'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '@/lib/app-context'
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Truck,
  FileText,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Globe,
  Sliders,
  CheckCircle2,
  X,
  MessageSquare,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Ship,
  Scale,
  Anchor,
  Search,
  Building2,
  Bot,
  CornerDownLeft,
  Flame,
  CheckCheck,
  Cpu,
  Terminal,
  ChevronDown,
  ChevronUp,
  Workflow,
  Plus,
  Paperclip,
  Edit2,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  StopCircle,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Zap,
  Settings,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  AIChatMessage,
  AICardItem,
  AIActionProposal,
  SupportedLanguage,
  AIAssistantMode,
  AIConversation,
  AIMessageAttachment,
  AIProviderType,
} from '@/lib/types/ai-assistant'
import { toast } from 'sonner'
import { WhatsAppMessageCard } from './whatsapp-card'
import { DocumentArtifactCard } from './document-card'
import { AISettingsDialog } from './ai-settings-dialog'

interface AIChatInterfaceProps {
  initialPrompt?: string
  isFloating?: boolean
  onClose?: () => void
}

export function AIChatInterface({ initialPrompt, isFloating = false, onClose }: AIChatInterfaceProps) {
  const { currentUser, setView, accounts = [], invoices = [] } = useApp()

  // Conversations State
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConvoId, setCurrentConvoId] = useState<string>('default-session')
  const [sidebarOpen, setSidebarOpen] = useState(!isFloating)
  const [searchConvoQuery, setSearchConvoQuery] = useState('')
  const [renamingConvoId, setRenamingConvoId] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')

  // Active Chat State
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '')
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('Understanding request...')
  const [language, setLanguage] = useState<SupportedLanguage>('EN')
  const [mode, setMode] = useState<AIAssistantMode>('ASK')
  const [engine, setEngine] = useState<'antigravity' | 'gemini' | 'openai' | 'offline_local'>('gemini')
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [executingProposalId, setExecutingProposalId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Attachments State
  const [attachments, setAttachments] = useState<AIMessageAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load Conversations on Mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/ai/conversations')
      const data = await res.json()
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations)
        if (data.conversations.length > 0 && currentConvoId === 'default-session') {
          const first = data.conversations[0]
          setCurrentConvoId(first.id)
          setMessages(first.messages || [])
          setMode(first.mode || 'ASK')
        }
      }
    } catch {
      // Fallback to local default session
    }
  }

  // Save current conversation when messages update
  useEffect(() => {
    if (messages.length > 0 && currentConvoId) {
      saveActiveConversation()
    }
  }, [messages])

  const saveActiveConversation = async () => {
    const title =
      messages.find((m) => m.role === 'user')?.content.slice(0, 36) || 'New Conversation'
    const convo: AIConversation = {
      id: currentConvoId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length,
      mode,
      messages,
      userId: currentUser?.id || 'admin',
    }

    try {
      await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: convo }),
      })
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === currentConvoId)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = convo
          return updated
        }
        return [convo, ...prev]
      })
    } catch {}
  }

  // Create New Chat
  const handleNewChat = () => {
    const newId = `convo-${Date.now()}`
    const newConvo: AIConversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      mode,
      messages: [],
      userId: currentUser?.id || 'admin',
    }
    setCurrentConvoId(newId)
    setMessages([])
    setAttachments([])
    setConversations((prev) => [newConvo, ...prev])
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  // Switch Conversation
  const handleSelectConversation = (convo: AIConversation) => {
    setCurrentConvoId(convo.id)
    setMessages(convo.messages || [])
    setMode(convo.mode || 'ASK')
    setAttachments([])
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  // Rename Conversation
  const handleStartRename = (convo: AIConversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingConvoId(convo.id)
    setRenameInput(convo.title)
  }

  const handleSaveRename = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!renameInput.trim()) return setRenamingConvoId(null)

    try {
      await fetch('/api/ai/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: renameInput.trim() }),
      })
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: renameInput.trim() } : c))
      )
      toast.success('Conversation renamed')
    } catch {
      toast.error('Failed to rename')
    } finally {
      setRenamingConvoId(null)
    }
  }

  // Delete Conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConvoId === id) {
        handleNewChat()
      }
      toast.success('Conversation deleted')
    } catch {
      toast.error('Failed to delete conversation')
    }
  }

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Handle Initial Prompt if passed
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSendMessage(initialPrompt)
    }
  }, [initialPrompt])

  // Handle File Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const newAttachment: AIMessageAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        }
        setAttachments((prev) => [...prev, newAttachment])
        toast.success(`Attached ${file.name}`)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  // Edit and Resend User Messages
  const handleStartEdit = (msg: AIChatMessage) => {
    setEditingMsgId(msg.id)
    setEditingText(msg.content)
  }

  const handleCancelEdit = () => {
    setEditingMsgId(null)
    setEditingText('')
  }

  const handleSaveAndResend = (msgId: string) => {
    const textToSend = editingText.trim()
    if (!textToSend) return
    setEditingMsgId(null)
    setEditingText('')

    const idx = messages.findIndex((m) => m.id === msgId)
    if (idx >= 0) {
      setMessages((prev) => prev.slice(0, idx))
    }
    handleSendMessage(textToSend)
  }

  // Regenerate Response
  const handleRegenerate = (assistantMsgId: string) => {
    const idx = messages.findIndex((m) => m.id === assistantMsgId)
    if (idx > 0) {
      const priorUserMsg = messages[idx - 1]
      if (priorUserMsg && priorUserMsg.role === 'user') {
        setMessages((prev) => prev.slice(0, idx))
        handleSendMessage(priorUserMsg.content, priorUserMsg.attachments)
      }
    }
  }

  // Stop Streaming / Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    setLoadingStage('')
    toast.info('Response generation stopped.')
  }

  // Send Query (with streaming / standard fallback)
  const handleSendMessage = async (promptToSend?: string, customAttachments?: AIMessageAttachment[]) => {
    const query = (promptToSend || inputPrompt).trim()
    const activeAttachments = customAttachments || attachments
    if ((!query && activeAttachments.length === 0) || loading) return

    const userMsgId = `msg-user-${Date.now()}`
    const userMsg: AIChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query || 'Uploaded file analysis request',
      attachments: activeAttachments.length > 0 ? [...activeAttachments] : undefined,
      mode,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    const sentAttachments = [...activeAttachments]
    if (!promptToSend) setInputPrompt('')
    setAttachments([])
    setLoading(true)
    setLoadingStage('Analyzing query & permissions...')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setTimeout(() => setLoadingStage('Retrieving verified database records...'), 300)
      setTimeout(() => setLoadingStage('Applying accounting invariance & anti-hallucination checks...'), 600)

      const firstFile = sentAttachments[0]
      const filePayload = firstFile?.dataUrl
        ? {
            data: firstFile.dataUrl,
            mimeType: firstFile.type,
            name: firstFile.name,
          }
        : undefined

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          action: 'ask',
          prompt: query,
          engine,
          mode,
          file: filePayload,
          attachments: sentAttachments,
          userContext: {
            id: currentUser?.id,
            username: currentUser?.username,
            name: currentUser?.name,
            role: currentUser?.role,
            language,
          },
        }),
      })

      const data = await res.json()
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${data.error || 'Failed to process request.'}`,
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ])
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted, do not show error bubble
        return
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Network error: ${err.message}. Offline Deterministic Engine remains active.`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Confirm Action Proposal (Write Execution)
  const handleConfirmAction = async (proposal: AIActionProposal) => {
    try {
      setExecutingProposalId(proposal.id)
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm-action',
          proposal,
          userContext: {
            id: currentUser?.id,
            username: currentUser?.username,
            name: currentUser?.name,
            role: currentUser?.role,
            language,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Action executed successfully in database!')
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.actionProposal?.id === proposal.id) {
              return {
                ...msg,
                actionProposal: { ...msg.actionProposal, confirmed: true },
              }
            }
            return msg
          })
        )
      } else {
        toast.error(`Execution failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      toast.error(`Execution failed: ${err.message}`)
    } finally {
      setExecutingProposalId(null)
    }
  }

  // Card Action Handler (Navigate, Download, WhatsApp)
  const handleCardAction = (action: string, params?: any) => {
    if (action === 'NAVIGATE' && params?.view) {
      setView(params.view as any)
      if (onClose) onClose()
    } else if (action === 'GENERATE_WHATSAPP' && params?.bolNumber) {
      handleSendMessage(`Write a professional WhatsApp message for BOL ${params.bolNumber}`)
    } else if (action === 'GENERATE_PDF' && params?.bolNumber) {
      handleSendMessage(`Generate the complete PDF for BOL ${params.bolNumber}`)
    } else if (action === 'DOWNLOAD_FILE' && params?.url) {
      const a = document.createElement('a')
      a.href = params.url
      a.download = params.fileName || 'Document.pdf'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else if (action === 'COPY_TEXT' && params?.text) {
      navigator.clipboard.writeText(params.text)
      toast.success('Copied to clipboard!')
    }
  }

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Response copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Quick Action Chips
  const quickActionChips = [
    { label: '📱 Write WhatsApp Message', query: 'Write a professional WhatsApp message for our active shipment' },
    { label: '🔍 Find Shipment', query: 'Search active shipments in transit' },
    { label: '⚓ Containers at Bandar Abbas', query: 'Show me all containers currently at Bandar Abbas' },
    { label: '📑 Missing Documents', query: 'Which shipments are missing documents?' },
    { label: '💰 Overdue Invoices', query: 'Show overdue invoices and calculate outstanding balances' },
    { label: '📊 Daily Shipment Report', query: 'Prepare today\'s shipment report' },
    { label: '📄 Generate Complete BOL PDF', query: 'Generate the complete PDF for our latest BOL' },
  ]

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    if (!searchConvoQuery.trim()) return conversations
    const q = searchConvoQuery.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }, [conversations, searchConvoQuery])

  return (
    <div className={`w-full h-full flex bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden ${isFloating ? 'max-h-[620px]' : ''}`}>
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR (ChatGPT / Gemini Style)                             */}
      {/* ==================================================================== */}
      {!isFloating && sidebarOpen && (
        <aside className="w-72 sm:w-80 h-full flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none z-20">
          {/* Sidebar Top: Logo & New Chat */}
          <div className="p-4 space-y-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-tight text-white block">
                    SKY AI Operations
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    AQ Companies V5.26
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* "+ New Chat" Button */}
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </span>
              <span className="text-[10px] font-mono opacity-80 bg-white/20 px-1.5 py-0.5 rounded-md">
                Ctrl+K
              </span>
            </button>

            {/* Search Conversations Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchConvoQuery}
                onChange={(e) => setSearchConvoQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-8 pl-8 pr-7 text-[11px] rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
              />
              {searchConvoQuery && (
                <button
                  type="button"
                  onClick={() => setSearchConvoQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Middle: Conversation History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Recent Conversations
            </div>

            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No conversations recorded.
              </div>
            ) : (
              filteredConversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => handleSelectConversation(convo)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    currentConvoId === convo.id
                      ? 'bg-blue-600/20 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  {renamingConvoId === convo.id ? (
                    <form
                      onSubmit={(e) => handleSaveRename(convo.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 w-full"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-slate-950 border border-blue-500 rounded text-white"
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingConvoId(null)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate pr-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{convo.title}</span>
                      </div>

                      {/* Action icons on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(convo, e)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(convo.id, e)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar Bottom: User Profile & AI Engine Status */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
            {/* User Profile Info */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AQ'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white truncate text-[11px]">
                    {currentUser?.name || 'Ahsanullah Qureshi'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {currentUser?.role ? currentUser.role.toUpperCase() : 'SUPERADMIN'}
                  </span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online & Authorized" />
            </div>

            {/* AI Settings & Keys Trigger */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-left">
                  <span className="block text-white text-[11px] leading-tight">AI Settings & Keys</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Provider: {engine.toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </button>
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/* 2. MAIN CHAT WORKSPACE AREA                                         */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
        {/* Header Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            {!isFloating && !sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-600 dark:text-slate-300"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-900 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>SKY AI Business Assistant</span>
                  <span className="hidden md:inline px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                    Database Grounded
                  </span>
                </h1>
                <p className="hidden sm:block text-[10px] text-slate-500 font-medium">
                  Never hallucinates balances, locations, or dates • Real-time DB Grounding
                </p>
              </div>
            </div>
          </div>

          {/* Mode & Engine Controls */}
          <div className="flex items-center gap-2">
            {/* ASK MODE vs WORK MODE Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('ASK')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'ASK'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('WORK')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'WORK'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Work Mode</span>
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="h-8 px-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="EN">English</option>
              <option value="FA">فارسی (Dari)</option>
              <option value="PS">پښتو (Pashto)</option>
            </select>

            {/* Model Selector Dropdown */}
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="hidden lg:inline h-8 px-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="gemini">Gemini 3.8 Flash</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="offline_local">Offline Deterministic</option>
            </select>

            {/* AI Settings Dialog Trigger */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-600 dark:text-slate-300"
              title="AI Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {isFloating && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ================================================================== */}
        {/* Messages Feed Area                                                 */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-amber-500 text-white flex items-center justify-center shadow-xl">
                <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  How can SKY AI assist your logistics today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                  Directly connected to AQ Companies database. I can search shipments, track containers,
                  write verified WhatsApp messages, generate official PDFs, and audit financial ledgers.
                </p>
              </div>

              {/* Mode Explanation Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left text-xs">
                <div
                  onClick={() => setMode('ASK')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    mode === 'ASK'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-blue-900 dark:text-blue-300 mb-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span>ASK MODE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Search company records, explain shipment information, verify ledger balances, and analyze uploaded documents.
                  </p>
                </div>

                <div
                  onClick={() => setMode('WORK')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    mode === 'WORK'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-300 mb-1">
                    <Workflow className="w-4 h-4 text-emerald-600" />
                    <span>WORK MODE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Generate official PDFs, export packing lists, prepare WhatsApp messages, and update shipment records with confirmation.
                  </p>
                </div>
              </div>

              {/* Quick Action Suggested Prompts */}
              <div className="w-full space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Suggested Actions
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {quickActionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip.query)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all cursor-pointer shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Render Message History */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-2 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Message Card */}
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md space-y-2">
                    {editingMsgId === msg.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/10 text-white text-xs border border-white/30 focus:outline-hidden"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAndResend(msg.id)}
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer"
                          >
                            Save & Resend
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>

                        {/* Attached files preview */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/20">
                            {msg.attachments.map((att) => (
                              <span
                                key={att.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-[10px] font-mono"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{att.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[10px] text-white/70">
                          <span>
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                              title="Edit and resend"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content)
                                toast.success('Copied prompt to clipboard')
                              }}
                              className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy prompt"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* AI Message Bubble */
                  <div className="w-full max-w-[95%] sm:max-w-[90%] rounded-3xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3.5">
                    {/* Assistant Header: Model / Grounded Tags */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          SKY AI Assistant
                        </span>
                        {msg.sourceTags && msg.sourceTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="hidden sm:inline px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Execution Steps / Agent Steps Accordion */}
                    {msg.agentSteps && msg.agentSteps.length > 0 && (
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-2.5 text-xs space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTraces((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="w-full flex items-center justify-between font-bold text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>{msg.agentSteps.length} operational steps executed</span>
                          </span>
                          {expandedTraces[msg.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedTraces[msg.id] && (
                          <div className="pt-2 pl-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                            {msg.agentSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-emerald-500">✓</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Markdown Formatted Text */}
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert max-w-none leading-relaxed overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Dedicated WhatsApp Card */}
                    {msg.whatsappCard && (
                      <WhatsAppMessageCard
                        card={msg.whatsappCard}
                        onRegenerate={() =>
                          handleSendMessage(
                            `Regenerate WhatsApp message for BOL ${msg.whatsappCard?.bolNumber}`
                          )
                        }
                      />
                    )}

                    {/* Dedicated Document Artifact Card */}
                    {msg.documentArtifact && (
                      <DocumentArtifactCard
                        artifact={msg.documentArtifact}
                        onViewBol={(bNum) => setView('bol')}
                      />
                    )}

                    {/* Action Confirmation Proposal (Two-Phase Write Guard) */}
                    {msg.actionProposal && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span>Action Proposal (Confirmation Required)</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                            {msg.actionProposal.actionType}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {msg.actionProposal.description}
                        </p>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 text-xs font-mono space-y-1">
                          <div>
                            <span className="text-slate-400">Target Record:</span>{' '}
                            <strong>{msg.actionProposal.entityRef}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Proposed Values:</span>{' '}
                            {JSON.stringify(msg.actionProposal.proposedValues)}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {msg.actionProposal.confirmed ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Action Confirmed & Executed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={executingProposalId === msg.actionProposal.id}
                              onClick={() => handleConfirmAction(msg.actionProposal!)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {executingProposalId === msg.actionProposal.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Confirm & Apply Changes</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Structured Cards (Shipments, Containers, Invoices) */}
                    {msg.cards && msg.cards.length > 0 && (
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {msg.cards.map((card) => (
                          <div
                            key={card.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {card.title}
                              </span>
                              {card.status && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                                  {card.status}
                                </span>
                              )}
                            </div>

                            {card.subtitle && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {card.subtitle}
                              </p>
                            )}

                            {card.location && (
                              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-blue-500" />
                                <span>Location: {card.location}</span>
                              </div>
                            )}

                            {card.financials && (
                              <div className="space-y-1 py-1 border-t border-slate-100 dark:border-slate-800">
                                {card.financials.map((fin, idx) => (
                                  <div key={idx} className="flex justify-between text-xs font-mono font-bold">
                                    <span className="text-slate-500">{fin.label}:</span>
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                      {fin.amount.toLocaleString()} {fin.currency}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {card.missingItems && card.missingItems.length > 0 && (
                              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                                <span className="font-bold">Missing Compliance Items:</span>
                                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                                  {card.missingItems.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {card.actions && card.actions.length > 0 && (
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                                {card.actions.map((act, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleCardAction(act.action, act.params)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                      act.variant === 'primary'
                                        ? 'bg-blue-900 text-white hover:bg-blue-950'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                  >
                                    {act.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Assistant Message Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px]">
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                        {msg.invariancePassed && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Invariance Verified</span>
                          </span>
                        )}
                        {msg.engineUsed && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {msg.engineUsed.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRegenerate(msg.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          title="Regenerate this response"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Stage & Stop Generation Indicator */}
          {loading && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 max-w-md shadow-md">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>{loadingStage}</span>
              </div>
              <button
                type="button"
                onClick={handleStopGeneration}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800 transition-all cursor-pointer shadow-2xs"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================================================================== */}
        {/* 3. BOTTOM INPUT CONSOLE & FAST ACTIONS                             */}
        {/* ================================================================== */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 space-y-2.5">
          {/* Quick Action Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Bot className="w-3 h-3 text-blue-500" />
              Quick:
            </span>
            {quickActionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200/60 dark:border-slate-700 transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Attachments Preview Chips */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 font-bold"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-0.5 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Form with Multi-line Expansion */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-end gap-2"
          >
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.docx,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Attach PDF, Excel, Word, or Image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Expanding Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={loading}
                rows={1}
                placeholder={
                  mode === 'WORK'
                    ? 'Work Mode: "Generate complete PDF for NSA648", "Write WhatsApp message", "Update status"...'
                    : 'Ask Mode: "Containers at Bandar Abbas", "Overdue invoices", "Missing documents"...'
                }
                className="w-full min-h-[44px] max-h-32 p-3 pr-10 text-xs sm:text-sm font-medium rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              />

              {inputPrompt.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputPrompt('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || (!inputPrompt.trim() && attachments.length === 0)}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
              <span className="hidden md:inline text-[10px] opacity-75 font-mono">↵</span>
            </button>
          </form>

          {/* Footer Telemetry & Trust Disclaimer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Grounded in Live Databases • Never Hallucinates Balances, Dates, or Rates</span>
            </span>
            <span className="hidden sm:inline font-mono">
              Provider: {engine.toUpperCase()} · Mode: {mode}
            </span>
          </div>
        </div>
      </main>

      {/* AI Settings Modal */}
      <AISettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onConfigUpdated={(cfg) => {
          setEngine(cfg.provider as any)
          toast.success(`Active provider updated to ${cfg.provider}`)
        }}
      />
    </div>
  )
}
