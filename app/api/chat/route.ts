import { createOpenAI } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getProvider, type Provider } from '@/components/model-selector'

export const maxDuration = 30

const PROVIDER_CONFIG: Record<Provider, { baseURL: string }> = {
  qwen: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  kimi: { baseURL: 'https://api.moonshot.cn/v1' },
  glm:  { baseURL: 'https://open.bigmodel.cn/api/paas/v4/' },
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, model = 'glm-4-flash', conversationId, apiKeys } = await req.json()

  const provider = getProvider(model)
  const serverFallback = provider === 'glm' ? process.env.GLM_API_KEY : undefined
  const apiKey = apiKeys?.[provider] || serverFallback

  if (!apiKey) {
    return new Response(`API key for ${provider.toUpperCase()} is required`, { status: 400 })
  }

  const client = createOpenAI({
    baseURL: PROVIDER_CONFIG[provider].baseURL,
    apiKey,
  })

  const result = streamText({
    model: client(model),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!conversationId) return
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: text,
      })
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    },
  })

  return result.toUIMessageStreamResponse()
}
