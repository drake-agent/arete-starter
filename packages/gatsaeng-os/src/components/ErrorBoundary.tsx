'use client'

import { Component, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <Card className="border-gatsaeng-red/30">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-gatsaeng-red mx-auto mb-3" />
            <p className="text-sm text-foreground mb-1">오류가 발생했습니다</p>
            <p className="text-xs text-muted-foreground mb-4">{this.state.error?.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}
