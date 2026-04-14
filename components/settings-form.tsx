'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MODELS, DEFAULT_MODEL } from '@/lib/model-utils'
import { createClient } from '@/lib/supabase/client'

interface ApiKeys {
  qwen: string
  kimi: string
  glm: string
}

interface SettingsFormProps {
  defaultModel: string
  apiKeys: ApiKeys
}

const PROVIDER_INFO = [
  {
    key: 'glm' as keyof ApiKeys,
    label: 'GLM API key',
    placeholder: 'your-glm-api-key',
    link: 'https://open.bigmodel.cn',
    linkLabel: 'open.bigmodel.cn',
    note: 'GLM-4 Flash is free.',
  },
  {
    key: 'qwen' as keyof ApiKeys,
    label: 'Qwen API key',
    placeholder: 'sk-...',
    link: 'https://dashscope.aliyuncs.com',
    linkLabel: 'dashscope.aliyuncs.com',
    note: 'Get a key from Alibaba DashScope.',
  },
  {
    key: 'kimi' as keyof ApiKeys,
    label: 'Kimi API key',
    placeholder: 'sk-...',
    link: 'https://platform.moonshot.cn',
    linkLabel: 'platform.moonshot.cn',
    note: 'Get a key from Moonshot AI.',
  },
]

export default function SettingsForm({ defaultModel, apiKeys: initialApiKeys }: SettingsFormProps) {
  const [model, setModel] = useState(defaultModel)
  const [apiKeys, setApiKeys] = useState<ApiKeys>(initialApiKeys)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setKey(provider: keyof ApiKeys, value: string) {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_settings').upsert({
      user_id: user.id,
      default_model: model,
      qwen_api_key: apiKeys.qwen || null,
      kimi_api_key: apiKeys.kimi || null,
      glm_api_key: apiKeys.glm || null,
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Default model */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Default model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}{m.free ? ' (free)' : ''}
            </option>
          ))}
        </select>
      </div>

      <Separator />

      {/* API Keys */}
      <div className="space-y-5">
        <p className="text-sm font-medium">API Keys</p>
        {PROVIDER_INFO.map(({ key, label, placeholder, link, linkLabel, note }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{label}</label>
              {!apiKeys[key] && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Not set
                </span>
              )}
            </div>
            <input
              type="password"
              value={apiKeys[key]}
              onChange={(e) => setKey(key, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              {note}{' '}
              <a href={link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {linkLabel}
              </a>
            </p>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save settings'}
      </Button>
    </div>
  )
}
