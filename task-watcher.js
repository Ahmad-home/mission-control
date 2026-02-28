/**
 * Mission Control Task Watcher
 * Monitors tasks-state.json and notifies Dana on Telegram when changes occur
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TASKS_FILE = 'C:\\Users\\A7Sag\\Projects\\mission-control\\tasks-state.json';
const GROUP_ID = '-1003899530580';
const TOPIC_ID = '1';

let lastState = null;
let lastHash = null;
let lastNotificationTime = 0;
const MIN_NOTIFICATION_INTERVAL = 5000; // 5 seconds minimum between notifications

function getFileHash(content) {
  return require('crypto').createHash('md5').update(content).digest('hex');
}

function loadTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return { tasks: [], hash: null };
    const content = fs.readFileSync(TASKS_FILE, 'utf8');
    return { tasks: JSON.parse(content), hash: getFileHash(content) };
  } catch (e) {
    console.error('Error reading tasks:', e.message);
    return { tasks: [], hash: null };
  }
}

function compareTasks(oldTasks, newTasks) {
  const changes = [];
  const oldMap = new Map(oldTasks.map(t => [t.id, t]));
  const newMap = new Map(newTasks.map(t => [t.id, t]));

  // New tasks
  for (const [id, task] of newMap) {
    if (!oldMap.has(id)) {
      changes.push({ type: 'add', task });
    }
  }

  // Deleted tasks
  for (const [id, task] of oldMap) {
    if (!newMap.has(id)) {
      changes.push({ type: 'delete', task });
    }
  }

  // Modified tasks
  for (const [id, newTask] of newMap) {
    const oldTask = oldMap.get(id);
    if (oldTask) {
      if (oldTask.status !== newTask.status) {
        changes.push({ type: 'status', task: newTask, from: oldTask.status, to: newTask.status });
      }
      if (oldTask.notes !== newTask.notes && newTask.notes) {
        changes.push({ type: 'notes', task: newTask, notes: newTask.notes });
      }
      if (oldTask.priority !== newTask.priority) {
        changes.push({ type: 'priority', task: newTask, from: oldTask.priority, to: newTask.priority });
      }
    }
  }

  return changes;
}

function formatChanges(changes) {
  const statusAr = { todo: 'للعمل', inprogress: 'قيد التنفيذ', done: 'مكتمل' };
  const messages = [];
  
  for (const c of changes) {
    switch (c.type) {
      case 'add':
        messages.push({ text: `➕ مهمة جديدة: ${c.task.title}`, priority: 'normal' });
        break;
      case 'delete':
        messages.push({ text: `🗑️ محذوفة: ${c.task.title}`, priority: 'normal' });
        break;
      case 'status':
        // Special handling for tasks moving to inprogress
        if (c.to === 'inprogress' && c.task.assignee === 'Dana') {
          let taskMsg = `🚀 دانا، ابدئي بالمهمة:\n\n`;
          taskMsg += `📌 **${c.task.title}**\n`;
          if (c.task.description) taskMsg += `📝 ${c.task.description}\n`;
          if (c.task.notes) taskMsg += `💬 ملاحظة أحمد: ${c.task.notes}\n`;
          if (c.task.dueDate) taskMsg += `📅 الموعد: ${c.task.dueDate}\n`;
          taskMsg += `\nID: ${c.task.id}`;
          messages.push({ text: taskMsg, priority: 'high' });
        } else {
          messages.push({ 
            text: `🔄 ${c.task.title}: ${statusAr[c.from] || c.from} → ${statusAr[c.to] || c.to}`,
            priority: 'normal'
          });
        }
        break;
      case 'notes':
        // Notes added = Ahmad's instructions
        let noteMsg = `📝 ملاحظة جديدة من أحمد على "${c.task.title}":\n${c.notes}`;
        messages.push({ text: noteMsg, priority: c.task.assignee === 'Dana' ? 'high' : 'normal' });
        break;
      case 'priority':
        messages.push({ text: `⚡ أولوية ${c.task.title}: ${c.from} → ${c.to}`, priority: 'normal' });
        break;
    }
  }
  
  return messages;
}

function sendNotification(message, skipRateLimit = false) {
  // Prevent duplicate notifications (unless high priority)
  const now = Date.now();
  if (!skipRateLimit && now - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
    console.log('[SKIP] Too soon since last notification');
    return;
  }
  lastNotificationTime = now;
  
  // Escape for PowerShell command line
  const escaped = message.replace(/`/g, '``').replace(/"/g, '`"').replace(/\$/g, '`$');
  const cmd = `openclaw message send --channel telegram --target "${GROUP_ID}" --thread-id "${TOPIC_ID}" --message "${escaped}"`;
  
  console.log('[SEND]', cmd.substring(0, 100) + '...');
  
  exec(cmd, { shell: 'powershell.exe', timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('[ERROR] Send failed:', error.message);
      // Write to file as backup
      fs.appendFileSync(
        path.join(__dirname, 'pending-notifications.txt'),
        `${new Date().toISOString()}: ${message}\n`
      );
    } else {
      console.log('[OK] Notification sent');
    }
  });
}

function checkForChanges() {
  const { tasks: newTasks, hash: newHash } = loadTasks();
  
  if (lastHash === null) {
    lastState = newTasks;
    lastHash = newHash;
    console.log(`[INIT] Watching ${newTasks.length} tasks`);
    return;
  }

  if (newHash === lastHash) return;

  console.log(`[CHANGE] Detected at ${new Date().toLocaleTimeString()}`);
  
  const changes = compareTasks(lastState, newTasks);
  
  if (changes.length > 0) {
    const messages = formatChanges(changes);
    
    // Send high priority messages individually (task assignments)
    const highPriority = messages.filter(m => m.priority === 'high');
    const normalPriority = messages.filter(m => m.priority === 'normal');
    
    for (const msg of highPriority) {
      console.log('[HIGH]', msg.text);
      sendNotification(msg.text, true); // Skip rate limit for task assignments
    }
    
    // Bundle normal updates
    if (normalPriority.length > 0) {
      const bundled = `📊 Dashboard Update:\n${normalPriority.map(m => m.text).join('\n')}`;
      console.log('[NORMAL]', bundled);
      // Only send if no high priority (to avoid spam)
      if (highPriority.length === 0) {
        sendNotification(bundled);
      }
    }
  }

  lastState = newTasks;
  lastHash = newHash;
}

// Watch file for changes with aggressive debouncing
let debounce = null;
let lastCheckTime = 0;
fs.watch(TASKS_FILE, (eventType) => {
  if (eventType === 'change') {
    clearTimeout(debounce);
    // Only check if enough time has passed since last check
    const now = Date.now();
    if (now - lastCheckTime < 2000) {
      return; // Skip if checked less than 2 seconds ago
    }
    debounce = setTimeout(() => {
      lastCheckTime = Date.now();
      checkForChanges();
    }, 1000); // Wait 1 second for file to stabilize
  }
});

// Initial load
checkForChanges();

console.log('=== Mission Control Task Watcher ===');
console.log(`File: ${TASKS_FILE}`);
console.log(`Target: Telegram ${GROUP_ID}:${TOPIC_ID}`);
console.log('Waiting for changes...');
