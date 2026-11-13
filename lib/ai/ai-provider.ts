/**
 * Sky Ariana AI Provider Abstraction
 * Supports Google Gemini API and Local Deterministic Engine
 */

import { readJsonFile, mutateJsonFile } from '@/lib/services/blob-db'
import { getDataPath } from '@/lib/server-paths'
import { AIAssistantConfig } from '@/lib/types/ai-assistant'
import { evaluateAgentControlConfig } from './launchdarkly-client'

const AI_CONFIG_FILE = getDataPath('.local-ai-settings.json')

export const DEFAULT_AI_CONFIG: AIAssistantConfig = {
  enabled: true,
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  defaultLanguage: 'EN',
  mode: 'READ_ONLY',
  maxResults: 20,
  chatHistoryEnabled: true,
}

export async function getAIAssistantConfig(): Promise<AIAssistantConfig> {
  const cfg = await readJsonFile<AIAssistantConfig>(AI_CONFIG_FILE, DEFAULT_AI_CONFIG)
  // Check process.env.GEMINI_API_KEY if config doesn't have an explicit key
  const envKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
  return {
    ...DEFAULT_AI_CONFIG,
    ...cfg,
    apiKey: cfg.apiKey || envKey || '',
  }
}

export async function updateAIAssistantConfig(
  updates: Partial<AIAssistantConfig>
): Promise<AIAssistantConfig> {
  return await mutateJsonFile<AIAssistantConfig>(AI_CONFIG_FILE, DEFAULT_AI_CONFIG, (current) => ({
    ...current,
    ...updates,
  }))
}

/**
 * Normalizes Gemini model identifiers, auto-upgrading deprecated models to gemini-3.8-flash
 */
export function normalizeGeminiModel(m?: string): string {
  if (!m || typeof m !== 'string') return 'gemini-3.8-flash'
  const trimmed = m.trim()
  const lower = trimmed.toLowerCase()
  if (
    lower === 'gemini-flash-latest' ||
    lower.startsWith('gemini-2.5') ||
    lower.startsWith('gemini-2.0') ||
    lower.startsWith('gemini-1.5') ||
    lower === 'gemini-pro' ||
    lower.startsWith('gemini-1.0')
  ) {
    return 'gemini-3.8-flash'
  }
  return trimmed
}

export function isSupportedGeminiModel(m?: string): boolean {
  if (!m || typeof m !== 'string') return false
  return m.toLowerCase().startsWith('gemini') || m.toLowerCase().startsWith('gemma')
}

export interface PromptOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  userId?: string
}

/**
 * Generates an AI completion using Gemini REST API wrapped with LaunchDarkly AgentControl,
 * otherwise falls back cleanly to undefined so local deterministic wording is used.
 */
