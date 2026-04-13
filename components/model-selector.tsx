'use client'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export type Provider = 'qwen' | 'kimi' | 'glm'

export const MODELS = [
  // GLM
  { id: 'glm-4-flash', label: 'GLM-4 Flash', provider: 'glm' as Provider, free: true },
  { id: 'glm-4-air', label: 'GLM-4 Air', provider: 'glm' as Provider, free: false },
  { id: 'glm-4', label: 'GLM-4', provider: 'glm' as Provider, free: false },
  // Qwen
  { id: 'qwen-turbo', label: 'Qwen Turbo', provider: 'qwen' as Provider, free: false },
  { id: 'qwen-plus', label: 'Qwen Plus', provider: 'qwen' as Provider, free: false },
  { id: 'qwen-max', label: 'Qwen Max', provider: 'qwen' as Provider, free: false },
  // Kimi
  { id: 'moonshot-v1-8k', label: 'Kimi 8k', provider: 'kimi' as Provider, free: false },
  { id: 'moonshot-v1-32k', label: 'Kimi 32k', provider: 'kimi' as Provider, free: false },
  { id: 'moonshot-v1-128k', label: 'Kimi 128k', provider: 'kimi' as Provider, free: false },
]

export const DEFAULT_MODEL = 'glm-4-flash'

export function getProvider(modelId: string): Provider {
  return MODELS.find((m) => m.id === modelId)?.provider ?? 'glm'
}

const GROUP_LABELS: Record<Provider, string> = {
  glm: 'GLM (Zhipu)',
  qwen: 'Qwen (Alibaba)',
  kimi: 'Kimi (Moonshot)',
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const providers: Provider[] = ['glm', 'qwen', 'kimi']

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {providers.map((provider) => (
        <optgroup key={provider} label={GROUP_LABELS[provider]}>
          {MODELS.filter((m) => m.provider === provider).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}{m.free ? ' (free)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
