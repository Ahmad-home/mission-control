'use client'

import { useState, useEffect } from 'react'
import { SEED_TASKS, SEED_VERSION } from './seed'

type Priority = 'high' | 'medium' | 'low'
type Status = 'todo' | 'inprogress' | 'done'
type Assignee = 'Ahmad' | 'Dana'
type ViewMode = 'focus' | 'board' | 'calendar'
type ProjectFilter = 'all' | 'Sonika' | 'Audiom' | 'Dana' | 'OpenClaw'
type SortBy = 'dueDate' | 'priority' | 'createdAt'

interface Task {
  id: string
  title: string
  description: string
  plan?: string
  notes?: string
  assignee: Assignee
  priority: Priority
  status: Status
  createdAt: string
  dueDate?: string
  tags: string[]
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border border-green-500/30',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'عاجل',
  medium: 'متوسط',
  low: 'منخفض',
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 1, medium: 2, low: 3 }

const PROJECT_TAGS: Record<ProjectFilter, string[]> = {
  all: [],
  Sonika: ['Sonika', 'MVP'],
  Audiom: ['Audiom', 'Webflow', 'Benderz', 'Ramz'],
  Dana: ['OpenClaw', 'Mission Control', 'Heartbeat', 'Memory', 'Setup', 'Browser', 'Network', 'Deployment'],
  OpenClaw: ['OpenClaw', 'Heartbeat', 'Memory'],
}

