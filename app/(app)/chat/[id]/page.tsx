import { notFound } from 'next/navigation'
import ChatArea from '@/components/chat-area'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_MODEL, MODELS } from '@/lib/model-utils'

const VALID_MODEL_IDS = new Set(MODELS.map((m) => m.id))

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_model, qwen_api_key, kimi_api_key, glm_api_key')
    .single()

  const initialMessages = (messages ?? []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return (
    <ChatArea
      conversationId={id}
      initialMessages={initialMessages}
      defaultModel={VALID_MODEL_IDS.has(conversation.model) ? conversation.model : VALID_MODEL_IDS.has(settings?.default_model) ? settings!.default_model : DEFAULT_MODEL}
      apiKeys={{
        qwen: settings?.qwen_api_key ?? null,
        kimi: settings?.kimi_api_key ?? null,
        glm: settings?.glm_api_key ?? null,
      }}
    />
  )
}
