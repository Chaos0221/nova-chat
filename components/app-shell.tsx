'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface AppShellProps {
  conversations: Conversation[]
  userEmail: string
  userAvatar: string | null
  children: React.ReactNode
}

export default function AppShell({ conversations, userEmail, userAvatar, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-full">
      <Sidebar
        conversations={conversations}
        userEmail={userEmail}
        userAvatar={userAvatar}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
