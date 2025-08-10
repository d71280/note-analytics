import { createClient } from '@/lib/supabase/server'

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'

interface LogContext {
  userId?: string
  action?: string
  metadata?: Record<string, unknown>
  stack?: string
}

class Logger {
  private static instance: Logger
  private isDevelopment = process.env.NODE_ENV === 'development'

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private async saveToDatabase(
    level: LogLevel,
    message: string,
    context?: LogContext
  ) {
    // 開発環境ではデータベースに保存しない
    if (this.isDevelopment) return

    try {
      const supabase = createClient()
      await supabase.from('error_logs').insert({
        error_type: context?.action || 'general',
        error_message: message,
        error_stack: context?.stack,
        context: {
          userId: context?.userId,
          metadata: context?.metadata,
          timestamp: new Date().toISOString()
        },
        severity: level
      })
    } catch (error) {
      // ログ保存自体が失敗した場合はコンソールに出力
      console.error('Failed to save log to database:', error)
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage('debug', message, context)
    console.debug(formattedMessage)
    this.saveToDatabase('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage('info', message, context)
    console.info(formattedMessage)
    this.saveToDatabase('info', message, context)
  }

  warning(message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage('warning', message, context)
    console.warn(formattedMessage)
    this.saveToDatabase('warning', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      stack: error instanceof Error ? error.stack : undefined
    }
    const formattedMessage = this.formatMessage('error', message, errorContext)
    console.error(formattedMessage, error)
    this.saveToDatabase('error', message, errorContext)
  }

  critical(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      stack: error instanceof Error ? error.stack : undefined
    }
    const formattedMessage = this.formatMessage('critical', message, errorContext)
    console.error('🚨 CRITICAL:', formattedMessage, error)
    this.saveToDatabase('critical', message, errorContext)
    
    // クリティカルエラーの場合は通知を送る（将来的にメール/Slack通知を実装）
    this.sendCriticalAlert(message, errorContext)
  }

  private async sendCriticalAlert(message: string, context?: LogContext) {
    // TODO: メール/Slack/Discord通知の実装
    // 現時点ではコンソール出力のみ
    console.error('🚨🚨🚨 CRITICAL ALERT 🚨🚨🚨')
    console.error('Message:', message)
    console.error('Context:', context)
  }

  // API呼び出しのログ
  async logApiCall(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ) {
    const message = `API ${method} ${path} - Status: ${statusCode} - Time: ${responseTime}ms`
    
    if (statusCode >= 500) {
      this.error(message, undefined, { userId, action: 'api_call' })
    } else if (statusCode >= 400) {
      this.warning(message, { userId, action: 'api_call' })
    } else {
      this.info(message, { userId, action: 'api_call' })
    }
  }

  // パフォーマンス測定
  measurePerformance(label: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (duration > 1000) {
        this.warning(`Performance: ${label} took ${duration.toFixed(2)}ms`, {
          action: 'performance',
          metadata: { duration, label }
        })
      } else {
        this.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`, {
          action: 'performance',
          metadata: { duration, label }
        })
      }
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = Logger.getInstance()

// エラーハンドリングユーティリティ
export function handleError(error: unknown, context?: LogContext): string {
  if (error instanceof Error) {
    logger.error(error.message, error, context)
    return error.message
  } else if (typeof error === 'string') {
    logger.error(error, undefined, context)
    return error
  } else {
    const message = 'An unknown error occurred'
    logger.error(message, error, context)
    return message
  }
}

// APIレスポンスヘルパー
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: LogContext
) {
  const message = handleError(error, context)
  
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}