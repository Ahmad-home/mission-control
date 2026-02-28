'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MemoryFile {
  name: string
  lastModified: string
  size: number
  isDaily: boolean
}

interface FileContent {
  name: string
  content: string
  lastModified: string
  size: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'اليوم'
  if (days === 1) return 'أمس'
  if (days < 7) return `قبل ${days} أيام`
  return date.toLocaleDateString('ar-SA')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function getFileIcon(name: string): string {
  if (name === 'MEMORY.md') return '🧠'
  if (name === 'entities.md') return '📇'
  if (name === 'patterns.md') return '🔄'
  if (name === 'moments.md') return '✨'
  if (name === 'strategies.md') return '🎯'
  if (name === 'alerts.md') return '🚨'
  if (/^\d{4}-\d{2}-\d{2}/.test(name)) return '📅'
  return '📄'
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [filter, setFilter] = useState<'all' | 'daily' | 'system'>('all')

  useEffect(() => {
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        setFiles(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const loadFile = async (fileName: string) => {
    setLoadingContent(true)
    try {
      const res = await fetch(`/api/memory?file=${encodeURIComponent(fileName)}`)
      const data = await res.json()
      setSelectedFile(data)
    } catch (err) {
      console.error(err)
    }
    setLoadingContent(false)
  }

  const filteredFiles = files.filter(f => {
    if (filter === 'daily') return f.isDaily
    if (filter === 'system') return !f.isDaily
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/60 hover:text-white transition-colors">
              ← العودة
            </Link>
            <h1 className="text-xl font-bold">🧠 Memory Viewer</h1>
          </div>
          <div className="flex gap-2">
            {(['all', 'daily', 'system'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filter === f
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'الكل' : f === 'daily' ? '📅 يومي' : '⚙️ نظام'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 flex gap-4" style={{ height: 'calc(100vh - 73px)' }}>
        {/* File List */}
        <div className="w-80 flex-shrink-0 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-white/10 bg-white/5">
            <h2 className="font-medium text-white/80">الملفات ({filteredFiles.length})</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-white/40">جاري التحميل...</div>
            ) : (
              filteredFiles.map(file => (
                <button
                  key={file.name}
                  onClick={() => loadFile(file.name)}
                  className={`w-full p-3 text-right border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedFile?.name === file.name ? 'bg-violet-600/20 border-r-2 border-r-violet-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-white/40 flex gap-2">
                        <span>{formatDate(file.lastModified)}</span>
                        <span>•</span>
                        <span>{formatSize(file.size)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{getFileIcon(selectedFile.name)} {selectedFile.name}</h2>
                  <p className="text-sm text-white/40">
                    آخر تعديل: {new Date(selectedFile.lastModified).toLocaleString('ar-SA')}
                  </p>
                </div>
                <span className="text-sm text-white/40">{formatSize(selectedFile.size)}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loadingContent ? (
                  <div className="text-center text-white/40">جاري التحميل...</div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/80 dir-auto">
                    {selectedFile.content}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30">
              <div className="text-center">
                <div className="text-4xl mb-2">📂</div>
                <p>اختر ملف لعرض محتواه</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
