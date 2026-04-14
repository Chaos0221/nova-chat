'use client'

import { useState } from 'react'
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

const PROVIDER_COLORS: Record<Provider, string> = {
  ollama: 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  glm: 'bg-violet-500/20 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  qwen: 'bg-orange-500/20 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  kimi: 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  anthropic: 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const providers: Provider[] = ['ollama', 'glm', 'qwen', 'kimi']
  const selectedModel = MODELS.find((m) => m.id === value)
  const currentProvider = selectedModel ? getProvider(value) : 'glm'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-background active:scale-[0.98]"
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${PROVIDER_COLORS[currentProvider]}`}>
          {currentProvider.slice(0, 1).toUpperCase()}
        </span>
        <span className="text-foreground/80">{selectedModel?.label || 'Select model'}</span>
        <ChevronIcon className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl shadow-foreground/5 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-2 space-y-1">
              {providers.map((provider) => (
                <div key={provider}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {GROUP_LABELS[provider]}
                  </div>
                  {MODELS.filter((m) => m.provider === provider).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onChange(m.id)
                        setIsOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        m.id === value
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="font-medium">{m.label}</span>
                      {m.free && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          Free
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
