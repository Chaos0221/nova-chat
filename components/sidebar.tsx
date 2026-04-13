'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface SidebarProps {
  conversations: Conversation[]
  userEmail: string
  userAvatar: string | null
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ conversations, userEmail, userAvatar, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const { theme, setTheme } = useTheme()

  async function handleNewChat() {
    setIsCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New Conversation' })
      .select('id')
      .single()

    if (data) {
      router.push(`/chat/${data.id}`)
      router.refresh()
    }
    setIsCreating(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (collapsed) {
    return (
      <aside className="flex h-full w-12 flex-col items-center border-r border-border bg-sidebar py-3 gap-2">
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          title="Expand sidebar"
        >
          <PanelOpenIcon />
        </button>
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent disabled:opacity-50"
          title="New chat"
        >
          <NewChatIcon />
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-sidebar-foreground">Nova Chat</span>
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-1.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          title="Collapse sidebar"
        >
          <PanelCloseIcon />
        </button>
      </div>

      <Separator />

      {/* New chat button */}
      <div className="px-2 pt-2">
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent disabled:opacity-50"
        >
          <NewChatIcon />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2 py-1">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className={`block truncate rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    pathname === `/chat/${c.id}`
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground'
                  }`}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="space-y-1 p-2">
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <SettingsIcon />
            Settings
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Toggle theme"
          >
            <SunMoonIcon />
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {userAvatar ? (
            <img src={userAvatar} alt="avatar" className="h-5 w-5 rounded-full" />
          ) : (
            <UserIcon />
          )}
          <span className="truncate">{userEmail}</span>
        </button>
      </div>
    </aside>
  )
}

function PanelCloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function PanelOpenIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function NewChatIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function SunMoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  )
}
