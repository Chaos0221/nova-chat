'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const isNewChatPage = pathname === '/chat'
  const [collapsed, setCollapsed] = useState(isNewChatPage)

  return (
    <div className="flex h-full">
      {!isNewChatPage && (
        <Sidebar
          conversations={conversations}
          userEmail={userEmail}
          userAvatar={userAvatar}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      )}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
