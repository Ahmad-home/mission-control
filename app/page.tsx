'use client'

import { useState, useEffect } from 'react'
import { SEED_TASKS, SEED_VERSION } from './seed'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Priority = 'high' | 'medium' | 'low'
type Status = 'todo' | 'inprogress' | 'done'
type Assignee = 'Ahmad' | 'Dana'
type ViewMode = 'focus' | 'board' | 'calendar'
type ProjectFilter = 'all' | 'Sonika' | 'Audiom' | 'OpenClaw'
type SortBy = 'dueDate' | 'priority' | 'createdAt'

interface Task {
  id: string; title: string; description: string; plan?: string; notes?: string
  assignee: Assignee; priority: Priority; status: Status
  createdAt: string; dueDate?: string; tags: string[]
  activeNow?: boolean
}

const PC: Record<Priority,string> = {
  high: 'text-red-400 bg-red-500/15 border border-red-500/30',
  medium: 'text-amber-400 bg-amber-500/15 border border-amber-500/30',
  low: 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30',
}
const PL: Record<Priority,string> = { high: 'عاجل', medium: 'متوسط', low: 'منخفض' }
const PO: Record<Priority,number> = { high:1, medium:2, low:3 }

const PTAGS: Record<ProjectFilter,string[]> = {
  all: [],
  Sonika: ['Sonika','MVP','DNA','Audio Logo'],
  Audiom: ['Audiom','Webflow','Benderz','Ramz','n8n','Automation'],
  OpenClaw: ['OpenClaw','Mission Control','Heartbeat','Memory','Setup','Browser','Deployment'],
}
const PFL: Record<ProjectFilter,string> = {
  all: 'الكل', Sonika: '🎵 Sonika', Audiom: '🏢 Audiom', OpenClaw: '🤖 OpenClaw',
}

function genId() { return Math.random().toString(36).slice(2,9) }

function matchP(t: Task, p: ProjectFilter) {
  if (p==='all') return true
  return t.tags.some(tag => PTAGS[p].includes(tag))
}

function fmtDue(d?: string): { label:string; color:string }|null {
  if (!d) return null
  const due=new Date(d), today=new Date()
  today.setHours(0,0,0,0); due.setHours(0,0,0,0)
  const diff=Math.round((due.getTime()-today.getTime())/86400000)
  if (diff<0) return {label:`تأخّر ${Math.abs(diff)} أيام`,color:'text-red-400 bg-red-500/10 border-red-500/30'}
  if (diff===0) return {label:'اليوم',color:'text-orange-400 bg-orange-500/10 border-orange-500/30'}
  if (diff===1) return {label:'غداً',color:'text-amber-400 bg-amber-500/10 border-amber-500/30'}
  if (diff<=7) return {label:`${diff} أيام`,color:'text-blue-400 bg-blue-500/10 border-blue-500/30'}
  const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return {label:`${new Date(d).getDate()} ${mn[new Date(d).getMonth()]}`,color:'text-white/40 bg-white/5 border-white/10'}
}

function sortT(tasks:Task[], s:SortBy) {
  return [...tasks].sort((a,b)=>{
    if (s==='priority') return PO[a.priority]-PO[b.priority]
    if (s==='dueDate') {
      if (!a.dueDate&&!b.dueDate) return PO[a.priority]-PO[b.priority]
      if (!a.dueDate) return 1; if (!b.dueDate) return -1
      const d=new Date(a.dueDate).getTime()-new Date(b.dueDate).getTime()
      return d!==0?d:PO[a.priority]-PO[b.priority]
    }
    return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
  })
}

