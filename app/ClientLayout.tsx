'use client'

import Background from '@/components/Background'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey(prev => prev + 1) // Force remount of Background on route change
  }, [pathname])
  
  return (
    <div className="relative">
      <div className="fixed inset-0 z-0">
        <Background key={key} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
} 