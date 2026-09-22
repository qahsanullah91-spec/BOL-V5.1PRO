const PYTHON_API_BASE_URL =
  process.env.NEXT_PUBLIC_PYTHON_API_BASE_URL ||
  process.env.PYTHON_API_BASE_URL ||
  "http://127.0.0.1:8000"

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: any
  query?: Record<string, string | number | boolean | null | undefined>
}

export class PythonApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "PythonApiError"
    this.status = status
  }
}

function buildUrl(path: string, query?: ApiOptions["query"]) {
  const url = new URL(path.startsWith("http") ? path : `${PYTHON_API_BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

export async function pythonApi<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { query, headers, body, ...init } = options
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: body instanceof FormData ? headers : { "Content-Type": "application/json", ...headers },
    body: body && !(body instanceof FormData) && typeof body !== "string" ? JSON.stringify(body) : body,
  })

  const contentType = response.headers.get("content-type") || ""
  const data = contentType.includes("application/json") ? await response.json() : await response.text()

  if (!response.ok) {
    throw new PythonApiError(typeof data === "string" ? data : data?.detail || data?.error || "Python API request failed", response.status)
  }

  return data as T
}

export const pythonBackend = {
  health: () => pythonApi("/api/health"),
  auth: {
    login: (username: string, password: string) => pythonApi("/api/auth/login", { method: "POST", body: { username, password } }),
    logout: () => pythonApi("/api/auth/logout", { method: "POST" }),
    me: () => pythonApi("/api/auth/me"),
    changePassword: (payload: any) => pythonApi("/api/auth/change-password", { method: "POST", body: payload }),
  },
  users: {
    list: () => pythonApi("/api/users"),
    create: (payload: any) => pythonApi("/api/users", { method: "POST", body: payload }),
    update: (id: string, payload: any) => pythonApi(`/api/users/${id}`, { method: "PUT", body: payload }),
    delete: (id: string) => pythonApi(`/api/users/${id}`, { method: "DELETE" }),
  },
  invoices: {
    list: (q?: string) => pythonApi("/api/invoices", { query: { q } }),
    get: (id: string) => pythonApi(`/api/invoices/${id}`),
    save: (payload: any) => pythonApi("/api/invoices", { method: "POST", body: payload }),
    update: (id: string, payload: any) => pythonApi(`/api/invoices/${id}`, { method: "PUT", body: payload }),
    delete: (id: string) => pythonApi(`/api/invoices/${id}`, { method: "DELETE" }),
    nextNumber: () => pythonApi("/api/invoices/tools/next-number"),
  },
  billOfLading: {
    list: (q?: string) => pythonApi("/api/bill-of-lading", { query: { q } }),
    get: (id: string) => pythonApi(`/api/bill-of-lading/${id}`),
    save: (payload: any) => pythonApi("/api/bill-of-lading", { method: "POST", body: payload }),
    update: (id: string, payload: any) => pythonApi(`/api/bill-of-lading/${id}`, { method: "PUT", body: payload }),
    delete: (id: string) => pythonApi(`/api/bill-of-lading/${id}`, { method: "DELETE" }),
    nextNumber: () => pythonApi("/api/bill-of-lading/tools/next-number"),
  },
  importAccounts: {
    list: (q?: string) => pythonApi("/api/import-accounts", { query: { q } }),
    save: (payload: any) => pythonApi("/api/import-accounts", { method: "POST", body: payload }),
  },
  exportAccounts: {
    list: (q?: string) => pythonApi("/api/export-accounts", { query: { q } }),
    save: (payload: any) => pythonApi("/api/export-accounts", { method: "POST", body: payload }),
  },
  ledgerEntries: {
    list: (q?: string) => pythonApi("/api/ledger-entries", { query: { q } }),
    byAccount: (accountId: string, accountType?: string) => pythonApi(`/api/ledger-entries/account/${accountId}/entries`, { query: { account_type: accountType } }),
    save: (payload: any) => pythonApi("/api/ledger-entries", { method: "POST", body: payload }),
    update: (id: string, payload: any) => pythonApi(`/api/ledger-entries/${id}`, { method: "PUT", body: payload }),
    delete: (id: string) => pythonApi(`/api/ledger-entries/${id}`, { method: "DELETE" }),
  },
  trucks: {
    list: (q?: string) => pythonApi("/api/trucks", { query: { q } }),
    save: (payload: any) => pythonApi("/api/trucks", { method: "POST", body: payload }),
  },
  settings: {
    list: () => pythonApi("/api/settings"),
    save: (payload: any) => pythonApi("/api/settings", { method: "POST", body: payload }),
    app: {
      list: () => pythonApi("/api/app-settings"),
      save: (payload: any) => pythonApi("/api/app-settings", { method: "POST", body: payload }),
    },
    company: {
      list: () => pythonApi("/api/company-settings"),
      save: (payload: any) => pythonApi("/api/company-settings", { method: "POST", body: payload }),
    },
  },
  media: {
    list: (query?: Record<string, string>) => pythonApi("/api/media", { query }),
    fileUrl: (id: string) => buildUrl(`/api/media/${id}/file`),
    downloadUrl: (id: string) => buildUrl(`/api/media/${id}/download`),
    upload: (file: File, metadata: Record<string, string> = {}) => {
      const formData = new FormData()
      formData.append("file", file)
      Object.entries(metadata).forEach(([key, value]) => formData.append(key, value))
      return pythonApi("/api/upload", { method: "POST", body: formData })
    },
    update: (id: string, payload: any) => pythonApi(`/api/media/${id}`, { method: "PUT", body: payload }),
    delete: (id: string, permanent = false) => pythonApi(`/api/media/${id}`, { method: "DELETE", query: { permanent } }),
  },
  pdf: {
    upload: (file: File, metadata: Record<string, string> = {}) => {
      const formData = new FormData()
      formData.append("file", file)
      Object.entries(metadata).forEach(([key, value]) => formData.append(key, value))
      return pythonApi("/api/pdf/upload", { method: "POST", body: formData })
    },
    previewUrl: (documentId: string) => buildUrl("/api/pdf/preview", { document_id: documentId }),
    delete: (documentId: string, permanent = false) => pythonApi(`/api/pdf/${documentId}`, { method: "DELETE", query: { permanent } }),
  },
  excel: {
    import: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return pythonApi("/api/excel/import", { method: "POST", body: formData })
    },
    export: (rows: any[], filename = "sky-logistics-export.xlsx") => pythonApi("/api/excel/export", { method: "POST", body: { rows, filename } }),
  },
  backup: {
    exportUrl: () => buildUrl("/api/backup/export"),
    restore: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return pythonApi("/api/backup/restore", { method: "POST", body: formData })
    },
  },
  reports: {
    summary: () => pythonApi("/api/reports/summary"),
    monthly: () => pythonApi("/api/reports/monthly"),
    customer: (q?: string) => pythonApi("/api/reports/customer", { query: { q } }),
    shipper: (q?: string) => pythonApi("/api/reports/shipper", { query: { q } }),
    container: (q?: string) => pythonApi("/api/reports/container", { query: { q } }),
    detentionDemurrage: () => pythonApi("/api/reports/detention-demurrage"),
  },
  search: (q: string) => pythonApi("/api/search", { query: { q } }),
}