function FG<T extends string>({opts,val,onChange}:{opts:{v:T;label:string}[];val:T;onChange:(v:T)=>void}) {
  return (
    <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5 shrink-0">
      {opts.map(o=>(
        <button key={o.v} onClick={()=>onChange(o.v)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${val===o.v?'bg-violet-600 text-white':'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
export default function MC() {
  const [tasks,setTasks]=useState<Task[]>([])
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<Task|null>(null)
  const [view,setView]=useState<ViewMode>('board')
  const [proj,setProj]=useState<ProjectFilter>('all')
  const [archive,setArchive]=useState(false)
  const [fA,setFA]=useState<'all'|Assignee>('all')
  const [fP,setFP]=useState<'all'|Priority>('all')
  const [sort,setSort]=useState<SortBy>('dueDate')
  const [draggedTask,setDraggedTask]=useState<Task|null>(null)
  const [form,setForm]=useState({
    title:'',description:'',plan:'',notes:'',
    assignee:'Ahmad' as Assignee,priority:'medium' as Priority,
    status:'todo' as Status,tags:'',dueDate:'',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  useEffect(()=>{
    const load=async()=>{
      try {
        const r=await fetch('/api/tasks')
        if (r.ok) {
          const d=await r.json()
          if (d&&Array.isArray(d)&&d.length>0) {
            setTasks(d)
            localStorage.setItem('mc-tasks',JSON.stringify(d))
            localStorage.setItem('mc-v',SEED_VERSION)
            return
          }
        }
      } catch {}
      const sv=localStorage.getItem('mc-v'), sd=localStorage.getItem('mc-tasks')
      if (sd&&sv===SEED_VERSION) setTasks(JSON.parse(sd))
      else {
        setTasks(SEED_TASKS as Task[])
        localStorage.setItem('mc-tasks',JSON.stringify(SEED_TASKS))
        localStorage.setItem('mc-v',SEED_VERSION)
      }
    }
    load()
    const sf=localStorage.getItem('mc-f')
    if (sf) { try { const f=JSON.parse(sf); if(f.fA) setFA(f.fA); if(f.fP) setFP(f.fP); if(f.sort) setSort(f.sort) } catch {} }
    const poll=setInterval(async()=>{
      try { const r=await fetch('/api/tasks'); if(!r.ok) return; const d=await r.json(); if(d&&d.length>0){setTasks(d);localStorage.setItem('mc-tasks',JSON.stringify(d))} } catch {}
    },30000)
    const onS=(e:StorageEvent)=>{if(e.key==='mc-tasks'&&e.newValue){try{setTasks(JSON.parse(e.newValue))}catch{}}}
    window.addEventListener('storage',onS)
    return()=>{clearInterval(poll);window.removeEventListener('storage',onS)}
  },[])

  const sf2=(u:object)=>localStorage.setItem('mc-f',JSON.stringify({fA,fP,sort,...u}))
  const save=(t:Task[])=>{
    setTasks(t)
    localStorage.setItem('mc-tasks',JSON.stringify(t))
    fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}).catch(()=>{})
  }
  const openAdd=(s:Status='todo')=>{
    setEditing(null)
    setForm({title:'',description:'',plan:'',notes:'',assignee:'Ahmad',priority:'medium',status:s,tags:'',dueDate:''})
    setShowForm(true)
  }
  const openEdit=(t:Task)=>{
    setEditing(t)
    setForm({title:t.title,description:t.description,plan:t.plan||'',notes:t.notes||'',
      assignee:t.assignee,priority:t.priority,status:t.status,tags:t.tags.join(', '),dueDate:t.dueDate||''})
    setShowForm(true)
  }
  const submit=()=>{
    if (!form.title.trim()) return
    const tl=form.tags.split(',').map((x:string)=>x.trim()).filter(Boolean)
    if (editing) {
      save(tasks.map(t=>t.id===editing.id?{...t,...form,tags:tl,
        dueDate:form.dueDate||undefined,plan:form.plan||undefined,notes:form.notes||undefined}:t))
    } else {
      save([...tasks,{id:genId(),title:form.title,description:form.description,
        plan:form.plan||undefined,notes:form.notes||undefined,assignee:form.assignee,
        priority:form.priority,status:form.status,tags:tl,
        createdAt:new Date().toISOString(),dueDate:form.dueDate||undefined}])
    }
    setShowForm(false)
  }
  const del=(id:string)=>save(tasks.filter(t=>t.id!==id))
  const move=(id:string,s:Status)=>save(tasks.map(t=>t.id===id?{...t,status:s}:t))
  const setActive=(id:string,active:boolean)=>save(tasks.map(t=>t.id===id?{...t,activeNow:active}:t))
  const apf=(list:Task[])=>{
    let r=proj==='all'?list:list.filter(t=>matchP(t,proj))
    if (fA!=='all') r=r.filter(t=>t.assignee===fA)
    if (fP!=='all') r=r.filter(t=>t.priority===fP)
    return r
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setDraggedTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedTask(null)
    const { active, over } = event
    if (!over) return
    const overId = over.id as string
    if (overId === 'col-todo' || overId === 'col-inprogress' || overId === 'col-done') {
      const newStatus = overId.replace('col-', '') as Status
      if (tasks.find(t => t.id === active.id)?.status !== newStatus) {
        move(active.id as string, newStatus)
      }
    }
  }

  const act=apf(tasks.filter(t=>t.status!=='done'))
  const done=apf(tasks.filter(t=>t.status==='done'))
  const ipT=sortT(act.filter(t=>t.status==='inprogress'),sort)
  const urgT=sortT(act.filter(t=>t.priority==='high'&&t.status==='todo'),sort)
  const pendT=sortT(act.filter(t=>t.status==='todo'&&t.priority!=='high'),sort)
  const todoT=sortT(apf(tasks.filter(t=>t.status==='todo')),sort)
  return (
    <div className="min-h-screen bg-[#0a0c11] text-white overflow-x-hidden" dir="rtl">

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-[#111318]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-violet-600 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/30 shrink-0">M</div>
              <div>
                <div className="font-bold text-sm tracking-tight">Mission Control</div>
                <div className="text-[10px] text-white/30 font-light">Dana × Ahmad</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex bg-black/30 rounded-xl p-1 gap-0.5 border border-white/[0.06]">
                {([{id:'focus',e:'🎯'},{id:'board',e:'📋'},{id:'calendar',e:'📅'}] as {id:ViewMode;e:string}[]).map(t=>(
                  <button key={t.id} onClick={()=>setView(t.id)}
                    className={`w-8 h-8 rounded-lg text-sm transition-all ${view===t.id?'bg-violet-600/80 text-white':'text-white/30 hover:text-white/60'}`}>
                    {t.e}
                  </button>
                ))}
              </div>
              <a href="/memory" className="w-9 h-9 rounded-xl bg-black/30 border border-white/[0.06] text-white/30 hover:text-white/60 flex items-center justify-center text-sm transition-all">🧠</a>
            </div>
          </div>

          {view!=='calendar'&&(
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 -mx-4 px-4">
              {(Object.keys(PFL) as ProjectFilter[]).map(p=>(
                <button key={p} onClick={()=>setProj(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${proj===p?'bg-violet-600 border-violet-500/50 text-white':'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/20'}`}>
                  {PFL[p]}
                </button>
              ))}
            </div>
          )}

          {view!=='calendar'&&(
            <div className="flex flex-wrap gap-2 mt-3">
              <FG<'all'|Assignee> val={fA} onChange={v=>{setFA(v);sf2({fA:v})}}
                opts={[{v:'all',label:'الكل'},{v:'Ahmad',label:'👨 أحمد'},{v:'Dana',label:'💜 دانا'}]} />
              <FG<'all'|Priority> val={fP} onChange={v=>{setFP(v);sf2({fP:v})}}
                opts={[{v:'all',label:'الأولوية'},{v:'high',label:'🔴'},{v:'medium',label:'🟡'},{v:'low',label:'🟢'}]} />
              <FG<SortBy> val={sort} onChange={v=>{setSort(v);sf2({sort:v})}}
                opts={[{v:'dueDate',label:'📅 الموعد'},{v:'priority',label:'🔥 الأولوية'},{v:'createdAt',label:'🕐 الأقدم'}]} />
            </div>
          )}
        </div>
      </header>

      {/* ─── Stats Bar ─── */}
      {view!=='calendar'&&(
        <div className="grid grid-cols-4 gap-2 px-4 py-3">
          {[
            {label:'جارٍ',v:ipT.length,ic:'⚡',c:'text-blue-400',bg:'bg-blue-500/10 border-blue-500/20'},
            {label:'عاجل',v:urgT.length,ic:'🔴',c:'text-red-400',bg:'bg-red-500/10 border-red-500/20'},
            {label:'أحمد',v:apf(tasks.filter(t=>t.assignee==='Ahmad'&&t.status!=='done')).length,ic:'👨',c:'text-amber-400',bg:'bg-amber-500/10 border-amber-500/20'},
            {label:'دانا',v:apf(tasks.filter(t=>t.assignee==='Dana'&&t.status!=='done')).length,ic:'💜',c:'text-violet-400',bg:'bg-violet-500/10 border-violet-500/20'},
          ].map(s=>(
            <div key={s.label} className={`rounded-xl p-2.5 border flex items-center gap-2 ${s.bg}`}>
              <span className="text-lg leading-none">{s.ic}</span>
              <div className="min-w-0">
                <div className={`text-xl font-bold leading-none ${s.c}`}>{s.v}</div>
                <div className="text-[9px] text-white/30 mt-0.5 truncate">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ─── Focus View ─── */}
      {view==='focus'&&(
        <div className="px-4 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Col title="قيد التنفيذ" icon="⚡" top="border-t-blue-500" n={ipT.length} add={()=>openAdd('inprogress')}>
              {ipT.length===0&&<E msg="لا يوجد شيء جارٍ الآن"/>}
              {ipT.map(t=><TC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive}/>)}
            </Col>
            <Col title="عاجل جداً" icon="🔴" top="border-t-red-500" n={urgT.length} add={()=>openAdd('todo')}>
              {urgT.length===0&&<E msg="لا يوجد شيء عاجل"/>}
              {urgT.map(t=><TC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive}/>)}
            </Col>
          </div>

          {pendT.length>0&&(
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs text-white/25">📥 قائمة الانتظار</span>
                <div className="flex-1 h-px bg-white/[0.04]"/>
              </div>
              <div className="flex flex-col gap-1.5">
                {pendT.map(task=>{
                  const due=fmtDue(task.dueDate)
                  return(
                    <div key={task.id} onClick={()=>openEdit(task)}
                      className="bg-[#14171f] rounded-xl px-3 py-2.5 border border-white/[0.06] hover:border-white/15 cursor-pointer flex items-center gap-2.5 transition-all group">
                      <span className="text-sm shrink-0">{task.priority==='medium'?'🟡':'🟢'}</span>
                      <span className="text-sm flex-1 min-w-0 truncate text-white/80 group-hover:text-white">{task.title}</span>
                      {due&&<span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${due.color}`}>{due.label}</span>}
                      <span className="text-[10px] text-white/25 shrink-0">{task.assignee==='Ahmad'?'أحمد':'دانا'}</span>
                      <button onClick={e=>{e.stopPropagation();move(task.id,'inprogress')}}
                        className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100">
                        ⚡ ابدأ
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-4">
            <button onClick={()=>setArchive(!archive)}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.06] text-xs text-white/25 hover:text-white/40 hover:border-white/15 transition-all">
              {archive?'✖ إخفاء المكتملة':`✔ عرض المكتملة (${done.length})`}
            </button>
            {archive&&(
              <div className="mt-3 flex flex-col gap-1.5">
                {done.map(t=>(
                  <div key={t.id} onClick={()=>openEdit(t)}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.02] rounded-xl border border-white/[0.04] cursor-pointer opacity-50 hover:opacity-70">
                    <span className="text-sm">✅</span>
                    <span className="text-sm flex-1 line-through text-white/40 truncate">{t.title}</span>
                    <span className="text-[10px] text-white/20">{t.assignee==='Ahmad'?'أحمد':'دانا'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Board View with Drag & Drop ─── */}
      {view==='board'&&(
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="px-4 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DroppableCol id="col-todo" title="للبدء" icon="📌" top="border-t-slate-500" n={todoT.length} add={()=>openAdd('todo')}>
                <SortableContext items={todoT.map(t=>t.id)} strategy={verticalListSortingStrategy}>
                  {todoT.length===0&&<E msg="فارغ"/>}
                  {todoT.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive}/>)}
                </SortableContext>
              </DroppableCol>
              <DroppableCol id="col-inprogress" title="قيد التنفيذ" icon="⚡" top="border-t-blue-500" n={ipT.length} add={()=>openAdd('inprogress')}>
                <SortableContext items={ipT.map(t=>t.id)} strategy={verticalListSortingStrategy}>
                  {ipT.length===0&&<E msg="فارغ"/>}
                  {ipT.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive}/>)}
                </SortableContext>
              </DroppableCol>
              <DroppableCol id="col-done" title="مكتمل" icon="✅" top="border-t-emerald-500" n={done.length} add={()=>{}}>
                <SortableContext items={done.map(t=>t.id)} strategy={verticalListSortingStrategy}>
                  {done.length===0&&<E msg="فارغ"/>}
                  {done.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} isDone/>)}
                </SortableContext>
              </DroppableCol>
            </div>
          </div>
          <DragOverlay>
            {draggedTask && <TC task={draggedTask} onEdit={()=>{}} onDel={()=>{}} onMove={()=>{}} onSetActive={()=>{}} isDragging/>}
          </DragOverlay>
        </DndContext>
      )}

      {/* ─── Calendar View ─── */}
      {view==='calendar'&&<div className="p-4 pb-24"><Cal tasks={tasks}/></div>}

      {/* ─── FAB ─── */}
      {view!=='calendar'&&(
        <button onClick={()=>openAdd()}
          className="fixed bottom-6 left-4 w-14 h-14 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-2xl flex items-center justify-center text-3xl font-light shadow-2xl shadow-violet-900/50 transition-all z-40">
          +
        </button>
      )}
      {/* ─── Modal ─── */}
      {showForm&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50"
          onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="bg-[#111318] border border-white/[0.08] rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#111318] px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-bold text-base">{editing?'تعديل المهمة':'إضافة مهمة'}</h2>
              <button onClick={()=>setShowForm(false)}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-sm">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <F lbl="العنوان *">
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                  placeholder="عنوان المهمة..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20"/>
              </F>
              <F lbl="الوصف">
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  placeholder="وصف المهمة..." rows={2}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none"/>
              </F>
              <F lbl="📝 ملاحظات">
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  placeholder="ملاحظات وتفاصيل..." rows={2}
                  className="w-full bg-amber-500/[0.04] border border-amber-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/40 transition-all placeholder:text-white/20 resize-none"/>
              </F>
              <F lbl="🛠 خطة التنفيذ">
                <textarea value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}
                  placeholder="خطوات التنفيذ..." rows={3}
                  className="w-full bg-violet-500/[0.04] border border-violet-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/40 transition-all placeholder:text-white/20 resize-none font-mono text-xs leading-relaxed"/>
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F lbl="المسؤول">
                  <select value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value as Assignee})}
                    className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all [&>option]:bg-[#1a1d26] [&>option]:text-white">
                    <option value="Ahmad">أحمد</option>
                    <option value="Dana">دانا</option>
                  </select>
                </F>
                <F lbl="الأولوية">
                  <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})}
                    className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all [&>option]:bg-[#1a1d26] [&>option]:text-white">
                    <option value="high">🔴 عاجل</option>
                    <option value="medium">🟡 متوسط</option>
                    <option value="low">🟢 منخفض</option>
                  </select>
                </F>
                <F lbl="الحالة">
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})}
                    className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all [&>option]:bg-[#1a1d26] [&>option]:text-white">
                    <option value="todo">📌 للبدء</option>
                    <option value="inprogress">⚡ قيد التنفيذ</option>
                    <option value="done">✅ مكتمل</option>
                  </select>
                </F>
                <F lbl="📅 تاريخ الاستحقاق">
                  <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all [color-scheme:dark]"/>
                </F>
              </div>
              <F lbl="🏷 تاغات مفصولة بفاصلة">
                <input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}
                  placeholder="Sonika, Audiom, ..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20"/>
              </F>
            </div>
            <div className="flex gap-2.5 px-5 pb-5">
              <button onClick={submit}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all text-sm">
                {editing?'حفظ التعديلات':'إضافة المهمة'}
              </button>
              {editing&&(
                <button onClick={()=>{del(editing.id);setShowForm(false)}}
                  className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-3.5 rounded-xl transition-all text-sm border border-red-500/20">
                  حذف
                </button>
              )}
              <button onClick={()=>setShowForm(false)}
                className="px-5 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 font-medium py-3.5 rounded-xl transition-all text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ─── Helper Components ───────────────────────────────────────────────────────

function F({lbl,children}:{lbl:string;children:React.ReactNode}) {
  return (
    <div>
      <label className="text-xs text-white/30 mb-1.5 block font-medium">{lbl}</label>
      {children}
    </div>
  )
}

function Col({title,icon,top,n,add,children}:{title:string;icon:string;top:string;n:number;add:()=>void;children:React.ReactNode}) {
  return (
    <div className={`bg-[#0e1017] rounded-2xl border border-white/[0.06] border-t-2 ${top} overflow-hidden`}>
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          <span className="text-[10px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full">{n}</span>
        </div>
        <button onClick={add}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all">
          +
        </button>
      </div>
      <div className="p-3 flex flex-col gap-2 min-h-[60px]">{children}</div>
    </div>
  )
}

function DroppableCol({id,title,icon,top,n,add,children}:{id:string;title:string;icon:string;top:string;n:number;add:()=>void;children:React.ReactNode}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`bg-[#0e1017] rounded-2xl border border-white/[0.06] border-t-2 ${top} overflow-hidden transition-all ${isOver?'ring-2 ring-violet-500/50 bg-violet-500/5':''}`}>
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          <span className="text-[10px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full">{n}</span>
        </div>
        <button onClick={add}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all">
          +
        </button>
      </div>
      <div className="p-3 flex flex-col gap-2 min-h-[120px]">{children}</div>
    </div>
  )
}

function E({msg}:{msg:string}) {
  return <p className="text-xs text-white/20 text-center py-6">{msg}</p>
}
function TC({task,onEdit,onDel,onMove,onSetActive,isDone,isDragging}:{task:Task;onEdit:(t:Task)=>void;onDel:(id:string)=>void;onMove:(id:string,s:Status)=>void;onSetActive:(id:string,active:boolean)=>void;isDone?:boolean;isDragging?:boolean}) {
  const [exp,setExp]=useState(false)
  const due=fmtDue(task.dueDate)
  const ov=due?.label.includes('تأخّر')
  const activeClass = task.activeNow ? 'ring-2 ring-violet-500 animate-pulse' : ''
  return (
    <div className={`rounded-xl p-3 border transition-all cursor-pointer ${isDragging?'opacity-70 scale-105 shadow-2xl':''} ${isDone?'opacity-50 bg-white/[0.015] border-white/[0.04]':ov?'bg-[#14171f] border-red-500/25 hover:border-red-500/40':'bg-[#14171f] border-white/[0.06] hover:border-white/15'} ${activeClass}`}
      onClick={()=>onEdit(task)}>
      {task.activeNow && (
        <div className="flex items-center gap-1.5 mb-2 text-violet-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          <span className="text-[10px] font-medium">🔥 شغالة عليها</span>
        </div>
      )}
      <div className="flex items-start gap-2 mb-2">
        <h3 className={`flex-1 font-medium text-sm leading-snug min-w-0 ${isDone?'line-through text-white/30':'text-white/90'}`}>{task.title}</h3>
        <button onClick={e=>{e.stopPropagation();onDel(task.id)}}
          className="w-5 h-5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all shrink-0 text-base leading-none">×</button>
      </div>
      {task.description&&!isDone&&<p className="text-xs text-white/35 mb-2.5 leading-relaxed line-clamp-2">{task.description}</p>}
      {task.notes&&!isDone&&(
        <div className="mb-2.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-3 py-2">
          <span className="text-[9px] text-amber-400/60 font-semibold uppercase tracking-widest block mb-1">📝 ملاحظات</span>
          <p className="text-xs text-amber-200/60 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}
      {task.plan&&!isDone&&(
        <div className="mb-2.5">
          <button onClick={e=>{e.stopPropagation();setExp(!exp)}}
            className="text-[10px] text-violet-400/60 hover:text-violet-400 transition-all">
            {exp?'▲ إخفاء الخطة':'▼ عرض الخطة'}
          </button>
          {exp&&(
            <div className="mt-2 bg-violet-500/[0.06] border border-violet-500/20 rounded-xl p-3">
              <pre className="text-[11px] text-white/50 whitespace-pre-wrap leading-relaxed font-sans">{task.plan}</pre>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PC[task.priority]}`}>{PL[task.priority]}</span>
        <span className={task.assignee==='Ahmad'?
          'text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full font-medium':
          'text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full font-medium'}>
          {task.assignee==='Ahmad'?'أحمد':'دانا'}
        </span>
        {due&&<span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${due.color}`}>{due.label}</span>}
        {task.tags.slice(0,2).map(t=><span key={t} className="text-[9px] bg-white/[0.04] text-white/30 px-1.5 py-0.5 rounded-full">{t}</span>)}
      </div>
      {!isDone&&(
        <div className="flex gap-1.5 mt-2.5" onClick={e=>e.stopPropagation()}>
          {task.status!=='todo'&&(
            <button onClick={()=>onMove(task.id,task.status==='inprogress'?'todo':'inprogress')}
              className="text-[10px] bg-white/[0.04] hover:bg-white/10 px-2.5 py-1 rounded-lg text-white/35 transition-all">
              ← رجوع
            </button>
          )}
          {task.status!=='done'&&(
            <button onClick={()=>onMove(task.id,task.status==='todo'?'inprogress':'done')}
              className="text-[10px] bg-white/[0.04] hover:bg-blue-500/20 hover:text-blue-300 px-2.5 py-1 rounded-lg text-white/35 transition-all">
              {task.status==='todo'?'⚡ ابدأ':'✅ أكمل'}
            </button>
          )}
          {task.status==='inprogress'&&!task.activeNow&&task.assignee==='Dana'&&(
            <button onClick={()=>onSetActive(task.id,true)}
              className="text-[10px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-2.5 py-1 rounded-lg transition-all">
              🔥 شغالة
            </button>
          )}
          {task.activeNow&&(
            <button onClick={()=>onSetActive(task.id,false)}
              className="text-[10px] bg-white/[0.04] hover:bg-white/10 px-2.5 py-1 rounded-lg text-white/35 transition-all">
              إيقاف
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DraggableTC({task,onEdit,onDel,onMove,onSetActive,isDone}:{task:Task;onEdit:(t:Task)=>void;onDel:(id:string)=>void;onMove:(id:string,s:Status)=>void;onSetActive:(id:string,active:boolean)=>void;isDone?:boolean}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TC task={task} onEdit={onEdit} onDel={onDel} onMove={onMove} onSetActive={onSetActive} isDone={isDone} isDragging={isDragging}/>
    </div>
  )
}
// ─── Calendar Component ───────────────────────────────────────────────────────

function Cal({tasks}:{tasks:Task[]}) {
  const now=new Date()
  const [y,setY]=useState(now.getFullYear())
  const [m,setM]=useState(now.getMonth())
  const dim=new Date(y,m+1,0).getDate()
  const fd=new Date(y,m,1).getDay()
  const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const dn=['أحد','اث','ثلا','أرب','خمس','جمعة','سبت']
  const td: Record<number,Task[]>={}
  tasks.forEach(t=>{
    const d=new Date(t.dueDate||t.createdAt)
    if (d.getFullYear()===y&&d.getMonth()===m) {
      const day=d.getDate()
      if (!td[day]) td[day]=[]
      td[day].push(t)
    }
  })
  const cells:(number|null)[]=[]
  for (let i=0;i<fd;i++) cells.push(null)
  for (let d=1;d<=dim;d++) cells.push(d)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>{if(m===0){setM(11);setY(y-1)}else setM(m-1)}}
          className="px-3 py-2 bg-white/[0.04] hover:bg-white/10 rounded-xl text-sm transition-all">←</button>
        <h2 className="font-bold">{mn[m]} {y}</h2>
        <button onClick={()=>{if(m===11){setM(0);setY(y+1)}else setM(m+1)}}
          className="px-3 py-2 bg-white/[0.04] hover:bg-white/10 rounded-xl text-sm transition-all">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dn.map(d=><div key={d} className="text-center text-[9px] text-white/25 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day,i)=>{
          if (!day) return <div key={i}/>
          const dt=td[day]||[]
          const it=day===now.getDate()&&m===now.getMonth()&&y===now.getFullYear()
          return (
            <div key={day} className={`min-h-[52px] rounded-xl p-1.5 border ${it?'border-violet-500/50 bg-violet-500/10':'border-white/[0.04] bg-white/[0.015]'}`}>
              <div className={`text-[10px] mb-1 font-medium ${it?'text-violet-400':'text-white/25'}`}>{day}</div>
              {dt.slice(0,2).map(t=>(
                <div key={t.id} className={`text-[7px] px-1 py-0.5 rounded mb-0.5 truncate leading-tight ${
                  t.priority==='high'?'bg-red-500/20 text-red-300':
                  t.priority==='medium'?'bg-amber-500/20 text-amber-300':
                  'bg-emerald-500/20 text-emerald-300'}`}>
                  {t.title}
                </div>
              ))}
              {dt.length>2&&<div className="text-[7px] text-white/20">+{dt.length-2}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

