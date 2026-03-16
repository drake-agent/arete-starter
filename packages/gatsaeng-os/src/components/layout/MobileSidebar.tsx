'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useState } from 'react'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-56">
        <div onClick={(e) => {
          // Close only when navigating (Link click), not for buttons/inputs
          if ((e.target as HTMLElement).closest('a')) setOpen(false)
        }}>
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}
