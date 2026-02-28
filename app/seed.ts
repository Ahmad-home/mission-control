const now = new Date().toISOString()

export const SEED_VERSION = '2026-02-28-v5'

export const SEED_TASKS = [
  // AHMAD
  { id: 'a1', title: 'Build AI Agent - Technical Proposal System', description: 'بناء AI Agent لإنشاء Technical Proposals تلقائياً', assignee: 'Ahmad', priority: 'high', status: 'inprogress', tags: ['Audiom', 'AI'], dueDate: '2026-03-05', createdAt: now },
  { id: 'a2', title: 'Domain Setup + Webflow for audiom.sa', description: 'ضبط الدومين وربطه مع Webflow', assignee: 'Ahmad', priority: 'medium', status: 'inprogress', tags: ['Audiom', 'Webflow'], dueDate: '2026-03-10', createdAt: now },
  { id: 's1', title: 'Follow Up with Tech Team (Sonika)', description: 'متابعة أحمد حجازي + مصطفى — الخميس 6 مارس', assignee: 'Ahmad', priority: 'high', status: 'todo', tags: ['Sonika'], dueDate: '2026-03-06', createdAt: now },
  { id: 's2', title: 'Review MVP Platform Requirements', description: 'مراجعة متطلبات الـ MVP قبل اجتماع الفريق', assignee: 'Ahmad', priority: 'high', status: 'todo', tags: ['Sonika', 'MVP'], dueDate: '2026-03-06', createdAt: now },
  { id: 'a3', title: 'Benderz — Make a Decision', description: 'قرار نهائي: هل نكمل أو نوقف؟', assignee: 'Ahmad', priority: 'medium', status: 'todo', tags: ['Audiom', 'Benderz'], dueDate: '2026-03-15', createdAt: now },
  { id: 'a4', title: 'Plan AI Automation Roadmap', description: 'خارطة طريق لمشاريع الأتمتة', assignee: 'Ahmad', priority: 'medium', status: 'todo', tags: ['Audiom', 'AI'], createdAt: now },
  { id: 'a5', title: 'Webhook → n8n Integration', description: 'ربط OpenClaw بـ n8n عبر webhook', assignee: 'Ahmad', priority: 'medium', status: 'todo', tags: ['n8n', 'Audiom'], dueDate: '2026-03-20', createdAt: now },

  // DANA — Active
  { id: 'd-redesign', title: 'Mission Control — Effort + Capacity + DnD', description: 'إضافة تقدير الجهد وشريط السعة والسحب والإفلات', assignee: 'Dana', priority: 'high', status: 'inprogress', tags: ['Mission Control', 'OpenClaw'], dueDate: '2026-02-28', createdAt: now, activeNow: true, effort: 'heavy', progress: 85 },

  // DANA — Todo
  { id: 'd-gcal', title: 'Google Calendar Integration', description: 'ربط Google Calendar لإدارة المواعيد', assignee: 'Dana', priority: 'medium', status: 'todo', tags: ['OpenClaw', 'Integration'], dueDate: '2026-03-18', createdAt: now, effort: 'heavy' },
  { id: 'd-n8n', title: 'Explore n8n Integration', description: 'ربط n8n بـ OpenClaw', assignee: 'Dana', priority: 'medium', status: 'todo', tags: ['n8n', 'OpenClaw'], createdAt: now, effort: 'medium' },
  { id: 'd-x', title: 'Setup X Account in Browser', description: 'تسجيل دخول @Dana_persists', assignee: 'Dana', priority: 'low', status: 'todo', tags: ['OpenClaw', 'Setup'], createdAt: now, effort: 'light' },

  // DANA — Done (with completedAt)
  { id: 'd-done-vercel', title: 'Deploy Mission Control to Vercel', assignee: 'Dana', priority: 'high', status: 'done', tags: ['Mission Control', 'Deployment'], createdAt: now, effort: 'medium', progress: 100, completedAt: '2026-02-28T10:00:00Z' },
  { id: 'd-done-tailscale', title: 'Setup Tailscale — Remote Access', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['OpenClaw', 'Setup'], createdAt: now, effort: 'light', progress: 100, completedAt: '2026-02-28T01:00:00Z' },
  { id: 'd-done-memory', title: 'Mission Control — Memory Viewer', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['Mission Control'], createdAt: now, effort: 'medium', progress: 100, completedAt: '2026-02-28T03:10:00Z' },
  { id: 'd-done-heartbeat', title: 'Heartbeat System — Escalation', assignee: 'Dana', priority: 'high', status: 'done', tags: ['OpenClaw', 'Heartbeat'], createdAt: now, effort: 'heavy', progress: 100, completedAt: '2026-02-27T22:00:00Z' },
  { id: 'd-done-watchdog', title: 'Watchdog System — Fix & Verify', assignee: 'Dana', priority: 'high', status: 'done', tags: ['OpenClaw'], createdAt: now, effort: 'medium', progress: 100, completedAt: '2026-02-27T20:00:00Z' },
  { id: 'd-done-mobile', title: 'Mission Control — Mobile Friendly', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['Mission Control', 'UI'], createdAt: now, effort: 'medium', progress: 100, completedAt: '2026-02-27T18:00:00Z' },
  { id: 'd-done-filters', title: 'Fix Filters — Cleanup', assignee: 'Dana', priority: 'medium', status: 'done', tags: ['Mission Control'], createdAt: now, effort: 'light', progress: 100, completedAt: '2026-02-28T15:00:00Z' },
]