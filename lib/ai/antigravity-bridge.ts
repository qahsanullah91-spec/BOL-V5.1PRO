/**
 * Google Antigravity SDK Agent Bridge
 * Executes the Python Antigravity multi-tool agent and bridges
 * structured outputs and accounting invariance assertions into TypeScript.
 */

import { execFile } from 'child_process'
import path from 'path'
import {
  AIUserSessionContext,
  AIResponsePayload,
  AIChatMessage,
  AICardItem,
} from '@/lib/types/ai-assistant'

interface PythonAntigravityRawOutput {
  success: boolean
  intent: string
  content: string
  language: string
  agent_steps: string[]
  tools_called: {
    tool_name: string
    parameters: Record<string, any>
    status: string
    result_preview: string
  }[]
  invariance_passed: boolean
  source_tags: string[]
  cards: any[]
  action_proposal?: any
}

export async function executeAntigravityAgent(
  prompt: string,
  user: AIUserSessionContext,
  engine: string = 'antigravity'
): Promise<AIResponsePayload | null> {
  return new Promise((resolve) => {
    const cwd = process.cwd()
    // Windows virtual environment python executable
    const pythonExe = process.platform === 'win32'
      ? path.join(cwd, '.venv', 'Scripts', 'python.exe')
      : path.join(cwd, '.venv', 'bin', 'python')

    const scriptPath = path.join(cwd, 'scripts', 'ai', 'sky_antigravity_agent.py')

    const args = [
      scriptPath,
      '--query', prompt,
      '--user', user.username || 'admin',
      '--language', user.language || 'EN',
      '--engine', engine,
    ]

    const child = execFile(
      pythonExe,
      args,
      {
        cwd,
        timeout: 15000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          console.warn('[ANTIGRAVITY BRIDGE] Python execution error or timeout:', error.message)
          if (stderr) console.warn('[ANTIGRAVITY BRIDGE] stderr:', stderr)
          return resolve(null)
        }

        try {
          const raw: PythonAntigravityRawOutput = JSON.parse(stdout.trim())
          if (!raw || !raw.content) {
            return resolve(null)
          }

          const cards: AICardItem[] = (raw.cards || []).map((c, idx) => ({
            id: c.id || `card-${idx}-${Date.now()}`,
            type: (c.type as any) || 'REPORT',
            title: c.title || 'Record',
            subtitle: c.subtitle,
            status: c.status,
            location: c.location,
            primaryReference: c.title,
            financials: c.financials,
            actions: c.actions || [],
          }))

          const message: AIChatMessage = {
            id: `msg-ag-${Date.now()}`,
            role: 'assistant',
            content: raw.content,
            intent: (raw.intent as any) || 'GENERAL_QUESTION',
            sourceTags: raw.source_tags || ['Google Antigravity SDK', 'Database Grounded'],
            cards: cards.length > 0 ? cards : undefined,
            agentSteps: raw.agent_steps || [],
            toolsCalled: raw.tools_called || [],
            invariancePassed: raw.invariance_passed,
            engineUsed: 'antigravity',
            timestamp: new Date().toISOString(),
          }

          return resolve({
            success: true,
            message,
            suggestions: [
              'Where are active containers?',
              'Which trucks are at Islam Qala border?',
              'Audit customer balances and net position',
              "Make today's WhatsApp shipment status",
            ],
          })
        } catch (parseError: any) {
          console.warn('[ANTIGRAVITY BRIDGE] Failed to parse Python stdout JSON:', parseError.message)
          return resolve(null)
        }
      }
    )
  })
}
