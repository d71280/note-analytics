export interface TitleAnalysis {
  length: number
  hasNumber: boolean
  hasQuestion: boolean
  emotionalWords: string[]
  powerWords: string[]
  score: number
}

export interface ContentAnalysis {
  wordCount: number
  paragraphCount: number
  headingCount: number
  listCount: number
  hasPersonalStory: boolean
  score: number
}

export interface SEOAnalysis {
  keywords: string[]
  keywordDensity: Record<string, number>
  titleKeywordMatch: boolean
  score: number
}

export interface ReadabilityAnalysis {
  lineBreakFrequency: number
  averageParagraphLength: number
  estimatedReadingTime: number
  score: number
}

export interface EngagementPrediction {
  expectedLikes: number
  engagementRate: number
  viralPotential: 'low' | 'medium' | 'high'
  optimalPostingTime: string[]
}

export interface AnalysisResult {
  titleAnalysis: TitleAnalysis
  contentAnalysis: ContentAnalysis
  seoAnalysis: SEOAnalysis
  readabilityAnalysis: ReadabilityAnalysis
  predictions: EngagementPrediction
  overallScore: number
  suggestions: Suggestion[]
}

export interface Suggestion {
  priority: 'high' | 'medium' | 'low'
  category: 'title' | 'content' | 'seo' | 'readability'
  issue: string
  recommendation: string
  example?: string
}