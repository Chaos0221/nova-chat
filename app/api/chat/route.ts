import { createOpenAI } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getProvider, PROVIDER_CONFIG } from '@/lib/model-utils'

export const maxDuration = 30

function toOllamaMessages(messages: any[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: Array.isArray(msg.parts)
      ? msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      : (msg.content ?? ''),
  }))
}

async function streamOllama(model: string, messages: any[], onFinish: (text: string) => Promise<void>): Promise<Response> {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: toOllamaMessages(messages),
          stream: true,
        }),
      })

      if (!res.ok) {
        throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      const textId = 'ollama-text'
      let fullText = ''

      writer.write({ type: 'text-start', id: textId })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const data = JSON.parse(line)
            const delta = data.message?.content ?? ''
            if (delta) {
              fullText += delta
              writer.write({ type: 'text-delta', id: textId, delta })
            }
            if (data.done) break
          } catch {
            // skip malformed lines
          }
        }
      }

      writer.write({ type: 'text-end', id: textId })
      await onFinish(fullText)
    },
  })

  return createUIMessageStreamResponse({ stream })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return new Response('Unauthorized', { status: 401 })

    const { messages, model = 'claude-3-5-sonnet-20241022', conversationId, apiKeys } = await req.json()

    const provider = getProvider(model)

    console.log('Processing chat request:', { model, provider, conversationId, messagesCount: messages?.length })

    if (!['ollama', 'glm', 'qwen', 'kimi', 'anthropic'].includes(provider)) {
      return new Response(`Unknown provider for model: ${model}`, { status: 400 })
    }

    if (provider === 'ollama') {
      return streamOllama(model, messages, async (text) => {
        if (!conversationId) return
        try {
          await supabase.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: text })
          await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
        } catch (error) {
          console.error('Error saving assistant message:', error)
        }
      })
    }

    const serverFallback = provider === 'glm' ? process.env.GLM_API_KEY :
                           provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : undefined
    const apiKey = apiKeys?.[provider] || serverFallback

    if (!apiKey) {
      return new Response(`API key for ${provider.toUpperCase()} is required`, { status: 400 })
    }

    const client = createOpenAI({ baseURL: PROVIDER_CONFIG[provider].baseURL, apiKey })

    const result = streamText({
      model: client(model),
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        if (!conversationId) return
        try {
          await supabase.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: text })
          await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
        } catch (error) {
          console.error('Error saving assistant message:', error)
        }
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
