'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    label: 'GLM',
    description: 'Zhipu AI models',
    placeholder: 'your-glm-api-key',
    link: 'https://open.bigmodel.cn',
    linkLabel: 'open.bigmodel.cn',
    badge: 'Free tier available',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'qwen' as keyof ApiKeys,
    label: 'Qwen',
    description: 'Alibaba DashScope models',
    placeholder: 'sk-...',
    link: 'https://dashscope.aliyuncs.com',
    linkLabel: 'dashscope.aliyuncs.com',
    badge: null,
    badgeColor: '',
  },
  {
    key: 'kimi' as keyof ApiKeys,
    label: 'Kimi',
    description: 'Moonshot AI models',
    placeholder: 'sk-...',
    link: 'https://platform.moonshot.cn',
    linkLabel: 'platform.moonshot.cn',
    badge: null,
    badgeColor: '',
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
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Default Model</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred AI model</p>
          </div>
        </div>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border/50 bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}{m.free ? ' (free)' : ''}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Add your API keys to enable different models</p>
        </div>
        
        <div className="space-y-3">
          {PROVIDER_INFO.map(({ key, label, description, placeholder, link, linkLabel, badge, badgeColor }) => (
            <div key={key} className="group relative rounded-xl border border-border/50 bg-muted/30 p-4 transition-all hover:border-border hover:bg-muted/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">— {description}</span>
                </div>
                {badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor}`}>
                    {badge}
                  </span>
                )}
                {apiKeys[key] && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Configured
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={apiKeys[key]}
                  onChange={(e) => setKey(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <ExternalLinkIcon className="h-3 w-3 text-muted-foreground/50" />
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  {linkLabel}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full h-11 rounded-xl font-medium shadow-lg shadow-primary/10 transition-all hover:shadow-xl hover:shadow-primary/15"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner className="h-4 w-4" />
            Saving...
          </span>
        ) : saved ? (
          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="h-4 w-4" />
            Settings saved
          </span>
        ) : (
          'Save settings'
        )}
      </Button>
    </div>
  )
}

function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function ExternalLinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function LoadingSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
