import ChatArea from '@/components/chat-area'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_MODEL } from '@/components/model-selector'

export default async function NewChatPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_model, qwen_api_key, kimi_api_key, glm_api_key')
    .single()

  return (
    <ChatArea
      conversationId={null}
      initialMessages={[]}
      defaultModel={settings?.default_model ?? DEFAULT_MODEL}
      apiKeys={{
        qwen: settings?.qwen_api_key ?? null,
        kimi: settings?.kimi_api_key ?? null,
        glm: settings?.glm_api_key ?? null,
      }}
    />
  )
}
