'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Star,
  Hash,
  Clock,
  Eye
} from 'lucide-react'

interface OptimizationSuggestion {
  type: 'title' | 'content' | 'tags' | 'timing' | 'structure'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  impact: string
  example?: string
}

export default function EngagementOptimizer() {
  const [articleContent, setArticleContent] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])

  const analyzeTitleandContent = async () => {
    setIsAnalyzing(true)
    
    // 模擬分析処理（実際にはAI APIを使用）
    setTimeout(() => {
      const mockSuggestions: OptimizationSuggestion[] = [
        {
          type: 'title',
          priority: 'high',
          suggestion: 'タイトルに数字や具体的な価値を追加',
          impact: 'クリック率 +25% 向上',
          example: '「ChatGPTで効率化」→「ChatGPTで作業時間を70%短縮する5つの方法」'
        },
        {
          type: 'content',
          priority: 'high',
          suggestion: '導入部分でより具体的な問題提起を',
          impact: '読了率 +18% 向上',
          example: '読者が直面する具体的な課題を最初の3文で明確にする'
        },
        {
          type: 'tags',
          priority: 'medium',
          suggestion: 'トレンドタグを1-2個追加',
          impact: 'リーチ +30% 拡大',
          example: '#生成AI #DX を追加することを推奨'
        },
        {
          type: 'structure',
          priority: 'medium',
          suggestion: '箇条書きや見出しでの構造化',
          impact: '読みやすさ +22% 向上',
          example: 'ステップごとに見出しを設けて読みやすく整理'
        },
        {
          type: 'timing',
          priority: 'low',
          suggestion: '公開時間を19:00-21:00に設定',
          impact: 'エンゲージメント +15% 向上',
          example: 'この記事の場合、木曜20:00公開が最適'
        }
      ]
      
      setSuggestions(mockSuggestions)
      setIsAnalyzing(false)
    }, 2000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />
      case 'medium': return <Target className="h-4 w-4" />
      case 'low': return <CheckCircle className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return <Eye className="h-4 w-4" />
      case 'content': return <Star className="h-4 w-4" />
      case 'tags': return <Hash className="h-4 w-4" />
      case 'timing': return <Clock className="h-4 w-4" />
      case 'structure': return <Target className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            エンゲージメント最適化アナライザー
          </CardTitle>
          <CardDescription>
            記事の内容を分析して、エンゲージメント向上のための具体的な提案を行います
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">記事タイトル</Label>
            <Textarea
              id="title"
              placeholder="記事のタイトルを入力してください"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="content">記事内容（抜粋可）</Label>
            <Textarea
              id="content"
              placeholder="記事の内容や概要を入力してください。全文でなくても構いません。"
              value={articleContent}
              onChange={(e) => setArticleContent(e.target.value)}
              rows={6}
            />
          </div>

          <Button 
            onClick={analyzeTitleandContent}
            disabled={!articleTitle.trim() || !articleContent.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                分析中...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                エンゲージメント分析を開始
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              最適化提案
            </CardTitle>
            <CardDescription>
              分析結果に基づく改善提案（優先度順）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(suggestion.priority)}
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {suggestion.type === 'title' && 'タイトル最適化'}
                          {suggestion.type === 'content' && 'コンテンツ改善'}
                          {suggestion.type === 'tags' && 'タグ戦略'}
                          {suggestion.type === 'timing' && '投稿タイミング'}
                          {suggestion.type === 'structure' && '構造改善'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                          suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {suggestion.priority === 'high' && '高優先度'}
                          {suggestion.priority === 'medium' && '中優先度'}
                          {suggestion.priority === 'low' && '低優先度'}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2">{suggestion.suggestion}</p>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        <strong>予想効果:</strong> {suggestion.impact}
                      </div>
                      
                      {suggestion.example && (
                        <div className="bg-white bg-opacity-50 p-2 rounded text-xs">
                          <strong>例:</strong> {suggestion.example}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>実装優先度ガイド</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-red-700">高優先度</h3>
                <p className="text-xs text-red-600">即座に実装することで大きな効果が期待できます</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold text-yellow-700">中優先度</h3>
                <p className="text-xs text-yellow-600">時間があるときに実装することを推奨</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-700">低優先度</h3>
                <p className="text-xs text-green-600">長期的な改善として考慮</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 