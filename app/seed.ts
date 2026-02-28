const now = new Date().toISOString()

// bump this version to force-reset localStorage on next load
export const SEED_VERSION = '2026-02-28-v3'

export const SEED_TASKS = [
  // ══════════════════════════════════════════════════════════════════════════
  // AHMAD — مهام أحمد
  // ══════════════════════════════════════════════════════════════════════════
  
  // --- قيد التنفيذ ---
  {
    id: 'a1',
    title: 'Build AI Agent - Technical Proposal System',
    description: 'بناء AI Agent لإنشاء Technical Proposals تلقائياً لعملاء Audiom',
    assignee: 'Ahmad',
    priority: 'high',
    status: 'inprogress',
    tags: ['Audiom', 'AI'],
    dueDate: '2026-03-05',
    createdAt: now,
  },
  {
    id: 'a2',
    title: 'Domain Setup + Webflow for audiom.sa',
    description: 'ضبط الدومين وربطه مع Webflow لموقع audiom.sa',
    assignee: 'Ahmad',
    priority: 'medium',
    status: 'inprogress',
    tags: ['Audiom', 'Webflow'],
    dueDate: '2026-03-10',
    createdAt: now,
  },

  // --- للبدء ---
  {
    id: 's1',
    title: 'Follow Up with Tech Team (Sonika)',
    description: 'متابعة أحمد حجازي + مصطفى — الموعد الخميس 6 مارس',
    assignee: 'Ahmad',
    priority: 'high',
    status: 'todo',
    tags: ['Sonika'],
    dueDate: '2026-03-06',
    createdAt: now,
  },
  {
    id: 's2',
    title: 'Review MVP Platform Requirements (Sonika)',
    description: 'مراجعة متطلبات الـ MVP قبل اجتماع الفريق التقني القادم',
    assignee: 'Ahmad',
    priority: 'high',
    status: 'todo',
    tags: ['Sonika', 'MVP'],
    dueDate: '2026-03-06',
    createdAt: now,
  },
  {
    id: 'a3',
    title: 'Benderz — Make a Decision',
    description: 'قرار نهائي: هل نكمل مشروع Benderz أو نوقفه رسمياً؟',
    assignee: 'Ahmad',
    priority: 'medium',
    status: 'todo',
    tags: ['Audiom', 'Benderz'],
    dueDate: '2026-03-15',
    createdAt: now,
  },
  {
    id: 'a4',
    title: 'Plan AI Automation Roadmap (Audiom)',
    description: 'وضع خارطة طريق واضحة لمشاريع الأتمتة داخل Audiom',
    assignee: 'Ahmad',
    priority: 'medium',
    status: 'todo',
    tags: ['Audiom', 'AI', 'Planning'],
    createdAt: now,
  },
  {
    id: 'a5',
    title: 'Webhook → n8n Integration',
    description: 'ربط OpenClaw بـ n8n عبر HTTP webhook — لما يصل trigger من n8n ينبّه دانا فوراً',
    assignee: 'Ahmad',
    priority: 'medium',
    status: 'todo',
    tags: ['n8n', 'Audiom', 'Automation'],
    dueDate: '2026-03-20',
    createdAt: now,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DANA — مهام دانا
  // ══════════════════════════════════════════════════════════════════════════

  // --- قيد التنفيذ ---
  {
    id: 'd-redesign',
    title: 'Mission Control Redesign — RTL + Drag & Drop',
    description: 'إعادة بناء الداشبورد من الصفر: RTL-first، Tajawal font، dark command center، Drag & Drop للكاردات',
    assignee: 'Dana',
    priority: 'high',
    status: 'inprogress',
    tags: ['Mission Control', 'OpenClaw'],
    dueDate: '2026-02-28',
    createdAt: now,
    activeNow: true,
  },

  // --- للبدء ---
  {
    id: 'd-gcal',
    title: 'Google Calendar Integration',
    description: 'ربط Google Calendar لإدارة مواعيد أحمد وجدولة المهام تلقائياً',
    assignee: 'Dana',
    priority: 'medium',
    status: 'todo',
    tags: ['OpenClaw', 'Integration'],
    dueDate: '2026-03-18',
    createdAt: now,
  },
  {
    id: 'd-n8n',
    title: 'Explore n8n Integration',
    description: 'ربط n8n بـ OpenClaw لتشغيل Workflows مباشرة',
    assignee: 'Dana',
    priority: 'medium',
    status: 'todo',
    tags: ['n8n', 'OpenClaw', 'Automation'],
    createdAt: now,
  },
  {
    id: 'd-x',
    title: 'Setup X Account in Browser',
    description: 'تسجيل دخول @Dana_persists في المتصفح',
    assignee: 'Dana',
    priority: 'low',
    status: 'todo',
    tags: ['OpenClaw', 'Setup'],
    createdAt: now,
  },

  // --- مكتمل ---
  {
    id: 'd-done-vercel',
    title: 'Deploy Mission Control to Vercel',
    description: 'نشر التطبيق على Vercel — متاح من أي جهاز https://mission-control-zeta-lake.vercel.app',
    assignee: 'Dana',
    priority: 'high',
    status: 'done',
    tags: ['Mission Control', 'Deployment'],
    createdAt: now,
  },
  {
    id: 'd-done-tailscale',
    title: 'Setup Tailscale — Remote Access',
    description: 'تثبيت Tailscale على الجهاز والجوال — http://100.65.202.47:3000',
    assignee: 'Dana',
    priority: 'medium',
    status: 'done',
    tags: ['OpenClaw', 'Setup'],
    createdAt: now,
  },
  {
    id: 'd-done-memory',
    title: 'Mission Control — Memory Viewer Screen',
    description: 'شاشة تعرض ملفات الذاكرة في /memory',
    assignee: 'Dana',
    priority: 'medium',
    status: 'done',
    tags: ['Mission Control'],
    createdAt: now,
  },
  {
    id: 'd-done-heartbeat',
    title: 'Heartbeat System — Escalation & Improvements',
    description: 'تحسين نظام الـ Heartbeat: مستويات تنبيه، TTS للعاجل، alerts.md',
    assignee: 'Dana',
    priority: 'high',
    status: 'done',
    tags: ['OpenClaw', 'Heartbeat'],
    createdAt: now,
  },
  {
    id: 'd-done-watchdog',
    title: 'Watchdog System — Fix & Verify',
    description: 'إعادة كتابة watchdog.ps1 مع logging + اختبار live',
    assignee: 'Dana',
    priority: 'high',
    status: 'done',
    tags: ['OpenClaw'],
    createdAt: now,
  },
  {
    id: 'd-done-mobile',
    title: 'Mission Control — Mobile Friendly',
    description: 'تحديث الداشبورد للموبايل: responsive layout، touch targets',
    assignee: 'Dana',
    priority: 'medium',
    status: 'done',
    tags: ['Mission Control', 'UI'],
    createdAt: now,
  },
  {
    id: 'd-done-filters',
    title: 'Fix Filters — Remove Duplicate Dana Tag',
    description: 'تنظيف الفلاتر: Projects + Assignee منفصلين بدون تكرار',
    assignee: 'Dana',
    priority: 'medium',
    status: 'done',
    tags: ['Mission Control'],
    createdAt: now,
  },
]