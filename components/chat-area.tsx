'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import ModelSelector, { getProvider } from '@/components/model-selector'
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentProvider = getProvider(model)
  const hasApiKey = !!apiKeys[currentProvider] || currentProvider === 'glm'

  const { messages, sendMessage, status } = useChat({
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

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
      router.refresh()
    } else {
      const supabase = createClient()
      await supabase.from('messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: text,
      })
    }

    sendMessage({ text })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Model selector bar */}
      <div className="flex items-center justify-end px-4 py-2">
        <ModelSelector value={model} onChange={setModel} />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        {!hasApiKey ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold">Nova Chat</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your {currentProvider.toUpperCase()} API key in{' '}
              <a href="/settings" className="underline underline-offset-2 hover:text-foreground">
                Settings
              </a>{' '}
              to start chatting.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold">Nova Chat</p>
            <p className="mt-1 text-sm text-muted-foreground">Start a conversation</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === 'text')
                .map((p) => (p as { type: 'text'; text: string }).text)
                .join('')

              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{text}</p>
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-2.5">
                  <LoadingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder={hasApiKey ? 'Message Nova Chat...' : `Add a ${currentProvider.toUpperCase()} API key in Settings to start`}
            disabled={!hasApiKey}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            style={{ maxHeight: '160px', overflowY: 'auto' }}
          />
          <Button type="submit" size="sm" disabled={!hasApiKey || isLoading || !inputValue.trim()} className="h-10 px-4">
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