const PROJECT_LABELS: Record<ProjectFilter, string> = {
  all: 'الكل',
  Sonika: '🎵 Sonika',
  Audiom: '🏢 Audiom',
  Dana: '💜 دانا',
  OpenClaw: '🤖 OpenClaw',
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function matchesProject(task: Task, project: ProjectFilter): boolean {
  if (project === 'all') return true
  return task.tags.some(tag => PROJECT_TAGS[project].includes(tag))
}

function formatDueDate(dueDate?: string): { label: string; color: string } | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `تأخّر ${Math.abs(diff)} أيام`, color: 'text-red-400 bg-red-500/10 border-red-500/30' }
  if (diff === 0) return { label: 'اليوم', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' }
  if (diff === 1) return { label: 'غداً', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' }
  if (diff <= 7) return { label: `${diff} أيام`, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' }
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return { label: `${new Date(dueDate).getDate()} ${months[new Date(dueDate).getMonth()]}`, color: 'text-white/40 bg-white/5 border-white/10' }
}

function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      return diff !== 0 ? diff : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

// Simple toggle button group component
function FilterGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            value === opt.value
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function MissionControl() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [view, setView] = useState<ViewMode>('focus')
  const [project, setProject] = useState<ProjectFilter>('all')
  const [showFocusArchive, setShowFocusArchive] = useState(false)
  const [filterAssignee, setFilterAssignee] = useState<'all' | Assignee>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all')
  const [sortBy, setSortBy] = useState<SortBy>('dueDate')
  const [form, setForm] = useState({
    title: '', description: '', plan: '', notes: '',
    assignee: 'Ahmad' as Assignee,
    priority: 'medium' as Priority,
    status: 'todo' as Status,
    tags: '', dueDate: '',
  })

  useEffect(() => {
    // Always fetch from API first (for cross-device access)
    const loadTasks = async () => {
      try {
        const res = await fetch('/api/tasks')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data) && data.length > 0) {
            setTasks(data)
            localStorage.setItem('mission-control-tasks', JSON.stringify(data))
            localStorage.setItem('mission-control-version', SEED_VERSION)
            return
          }
        }
      } catch {}
      const savedVersion = localStorage.getItem('mission-control-version')
      const saved = localStorage.getItem('mission-control-tasks')
      if (saved && savedVersion === SEED_VERSION) {
        setTasks(JSON.parse(saved))
      } else {
        setTasks(SEED_TASKS as Task[])
        localStorage.setItem('mission-control-tasks', JSON.stringify(SEED_TASKS))
        localStorage.setItem('mission-control-version', SEED_VERSION)
      }
    }
    loadTasks()
    const sf = localStorage.getItem('mc-filters')
    if (sf) {
      try {
        const f = JSON.parse(sf)
        if (f.filterAssignee) setFilterAssignee(f.filterAssignee)
        if (f.filterPriority) setFilterPriority(f.filterPriority)
        if (f.sortBy) setSortBy(f.sortBy)
      } catch {}
    }

    // Auto-poll: check API for task updates every 30s
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/tasks')
        if (!res.ok) return
        const data = await res.json()
        if (data && Array.isArray(data) && data.length > 0) {
          setTasks(data)
          localStorage.setItem('mission-control-tasks', JSON.stringify(data))
        }
      } catch {}
    }, 30000)

    // Also sync across browser tabs via storage events
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mission-control-tasks' && e.newValue) {
        try { setTasks(JSON.parse(e.newValue)) } catch {}
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(poll)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const saveFilters = (updates: object) => {
    const current = { filterAssignee, filterPriority, sortBy }
    localStorage.setItem('mc-filters', JSON.stringify({ ...current, ...updates }))
  }

  const saveTasks = (t: Task[]) => {
    setTasks(t)
    localStorage.setItem('mission-control-tasks', JSON.stringify(t))
    fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).catch(() => {})
  }

  const openAdd = (status: Status = 'todo') => {
    setEditingTask(null)
    setForm({ title: '', description: '', plan: '', notes: '', assignee: 'Ahmad', priority: 'medium', status, tags: '', dueDate: '' })
    setShowForm(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title, description: task.description, plan: task.plan || '',
      notes: task.notes || '',
      assignee: task.assignee, priority: task.priority, status: task.status,
      tags: task.tags.join(', '), dueDate: task.dueDate || '',
    })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    const tagList = form.tags.split(',').map((x: string) => x.trim()).filter(Boolean)
    if (editingTask) {
      saveTasks(tasks.map(t => t.id === editingTask.id ? {
        ...t, ...form, tags: tagList,
        dueDate: form.dueDate || undefined,
        plan: form.plan || undefined,
        notes: form.notes || undefined,
      } : t))
    } else {
      saveTasks([...tasks, {
        id: generateId(), title: form.title, description: form.description,
        plan: form.plan || undefined, notes: form.notes || undefined,
        assignee: form.assignee, priority: form.priority,
        status: form.status, tags: tagList, createdAt: new Date().toISOString(),
        dueDate: form.dueDate || undefined,
      }])
    }
    setShowForm(false)
  }

  const deleteTask = (id: string) => saveTasks(tasks.filter(t => t.id !== id))
  const moveTask = (id: string, status: Status) => saveTasks(tasks.map(t => t.id === id ? { ...t, status } : t))

  const applyFilters = (list: Task[]) => {
    let r = project === 'all' ? list : list.filter(t => matchesProject(t, project))
    if (filterAssignee !== 'all') r = r.filter(t => t.assignee === filterAssignee)
    if (filterPriority !== 'all') r = r.filter(t => t.priority === filterPriority)
    return r
  }

  const activeTasks = applyFilters(tasks.filter(t => t.status !== 'done'))
  const doneTasks = applyFilters(tasks.filter(t => t.status === 'done'))
  const inprogressTasks = sortTasks(activeTasks.filter(t => t.status === 'inprogress'), sortBy)
  const urgentTasks = sortTasks(activeTasks.filter(t => t.priority === 'high' && t.status === 'todo'), sortBy)
  const pendingTasks = sortTasks(activeTasks.filter(t => t.status === 'todo' && t.priority !== 'high'), sortBy)
  const todoTasks = sortTasks(applyFilters(tasks.filter(t => t.status === 'todo')), sortBy)

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white font-sans" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 bg-[#111318] sticky top-0 z-30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold shrink-0">M</div>
            <div>
              <h1 className="font-bold text-base tracking-tight">Mission Control</h1>
              <p className="text-xs text-white/40">Dana x Ahmad</p>
            </div>
          </div>
          <div className="flex items-center gap-2"><div className="flex bg-white/5 rounded-lg p-1 gap-1">
            {([{id:'focus',label:'🎯 Focus'},{id:'board',label:'📌 Board'},{id:'calendar',label:'📅 Calendar'}] as {id:ViewMode;label:string}[]).map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${view===tab.id?'bg-white/10 text-white':'text-white/40 hover:text-white/60'}`}>
                {tab.label}
              </button>
            ))}
            </div>
            <a href="/memory" className="px-3 py-2 rounded-md text-xs font-medium bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
              🧠 Memory
            </a>
          </div>
        </div>

        {/* Project tabs */}
        {view !== 'calendar' && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {(Object.keys(PROJECT_LABELS) as ProjectFilter[]).map(p => (
              <button key={p} onClick={() => setProject(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${project===p?'bg-violet-600 border-violet-500 text-white':'bg-white/5 border-white/10 text-white/50 hover:text-white/80'}`}>
                {PROJECT_LABELS[p]}
              </button>
            ))}
          </div>
        )}

        {/* Filter + Sort bar â€” button groups (no select dropdowns) */}
        {view !== 'calendar' && (
          <div className="flex flex-wrap gap-3 mt-3 items-center">
            <FilterGroup<'all' | Assignee>
              value={filterAssignee}
              onChange={v => { setFilterAssignee(v); saveFilters({ filterAssignee: v }) }}
              options={[
              { value: 'all', label: 'الكل' },
              { value: 'Ahmad', label: 'أحمد' },
              { value: 'Dana', label: 'دانا' },
              ]}
            />
            <FilterGroup<'all' | Priority>
              value={filterPriority}
              onChange={v => { setFilterPriority(v); saveFilters({ filterPriority: v }) }}
              options={[
              { value: 'all', label: 'الأولوية' },
              { value: 'high', label: '🔴 عاجل' },
              { value: 'medium', label: '🟡 متوسط' },
              { value: 'low', label: '🟢 منخفض' },
              ]}
            />
            <div className="h-4 w-px bg-white/10" />
            <FilterGroup<SortBy>
              value={sortBy}
              onChange={v => { setSortBy(v); saveFilters({ sortBy: v }) }}
              options={[
              { value: 'dueDate', label: '📅 الموعد' },
              { value: 'priority', label: '🔥 الأولوية' },
              { value: 'createdAt', label: '🕒 الأقدم' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {view !== 'calendar' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {[
          {label:'نشط',value:inprogressTasks.length,icon:'⚡',color:'text-blue-400'},
          {label:'عاجل',value:urgentTasks.length,icon:'🔴',color:'text-red-400'},
          {label:'أحمد',value:applyFilters(tasks.filter(t=>t.assignee==='Ahmad'&&t.status!=='done')).length,icon:'👨',color:'text-white'},
          {label:'دانا',value:applyFilters(tasks.filter(t=>t.assignee==='Dana'&&t.status!=='done')).length,icon:'💜',color:'text-violet-400'},
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
              <span className="text-xl">{stat.icon}</span>
              <div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOCUS VIEW */}
      {view === 'focus' && (
        <div className="px-4 pb-6">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            <Column title="قيد التنفيذ" icon="⚡" color="border-t-blue-400" count={inprogressTasks.length} onAdd={() => openAdd('inprogress')}>
              {inprogressTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">لا يوجد شيء جارٍ الآن</p>}
              {inprogressTasks.map(t => <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={deleteTask} onMove={moveTask} />)}
            </Column>
            <Column title="عاجل جداً" icon="🔴" color="border-t-red-400" count={urgentTasks.length} onAdd={() => openAdd('todo')}>
              {urgentTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">لا يوجد شيء عاجل</p>}
              {urgentTasks.map(t => <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={deleteTask} onMove={moveTask} />)}
            </Column>
          </div>

          {pendingTasks.length > 0 && (
              <p className="text-xs text-white/30 mb-3 px-1">📥 قائمة المهام</p>
              <p className="text-xs text-white/30 mb-3 px-1">📥 قائمة الانتظار</p>
              <div className="flex flex-col gap-2">
                {pendingTasks.map(task => {
                  const due = formatDueDate(task.dueDate)
                  return (
                      <span className="text-sm">{task.priority==='medium'?'🟡':'🟢'}</span>
                      <span className="text-sm">{task.priority==='medium'?'🟡':'🟢'}</span>
                      <span className="text-sm flex-1">{task.title}</span>
                      {due && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${due.color}`}>{due.label}</span>}
                      <span className="text-xs text-white/30">{task.assignee==='Ahmad'?'أحمد':'دانا'}</span>
                      <button onClick={e => { e.stopPropagation(); moveTask(task.id,'inprogress') }}
                        className="text-xs bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 px-2 py-1 rounded-md text-white/40 transition-all">⚡ ابدأ</button>
                        className="text-xs bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 px-2 py-1 rounded-md text-white/40 transition-all">⚡ ابدأ</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button onClick={() => setShowFocusArchive(!showFocusArchive)}
            <button onClick={() => setShowFocusArchive(!showFocusArchive)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
              {showFocusArchive ? '✖ إخفاء المكتملة' : `✔ عرض المكتملة (${doneTasks.length})`}
              {showFocusArchive ? '✖ إخفاء المكتملة' : `✔ عرض المكتملة (${doneTasks.length})`}
              {showFocusArchive ? '✖ إخفاء المكتملة' : `✔ عرض المكتملة (${doneTasks.length})`}
            </button>
            {showFocusArchive && (
              <div className="mt-3 flex flex-col gap-2">
                {doneTasks.map(task => (
                  <div key={task.id} className="bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 flex items-center gap-3 opacity-60 cursor-pointer hover:opacity-80" onClick={() => openEdit(task)}>
                    <span className="text-sm">âœ…</span>
                    <span className="text-sm flex-1 line-through text-white/50">{task.title}</span>
                    <span className="text-xs text-white/30">{task.assignee==='Ahmad'?'أحمد':'دانا'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOARD VIEW â€” Done column always visible */}
      {view === 'board' && (
        <div className="px-4 pb-6">
            <Column title="قائمة المهام" icon="📌" color="border-t-slate-400" count={todoTasks.length} onAdd={() => openAdd('todo')}>
            <Column title="قائمة المهام" icon="📌" color="border-t-slate-400" count={todoTasks.length} onAdd={() => openAdd('todo')}>
              {todoTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">فارغ</p>}
              {todoTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">فارغ</p>}
            <Column title="قيد التنفيذ" icon="⚡" color="border-t-blue-400" count={inprogressTasks.length} onAdd={() => openAdd('inprogress')}>
            <Column title="قيد التنفيذ" icon="⚡" color="border-t-blue-400" count={inprogressTasks.length} onAdd={() => openAdd('inprogress')}>
              {inprogressTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">فارغ</p>}
              {inprogressTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">فارغ</p>}
            </Column>
            {/* Done â€” always visible */}
            <Column title="ظ…ظƒطھظ…ظ„" icon="âœ…" color="border-t-green-400" count={doneTasks.length} onAdd={() => {}}>
              {doneTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">فارغ</p>}
              {doneTasks.length === 0 && <p className="text-xs text-white/20 text-center py-6">فارغ</p>}
            </Column>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="p-4 md:p-6"><CalendarView tasks={tasks} /></div>
      )}

      {view !== 'calendar' && (
        <button onClick={() => openAdd()} className="fixed bottom-6 left-6 w-14 h-14 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-violet-900/50 transition-all z-40">+</button>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
            <h2 className="text-lg font-bold mb-5">{editingTask ? 'تعديل المهمة' : 'إضافة مهمة'}</h2>
            <h2 className="text-lg font-bold mb-5">{editingTask ? 'تعديل المهمة' : 'إضافة مهمة'}</h2>
              <Field label="العنوان *">
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="عنوان المهمة..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20" />
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="عنوان المهمة..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20" />
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20" />
              <Field label="الوصف">
                <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="وصف المهمة..." rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none" />
                <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="وصف المهمة..." rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none" />
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none" />
              <Field label="📝 ملاحظات">
                <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="ملاحظات وتفاصيل..." rows={3}
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/40 transition-all placeholder:text-white/20 resize-none leading-relaxed" />
                <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="ملاحظات وتفاصيل..." rows={3}
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/40 transition-all placeholder:text-white/20 resize-none leading-relaxed" />
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/40 transition-all placeholder:text-white/20 resize-none leading-relaxed" />
              <Field label="🛠 خطة التنفيذ / Plan">
                <textarea value={form.plan} onChange={e => setForm({...form,plan:e.target.value})} placeholder="خطوات التنفيذ..." rows={4}
                  className="w-full bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none font-mono text-xs leading-relaxed" />
                <textarea value={form.plan} onChange={e => setForm({...form,plan:e.target.value})} placeholder="خطوات التنفيذ..." rows={4}
                  className="w-full bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none font-mono text-xs leading-relaxed" />
                  className="w-full bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 resize-none font-mono text-xs leading-relaxed" />
              </Field>
              <Field label="المسؤول">
              <Field label="المسؤول">
                  <select value={form.assignee} onChange={e => setForm({...form,assignee:e.target.value as Assignee})}
                    <option value="Ahmad">أحمد</option>
                    <option value="Dana">دانا</option>
                    <option value="Dana">دانا</option>
                  </select>
              <Field label="الأولوية">
              <Field label="الأولوية">
                  <select value={form.priority} onChange={e => setForm({...form,priority:e.target.value as Priority})}
                    <option value="high">🔴 عاجل</option>
                    <option value="medium">🟡 متوسط</option>
                    <option value="low">🟢 منخفض</option>
                    <option value="low">🟢 منخفض</option>
                  </select>
              <Field label="الحالة">
              <Field label="الحالة">
                  <select value={form.status} onChange={e => setForm({...form,status:e.target.value as Status})}
                    <option value="todo">📌 للبدء</option>
                    <option value="inprogress">⚡ قيد التنفيذ</option>
                    <option value="done">✅ مكتمل</option>
                    <option value="done">âœ… ظ…ظƒطھظ…ظ„</option>
                  </select>
              <Field label="📅 تاريخ الاستحقاق">
              <Field label="📅 تاريخ الاستحقاق">
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none focus:border-violet-500/50 transition-all text-white [color-scheme:dark]" />
                </Field>
              <Field label="تاغات مفصولة بفاصلة">
              <Field label="تاغات مفصولة بفاصلة">
                <input value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} placeholder="Sonika, Audiom, ..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20 text-white" />
              </Field>
            </div>
            <div className="flex gap-3 mt-6">
              {editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
              {editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
              </button>
              {editingTask && (
                <button onClick={() => { deleteTask(editingTask.id); setShowForm(false) }}
                  className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-3.5 rounded-xl transition-all text-sm border border-red-500/20">حذف</button>
                  className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-3.5 rounded-xl transition-all text-sm border border-red-500/20">حذف</button>
              <button onClick={() => setShowForm(false)} className="px-6 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-3.5 rounded-xl transition-all text-sm">إلغاء</button>
              <button onClick={() => setShowForm(false)} className="px-6 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-3.5 rounded-xl transition-all text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

function Column({ title, icon, color, count, onAdd, children }: {
  title: string; icon: string; color: string; count: number; onAdd: () => void; children: React.ReactNode
}) {
  return (
    <div className={`bg-white/[0.03] rounded-xl border border-white/10 border-t-2 ${color} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">{count}</span>
        </div>
        <button onClick={onAdd} className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all text-sm">+</button>
      </div>
      <div className="p-3 flex flex-col gap-3 min-h-[100px]">{children}</div>
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onMove, done }: {
  task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void; onMove: (id: string, s: Status) => void; done?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isOverdue = due?.label.includes('تأخّر')
  const isOverdue = due?.label.includes('تأخّر')

  return (
    <div className={`rounded-xl p-4 border transition-all group cursor-pointer active:scale-[0.99] ${
      done ? 'bg-white/[0.02] border-white/5 opacity-60'
      : isOverdue ? 'bg-[#1a1d26] border-red-500/30 hover:border-red-500/50'
      : 'bg-[#1a1d26] border-white/10 hover:border-white/20'
    }`} onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-medium text-sm leading-snug flex-1 pl-2 ${done ? 'line-through text-white/50' : ''}`}>{task.title}</h3>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="text-white/20 hover:text-red-400 transition-all text-xs min-w-[24px] min-h-[24px] flex items-center justify-center">âœ•</button>
      </div>

      {task.description && !done && (
        <p className="text-xs text-white/40 mb-2 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Notes from Ahmad â€” always visible */}
      {task.notes && !done && (
        <div className="mb-3 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
              <span className="text-[9px] text-amber-400/70 font-medium uppercase tracking-wide">📝 ملاحظات</span>
              <span className="text-[9px] text-amber-400/70 font-medium uppercase tracking-wide">📝 ملاحظات</span>
          </div>
          <p className="text-xs text-amber-200/70 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}

      {task.plan && !done && (
        <div className="mb-3">
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
            {expanded ? '▲ إخفاء الخطة' : '▼ عرض الخطة'}
            {expanded ? '▲ إخفاء الخطة' : '▼ عرض الخطة'}
          </button>
          {expanded && (
            <div className="mt-2 bg-violet-500/5 rounded-lg p-3 border border-violet-500/20">
              <pre className="text-[11px] text-white/60 whitespace-pre-wrap leading-relaxed font-sans">{task.plan}</pre>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
              {task.assignee === 'Ahmad' ? 'أحمد' : 'دانا'}
              {task.assignee === 'Ahmad' ? 'أحمد' : 'دانا'}
        </span>
        {due && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${due.color}`}>ًں“… {due.label}</span>}
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>

      {!done && (
        <div className="flex gap-1 mt-3 md:opacity-0 md:group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
          {task.status !== 'todo' && (
            <button onClick={() => onMove(task.id, task.status==='inprogress'?'todo':'inprogress')}
              <button onClick={() => onMove(task.id, task.status==='inprogress'?'todo':'inprogress')}
                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-white/50 transition-all">← رجوع</button>
          )}
          {task.status !== 'done' && (
            <button onClick={() => onMove(task.id, task.status==='todo'?'⚡ ابدأ':'✅ أكمل')}
              className="text-xs bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 px-2 py-1 rounded-md text-white/40 transition-all">⚡ ابدأ</button>
          )}
        </div>
      )}
    </div>
  )
}

function CalendarView({ tasks }: { tasks: Task[] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

  const tasksByDay: Record<number, Task[]> = {}
  tasks.forEach(task => {
    const dateStr = task.dueDate || task.createdAt
    const d = new Date(dateStr)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!tasksByDay[day]) tasksByDay[day] = []
      tasksByDay[day].push(task)
    }
  })

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-all">â†گ</button>
        <h2 className="text-xl font-bold">{monthNames[month]} {year}</h2>
        <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-all">â†’</button>
      </div>
        {['أحد','اث','ثلا','أرب','خمس','جمعة','سبت'].map(d => (
        {['أحد','اث','ثلا','أرب','خمس','جمعة','سبت'].map(d => (
          <div key={d} className="text-center text-xs text-white/30 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dayTasks = tasksByDay[day || 0] || []
          const hasOverdue = dayTasks.some(t => t.status!=='done' && t.dueDate && new Date(t.dueDate) < now)
          return (
            <div key={i} className={`min-h-[56px] md:min-h-[80px] rounded-xl p-1 md:p-2 border transition-all ${
              day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear() ? 'border-violet-500/50 bg-violet-500/10'
              : hasOverdue ? 'border-red-500/30 bg-red-500/5'
              : 'border-white/5 bg-white/[0.02]'
            } ${!day?'opacity-0 pointer-events-none':''}`}>
              {day && (<>
                <div className="text-xs text-white/40 mb-1">{day}</div>
                {dayTasks.slice(0,2).map(t => (
                  <div key={t.id} className={`text-[9px] rounded px-1 py-0.5 mb-1 truncate ${
                    t.status==='done' ? 'bg-green-500/20 text-green-400'
                    : t.priority==='high' ? 'bg-red-500/20 text-red-300'
                    : 'bg-violet-500/20 text-violet-300'
                  }`}>{t.title}</div>
                ))}
                {dayTasks.length > 2 && <div className="text-[9px] text-white/30">+{dayTasks.length-2}</div>}
              </>)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

