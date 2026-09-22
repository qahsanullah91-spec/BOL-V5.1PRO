"use client"

import { useState, useCallback } from 'react'
import { Plus, Trash2, Building2, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { useApp } from '@/lib/app-context'

export function AccountsView() {
  const { accounts, addAccount, deleteAccount, selectAccount } = useApp()
  const [newAccountName, setNewAccountName] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleAddAccount = useCallback(() => {
    if (newAccountName.trim()) {
      addAccount(newAccountName.trim())
      setNewAccountName('')
      setIsOpen(false)
    }
  }, [newAccountName, addAccount])

  const openDialog = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsOpen(false)
    setNewAccountName('')
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Accounts</h2>
          <p className="text-muted-foreground mt-1">Manage your business accounts and companies</p>
        </div>
        <Button 
          type="button"
          onClick={openDialog} 
          className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-strong sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Account Name</label>
              <Input
                placeholder="Enter account name..."
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAccount()
                  }
                }}
                className="bg-white/50 border-white/30 focus:border-primary"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="bg-white/30" onClick={closeDialog}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleAddAccount} disabled={!newAccountName.trim()}>
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {accounts.length === 0 ? (
        <Card className="glass border-2 border-dashed border-primary/30 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-20 relative">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-6 rounded-full bg-primary/10 mb-6">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Welcome to SKY ARIANA</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                Get started by creating your first account. Each account can contain multiple companies with their own ledgers and invoices.
              </p>
              <Button 
                type="button"
                onClick={openDialog} 
                size="lg"
                className="gap-2 shadow-lg shadow-primary/25"
              >
                <Sparkles className="h-5 w-5" />
                Add Your First Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map(account => (
            <Card
              key={account.id}
              className="glass hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer group border-white/40 hover:border-primary/30"
              onClick={() => selectAccount(account)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {account.name}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                  onClick={e => {
                    e.stopPropagation()
                    deleteAccount(account.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.companies.length} {account.companies.length === 1 ? 'company' : 'companies'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
