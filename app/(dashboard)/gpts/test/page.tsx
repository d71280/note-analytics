'use client'

import { useState, useEffect } from 'react'

export default function TestPage() {
  const [contents, setContents] = useState<Array<{
    id: string
    content: string
    platform: string
    status: string
  }>>([])

  useEffect(() => {
    fetch('/api/gpts/contents')
      .then(res => res.json())
      .then(data => setContents(data.contents || []))
  }, [])

  const deleteContent = async (id: string) => {
    console.log('Delete clicked for:', id)
    
    const confirmed = window.confirm('削除しますか？')
    console.log('Confirm result:', confirmed)
    
    if (!confirmed) return
    
    try {
      const res = await fetch('/api/gpts-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      })
      
      console.log('Response:', res.status)
      
      if (res.ok) {
        alert('削除成功')
        location.reload()
      } else {
        alert('削除失敗')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('エラー発生')
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>削除機能テスト</h1>
      {contents.map(item => (
        <div key={item.id} style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          margin: '10px 0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <p>{item.content?.substring(0, 50)}...</p>
            <small>ID: {item.id}</small>
          </div>
          <button 
            onClick={() => deleteContent(item.id)}
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              padding: '5px 10px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            削除
          </button>
        </div>
      ))}
    </div>
  )
}