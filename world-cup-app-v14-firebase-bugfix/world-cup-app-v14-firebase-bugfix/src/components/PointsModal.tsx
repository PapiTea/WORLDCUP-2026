"use client"

import { X } from "lucide-react"

export function PointsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-headline text-2xl font-black">Points System</h2>
          <button onClick={onClose} className="rounded-full bg-muted p-2">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm font-bold text-muted-foreground">
          <div className="flex justify-between rounded-2xl bg-muted/50 p-3">
            <span>Correct result</span>
            <span>+2</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-muted/50 p-3">
            <span>Exact score</span>
            <span>+5</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-muted/50 p-3">
            <span>Correct group qualifier</span>
            <span>+3</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-muted/50 p-3">
            <span>Confidence pick correct</span>
            <span>x2</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-muted/50 p-3">
            <span>Confidence pick wrong</span>
            <span>-5</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-muted/50 p-3">
            <span>World Cup winner</span>
            <span>+50</span>
          </div>
        </div>
      </div>
    </div>
  )
}
