"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Printer, X } from "lucide-react"

export type PrintQuality = "draft" | "standard" | "high-quality"

export interface PrintOptions {
  copies: number
  quality: PrintQuality
  includeColorStrip: boolean
  fitToPage: boolean
}

interface PrintOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrint: (options: PrintOptions) => Promise<void>
  isPrinting?: boolean
}

export function PrintOptionsDialog({
  open,
  onOpenChange,
  onPrint,
  isPrinting = false,
}: PrintOptionsDialogProps) {
  const [copies, setCopies] = useState(1)
  const [quality, setQuality] = useState<PrintQuality>("standard")
  const [includeColorStrip, setIncludeColorStrip] = useState(true)
  const [fitToPage, setFitToPage] = useState(true)

  const handlePrint = async () => {
    await onPrint({
      copies,
      quality,
      includeColorStrip,
      fitToPage,
    })
    onOpenChange(false)
  }

  const handleCopiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
    setCopies(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-600" />
            Print Options
          </DialogTitle>
          <DialogDescription>
            Customize your print settings before printing the BOL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Copies Section */}
          <div className="space-y-3">
            <Label htmlFor="copies" className="font-semibold text-gray-700">
              Number of Copies
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="copies"
                type="number"
                min="1"
                max="99"
                value={copies}
                onChange={handleCopiesChange}
                className="h-10 w-20 border-blue-200 text-center"
              />
              <span className="text-sm text-gray-600">
                {copies === 1 ? "copy" : "copies"}
              </span>
            </div>
          </div>

          {/* Quality Section */}
          <div className="space-y-3">
            <Label className="font-semibold text-gray-700">Print Quality</Label>
            <RadioGroup value={quality} onValueChange={(v) => setQuality(v as PrintQuality)}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft" className="font-normal cursor-pointer">
                    <span className="font-medium">Draft</span>
                    <span className="text-sm text-gray-600 ml-2">Faster, lower quality</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="font-normal cursor-pointer">
                    <span className="font-medium">Standard</span>
                    <span className="text-sm text-gray-600 ml-2">Balanced quality & speed</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high-quality" id="high-quality" />
                  <Label htmlFor="high-quality" className="font-normal cursor-pointer">
                    <span className="font-medium">High Quality</span>
                    <span className="text-sm text-gray-600 ml-2">Premium output</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Options */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fitToPage"
                  checked={fitToPage}
                  onChange={(e) => setFitToPage(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <Label htmlFor="fitToPage" className="font-normal cursor-pointer text-sm">
                  Fit to page width
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="colorStrip"
                  checked={includeColorStrip}
                  onChange={(e) => setIncludeColorStrip(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <Label htmlFor="colorStrip" className="font-normal cursor-pointer text-sm">
                  Include color header (uses more ink)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPrinting}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? "Printing..." : "Print"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
