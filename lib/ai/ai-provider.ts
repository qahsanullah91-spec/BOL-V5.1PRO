/**
 * Sky Ariana AI Provider Abstraction
 * Supports Google Gemini API and Local Deterministic Engine
 */

import { readJsonFile, mutateJsonFile } from '@/lib/services/blob-db'
import { getDataPath } from '@/lib/server-paths'
import { AIAssistantConfig } from '@/lib/types/ai-assistant'

const AI_CONFIG_FILE = getDataPath('.local-ai-settings.json')

export const DEFAULT_AI_CONFIG: AIAssistantConfig = {
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  defaultLanguage: 'EN',
  mode: 'READ_ONLY',
  maxResults: 20,
  chatHistoryEnabled: true,
}

export async function getAIAssistantConfig(): Promise<AIAssistantConfig> {
  const cfg = await readJsonFile<AIAssistantConfig>(AI_CONFIG_FILE, DEFAULT_AI_CONFIG)
  // Check process.env.GEMINI_API_KEY if config doesn't have an explicit key
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY
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

export interface PromptOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

/**
 * Generates an AI completion using Gemini REST API if configured,
 * otherwise falls back cleanly to undefined so local deterministic wording is used.
 */
export async function generateAICompletion(
  prompt: string,
  options: PromptOptions = {}
): Promise<{ text: string; providerUsed: 'gemini' | 'offline_local' } | null> {
  const config = await getAIAssistantConfig()

  if (!config.enabled) {
    return null
  }

  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

  if (config.provider === 'gemini' && apiKey) {
    try {
      const model = config.model || 'gemini-2.5-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        systemInstruction: options.systemPrompt
          ? {
              parts: [{ text: options.systemPrompt }],
            }
          : undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const text =
          data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''
        if (text.trim()) {
          return { text: text.trim(), providerUsed: 'gemini' }
        }
      } else {
        const errBody = await response.text()
        console.warn('[GEMINI API WARNING]', response.status, errBody)
      }
    } catch (err: any) {
      console.warn('[GEMINI API ERROR - FALLING BACK TO LOCAL ENGINE]', err.message)
    }
  }

  return null
}

/**
 * Tests the Gemini API credentials securely without exposing key to frontend.
 */
export async function testAIConnection(): Promise<{
  success: boolean
  message: string
  model?: string
}> {
  const config = await getAIAssistantConfig()
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

  if (!apiKey) {
    const res = {
      success: false,
      message: 'No Gemini API key is configured. The assistant will operate in offline deterministic mode.',
    }
    await updateAIAssistantConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: 'ERROR',
      lastTestMessage: res.message,
    })
    return res
  }

  try {
    const model = config.model || 'gemini-2.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`

    const payload = {
      contents: [{ role: 'user', parts: [{ text: 'Hello, confirm Sky Ariana system connection.' }] }],
      generationConfig: { maxOutputTokens: 20 },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const msg = `Successfully connected to Gemini API (${model}).`
      await updateAIAssistantConfig({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'SUCCESS',
        lastTestMessage: msg,
      })
      return { success: true, message: msg, model }
    } else {
      const err = await res.text()
      const msg = `Gemini connection failed (HTTP ${res.status}): ${err.slice(0, 120)}`
      await updateAIAssistantConfig({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'ERROR',
        lastTestMessage: msg,
      })
      return { success: false, message: msg }
    }
  } catch (err: any) {
    const msg = `Gemini network error: ${err.message}`
    await updateAIAssistantConfig({
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: 'ERROR',
      lastTestMessage: msg,
    })
    return { success: false, message: msg }
  }
}
