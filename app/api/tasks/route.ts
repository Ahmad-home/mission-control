import { NextRequest, NextResponse } from 'next/server'

const NOTION_API_KEY = process.env.NOTION_API_KEY!
const NOTION_TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID!
const NOTION_VERSION = '2022-06-28'

function notionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

function truncate(str: string, max = 2000) {
  if (!str) return ''
  return str.length > max ? str.substring(0, max) : str
}

function pageToTask(page: any) {
  const p = page.properties
  const getText = (prop: any) => prop?.rich_text?.[0]?.plain_text || ''
  const getSelect = (prop: any) => prop?.select?.name || ''
  const getMultiSelect = (prop: any) => prop?.multi_select?.map((o: any) => o.name) || []
  const getDate = (prop: any) => prop?.date?.start || null
  const getTitle = (prop: any) => prop?.title?.[0]?.plain_text || ''

  return {
    id: getText(p['TaskId']) || page.id,
    title: getTitle(p['Title']),
    description: getText(p['Description']),
    assignee: getSelect(p['Assignee']) === 'dana' ? 'Dana' : (getSelect(p['Assignee']) || 'Ahmad'),
    priority: getSelect(p['Priority']),
    status: getSelect(p['Status']),
    tags: getMultiSelect(p['Tags']),
    dueDate: getDate(p['DueDate']),
    createdAt: getDate(p['CreatedAt']),
    notes: getText(p['Notes']) || undefined,
    plan: getText(p['Plan']) || undefined,
  }
}

function taskToProperties(task: any) {
  const props: any = {
    "Title": { title: [{ text: { content: truncate(task.title || '') } }] },
    "TaskId": { rich_text: [{ text: { content: task.id || '' } }] },
    "Description": { rich_text: [{ text: { content: truncate(task.description || '') } }] },
    "Priority": { select: { name: task.priority || 'medium' } },
    "Status": { select: { name: task.status || 'todo' } },
    "Tags": { multi_select: (task.tags || []).map((t: string) => ({ name: t })) },
  }

  const assignee = task.assignee === 'Dana' ? 'Dana' : (task.assignee || 'Ahmad')
  if (['Ahmad', 'dana'].includes(assignee)) {
    props["Assignee"] = { select: { name: assignee } }
  }

  if (task.dueDate) {
    props["DueDate"] = { date: { start: task.dueDate } }
  } else {
    props["DueDate"] = { date: null }
  }

  if (task.createdAt) {
    try {
      const d = new Date(task.createdAt).toISOString().split('T')[0]
      props["CreatedAt"] = { date: { start: d } }
    } catch (e) {}
  }

  if (task.notes) {
    props["Notes"] = { rich_text: [{ text: { content: truncate(task.notes) } }] }
  } else {
    props["Notes"] = { rich_text: [] }
  }

  if (task.plan) {
    props["Plan"] = { rich_text: [{ text: { content: truncate(task.plan) } }] }
  } else {
    props["Plan"] = { rich_text: [] }
  }

  return props
}

async function fetchAllPages() {
  const pages: any[] = []
  let cursor: string | undefined = undefined

  do {
    const body: any = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_TASKS_DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) return null
    const data = await res.json()
    pages.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return pages
}

export async function GET() {
  try {
    const pages = await fetchAllPages()
    if (!pages) return NextResponse.json([])
    const tasks = pages
      .filter((p: any) => !p.archived)
      .map(pageToTask)
    return NextResponse.json(tasks)
  } catch (err) {
    console.error('GET tasks error:', err)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const newTasks: any[] = await req.json()

    // Fetch existing pages
    const pages = await fetchAllPages()
    if (!pages) return NextResponse.json({ ok: false, error: 'Failed to fetch from Notion' }, { status: 500 })

    const existingMap = new Map<string, string>() // taskId -> pageId
    for (const page of pages) {
      if (!page.archived) {
        const taskId = page.properties['TaskId']?.rich_text?.[0]?.plain_text
        if (taskId) existingMap.set(taskId, page.id)
      }
    }

    const newTaskIds = new Set(newTasks.map((t: any) => t.id))

    // Delete removed tasks (archive)
    for (const [taskId, pageId] of existingMap.entries()) {
      if (!newTaskIds.has(taskId)) {
        await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers: notionHeaders(),
          body: JSON.stringify({ archived: true }),
        })
      }
    }

    // Upsert tasks
    for (const task of newTasks) {
      const properties = taskToProperties(task)
      if (existingMap.has(task.id)) {
        // Update
        await fetch(`https://api.notion.com/v1/pages/${existingMap.get(task.id)}`, {
          method: 'PATCH',
          headers: notionHeaders(),
          body: JSON.stringify({ properties }),
        })
      } else {
        // Create
        await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify({
            parent: { database_id: NOTION_TASKS_DB_ID },
            properties,
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST tasks error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