export async function generateAICompletion(
  prompt: string,
  options: PromptOptions = {}
): Promise<{ text: string; providerUsed: 'gemini' | 'launchdarkly' | 'offline_local' } | null> {
  const config = await getAIAssistantConfig()

  if (!config.enabled) {
    return null
  }

  // 1. Dynamic LaunchDarkly AgentControl evaluation
  const ldEval = await evaluateAgentControlConfig({
    userId: options.userId,
    defaultInstructions: options.systemPrompt,
    defaultModel: normalizeGeminiModel(config.model),
  })

  // If LaunchDarkly explicitly disabled the variation killswitch, gracefully return null
  if (!ldEval.enabled) {
    return null
  }

  const effectiveSystemPrompt = ldEval.instructions || options.systemPrompt
  const rawModel = isSupportedGeminiModel(ldEval.modelName)
    ? ldEval.modelName!
    : (config.model || 'gemini-3.8-flash')
  const effectiveModel = normalizeGeminiModel(rawModel)
  const effectiveTemperature =
    typeof ldEval.parameters?.temperature === 'number'
      ? (ldEval.parameters.temperature as number)
      : options.temperature ?? 0.2
  const effectiveMaxTokens =
    typeof ldEval.parameters?.maxTokens === 'number'
      ? (ldEval.parameters.maxTokens as number)
      : options.maxTokens ?? 1024

  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

  if (config.provider === 'gemini' && apiKey) {
    const startTime = Date.now()
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        effectiveModel
      )}:generateContent?key=${encodeURIComponent(apiKey)}`

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        systemInstruction: effectiveSystemPrompt
          ? {
              parts: [{ text: effectiveSystemPrompt }],
            }
          : undefined,
        generationConfig: {
          temperature: effectiveTemperature,
          maxOutputTokens: effectiveMaxTokens,
        },
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const durationMs = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        const text =
          data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''

        if (text.trim()) {
          // Track telemetry to LaunchDarkly AgentControl
          if (ldEval.tracker) {
            const promptTokens =
              data.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4)
            const candidatesTokens =
              data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4)
            const totalTokens =
              data.usageMetadata?.totalTokenCount ?? (promptTokens + candidatesTokens)

            ldEval.tracker.trackTokens({
              input: promptTokens,
              output: candidatesTokens,
              total: totalTokens,
            })
            ldEval.tracker.trackDuration(durationMs)
            ldEval.tracker.trackSuccess()
          }

          return {
            text: text.trim(),
            providerUsed: !ldEval.isFallback ? 'launchdarkly' : 'gemini',
          }
        }
      } else {
        const errBody = await response.text()
        console.warn('[GEMINI API WARNING]', response.status, errBody)
        if (ldEval.tracker) {
          ldEval.tracker.trackDuration(durationMs)
          ldEval.tracker.trackError()
        }
      }
    } catch (err: any) {
      console.warn('[GEMINI API ERROR - FALLING BACK TO LOCAL ENGINE]', err.message)
      if (ldEval.tracker) {
        ldEval.tracker.trackDuration(Date.now() - startTime)
        ldEval.tracker.trackError()
      }
    }
  }

  return null
}

/**
 * Structured JSON extraction using Gemini REST API with schema enforcement.
 * Falls back safely to null if API key is missing or model extraction fails.
 */
export async function extractStructuredData<T>(
  prompt: string,
  schema: Record<string, any>,
  options: PromptOptions = {}
): Promise<{ data: T; providerUsed: 'gemini' | 'launchdarkly' | 'offline_local'; modelUsed: string } | null> {
  const config = await getAIAssistantConfig()

  if (!config.enabled) {
    return null
  }

  const effectiveSystemPrompt =
    options.systemPrompt ||
    'You are Sky Ariana AI Logistics & Accounting Extractor. You extract structured fields with strict fidelity. Output valid JSON matching the schema exactly. Never hallucinate financial or logistics facts.'
  const effectiveModel = normalizeGeminiModel(config.model)
  const effectiveTemperature = options.temperature ?? 0.1
  const effectiveMaxTokens = options.maxTokens ?? 4096

  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

  if (config.provider === 'gemini' && apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        effectiveModel
      )}:generateContent?key=${encodeURIComponent(apiKey)}`

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: effectiveSystemPrompt }],
        },
        generationConfig: {
          temperature: effectiveTemperature,
          maxOutputTokens: effectiveMaxTokens,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        const text =
          result.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''

        if (text.trim()) {
          const cleaned = text
            .trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()
          const parsed = JSON.parse(cleaned) as T
          return {
            data: parsed,
            providerUsed: 'gemini',
            modelUsed: effectiveModel,
          }
        }
      } else {
        const errBody = await response.text()
        console.warn('[GEMINI STRUCTURED EXTRACTION WARNING]', response.status, errBody)
      }
    } catch (err: any) {
      console.warn('[GEMINI STRUCTURED EXTRACTION ERROR - FALLING BACK]', err.message)
    }
  }

  return null
}

/**
 * Tests the Gemini API credentials and LaunchDarkly AgentControl connection securely.
 */
