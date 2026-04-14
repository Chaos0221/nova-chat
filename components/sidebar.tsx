'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from 'next-themes'
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
      <aside className="flex h-full w-14 flex-col items-center border-r border-sidebar-border bg-sidebar/80 backdrop-blur-sm py-4 gap-3">
        <button
          onClick={onToggleCollapse}
          className="group flex h-7 w-7 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm"
          title="Expand sidebar"
        >
          <PanelOpenIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <div className="h-px w-6 bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="group flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 disabled:opacity-50"
          title="New chat"
        >
          <NewChatIcon className="h-4 w-4 transition-transform group-hover:rotate-90" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="relative flex h-full w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-sidebar-accent/30 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 shrink-0 flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shadow-sm shadow-primary/20">
            <SparkleIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[15px] font-semibold text-sidebar-foreground tracking-tight">Nova</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          title="Collapse sidebar"
        >
          <PanelCloseIcon />
        </button>
      </div>

      <div className="relative z-10 shrink-0 px-3 py-2">
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-dashed border-sidebar-border/50 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 disabled:opacity-50"
        >
          <NewChatIcon className="h-4 w-4 text-primary transition-transform duration-300 group-hover:rotate-90" />
          <span>New chat</span>
        </button>
      </div>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3.5 pb-2">Recent</div>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent/50">
              <EmptyIcon className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-all duration-200 ${
                    pathname === `/chat/${c.id}`
                      ? 'bg-primary/10 text-sidebar-accent-foreground shadow-sm shadow-primary/10'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground'
                  }`}
                >
                  <span className="truncate font-medium">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative z-10 shrink-0 border-t border-sidebar-border/50">
        <div className="flex items-center gap-1 p-2">
          <Link
            href="/settings"
            className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/60 transition-all duration-200 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="font-medium">Settings</span>
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sidebar-foreground/60 transition-all duration-200 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
            title="Toggle theme"
          >
            <SunMoonIcon />
          </button>
        </div>
        <div className="p-2 pt-0">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/60 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="h-5 w-5 rounded-lg object-cover" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
            <span className="truncate font-medium">{userEmail}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function PanelCloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function PanelOpenIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function NewChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function SettingsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.214 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function SunMoonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  )
}

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}

function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function EmptyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  )
}
