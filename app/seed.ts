const now = new Date().toISOString()

export const SEED_VERSION = '2026-02-28-v6'

export const SEED_TASKS = [
  // AHMAD
  { id: 'a1', title: 'Build AI Agent - Technical Proposal System', description: 'بناء AI Agent لإنشاء Technical Proposals تلقائياً', assignee: 'Ahmad', priority: 'high', status: 'inprogress', tags: ['Audiom', 'AI'], dueDate: '2026-03-05', createdAt: now },
  { id: 'a2', title: 'Domain Setup + Webflow for audiom.sa', description: 'ضبط الدومين وربطه مع Webflow', assignee: 'Ahmad', priority: 'medium', status: 'inprogress', tags: ['Audiom', 'Webflow'], dueDate: '2026-03-10', createdAt: now },
  { id: 's1', title: 'Follow Up with Tech Team (Sonika)', description: 'متابعة أحمد حجازي + مصطفى — الخميس 6 مارس', assignee: 'Ahmad', priority: 'high', status: 'todo', tags: ['Sonika'], dueDate: '2026-03-06', createdAt: now },
  { id: 's2', title: 'Review MVP Platform Requirements', description: 'مراجعة متطلبات الـ MVP قبل اجتماع الفريق', assignee: 'Ahmad', priority: 'high', status: 'todo', tags: ['Sonika', 'MVP'], dueDate: '2026-03-06', createdAt: now },
  { id: 'a3', title: 'Benderz — Make a Decision', description: 'قرار نهائي: هل نكمل أو نوقف؟', assignee: 'Ahmad', priority: 'medium', status: 'todo', tags: ['Audiom', 'Benderz'], dueDate: '2026-03-15', createdAt: now },
  { id: 'a4', title: 'Plan AI Automation Roadmap', description: 'خارطة طريق لمشاريع الأتمتة', assignee: 'Ahmad', priority: 'medium', status: 'todo', tags: ['Audiom', 'AI'], createdAt: now },

  // DANA — Active NOW ⚡
  { id: 'd-dashboard-v2', title: 'Mission Control — Dashboard V2', description: 'تحسين الداشبورد: Effort + Capacity + Review Status + تقارير الإنجاز', assignee: 'Dana', priority: 'high', status: 'inprogress', tags: ['Mission Control', 'OpenClaw'], dueDate: '2026-02-28', createdAt: now, activeNow: true, effort: 'heavy', progress: 60 },

  // DANA — Todo
  { id: 'd-gcal', title: 'Google Calendar Integration', description: 'ربط Google Calendar لإدارة المواعيد', assignee: 'Dana', priority: 'medium', status: 'todo', tags: ['OpenClaw', 'Integration'], dueDate: '2026-03-18', createdAt: now, effort: 'heavy' },
  { id: 'd-n8n', title: 'Explore n8n Integration', description: 'ربط n8n بـ OpenClaw', assignee: 'Dana', priority: 'medium', status: 'todo', tags: ['n8n', 'OpenClaw'], createdAt: now, effort: 'medium' },
  { id: 'd-x', title: 'Setup X Account in Browser', description: 'تسجيل دخول @Dana_persists', assignee: 'Dana', priority: 'low', status: 'todo', tags: ['OpenClaw', 'Setup'], createdAt: now, effort: 'light' },

  // DANA — Done (with completionNotes)
  { id: 'd-done-vercel', title: 'Deploy Mission Control to Vercel', assignee: 'Dana', priority: 'high', status: 'done', tags: ['Mission Control', 'Deployment'], createdAt: '2026-02-28T08:00:00Z', effort: 'medium', progress: 100, completedAt: '2026-02-28T10:00:00Z', completionNotes: '✅ نشر التطبيق على Vercel\\n✅ ربط الـ GitHub repo\\n✅ إعداد الـ environment variables\\n🔗 https://mission-control-zeta-lake.vercel.app' },
  { id: 'd-done-memory', title: 'Mission Control — Memory Viewer', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['Mission Control'], createdAt: '2026-02-28T01:00:00Z', effort: 'medium', progress: 100, completedAt: '2026-02-28T03:10:00Z', completionNotes: '✅ بناء API route /api/memory\\n✅ صفحة /memory لعرض الملفات\\n✅ فلتر حسب النوع (يومي/نظام)\\n✅ عرض المحتوى بتنسيق markdown' },
  { id: 'd-done-tailscale', title: 'Setup Tailscale — Remote Access', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['OpenClaw', 'Setup'], createdAt: '2026-02-27T23:00:00Z', effort: 'light', progress: 100, completedAt: '2026-02-28T01:00:00Z', completionNotes: '✅ تثبيت Tailscale على اللابتوب\\n✅ ربط الجوال\\n✅ IP: 100.65.202.47\\n✅ حساب: Ctc.ah100@hotmail.com' },
  { id: 'd-done-heartbeat', title: 'Heartbeat System — Escalation', assignee: 'Dana', priority: 'high', status: 'done', tags: ['OpenClaw', 'Heartbeat'], createdAt: '2026-02-27T18:00:00Z', effort: 'heavy', progress: 100, completedAt: '2026-02-27T22:00:00Z', completionNotes: '✅ نظام تنبيهات متدرج (🟢🟡🔴)\\n✅ TTS للتنبيهات العاجلة\\n✅ تسجيل التنبيهات في alerts.md\\n✅ Morning Escalation في البريفينج' },
  { id: 'd-done-watchdog', title: 'Watchdog System — Fix & Verify', assignee: 'Dana', priority: 'high', status: 'done', tags: ['OpenClaw'], createdAt: '2026-02-27T16:00:00Z', effort: 'medium', progress: 100, completedAt: '2026-02-27T20:00:00Z', completionNotes: '✅ إصلاح سكربت watchdog.ps1\\n✅ Task Scheduler مضبوط\\n✅ يراقب كل 5 دقايق\\n✅ يعيد تشغيل Gateway تلقائياً' },
  { id: 'd-done-filters', title: 'Fix Filters — Dana Assignee', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['Mission Control'], createdAt: '2026-02-28T14:00:00Z', effort: 'light', progress: 100, completedAt: '2026-02-28T15:00:00Z', completionNotes: '✅ إصلاح case mismatch (Dana vs dana)\\n✅ تحديث API route\\n✅ الفلاتر تشتغل صح الحين' },
]