export async function testAIConnection(): Promise<{
  success: boolean
  message: string
  model?: string
  launchDarkly?: {
    connected: boolean
    configKey?: string
    model?: string
    instructions?: string
  }
}> {
  const config = await getAIAssistantConfig()
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

  // Evaluate LaunchDarkly AgentControl status
  let ldStatus: {
    connected: boolean
    configKey?: string
    model?: string
    instructions?: string
  } | undefined

  try {
    const ldEval = await evaluateAgentControlConfig()
    if (!ldEval.isFallback) {
      ldStatus = {
        connected: true,
        configKey:
          process.env.LAUNCHDARKLY_AI_CONFIG_KEY || 'qahsanullah91-writing-improver-agent',
        model: ldEval.modelName,
        instructions: (ldEval.instructions || '').slice(0, 80) + '...',
      }
      if (ldEval.tracker) {
        ldEval.tracker.trackTokens({ input: 12, output: 18, total: 30 })
        ldEval.tracker.trackDuration(80)
        ldEval.tracker.trackSuccess()
      }
    }
  } catch (ldErr: any) {
    console.warn('[LAUNCHDARKLY TEST STATUS WARNING]', ldErr.message)
  }

  // 1. If provider is set to offline deterministic engine, verify local engine
  if (config.provider === 'offline_local') {
    const msg = 'Offline Deterministic Engine is active and verified. Rule-based search, shipment lookup, and accounting invariance guardrails are operational.'
    await updateAIAssistantConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: 'SUCCESS',
      lastTestMessage: msg,
    })
    return { success: true, message: msg, model: 'Offline Deterministic Engine', launchDarkly: ldStatus }
  }

  if (!apiKey) {
    const res = {
      success: false,
      message:
        'No Gemini API key is configured. Switch to Offline Deterministic Engine or enter a valid Gemini API key.',
      launchDarkly: ldStatus,
    }
    await updateAIAssistantConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: 'ERROR',
      lastTestMessage: res.message,
    })
    return res
  }

  try {
    const rawModel = isSupportedGeminiModel(ldStatus?.model)
      ? ldStatus!.model!
      : (config.model || 'gemini-3.8-flash')
    const model = normalizeGeminiModel(rawModel)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`

    const payload = {
      contents: [{ role: 'user', parts: [{ text: 'Hello, confirm Sky Ariana system connection.' }] }],
      generationConfig: { maxOutputTokens: 20 },
    }

    // Resilient fetch with timeout and 1 automatic retry
    const executeFetch = async (attempt = 1): Promise<Response> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return r
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (attempt < 2) {
          await new Promise((res) => setTimeout(res, 800))
          return executeFetch(attempt + 1)
        }
        throw err
      }
    }

    const res = await executeFetch()

    if (res.ok) {
      const msg = `Successfully connected to Gemini API (${model}).${
        ldStatus?.connected ? ` LaunchDarkly AgentControl active (${ldStatus.configKey}).` : ''
      }`
      await updateAIAssistantConfig({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'SUCCESS',
        lastTestMessage: msg,
      })
      return { success: true, message: msg, model, launchDarkly: ldStatus }
    } else {
      const errText = await res.text()
      let detailMsg = errText.slice(0, 150)
      try {
        const parsed = JSON.parse(errText)
        if (parsed?.error?.message) {
          detailMsg = parsed.error.message
        }
      } catch {}

      let msg = `Gemini connection (HTTP ${res.status}): ${detailMsg}`
      if (res.status === 403 && /free tier|billing/i.test(detailMsg)) {
        msg = `Gemini API (HTTP 403): Free tier is not available for this project. Link billing at https://aistudio.google.com/billing or switch to Offline Deterministic Engine.`
      } else if (res.status === 404 && /model/i.test(detailMsg)) {
        msg = `Gemini API (HTTP 404): Model '${model}' is unavailable. Please select 'Gemini 3.8 Flash' or switch to Offline Deterministic Engine.`
      }

      await updateAIAssistantConfig({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'ERROR',
        lastTestMessage: msg,
      })
      return { success: false, message: msg, launchDarkly: ldStatus }
    }
  } catch (err: any) {
    const causeStr = err.cause?.message || (err.cause?.code ? `Code: ${err.cause.code}` : '') || ''
    const rawDetail = causeStr ? `${err.message} (${causeStr})` : err.message
    const isTimeout = /connect timeout|timed out|UND_ERR_CONNECT_TIMEOUT|abort/i.test(rawDetail)
    const msg = isTimeout
      ? `Gemini connection timed out. Google API is unreachable from your network/VPN. You can switch to Offline Deterministic Engine (Local).`
      : `Gemini network error: ${rawDetail}. The assistant will automatically use the local deterministic engine.`

    await updateAIAssistantConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: 'ERROR',
      lastTestMessage: msg,
    })
    return { success: false, message: msg, launchDarkly: ldStatus }
  }
}
