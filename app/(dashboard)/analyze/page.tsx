'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BarChart, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-react'

export default function AnalyzePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [followerCount, setFollowerCount] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    // シミュレートされた分析結果
    setTimeout(() => {
      setAnalysisResult({
        overallScore: 78,
        titleScore: 85,
        contentScore: 72,
        seoScore: 80,
        readabilityScore: 75,
        predictions: {
          expectedLikes: 250,
          engagementRate: 3.5,
          viralPotential: '中'
        },
        suggestions: [
          {
            priority: 'high',
            category: 'title',
            issue: 'タイトルに数字を含めることをお勧めします',
            recommendation: '「5つの方法」や「10のコツ」など具体的な数字を追加'
          },
          {
            priority: 'medium',
            category: 'content',
            issue: '段落が長すぎる可能性があります',
            recommendation: '1段落を3-4文程度に収める'
          },
          {
            priority: 'low',
            category: 'seo',
            issue: 'キーワードの密度が低い',
            recommendation: '主要キーワードを本文中に2-3回追加'
          }
        ]
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">記事分析</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>記事情報を入力</CardTitle>
              <CardDescription>
                分析したい記事のタイトルと本文を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">記事タイトル</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="魅力的なタイトルを入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="content">記事本文</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="記事の本文を入力..."
                  rows={10}
                />
              </div>
              
              <div>
                <Label htmlFor="followers">フォロワー数（任意）</Label>
                <Input
                  id="followers"
                  type="number"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  placeholder="現在のフォロワー数"
                />
              </div>
              
              <Button
                className="w-full"
                onClick={handleAnalyze}
                disabled={!title || !content || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <BarChart className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <BarChart className="mr-2 h-4 w-4" />
                    分析開始
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {analysisResult && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>分析結果</CardTitle>
                  <CardDescription>
                    総合スコア: {analysisResult.overallScore}/100
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">タイトル評価</span>
                        <span className="text-sm">{analysisResult.titleScore}/100</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${analysisResult.titleScore}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">コンテンツ評価</span>
                        <span className="text-sm">{analysisResult.contentScore}/100</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${analysisResult.contentScore}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">SEO評価</span>
                        <span className="text-sm">{analysisResult.seoScore}/100</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${analysisResult.seoScore}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">読みやすさ</span>
                        <span className="text-sm">{analysisResult.readabilityScore}/100</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500"
                          style={{ width: `${analysisResult.readabilityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>予測</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analysisResult.predictions.expectedLikes}
                      </p>
                      <p className="text-sm text-gray-600">予想スキ数</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {analysisResult.predictions.engagementRate}%
                      </p>
                      <p className="text-sm text-gray-600">エンゲージメント率</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {analysisResult.predictions.viralPotential}
                      </p>
                      <p className="text-sm text-gray-600">バズ可能性</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>改善提案</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        {suggestion.priority === 'high' ? (
                          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{suggestion.issue}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {suggestion.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}