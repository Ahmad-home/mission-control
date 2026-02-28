import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const MEMORY_DIR = 'C:/Users/A7Sag/.openclaw/workspace/memory'
const WORKSPACE_DIR = 'C:/Users/A7Sag/.openclaw/workspace'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const file = searchParams.get('file')

  try {
    if (file) {
      let filePath: string
      if (file === 'MEMORY.md') {
        filePath = path.join(WORKSPACE_DIR, 'MEMORY.md')
      } else {
        filePath = path.join(MEMORY_DIR, file)
      }

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      const content = fs.readFileSync(filePath, 'utf8')
      const stats = fs.statSync(filePath)

      return NextResponse.json({
        name: file,
        content,
        lastModified: stats.mtime.toISOString(),
        size: stats.size
      })
    }

    // If memory dir doesn't exist (e.g. on Vercel), return empty array
    if (!fs.existsSync(MEMORY_DIR)) {
      return NextResponse.json([])
    }

    const memoryFiles = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const stats = fs.statSync(path.join(MEMORY_DIR, f))
        return {
          name: f,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
          isDaily: /^\d{4}-\d{2}-\d{2}/.test(f)
        }
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    const memoryMdPath = path.join(WORKSPACE_DIR, 'MEMORY.md')
    if (fs.existsSync(memoryMdPath)) {
      const stats = fs.statSync(memoryMdPath)
      memoryFiles.unshift({
        name: 'MEMORY.md',
        lastModified: stats.mtime.toISOString(),
        size: stats.size,
        isDaily: false
      })
    }

    return NextResponse.json(memoryFiles)
  } catch (error) {
    console.error('Memory API error:', error)
    // On Vercel or when files are unavailable, return empty array instead of 500
    return NextResponse.json([])
  }
}
