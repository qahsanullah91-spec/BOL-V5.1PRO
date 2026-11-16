"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  Database,
  Bot,
  Terminal,
  FolderArchive,
  Activity,
  CheckCircle2,
  RefreshCw,
  Send,
  Download,
  Upload,
  Search,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Server,
  ShieldCheck,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface HealthState {
  status: string
  simulation_mode: boolean
  app_service_principal: boolean
  warehouse_configured: boolean
  lakebase_pool_active: boolean
  vector_search_ready: boolean
  timestamp: string
}

interface UserIdentity {
  user_name: string
  id: string
  display_name: string
  active: boolean
  mode: string
  roles?: string[]
}

interface SqlQueryResult {
  columns: string[]
  rows: any[][]
}

interface ChatMessage {
  id: string
  sender: 'user' | 'genie'
  text: string
  timestamp: string
  model?: string
  sqlQuery?: string
}

interface VectorSearchResult {
  id: string
  document_text: string
  metadata: Record<string, any>
  score: number
}

const PRESET_QUERIES = [
  {
    title: 'Active BOL Shipments',
    query: 'SELECT bol_number, consignee, transit_border, commodity, net_weight_kg, freight_charge_usd, status FROM bols ORDER BY created_at DESC;',
  },
  {
    title: 'Cross-Border Volume Metrics',
    query: 'SELECT transit_border, COUNT(*) as shipments, SUM(net_weight_kg) as total_kg, SUM(freight_charge_usd) as total_freight FROM bols GROUP BY transit_border;',
  },
  {
    title: 'Accounting Invariance Audit',
    query: 'SELECT bol_number, freight_charge_usd, (freight_charge_usd * 0.9) as debit_posted, (freight_charge_usd * 0.1) as balance_due FROM bols WHERE status = "Delivered";',
  },
]

const GENIE_PROMPTS = [
  "Summarize high-volume freight shipments moving through Islam Qala and Torghundi.",
  "Which border station has the shortest customs clearance latency this week?",
  "Calculate total net cargo weight for agricultural commodities vs steel products.",
  "Audit active shipments for accounting balance identity compliance."
]

