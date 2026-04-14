'use client'

import { MODELS, DEFAULT_MODEL, getProvider, type Provider } from '@/lib/model-utils'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

const GROUP_LABELS: Record<Provider, string> = {
  ollama: 'Local (Ollama)',
  glm: 'GLM (Zhipu)',
  qwen: 'Qwen (Alibaba)',
  kimi: 'Kimi (Moonshot)',
  anthropic: 'Anthropic',
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const providers: Provider[] = ['ollama', 'glm', 'qwen', 'kimi']

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
