/**
 * Dana's Task Management Helper
 * CLI tool for Dana to update Mission Control tasks
 * 
 * Usage:
 *   node dana-tasks.js list                    - List all tasks
 *   node dana-tasks.js status <id> <status>    - Update task status (todo/inprogress/done)
 *   node dana-tasks.js add <title> [assignee]  - Add new task
 *   node dana-tasks.js note <id> <note>        - Add note to task
 *   node dana-tasks.js plan <id> <plan>        - Set Dana's plan for task
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const TASKS_FILE = 'C:\\Users\\A7Sag\\Projects\\mission-control\\tasks-state.json';
const API_URL = 'http://localhost:3000/api/tasks';

function loadTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return [];
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch (e) {
    console.error('Error loading tasks:', e.message);
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  
  // Also POST to API to sync
  const data = JSON.stringify(tasks);
  const url = new URL(API_URL);
  
  const req = http.request({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Synced to API');
    }
  });
  
  req.on('error', () => {
    console.log('⚠️ API sync failed (server may be down)');
  });
  
  req.write(data);
  req.end();
}

function listTasks() {
  const tasks = loadTasks();
  const statusEmoji = { todo: '⬜', inprogress: '🔄', done: '✅' };
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
  
  console.log('\n=== Mission Control Tasks ===\n');
  
  const grouped = {
    inprogress: tasks.filter(t => t.status === 'inprogress'),
    todo: tasks.filter(t => t.status === 'todo'),
    done: tasks.filter(t => t.status === 'done')
  };
  
  for (const [status, list] of Object.entries(grouped)) {
    if (list.length === 0) continue;
    console.log(`\n${statusEmoji[status]} ${status.toUpperCase()} (${list.length})`);
    console.log('-'.repeat(50));
    for (const t of list) {
      console.log(`  ${priorityEmoji[t.priority] || '⚪'} [${t.id}] ${t.title}`);
      if (t.assignee) console.log(`     👤 ${t.assignee}`);
      if (t.notes) console.log(`     📝 ${t.notes.substring(0, 50)}...`);
    }
  }
  console.log('\n');
}

function updateStatus(id, newStatus) {
  if (!['todo', 'inprogress', 'done'].includes(newStatus)) {
    console.error('Invalid status. Use: todo, inprogress, done');
    return;
  }
  
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    console.error(`Task not found: ${id}`);
    return;
  }
  
  const oldStatus = task.status;
  task.status = newStatus;
  saveTasks(tasks);
  
  console.log(`✅ "${task.title}": ${oldStatus} → ${newStatus}`);
}

function addTask(title, assignee = 'Dana') {
  const tasks = loadTasks();
  const id = 'd-' + Date.now().toString(36);
  
  const newTask = {
    id,
    title,
    description: '',
    assignee,
    priority: 'medium',
    status: 'todo',
    tags: [],
    createdAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  saveTasks(tasks);
  
  console.log(`✅ Added: [${id}] ${title} (${assignee})`);
}

function addNote(id, note) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    console.error(`Task not found: ${id}`);
    return;
  }
  
  task.notes = note;
  saveTasks(tasks);
  
  console.log(`✅ Note added to "${task.title}"`);
}

function setPlan(id, plan) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    console.error(`Task not found: ${id}`);
    return;
  }
  
  task.plan = plan;
  saveTasks(tasks);
  
  console.log(`✅ Plan set for "${task.title}"`);
}

// CLI Handler
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'list':
  case 'ls':
    listTasks();
    break;
  case 'status':
  case 's':
    updateStatus(args[0], args[1]);
    break;
  case 'add':
  case 'a':
    addTask(args[0], args[1]);
    break;
  case 'note':
  case 'n':
    addNote(args[0], args.slice(1).join(' '));
    break;
  case 'plan':
  case 'p':
    setPlan(args[0], args.slice(1).join(' '));
    break;
  default:
    console.log(`
Dana's Task Manager

Commands:
  list                    List all tasks
  status <id> <status>    Update status (todo/inprogress/done)
  add <title> [assignee]  Add new task
  note <id> <note>        Add note to task
  plan <id> <plan>        Set execution plan

Examples:
  node dana-tasks.js list
  node dana-tasks.js status d7 done
  node dana-tasks.js add "Build Memory Viewer" Dana
`);
}