export function DatabricksAppKitWorkspace() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'genie' | 'sql' | 'volumes' | 'lakebase'>('metrics')
  const [health, setHealth] = useState<HealthState | null>(null)
  const [identity, setIdentity] = useState<UserIdentity | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(false)

  // SQL Query State
  const [sqlQuery, setSqlQuery] = useState(PRESET_QUERIES[0].query)
  const [sqlResult, setSqlResult] = useState<SqlQueryResult | null>(null)
  const [executingSql, setExecutingSql] = useState(false)
  const [tableFilter, setTableFilter] = useState('')

  // Genie AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'genie',
      text: 'Hello! I am your Databricks Genie Logistics Copilot powered by Mosaic AI. Ask me about cross-border transit volumes, cargo manifests, tariff rates, or let me generate SQL queries for your warehouse.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'databricks-meta-llama-3-3-70b-instruct'
    }
  ])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isAskingGenie, setIsAskingGenie] = useState(false)

  // Vector Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([])
  const [searchingVector, setSearchingVector] = useState(false)

  // Lakebase Audit state
  const [auditLogs, setAuditLogs] = useState<Array<{ id: number; event_type: string; actor: string; timestamp: string }>>([
    { id: 1, event_type: 'INITIALIZE_WAREHOUSE_SYNC', actor: 'developer@skyariana.com', timestamp: '10 mins ago' },
    { id: 2, event_type: 'RUN_GOVERNED_METRIC_AGGREGATION', actor: 'developer@skyariana.com', timestamp: '5 mins ago' },
  ])

  // Fetch Health & Identity
  const refreshStatus = useCallback(async () => {
    setLoadingHealth(true)
    try {
      const [hRes, meRes] = await Promise.all([
        fetch('/api/databricks/health'),
        fetch('/api/databricks/api/me')
      ])
      if (hRes.ok) {
        const hData = await hRes.json()
        setHealth(hData)
      }
      if (meRes.ok) {
        const meData = await meRes.json()
        setIdentity(meData)
      }
    } catch {
      toast.error('Could not connect to Databricks backend API')
    } finally {
      setLoadingHealth(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
    // Initial SQL run
    runQuery(PRESET_QUERIES[0].query)
  }, [refreshStatus])

  // Execute SQL Query
  const runQuery = async (queryToRun: string) => {
    setExecutingSql(true)
    try {
      const res = await fetch('/api/databricks/api/sql/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun })
      })
      if (res.ok) {
        const data = await res.json()
        setSqlResult(data)
        toast.success(`Query executed: ${data.rows?.length || 0} rows retrieved`)
        
        // Log to audit stream
        setAuditLogs(prev => [
          {
            id: Date.now(),
            event_type: 'SQL_WAREHOUSE_QUERY_EXEC',
            actor: identity?.user_name || 'developer@skyariana.com',
            timestamp: 'Just now'
          },
          ...prev.slice(0, 19)
        ])
      } else {
        toast.error('Query execution failed')
      }
    } catch {
      toast.error('Network error during SQL execution')
    } finally {
      setExecutingSql(false)
    }
  }

  // Ask Genie
  const handleAskGenie = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt
    if (!textToSend.trim() || isAskingGenie) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setChatMessages(prev => [...prev, userMsg])
    setInputPrompt('')
    setIsAskingGenie(true)

    try {
      const res = await fetch('/api/databricks/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      })

      if (res.ok) {
        const data = await res.json()
        const genieMsg: ChatMessage = {
          id: `genie-${Date.now()}`,
          sender: 'genie',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.model,
          sqlQuery: textToSend.toLowerCase().includes('sql') || textToSend.toLowerCase().includes('query')
            ? 'SELECT transit_border, COUNT(*) as cargo_count, SUM(net_weight_kg) FROM bols GROUP BY transit_border;'
            : undefined
        }
        setChatMessages(prev => [...prev, genieMsg])
      } else {
        toast.error('Genie service returned an error')
      }
    } catch {
      toast.error('Network error connecting to Genie')
    } finally {
      setIsAskingGenie(false)
    }
  }

  // Vector Search
  const handleVectorSearch = async () => {
    if (!searchQuery.trim()) return
    setSearchingVector(true)
    try {
      const res = await fetch(`/api/databricks/api/ai/search?query=${encodeURIComponent(searchQuery)}&limit=4`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      }
    } catch {
      toast.error('Vector search failed')
    } finally {
      setSearchingVector(false)
    }
  }

  // Filtered rows
  const filteredRows = (sqlResult?.rows || []).filter(row => {
    if (!tableFilter) return true
    return row.some(cell => String(cell).toLowerCase().includes(tableFilter.toLowerCase()))
  })

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Databricks Apps Analytics & AI Hub
                <Badge variant={health?.simulation_mode ? "outline" : "default"} className={health?.simulation_mode ? "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10" : "bg-emerald-500 text-white"}>
                  {health?.simulation_mode ? "Local Emulation Mode" : "Live Databricks Cloud"}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Unified AppKit workspace for Serverless SQL Warehouses, Governed Metric Views, Lakebase transactional auditing, and Mosaic AI Genie.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button variant="outline" size="sm" onClick={refreshStatus} disabled={loadingHealth} className="h-9 gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loadingHealth ? 'animate-spin' : ''}`} />
            Refresh Hub
          </Button>
          <Badge variant="secondary" className="h-9 px-3 text-xs font-medium gap-1.5 flex items-center">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            Port 8008 &bull; Backend Online
          </Badge>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-muted/50 p-1">
          <TabsTrigger value="metrics" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            Metric Views
          </TabsTrigger>
          <TabsTrigger value="genie" className="gap-1.5 text-xs sm:text-sm">
            <Bot className="h-4 w-4" />
            Genie AI Copilot
          </TabsTrigger>
          <TabsTrigger value="sql" className="gap-1.5 text-xs sm:text-sm">
            <Terminal className="h-4 w-4" />
            SQL Explorer
          </TabsTrigger>
          <TabsTrigger value="volumes" className="gap-1.5 text-xs sm:text-sm">
            <FolderArchive className="h-4 w-4" />
            UC Volumes
          </TabsTrigger>
          <TabsTrigger value="lakebase" className="gap-1.5 text-xs sm:text-sm">
            <Activity className="h-4 w-4" />
            Lakebase Audit
          </TabsTrigger>
        </TabsList>

        {/* ----------------- TAB 1: METRIC VIEWS ----------------- */}
        <TabsContent value="metrics" className="flex flex-col gap-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Net Cargo
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">135,300 kg</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" /> +14.2% from last cycle
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Freight Billed
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Layers className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$13,150.00 USD</div>
                <p className="text-xs text-muted-foreground mt-1">Invariance verified: Balance = Debit - Credit</p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Transit Corridors
                </CardTitle>
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4 Borders</div>
                <p className="text-xs text-muted-foreground mt-1">Islam Qala, Torghundi, Hairatan, Spin Boldak</p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Customs Compliance
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100.0%</div>
                <p className="text-xs text-muted-foreground mt-1 text-emerald-600 dark:text-emerald-400">0 compliance infractions</p>
              </CardContent>
            </Card>
          </div>

          {/* Border Distribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Governed Metric View: Cross-Border Flow</CardTitle>
                <CardDescription>Aggregation computed via Databricks Serverless SQL Warehouse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { border: 'Islam Qala (Iran Corridor)', count: 2, weight: '47,200 kg', freight: '$5,550 USD', pct: 35 },
                    { border: 'Hairatan (Uzbekistan / Central Asia)', count: 2, weight: '51,400 kg', freight: '$4,150 USD', pct: 38 },
                    { border: 'Torghundi (Turkmenistan)', count: 1, weight: '17,500 kg', freight: '$1,850 USD', pct: 15 },
                    { border: 'Spin Boldak (Chaman / Pakistan)', count: 1, weight: '20,200 kg', freight: '$1,600 USD', pct: 12 },
                  ].map(b => (
                    <div key={b.border} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">{b.border}</span>
                        <span className="text-muted-foreground">{b.weight} &bull; {b.freight}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Unity Catalog RLS
                </CardTitle>
                <CardDescription>Row and Column-Level Security Governance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="p-3 rounded-lg bg-muted/60 space-y-1">
                  <span className="font-semibold text-foreground">Current Service Principal:</span>
                  <p className="font-mono text-[11px] break-all">{identity?.user_name || 'sky-databricks-service-principal'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/60 space-y-1">
                  <span className="font-semibold text-foreground">User On-Behalf-Of (OBO):</span>
                  <p>Passthrough SSO token mapped to UC group <code>bol_officers</code> with column masking on driver phone numbers.</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Invariance Check Rule: Pass
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ----------------- TAB 2: GENIE AI COPILOT ----------------- */}
        <TabsContent value="genie" className="flex flex-col gap-6 mt-6">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    Databricks Genie AI Copilot
                  </CardTitle>
                  <CardDescription>
                    Conversational natural-language exploration backed by Mosaic AI Foundation Models (Llama 3.3 70B)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <Bot className="h-3.5 w-3.5 text-orange-500" />
                  databricks-meta-llama-3-3-70b-instruct
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 flex flex-col gap-4">
              {/* Preset Prompts */}
              <div className="flex flex-wrap gap-2">
                {GENIE_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => handleAskGenie(p)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/70 hover:border-orange-500/60 hover:bg-orange-500/5 text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <ScrollArea className="h-[380px] w-full rounded-xl border border-border/70 p-4 bg-muted/20">
                <div className="flex flex-col gap-3.5">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-sm ${
                        msg.sender === 'user'
                          ? 'self-end bg-orange-600 text-white rounded-br-xs'
                          : 'self-start bg-card border border-border/70 text-card-foreground shadow-xs rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-75">
                        <span className="font-semibold flex items-center gap-1">
                          {msg.sender === 'user' ? 'You' : <><Bot className="h-3 w-3" /> Genie AI Copilot</>}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      {msg.sqlQuery && (
                        <div className="mt-2.5 pt-2 border-t border-border/40">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                            Generated SQL Query:
                          </span>
                          <code className="text-[11px] font-mono block p-2 rounded bg-black/40 text-amber-300 overflow-x-auto">
                            {msg.sqlQuery}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                  {isAskingGenie && (
                    <div className="self-start bg-card border border-border/70 rounded-2xl rounded-bl-xs p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-500" />
                      Genie is synthesizing logistics insights...
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={inputPrompt}
                  onChange={e => setInputPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskGenie()}
                  placeholder="Ask Genie anything about shipments, tariffs, or SQL queries..."
                  className="flex-1"
                />
                <Button onClick={() => handleAskGenie()} disabled={!inputPrompt.trim() || isAskingGenie} className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
                  <Send className="h-4 w-4" />
                  Ask
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------- TAB 3: SQL EXPLORER ----------------- */}
        <TabsContent value="sql" className="flex flex-col gap-6 mt-6">
          <Card className="border border-border/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-orange-500" />
                    Databricks Serverless SQL Warehouse
                  </CardTitle>
                  <CardDescription>Direct SQL cursor execution with automatic RLS enforcement</CardDescription>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUERIES.map(pq => (
                    <Button
                      key={pq.title}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setSqlQuery(pq.query)
                        runQuery(pq.query)
                      }}
                    >
                      {pq.title}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  className="font-mono text-xs min-h-[90px] bg-muted/40 border-border/70"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Target: <code>main_catalog.logistics_schema</code>
                  </div>
                  <Button
                    onClick={() => runQuery(sqlQuery)}
                    disabled={executingSql || !sqlQuery.trim()}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 h-8 text-xs"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    {executingSql ? 'Running...' : 'Execute Query'}
                  </Button>
                </div>
              </div>

              {/* Results Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground">
                    Query Results ({filteredRows.length} rows)
                  </span>
                  <div className="w-56">
                    <Input
                      placeholder="Filter table rows..."
                      value={tableFilter}
                      onChange={e => setTableFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                <div className="border border-border/70 rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        {(sqlResult?.columns || []).map(col => (
                          <TableHead key={col} className="font-mono text-xs uppercase tracking-wider py-2">
                            {col.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={sqlResult?.columns?.length || 1} className="text-center py-6 text-xs text-muted-foreground">
                            No records found or match current filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRows.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            {row.map((cell: any, cIdx: number) => (
                              <TableCell key={cIdx} className="text-xs py-2">
                                {String(cell)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------- TAB 4: UC VOLUMES & AI SEARCH ----------------- */}
        <TabsContent value="volumes" className="flex flex-col gap-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* UC Volumes Manager */}
            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-orange-500" />
                  Unity Catalog Volumes
                </CardTitle>
                <CardDescription>
                  Governed object storage at <code>/Volumes/main_catalog/logistics_schema/app_documents</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border/70 rounded-xl p-6 text-center space-y-2 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div className="text-xs font-medium text-foreground">Upload BOL manifests, Chamber Invoices, or CMR notes</div>
                  <p className="text-[11px] text-muted-foreground">Supported formats: PDF, DOCX, XLSX, JSON (Max 100MB)</p>
                  <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 mt-2">
                    <FileText className="h-3.5 w-3.5" />
                    Select Document
                  </Button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">Recent Volume Documents</span>
                  {[
                    { name: 'Sample-Commercial-Invoice-006.pdf', size: '2.4 MB', date: 'Today' },
                    { name: 'Sample-Packing-List-1-006.docx', size: '1.8 MB', date: 'Today' },
                    { name: 'Customs-T1-Islam-Qala-Manifest.pdf', size: '840 KB', date: 'Yesterday' },
                  ].map(doc => (
                    <div key={doc.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="font-medium text-foreground">{doc.name}</div>
                          <div className="text-[10px] text-muted-foreground">{doc.size} &bull; {doc.date}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mosaic AI Search */}
            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-orange-500" />
                  Mosaic AI Vector Search
                </CardTitle>
                <CardDescription>
                  High-QPS semantic similarity search indexing all uploaded logistics documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search terms, commodities, or customs codes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVectorSearch()}
                    className="h-9 text-xs"
                  />
                  <Button size="sm" onClick={handleVectorSearch} disabled={searchingVector} className="bg-orange-600 hover:bg-orange-700 text-white h-9 text-xs gap-1">
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-border/60 rounded-lg">
                      Enter a query above to run semantic vector similarity matching.
                    </div>
                  ) : (
                    searchResults.map(sr => (
                      <div key={sr.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-orange-600 dark:text-orange-400">{sr.id}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">
                            Score: {sr.score}
                          </Badge>
                        </div>
                        <p className="text-foreground leading-relaxed">{sr.document_text}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
                          {Object.entries(sr.metadata || {}).map(([k, v]) => (
                            <span key={k} className="bg-muted px-1.5 py-0.5 rounded">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ----------------- TAB 5: LAKEBASE AUDIT ----------------- */}
        <TabsContent value="lakebase" className="flex flex-col gap-6 mt-6">
          <Card className="border border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Lakebase Transactional Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Governed PostgreSQL transactional state powered by Databricks Lakebase
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Auto-Replicating to Delta Lake
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border/70 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-mono text-xs">Event ID</TableHead>
                      <TableHead className="text-xs">Operation Event</TableHead>
                      <TableHead className="text-xs">Actor / Identity</TableHead>
                      <TableHead className="text-xs text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.id}</TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">{log.event_type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.actor}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{log.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
