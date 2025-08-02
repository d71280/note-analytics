'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Send, Loader2, FileText, Hash, Video, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  usedKnowledge?: number
  knowledgeItems?: Array<{
    title: string
    content_type: string
  }>
}

export default function KnowledgeChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/knowledge/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: inputMessage,
          useKnowledgeBase: true
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'エラーが発生しました',
        timestamp: new Date(),
        usedKnowledge: data.usedKnowledge,
        knowledgeItems: data.knowledgeItems
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
      case 'note':
        return <FileText className="h-3 w-3" />
      case 'video_transcript':
        return <Video className="h-3 w-3" />
      case 'tweet':
        return <Hash className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Brain className="h-8 w-8" />
        知識ベースチャット
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AIアシスタント
          </CardTitle>
          <CardDescription>
            知識ベースに保存された情報を活用して、あなたの質問に答えます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* チャット履歴 */}
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>知識ベースについて何でも質問してください</p>
                  <p className="text-sm mt-2">例: 「脳内OS強化について教えて」</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {message.role === 'assistant' && message.usedKnowledge && message.usedKnowledge > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">
                              参照した知識ベース ({message.usedKnowledge}件):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.knowledgeItems?.map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {getContentTypeIcon(item.content_type)}
                                  <span className="ml-1">{item.title}</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* 入力エリア */}
            <div className="space-y-2">
              <Label htmlFor="message">メッセージ</Label>
              <Textarea
                id="message"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="知識ベースについて質問してください..."
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    回答生成中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    送信
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使い方のヒント */}
      <Card>
        <CardHeader>
          <CardTitle>使い方のヒント</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-lg">•</span>
              <span>知識ベースに保存されたPDF、ブログ記事、動画の文字起こしなどの内容について質問できます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">•</span>
              <span>「〇〇について教えて」「〇〇を要約して」などの質問が効果的です</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">•</span>
              <span>回答には関連する知識ベースの情報が表示されます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">•</span>
              <span>Shift + Enterで改行、Enterで送信できます</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}