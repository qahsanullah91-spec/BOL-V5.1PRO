'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  Bot,
  Settings,
  Eye,
  EyeOff,
  Server,
  Zap,
} from 'lucide-react'
import { AIAssistantConfig, AIProviderType } from '@/lib/types/ai-assistant'
import { toast } from 'sonner'

interface AISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfigUpdated?: (config: AIAssistantConfig) => void
}

export function AISettingsDialog({ open, onOpenChange, onConfigUpdated }: AISettingsDialogProps) {
  const [config, setConfig] = useState<AIAssistantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    model?: string
  } | null>(null)

  // Form states
  const [provider, setProvider] = useState<AIProviderType>('gemini')
  const [geminiKey, setGeminiKey] = useState('')
  const [openAiKey, setOpenAiKey] = useState('')
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash')
  const [openAiModel, setOpenAiModel] = useState('gpt-4o')
  const [defaultLanguage, setDefaultLanguage] = useState<'EN' | 'FA' | 'PS'>('EN')
  const [defaultMode, setDefaultMode] = useState<'ASK' | 'WORK'>('ASK')
  const [maxTokens, setMaxTokens] = useState<number>(2000)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showOpenAiKey, setShowOpenAiKey] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [showErrorLogs, setShowErrorLogs] = useState(false)

  // Fetch current config on open
  useEffect(() => {
    if (open) {
      loadConfig()
    }
  }, [open])

  const loadConfig = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/ai/assistant')
      const data = await res.json()
      if (data.success && data.config) {
        setConfig(data.config)
        setProvider(data.config.provider || 'gemini')
        setGeminiKey(data.config.apiKey || '')
        setOpenAiKey(data.config.openaiApiKey || '')
        setGeminiModel(data.config.model || 'gemini-3.8-flash')
        setOpenAiModel(data.config.openaiModel || 'gpt-4o')
        setDefaultLanguage(data.config.defaultLanguage || 'EN')
        setDefaultMode((data.config.mode as any) || 'ASK')
        setMaxTokens(data.config.maxResponseLength || 2000)
        setSystemPrompt(data.config.systemPrompt || '')
        if (data.config.lastTestedAt) {
          setTestResult({
            success: data.config.lastTestStatus === 'SUCCESS',
            message: data.config.lastTestMessage || 'Previous connection test recorded.',
            model: data.config.model,
          })
        }
      }
    } catch (err: any) {
      toast.error('Failed to load AI settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Partial<AIAssistantConfig> = {
        provider,
        model: geminiModel,
        openaiModel: openAiModel,
        defaultLanguage,
        mode: defaultMode,
        maxResponseLength: maxTokens,
        systemPrompt,
      }
      if (geminiKey && !geminiKey.startsWith('••••')) {
        updates.apiKey = geminiKey.trim()
      }
      if (openAiKey && !openAiKey.startsWith('••••')) {
        updates.openaiApiKey = openAiKey.trim()
      }

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-config',
          updates,
        }),
      })

      const data = await res.json()
      if (data.success && data.config) {
        toast.success('AI configuration saved successfully!')
        setConfig(data.config)
        onConfigUpdated?.(data.config)
        onOpenChange(false)
      } else {
        toast.error(`Save failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // First save current draft settings if changed
      const updates: Partial<AIAssistantConfig> = {
        provider,
        model: geminiModel,
        openaiModel: openAiModel,
      }
      if (geminiKey && !geminiKey.startsWith('••••')) {
        updates.apiKey = geminiKey.trim()
      }
      if (openAiKey && !openAiKey.startsWith('••••')) {
        updates.openaiApiKey = openAiKey.trim()
      }

      await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-config', updates }),
      })

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection' }),
      })

      const data = await res.json()
      setTestResult(data)
      if (data.success) {
        toast.success('AI Connection Verified!')
      } else {
        toast.error('Connection Test Failed')
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection test error: ${err.message}`,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight">
              AI Provider & Intelligence Settings
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Configure Google Gemini, OpenAI, or the offline deterministic engine. API keys are
            isolated securely on the server and never exposed to the browser.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Loading AI parameters...</span>
          </div>
        ) : (
          <div className="space-y-5 pt-3">
            {/* 1. Provider Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Primary AI Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('gemini')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    provider === 'gemini'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Gemini</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Gemini 3.8 Flash, 2.5 Flash, 1.5 Pro
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('openai')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    provider === 'openai'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black mb-1">
                    <Bot className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OpenAI</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    ChatGPT models (GPT-4o, GPT-4o-mini)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('offline_local')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    provider === 'offline_local'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black mb-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Offline Engine</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    100% Local, zero external network dependency
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Provider-Specific Credentials & Models */}
            {provider === 'gemini' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Google Gemini API Key</span>
                    <a
                      href="https://aistudio.google.com/app/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      Get Key from Google AI Studio ↗
                    </a>
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full h-10 px-3.5 pr-10 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Gemini Model
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended • Fast & Accurate)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </select>
                </div>
              </div>
            )}

            {provider === 'openai' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>OpenAI API Key</span>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline"
                    >
                      Get Key from OpenAI Platform ↗
                    </a>
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenAiKey ? 'text' : 'password'}
                      value={openAiKey}
                      onChange={(e) => setOpenAiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full h-10 px-3.5 pr-10 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    OpenAI Model
                  </label>
                  <select
                    value={openAiModel}
                    onChange={(e) => setOpenAiModel(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="gpt-4o">GPT-4o (Flagship Omni Model)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Efficient)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
              </div>
            )}

            {provider === 'offline_local' && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300 space-y-1.5">
                <span className="font-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Offline Deterministic Engine Active
                </span>
                <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-400">
                  Operates using internal rule-based parsers, verified local JSON databases, and
                  mathematical invariance guards. No internet connection or API keys required.
                </p>
              </div>
            )}

            {/* 3. Operational Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Default Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as any)}
                  className="w-full h-9 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="EN">English</option>
                  <option value="FA">فارسی (Dari)</option>
                  <option value="PS">پښتو (Pashto)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Default Mode
                </label>
                <select
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value as any)}
                  className="w-full h-9 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="ASK">ASK MODE (Q&A)</option>
                  <option value="WORK">WORK MODE (Actions)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Max Response Tokens
                </label>
                <input
                  type="number"
                  min={500}
                  max={8000}
                  step={250}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 2000)}
                  className="w-full h-9 px-3 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* 4. System Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                System Instructions
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                placeholder="Custom persona or behavioral rules for SKY AI..."
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            {/* 5. Error Logs Accordion */}
            {config?.errorLog && config.errorLog.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowErrorLogs(!showErrorLogs)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Provider Error Logs ({config.errorLog.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {showErrorLogs ? 'Hide' : 'View'}
                  </span>
                </button>
                {showErrorLogs && (
                  <div className="max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    {config.errorLog.map((log, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-red-500 font-bold">[{log.provider?.toUpperCase() || 'AI'}]</span> {log.timestamp?.slice(11, 19)}: {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Connection Test Result Banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-black block">
                    {testResult.success ? 'Connection Operational' : 'Connection Error'}
                  </span>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* 5. Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                <span>Test Connection</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || testing}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
