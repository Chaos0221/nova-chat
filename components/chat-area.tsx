'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import ModelSelector from '@/components/model-selector'
import { getProvider } from '@/lib/model-utils'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ApiKeys {
  qwen: string | null
  kimi: string | null
  glm: string | null
}

interface ChatAreaProps {
  conversationId: string | null
  initialMessages: Message[]
  defaultModel: string
  apiKeys: ApiKeys
}

export default function ChatArea({
  conversationId,
  initialMessages,
  defaultModel,
  apiKeys,
}: ChatAreaProps) {
  const router = useRouter()
  const [model, setModel] = useState(defaultModel)
  const [convId, setConvId] = useState<string | null>(conversationId)
  const [inputValue, setInputValue] = useState('')
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentProvider = getProvider(model)
  const hasApiKey = currentProvider === 'ollama' || currentProvider === 'glm' || !!apiKeys[currentProvider as keyof ApiKeys]

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model, conversationId: convId, apiKeys },
    }),
    messages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: 'text' as const, text: m.content }],
    })),
    onFinish: () => {
      router.refresh()
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoading = status === 'streaming' || status === 'submitted'
  const isInitialLoad = initialMessages.length === 0
  const isWaitingForFirstResponse = isLoading && messages.length <= 1 && isInitialLoad

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    const pending = sessionStorage.getItem('nova-pending-message')
    if (!pending) return
    sessionStorage.removeItem('nova-pending-message')
    const hasMessageAlready = initialMessages.some(m => m.content === pending && m.role === 'user')
    if (!hasMessageAlready) {
      sendMessage({ text: pending })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const text = inputValue.trim()
    if (!text || isLoading) return

    setInputValue('')

    let currentConvId = convId
    if (!currentConvId) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const title = text.slice(0, 60)
      const { data } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title, model })
        .select('id')
        .single()

      if (!data) return
      currentConvId = data.id
      setConvId(data.id)

      await supabase.from('messages').insert({
        conversation_id: data.id,
        role: 'user',
        content: text,
      })

      router.push(`/chat/${data.id}`)
      return
    } else {
      const supabase = createClient()
      const { data: conversation } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', currentConvId)
        .single()

      if (conversation?.title === 'New Conversation') {
        const newTitle = text.slice(0, 60)
        await supabase
          .from('conversations')
          .update({ title: newTitle })
          .eq('id', currentConvId)
      }

      await supabase.from('messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: text,
      })
    }

    sendMessage({ text })
  }

  const isNewConversation = (messages.length === 0 || isWaitingForFirstResponse) && hasApiKey

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-end px-6 py-3 border-b border-border/50 backdrop-blur-sm bg-background/50">
        <ModelSelector value={model} onChange={setModel} />
      </div>

      {isNewConversation ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
          {!isWaitingForFirstResponse && mounted && (
            <div className={`text-center mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-5 flex justify-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/10">
                    <NovaIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary/20 animate-pulse" />
                </div>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Nova Chat
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your intelligent assistant powered by multiple AI models
              </p>
            </div>
          )}

          <div className={`w-full max-w-2xl transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div
              className="group relative"
            >
              <div className="relative rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-lg shadow-foreground/5 transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-xl focus-within:shadow-primary/5">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={isWaitingForFirstResponse ? '' : 'Ask anything...'}
                  disabled={!hasApiKey || isLoading}
                  rows={1}
                  className="w-full resize-none rounded-2xl bg-transparent px-5 py-2 pr-10 text-[15px] placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                  style={{ maxHeight: '200px', overflowY: 'auto', minHeight: '40px' }}
                />
                <button 
                  type="button"
                  onClick={() => isLoading ? stop() : handleSendMessage()}
                  disabled={!hasApiKey || (!isLoading && !inputValue.trim())} 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                >
                  {isLoading ? (
                    <StopIcon className="h-3 w-3" />
                  ) : (
                    <ArrowUpIcon className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground/60">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
            {isWaitingForFirstResponse && (
              <div className="flex justify-center mt-6">
                <div className="rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-5 py-3 shadow-lg">
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="relative z-10 flex-1 min-h-0 px-6 py-8">
            {!hasApiKey ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                  <WarningIcon className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-xl font-semibold text-foreground">API Key Required</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Add your {currentProvider.toUpperCase()} API key in{' '}
                  <a href="/settings" className="font-medium text-primary hover:underline underline-offset-2">
                    Settings
                  </a>{' '}
                  to start chatting.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-8">
                {messages.map((m, i) => {
                  const text = m.parts
                    .filter((p) => p.type === 'text')
                    .map((p) => (p as { type: 'text'; text: string }).text)
                    .join('')

                  return (
                    <div
                      key={m.id}
                      className={`flex animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ${
                        m.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed transition-all duration-200 ${
                          m.role === 'user'
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                            : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                        }`}
                      >
                        {m.role === 'assistant' && (
                          <div className="absolute -left-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg bg-background/90 backdrop-blur-sm shadow-sm border border-border/50">
                            <BotIcon className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{text}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-sm px-6 py-2">
            <div
              className="mx-auto flex max-w-2xl items-center"
            >
              <div className="relative flex-1 rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl transition-all duration-200 focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={hasApiKey ? 'Type your message...' : `Add a ${currentProvider.toUpperCase()} API key in Settings`}
                  disabled={!hasApiKey}
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 py-2 pr-10 text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                  style={{ maxHeight: '160px', overflowY: 'auto' }}
                />
                <button 
                  type="button"
                  onClick={() => isLoading ? stop() : handleSendMessage()}
                  disabled={!hasApiKey || (!isLoading && !inputValue.trim())} 
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                >
                  {isLoading ? (
                    <StopIcon className="h-3 w-3" />
                  ) : (
                    <ArrowUpIcon className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function NovaIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25 18 6.75m-1.5 0 1.5 1.5m-7.5 0h7.5m-7.5 0-3 3m0 0 .75 1.5M15 12H9m0 0-1.5 1.5M18 15l3-3m-3 3-3-3" />
    </svg>
  )
}

function ArrowUpIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StopIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function BotIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  )
}

function WarningIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}
