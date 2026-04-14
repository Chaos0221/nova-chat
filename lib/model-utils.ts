export type Provider = 'qwen' | 'kimi' | 'glm' | 'anthropic' | 'ollama'

export const MODELS = [
  // Claude (Anthropic Official)
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' as Provider, free: false },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'anthropic' as Provider, free: false },
  { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', provider: 'anthropic' as Provider, free: false },
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
  // Ollama (local)
  { id: 'llama3', label: 'Llama 3', provider: 'ollama' as Provider, free: true },
] as const

export const DEFAULT_MODEL = 'llama3'

export function getProvider(modelId: string): Provider {
  return MODELS.find((m) => m.id === modelId)?.provider ?? 'glm'
}

export const PROVIDER_CONFIG: Record<Provider, { baseURL: string }> = {
  qwen: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  kimi: { baseURL: 'https://api.moonshot.cn/v1' },
  glm:  { baseURL: 'https://open.bigmodel.cn/api/paas/v4/' },
  anthropic: { baseURL: 'https://api.anthropic.com/v1' },
  ollama: { baseURL: 'http://localhost:11434/v1' },
}
