import SettingsForm from '@/components/settings-form'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_MODEL } from '@/components/model-selector'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_model, qwen_api_key, kimi_api_key, glm_api_key')
    .single()

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <SettingsForm
        defaultModel={settings?.default_model ?? DEFAULT_MODEL}
        apiKeys={{
          qwen: settings?.qwen_api_key ?? '',
          kimi: settings?.kimi_api_key ?? '',
          glm: settings?.glm_api_key ?? '',
        }}
      />
    </div>
  )
}
