'use client'

import { useState, useEffect } from 'react'
import { SEED_TASKS, SEED_VERSION } from './seed'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Priority = 'high' | 'medium' | 'low'
type Status = 'todo' | 'inprogress' | 'review' | 'done'
type Assignee = 'Ahmad' | 'Dana'
type Effort = 'light' | 'medium' | 'heavy'
type ViewMode = 'focus' | 'board' | 'calendar'
type ProjectFilter = 'all' | 'Sonika' | 'Audiom' | 'OpenClaw'
type SortBy = 'dueDate' | 'priority' | 'createdAt'

interface Task {
  id: string; title: string; description: string; plan?: string; notes?: string
  assignee: Assignee; priority: Priority; status: Status
  createdAt: string; dueDate?: string; tags: string[]
  activeNow?: boolean; effort?: Effort; progress?: number
  completedAt?: string; completionNotes?: string
}

const PC: Record<Priority,string> = { high: 'text-red-400 bg-red-500/15 border-red-500/30', medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30', low: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
const PL: Record<Priority,string> = { high: '🔴', medium: '🟡', low: '🟢' }
const PO: Record<Priority,number> = { high:1, medium:2, low:3 }
const EC: Record<Effort,string> = { light: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30', heavy: 'text-red-400 bg-red-500/15 border-red-500/30' }
const EL: Record<Effort,string> = { light: '⚡ <30m', medium: '⏱ 30m-2h', heavy: '🔥 2h+' }
const EW: Record<Effort,number> = { light: 10, medium: 25, heavy: 50 }
const PTAGS: Record<ProjectFilter,string[]> = { all: [], Sonika: ['Sonika','MVP','DNA','Audio Logo'], Audiom: ['Audiom','Webflow','Benderz','Ramz','n8n','Automation'], OpenClaw: ['OpenClaw','Mission Control','Heartbeat','Memory','Setup','Browser','Deployment'] }
const PFL: Record<ProjectFilter,string> = { all: 'الكل', Sonika: '🎵 Sonika', Audiom: '🏢 Audiom', OpenClaw: '🤖 OpenClaw' }

function genId() { return Math.random().toString(36).slice(2,9) }
function matchP(t: Task, p: ProjectFilter) { if (p==='all') return true; return t.tags.some(tag => PTAGS[p].includes(tag)) }

function fmtDue(d?: string): { label:string; color:string }|null {
  if (!d) return null
  const due=new Date(d), today=new Date(); today.setHours(0,0,0,0); due.setHours(0,0,0,0)
  const diff=Math.round((due.getTime()-today.getTime())/86400000)
  if (diff<0) return {label:`تأخّر ${Math.abs(diff)} أيام`,color:'text-red-400 bg-red-500/10 border-red-500/30'}
  if (diff===0) return {label:'اليوم',color:'text-orange-400 bg-orange-500/10 border-orange-500/30'}
  if (diff===1) return {label:'غداً',color:'text-amber-400 bg-amber-500/10 border-amber-500/30'}
  if (diff<=7) return {label:`${diff} أيام`,color:'text-blue-400 bg-blue-500/10 border-blue-500/30'}
  const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return {label:`${new Date(d).getDate()} ${mn[new Date(d).getMonth()]}`,color:'text-white/40 bg-white/5 border-white/10'}
}

function fmtCompleted(d?: string): string|null {
  if (!d) return null
  const comp=new Date(d), now=new Date()
  const diff=Math.round((now.getTime()-comp.getTime())/86400000)
  if (diff===0) return 'اليوم'
  if (diff===1) return 'أمس'
  if (diff<=7) return `قبل ${diff} أيام`
  const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${comp.getDate()} ${mn[comp.getMonth()]}`
}

function sortT(tasks:Task[], s:SortBy) {
  return [...tasks].sort((a,b)=>{
    if (s==='priority') return PO[a.priority]-PO[b.priority]
    if (s==='dueDate') { if (!a.dueDate&&!b.dueDate) return PO[a.priority]-PO[b.priority]; if (!a.dueDate) return 1; if (!b.dueDate) return -1; const d=new Date(a.dueDate).getTime()-new Date(b.dueDate).getTime(); return d!==0?d:PO[a.priority]-PO[b.priority] }
    return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
  })
}

function calcCapacity(tasks: Task[]): number {
  return tasks.filter(t => t.assignee === 'Dana' && t.status === 'inprogress' && t.effort).reduce((sum, t) => sum + EW[t.effort!], 0)
}

function FG<T extends string>({opts,val,onChange}:{opts:{v:T;label:string}[];val:T;onChange:(v:T)=>void}) {
  return (<div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5 shrink-0">{opts.map(o=>(<button key={o.v} onClick={()=>onChange(o.v)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${val===o.v?'bg-violet-600 text-white':'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>{o.label}</button>))}</div>)
}
export default function MC() {
  const [tasks,setTasks]=useState<Task[]>([])
  const [showForm,setShowForm]=useState(false)
  const [showDetail,setShowDetail]=useState<Task|null>(null)
  const [editing,setEditing]=useState<Task|null>(null)
  const [view,setView]=useState<ViewMode>('board')
  const [proj,setProj]=useState<ProjectFilter>('all')
  const [fA,setFA]=useState<'all'|Assignee>('all')
  const [fP,setFP]=useState<'all'|Priority>('all')
  const [sort,setSort]=useState<SortBy>('dueDate')
  const [draggedTask,setDraggedTask]=useState<Task|null>(null)
  const [form,setForm]=useState({title:'',description:'',plan:'',notes:'',assignee:'Ahmad' as Assignee,priority:'medium' as Priority,status:'todo' as Status,tags:'',dueDate:'',effort:'medium' as Effort,progress:0,completionNotes:''})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }))

  useEffect(()=>{
    const load=async()=>{
      try { const r=await fetch('/api/tasks'); if (r.ok) { const d=await r.json(); if (d&&Array.isArray(d)&&d.length>0) { setTasks(d); localStorage.setItem('mc-tasks',JSON.stringify(d)); localStorage.setItem('mc-v',SEED_VERSION); return } } } catch {}
      const sv=localStorage.getItem('mc-v'), sd=localStorage.getItem('mc-tasks')
      if (sd&&sv===SEED_VERSION) setTasks(JSON.parse(sd))
      else { setTasks(SEED_TASKS as Task[]); localStorage.setItem('mc-tasks',JSON.stringify(SEED_TASKS)); localStorage.setItem('mc-v',SEED_VERSION) }
    }
    load()
    const sf=localStorage.getItem('mc-f'); if (sf) { try { const f=JSON.parse(sf); if(f.fA) setFA(f.fA); if(f.fP) setFP(f.fP); if(f.sort) setSort(f.sort) } catch {} }
    const poll=setInterval(async()=>{ try { const r=await fetch('/api/tasks'); if(!r.ok) return; const d=await r.json(); if(d&&d.length>0){setTasks(d);localStorage.setItem('mc-tasks',JSON.stringify(d))} } catch {} },30000)
    const onS=(e:StorageEvent)=>{if(e.key==='mc-tasks'&&e.newValue){try{setTasks(JSON.parse(e.newValue))}catch{}}}
    window.addEventListener('storage',onS)
    return()=>{clearInterval(poll);window.removeEventListener('storage',onS)}
  },[])

  const sf2=(u:object)=>localStorage.setItem('mc-f',JSON.stringify({fA,fP,sort,...u}))
  const save=(t:Task[])=>{ setTasks(t); localStorage.setItem('mc-tasks',JSON.stringify(t)); fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}).catch(()=>{}) }
  const openAdd=(s:Status='todo')=>{ setEditing(null); setForm({title:'',description:'',plan:'',notes:'',assignee:'Ahmad',priority:'medium',status:s,tags:'',dueDate:'',effort:'medium',progress:0,completionNotes:''}); setShowForm(true) }
  const openEdit=(t:Task)=>{ setEditing(t); setForm({title:t.title,description:t.description,plan:t.plan||'',notes:t.notes||'',assignee:t.assignee,priority:t.priority,status:t.status,tags:t.tags.join(', '),dueDate:t.dueDate||'',effort:t.effort||'medium',progress:t.progress||0,completionNotes:t.completionNotes||''}); setShowForm(true) }
  const submit=()=>{ if (!form.title.trim()) return; const tl=form.tags.split(',').map((x:string)=>x.trim()).filter(Boolean); const isNowDone = form.status==='done' && (!editing || editing.status!=='done'); if (editing) { save(tasks.map(t=>t.id===editing.id?{...t,...form,tags:tl,dueDate:form.dueDate||undefined,plan:form.plan||undefined,notes:form.notes||undefined,effort:form.effort,progress:form.progress,completionNotes:form.completionNotes||undefined,completedAt:isNowDone?new Date().toISOString():t.completedAt}:t)) } else { save([...tasks,{id:genId(),title:form.title,description:form.description,plan:form.plan||undefined,notes:form.notes||undefined,assignee:form.assignee,priority:form.priority,status:form.status,tags:tl,createdAt:new Date().toISOString(),dueDate:form.dueDate||undefined,effort:form.effort,progress:form.progress,completionNotes:form.completionNotes||undefined,completedAt:form.status==='done'?new Date().toISOString():undefined}]) }; setShowForm(false) }
  const del=(id:string)=>save(tasks.filter(t=>t.id!==id))
  const move=(id:string,s:Status)=>save(tasks.map(t=>t.id===id?{...t,status:s,progress:s==='done'?100:t.progress,completedAt:s==='done'?new Date().toISOString():t.completedAt}:t))
  const setActive=(id:string,active:boolean)=>save(tasks.map(t=>t.id===id?{...t,activeNow:active}:t))
  const setProgress=(id:string,p:number)=>save(tasks.map(t=>t.id===id?{...t,progress:p}:t))
  const apf=(list:Task[])=>{ let r=proj==='all'?list:list.filter(t=>matchP(t,proj)); if (fA!=='all') r=r.filter(t=>t.assignee===fA); if (fP!=='all') r=r.filter(t=>t.priority===fP); return r }

  const handleDragStart = (event: DragStartEvent) => { const task = tasks.find(t => t.id === event.active.id); if (task) setDraggedTask(task) }
  const handleDragEnd = (event: DragEndEvent) => { setDraggedTask(null); const { active, over } = event; if (!over) return; const overId = over.id as string; if (['col-todo','col-inprogress','col-review','col-done'].includes(overId)) { const newStatus = overId.replace('col-', '') as Status; if (tasks.find(t => t.id === active.id)?.status !== newStatus) { move(active.id as string, newStatus) } } }

  const capacity = calcCapacity(tasks)
  const todoT=sortT(apf(tasks.filter(t=>t.status==='todo')),sort)
  const ipT=sortT(apf(tasks.filter(t=>t.status==='inprogress')),sort)
  const reviewT=sortT(apf(tasks.filter(t=>t.status==='review')),sort)
  const done=apf(tasks.filter(t=>t.status==='done')).sort((a,b)=>(new Date(b.completedAt||0).getTime())-(new Date(a.completedAt||0).getTime()))
  const act=apf(tasks.filter(t=>t.status!=='done'))
  const urgT=sortT(act.filter(t=>t.priority==='high'&&t.status==='todo'),sort)
  return (
    <div className="min-h-screen bg-[#0a0c11] text-white overflow-x-hidden" dir="rtl">
      <header className="sticky top-0 z-40 bg-[#111318]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-violet-600 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/30 shrink-0">M</div>
              <div><div className="font-bold text-sm tracking-tight">Mission Control</div><div className="text-[10px] text-white/30 font-light">Dana × Ahmad</div></div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex bg-black/30 rounded-xl p-1 gap-0.5 border border-white/[0.06]">
                {([{id:'focus',e:'🎯'},{id:'board',e:'📋'},{id:'calendar',e:'📅'}] as {id:ViewMode;e:string}[]).map(t=>(
                  <button key={t.id} onClick={()=>setView(t.id)} className={`w-8 h-8 rounded-lg text-sm transition-all ${view===t.id?'bg-violet-600/80 text-white':'text-white/30 hover:text-white/60'}`}>{t.e}</button>
                ))}
              </div>
              <a href="/memory" className="w-9 h-9 rounded-xl bg-black/30 border border-white/[0.06] text-white/30 hover:text-white/60 flex items-center justify-center text-sm transition-all">🧠</a>
            </div>
          </div>
          {view!=='calendar'&&(<div className="mt-3 bg-violet-500/10 border border-violet-500/20 rounded-xl p-2.5"><div className="flex items-center justify-between mb-1.5"><span className="text-[10px] text-violet-300 font-medium">💜 سعة دانا</span><span className={`text-[10px] font-bold ${capacity>=80?'text-red-400':capacity>=50?'text-amber-400':'text-emerald-400'}`}>{capacity}%</span></div><div className="h-2 bg-black/30 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${capacity>=80?'bg-red-500':capacity>=50?'bg-amber-500':'bg-violet-500'}`} style={{width:`${Math.min(capacity,100)}%`}}/></div><div className="text-[9px] text-white/30 mt-1">{capacity>=80?'⚠️ حمل ثقيل':capacity>=50?'متوسط — ممكن مهمة خفيفة':'✨ متاح'}</div></div>)}
          {view!=='calendar'&&(<div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 -mx-4 px-4">{(Object.keys(PFL) as ProjectFilter[]).map(p=>(<button key={p} onClick={()=>setProj(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${proj===p?'bg-violet-600 border-violet-500/50 text-white':'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/20'}`}>{PFL[p]}</button>))}</div>)}
          {view!=='calendar'&&(<div className="flex flex-wrap gap-2 mt-3"><FG<'all'|Assignee> val={fA} onChange={v=>{setFA(v);sf2({fA:v})}} opts={[{v:'all',label:'الكل'},{v:'Ahmad',label:'👨 أحمد'},{v:'Dana',label:'💜 دانا'}]} /><FG<'all'|Priority> val={fP} onChange={v=>{setFP(v);sf2({fP:v})}} opts={[{v:'all',label:'الأولوية'},{v:'high',label:'🔴'},{v:'medium',label:'🟡'},{v:'low',label:'🟢'}]} /><FG<SortBy> val={sort} onChange={v=>{setSort(v);sf2({sort:v})}} opts={[{v:'dueDate',label:'📅 الموعد'},{v:'priority',label:'🔥 الأولوية'},{v:'createdAt',label:'🕐 الأقدم'}]} /></div>)}
        </div>
      </header>

      {view!=='calendar'&&(<div className="grid grid-cols-5 gap-2 px-4 py-3">{[{label:'للبدء',v:todoT.length,ic:'📌',c:'text-slate-400',bg:'bg-slate-500/10 border-slate-500/20'},{label:'جارٍ',v:ipT.length,ic:'⚡',c:'text-blue-400',bg:'bg-blue-500/10 border-blue-500/20'},{label:'مراجعة',v:reviewT.length,ic:'👁️',c:'text-purple-400',bg:'bg-purple-500/10 border-purple-500/20'},{label:'مكتمل',v:done.length,ic:'✅',c:'text-emerald-400',bg:'bg-emerald-500/10 border-emerald-500/20'},{label:'دانا',v:apf(tasks.filter(t=>t.assignee==='Dana'&&t.status!=='done')).length,ic:'💜',c:'text-violet-400',bg:'bg-violet-500/10 border-violet-500/20'}].map(s=>(<div key={s.label} className={`rounded-xl p-2 border flex items-center gap-1.5 ${s.bg}`}><span className="text-base leading-none">{s.ic}</span><div className="min-w-0"><div className={`text-lg font-bold leading-none ${s.c}`}>{s.v}</div><div className="text-[8px] text-white/30 truncate">{s.label}</div></div></div>))}</div>)}
      {view==='focus'&&(<div className="px-4 pb-24"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Col title="قيد التنفيذ" icon="⚡" top="border-t-blue-500" n={ipT.length} add={()=>openAdd('inprogress')}>{ipT.length===0&&<E msg="لا يوجد شيء جارٍ"/>}{ipT.map(t=><TC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} onSetProgress={setProgress} onShowDetail={setShowDetail}/>)}</Col><Col title="مراجعة" icon="👁️" top="border-t-purple-500" n={reviewT.length} add={()=>openAdd('review')}>{reviewT.length===0&&<E msg="لا يوجد شيء للمراجعة"/>}{reviewT.map(t=><TC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} onSetProgress={setProgress} onShowDetail={setShowDetail}/>)}</Col></div></div>)}

      {view==='board'&&(
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="px-4 pb-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DroppableCol id="col-todo" title="للبدء" icon="📌" top="border-t-slate-500" n={todoT.length} add={()=>openAdd('todo')}>
                <SortableContext items={todoT.map(t=>t.id)} strategy={verticalListSortingStrategy}>{todoT.length===0&&<E msg="فارغ"/>}{todoT.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} onSetProgress={setProgress} onShowDetail={setShowDetail}/>)}</SortableContext>
              </DroppableCol>
              <DroppableCol id="col-inprogress" title="قيد التنفيذ" icon="⚡" top="border-t-blue-500" n={ipT.length} add={()=>openAdd('inprogress')}>
                <SortableContext items={ipT.map(t=>t.id)} strategy={verticalListSortingStrategy}>{ipT.length===0&&<E msg="فارغ"/>}{ipT.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} onSetProgress={setProgress} onShowDetail={setShowDetail}/>)}</SortableContext>
              </DroppableCol>
              <DroppableCol id="col-review" title="مراجعة" icon="👁️" top="border-t-purple-500" n={reviewT.length} add={()=>openAdd('review')}>
                <SortableContext items={reviewT.map(t=>t.id)} strategy={verticalListSortingStrategy}>{reviewT.length===0&&<E msg="فارغ"/>}{reviewT.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} onSetProgress={setProgress} onShowDetail={setShowDetail}/>)}</SortableContext>
              </DroppableCol>
              <DroppableCol id="col-done" title="مكتمل" icon="✅" top="border-t-emerald-500" n={done.length} add={()=>{}}>
                <SortableContext items={done.map(t=>t.id)} strategy={verticalListSortingStrategy}>{done.length===0&&<E msg="فارغ"/>}{done.map(t=><DraggableTC key={t.id} task={t} onEdit={openEdit} onDel={del} onMove={move} onSetActive={setActive} onSetProgress={setProgress} onShowDetail={setShowDetail} isDone/>)}</SortableContext>
              </DroppableCol>
            </div>
          </div>
          <DragOverlay>{draggedTask && <TC task={draggedTask} onEdit={()=>{}} onDel={()=>{}} onMove={()=>{}} onSetActive={()=>{}} onSetProgress={()=>{}} onShowDetail={()=>{}} isDragging/>}</DragOverlay>
        </DndContext>
      )}

      {view==='calendar'&&<div className="p-4 pb-24"><Cal tasks={tasks}/></div>}
      {view!=='calendar'&&(<button onClick={()=>openAdd()} className="fixed bottom-6 left-4 w-14 h-14 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-2xl flex items-center justify-center text-3xl font-light shadow-2xl shadow-violet-900/50 transition-all z-40">+</button>)}
      {/* Task Detail Modal */}
      {showDetail&&(<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={()=>setShowDetail(null)}>
        <div className="bg-[#111318] border border-white/[0.08] rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="sticky top-0 bg-[#111318] px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-lg">{showDetail.status==='done'?'✅':showDetail.status==='review'?'👁️':'📋'}</span><h2 className="font-bold text-base">{showDetail.title}</h2></div>
            <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-sm">✕</button>
          </div>
          <div className="p-5">
            {showDetail.description&&<p className="text-sm text-white/60 mb-4">{showDetail.description}</p>}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full border ${PC[showDetail.priority]}`}>{PL[showDetail.priority]} {showDetail.priority==='high'?'عاجل':showDetail.priority==='medium'?'متوسط':'منخفض'}</span>
              {showDetail.effort&&<span className={`text-xs px-2 py-1 rounded-full border ${EC[showDetail.effort]}`}>{EL[showDetail.effort]}</span>}
              <span className={showDetail.assignee==='Ahmad'?'text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-1 rounded-full':'text-xs bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-1 rounded-full'}>{showDetail.assignee==='Ahmad'?'👨 أحمد':'💜 دانا'}</span>
            </div>
            {showDetail.completedAt&&<div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"><div className="text-[10px] text-emerald-400 font-medium mb-1">✓ اكتمل {fmtCompleted(showDetail.completedAt)}</div></div>}
            {showDetail.completionNotes&&<div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"><div className="text-[10px] text-white/40 font-medium mb-2">📝 تقرير الإنجاز</div><div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{showDetail.completionNotes.replace(/\\n/g, '\n')}</div></div>}
            {!showDetail.completionNotes&&showDetail.status==='done'&&<div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center"><div className="text-xs text-white/30">لا يوجد تقرير إنجاز</div></div>}
          </div>
          <div className="flex gap-2 px-5 pb-5"><button onClick={()=>{openEdit(showDetail);setShowDetail(null)}} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition-all text-sm">✏️ تعديل</button><button onClick={()=>setShowDetail(null)} className="px-5 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 font-medium py-3 rounded-xl transition-all text-sm">إغلاق</button></div>
        </div>
      </div>)}
      {/* Add/Edit Form Modal */}
      {showForm&&(<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
        <div className="bg-[#111318] border border-white/[0.08] rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-[#111318] px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between"><h2 className="font-bold text-base">{editing?'تعديل المهمة':'إضافة مهمة'}</h2><button onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-sm">✕</button></div>
          <div className="p-5 flex flex-col gap-4">
            <F lbl="العنوان *"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان المهمة..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20"/></F>
            <F lbl="الوصف"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="وصف المهمة..." rows={2} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none"/></F>
            <div className="grid grid-cols-2 gap-3">
              <F lbl="👤 المسؤول"><select value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value as Assignee})} className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all"><option value="Ahmad">👨 أحمد</option><option value="Dana">💜 دانا</option></select></F>
              <F lbl="🎯 الأولوية"><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})} className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all"><option value="high">🔴 عاجل</option><option value="medium">🟡 متوسط</option><option value="low">🟢 منخفض</option></select></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F lbl="⏱ الجهد"><select value={form.effort} onChange={e=>setForm({...form,effort:e.target.value as Effort})} className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all"><option value="light">⚡ خفيف</option><option value="medium">⏱ متوسط</option><option value="heavy">🔥 ثقيل</option></select></F>
              <F lbl="📊 الحالة"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})} className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all"><option value="todo">📌 للبدء</option><option value="inprogress">⚡ قيد التنفيذ</option><option value="review">👁️ مراجعة</option><option value="done">✅ مكتمل</option></select></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F lbl="📅 الاستحقاق"><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full bg-[#1a1d26] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 text-white transition-all [color-scheme:dark]"/></F>
              <F lbl={`📈 الإنجاز (${form.progress}%)`}><input type="range" min="0" max="100" step="25" value={form.progress} onChange={e=>setForm({...form,progress:parseInt(e.target.value)})} className="w-full h-10 accent-violet-500"/></F>
            </div>
            <F lbl="🏷 تاغات"><input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="Sonika, Audiom, ..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20"/></F>
            {(form.status==='done'||form.status==='review')&&<F lbl="📝 تقرير الإنجاز"><textarea value={form.completionNotes} onChange={e=>setForm({...form,completionNotes:e.target.value})} placeholder="ماذا تم إنجازه؟ خطوات، نتائج، روابط..." rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none"/></F>}
          </div>
          <div className="flex gap-2.5 px-5 pb-5"><button onClick={submit} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all text-sm">{editing?'حفظ':'إضافة'}</button>{editing&&(<button onClick={()=>{del(editing.id);setShowForm(false)}} className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-3.5 rounded-xl transition-all text-sm border border-red-500/20">حذف</button>)}<button onClick={()=>setShowForm(false)} className="px-5 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 font-medium py-3.5 rounded-xl transition-all text-sm">إلغاء</button></div>
        </div>
      </div>)}
    </div>
  )
}
function F({lbl,children}:{lbl:string;children:React.ReactNode}) { return (<div><label className="text-xs text-white/30 mb-1.5 block font-medium">{lbl}</label>{children}</div>) }
function Col({title,icon,top,n,add,children}:{title:string;icon:string;top:string;n:number;add:()=>void;children:React.ReactNode}) { return (<div className={`bg-[#0e1017] rounded-2xl border border-white/[0.06] border-t-2 ${top} overflow-hidden`}><div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.04]"><div className="flex items-center gap-2"><span className="text-base">{icon}</span><span className="font-semibold text-sm">{title}</span><span className="text-[10px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full">{n}</span></div><button onClick={add} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all">+</button></div><div className="p-3 flex flex-col gap-2 min-h-[60px]">{children}</div></div>) }
function DroppableCol({id,title,icon,top,n,add,children}:{id:string;title:string;icon:string;top:string;n:number;add:()=>void;children:React.ReactNode}) { const { setNodeRef, isOver } = useDroppable({ id }); return (<div ref={setNodeRef} className={`bg-[#0e1017] rounded-2xl border border-white/[0.06] border-t-2 ${top} overflow-hidden transition-all ${isOver?'ring-2 ring-violet-500/50 bg-violet-500/5':''}`}><div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.04]"><div className="flex items-center gap-2"><span className="text-base">{icon}</span><span className="font-semibold text-sm">{title}</span><span className="text-[10px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded-full">{n}</span></div><button onClick={add} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all">+</button></div><div className="p-3 flex flex-col gap-2 min-h-[100px]">{children}</div></div>) }
function E({msg}:{msg:string}) { return <p className="text-xs text-white/20 text-center py-6">{msg}</p> }
function TC({task,onEdit,onDel,onMove,onSetActive,onSetProgress,onShowDetail,isDone,isDragging}:{task:Task;onEdit:(t:Task)=>void;onDel:(id:string)=>void;onMove:(id:string,s:Status)=>void;onSetActive:(id:string,active:boolean)=>void;onSetProgress:(id:string,p:number)=>void;onShowDetail:(t:Task)=>void;isDone?:boolean;isDragging?:boolean}) {
  const due=fmtDue(task.dueDate), ov=due?.label.includes('تأخّر'), completed=fmtCompleted(task.completedAt)
  const activeClass = task.activeNow ? 'ring-2 ring-violet-500 animate-pulse' : ''
  const hasProgress = task.effort && task.effort !== 'light' && task.status === 'inprogress'
  return (
    <div className={`rounded-xl p-3 border transition-all cursor-pointer ${isDragging?'opacity-70 scale-105 shadow-2xl':''} ${isDone?'bg-white/[0.02] border-white/[0.04] hover:border-white/10':ov?'bg-[#14171f] border-red-500/25 hover:border-red-500/40':'bg-[#14171f] border-white/[0.06] hover:border-white/15'} ${activeClass}`} onClick={()=>isDone?onShowDetail(task):onEdit(task)}>
      {task.activeNow && (<div className="flex items-center gap-1.5 mb-2 text-violet-400"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span><span className="text-[10px] font-medium">🔥 شغالة عليها</span></div>)}
      <div className="flex items-start gap-2 mb-2"><h3 className={`flex-1 font-medium text-sm leading-snug min-w-0 ${isDone?'text-white/50':'text-white/90'}`}>{task.title}</h3>{!isDone&&<button onClick={e=>{e.stopPropagation();onDel(task.id)}} className="w-5 h-5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all shrink-0 text-base leading-none">×</button>}</div>
      {hasProgress && (<div className="mb-2.5" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-1"><span className="text-[9px] text-white/30">الإنجاز</span><span className="text-[9px] text-white/50 font-medium">{task.progress||0}%</span></div><div className="h-1.5 bg-black/30 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full transition-all" style={{width:`${task.progress||0}%`}}/></div><div className="flex gap-1 mt-1.5">{[0,25,50,75,100].map(p=>(<button key={p} onClick={()=>onSetProgress(task.id,p)} className={`flex-1 text-[8px] py-0.5 rounded transition-all ${task.progress===p?'bg-violet-500 text-white':'bg-white/5 text-white/30 hover:bg-white/10'}`}>{p}%</button>))}</div></div>)}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${PC[task.priority]}`}>{PL[task.priority]}</span>
        {task.effort && (<span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${EC[task.effort]}`}>{EL[task.effort]}</span>)}
        <span className={task.assignee==='Ahmad'?'text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full':'text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full'}>{task.assignee==='Ahmad'?'👨':'💜'}</span>
        {!isDone&&due&&<span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${due.color}`}>{due.label}</span>}
        {isDone&&completed&&<span className="text-[9px] px-1.5 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">✓ {completed}</span>}
      </div>
      {isDone&&task.completionNotes&&<div className="text-[10px] text-white/30 bg-white/[0.02] rounded-lg p-2 mb-2 line-clamp-2">{task.completionNotes.replace(/\\n/g, ' ').substring(0,80)}...</div>}
      {!isDone&&(<div className="flex gap-1.5 mt-2" onClick={e=>e.stopPropagation()}>
        {task.status==='inprogress'&&<button onClick={()=>onMove(task.id,'todo')} className="text-[10px] bg-white/[0.04] hover:bg-white/10 px-2 py-1 rounded-lg text-white/35 transition-all">← رجوع</button>}
        {task.status==='todo'&&<button onClick={()=>onMove(task.id,'inprogress')} className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg transition-all">⚡ ابدأ</button>}
        {task.status==='inprogress'&&<button onClick={()=>onMove(task.id,'review')} className="text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg transition-all">👁️ مراجعة</button>}
        {task.status==='review'&&<button onClick={()=>onMove(task.id,'inprogress')} className="text-[10px] bg-white/[0.04] hover:bg-white/10 px-2 py-1 rounded-lg text-white/35 transition-all">← رجوع</button>}
        {task.status==='review'&&<button onClick={()=>onMove(task.id,'done')} className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg transition-all">✅ أكمل</button>}
        {task.status==='inprogress'&&!task.activeNow&&task.assignee==='Dana'&&<button onClick={()=>onSetActive(task.id,true)} className="text-[10px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-2 py-1 rounded-lg transition-all">🔥 شغالة</button>}
        {task.activeNow&&<button onClick={()=>onSetActive(task.id,false)} className="text-[10px] bg-white/[0.04] hover:bg-white/10 px-2 py-1 rounded-lg text-white/35 transition-all">إيقاف</button>}
      </div>)}
    </div>
  )
}
function DraggableTC({task,onEdit,onDel,onMove,onSetActive,onSetProgress,onShowDetail,isDone}:{task:Task;onEdit:(t:Task)=>void;onDel:(id:string)=>void;onMove:(id:string,s:Status)=>void;onSetActive:(id:string,active:boolean)=>void;onSetProgress:(id:string,p:number)=>void;onShowDetail:(t:Task)=>void;isDone?:boolean}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (<div ref={setNodeRef} style={style} {...attributes} {...listeners}><TC task={task} onEdit={onEdit} onDel={onDel} onMove={onMove} onSetActive={onSetActive} onSetProgress={onSetProgress} onShowDetail={onShowDetail} isDone={isDone} isDragging={isDragging}/></div>)
}

function Cal({tasks}:{tasks:Task[]}) {
  const now=new Date()
  const [y,setY]=useState(now.getFullYear())
  const [m,setM]=useState(now.getMonth())
  const dim=new Date(y,m+1,0).getDate(), fd=new Date(y,m,1).getDay()
  const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const dn=['أحد','اث','ثلا','أرب','خمس','جمعة','سبت']
  const td: Record<number,Task[]>={}
  tasks.forEach(t=>{const d=new Date(t.dueDate||t.createdAt);if (d.getFullYear()===y&&d.getMonth()===m) {const day=d.getDate();if (!td[day]) td[day]=[];td[day].push(t)}})
  const cells:(number|null)[]=[]; for (let i=0;i<fd;i++) cells.push(null); for (let d=1;d<=dim;d++) cells.push(d)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4"><button onClick={()=>{if(m===0){setM(11);setY(y-1)}else setM(m-1)}} className="px-3 py-2 bg-white/[0.04] hover:bg-white/10 rounded-xl text-sm transition-all">←</button><h2 className="font-bold">{mn[m]} {y}</h2><button onClick={()=>{if(m===11){setM(0);setY(y+1)}else setM(m+1)}} className="px-3 py-2 bg-white/[0.04] hover:bg-white/10 rounded-xl text-sm transition-all">→</button></div>
      <div className="grid grid-cols-7 gap-1 mb-2">{dn.map(d=><div key={d} className="text-center text-[9px] text-white/25 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((day,i)=>{if (!day) return <div key={i}/>;const dt=td[day]||[];const it=day===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();return (<div key={day} className={`min-h-[52px] rounded-xl p-1.5 border ${it?'border-violet-500/50 bg-violet-500/10':'border-white/[0.04] bg-white/[0.015]'}`}><div className={`text-[10px] mb-1 font-medium ${it?'text-violet-400':'text-white/25'}`}>{day}</div>{dt.slice(0,2).map(t=>(<div key={t.id} className={`text-[7px] px-1 py-0.5 rounded mb-0.5 truncate leading-tight ${t.priority==='high'?'bg-red-500/20 text-red-300':t.priority==='medium'?'bg-amber-500/20 text-amber-300':'bg-emerald-500/20 text-emerald-300'}`}>{t.title}</div>))}{dt.length>2&&<div className="text-[7px] text-white/20">+{dt.length-2}</div>}</div>)})}</div>
    </div>
  )
}