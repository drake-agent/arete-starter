'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WidgetWrapperProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  widgetId?: string
  /** When true, renders without Card wrapper (used inside cockpit grid which has its own frame) */
  compact?: boolean
}

export function WidgetWrapper({ title, icon, children, className, widgetId, compact }: WidgetWrapperProps) {
  if (compact) {
    return <div className={className}>{children}</div>
  }

  return (
    <Card className={className} id={widgetId ? `widget-${widgetId}` : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
