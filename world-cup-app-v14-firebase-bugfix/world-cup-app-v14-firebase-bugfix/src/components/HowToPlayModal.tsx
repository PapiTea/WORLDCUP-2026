"use client"

import { X } from "lucide-react"

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-headline text-2xl font-black">How To Play</h2>
          <button onClick={onClose} className="rounded-full bg-muted p-2">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>1. Pick the two teams you think will finish highest in each group.</p>
          <p>2. Choose your World Cup winner before the tournament starts.</p>
          <p>3. Predict the score for every match before kick-off.</p>
          <p>4. Use your 3 Confidence Picks carefully — these double your points.</p>
          <p>5. Match predictions lock automatically at kick-off.</p>
          <p>6. Group picks and winner picks lock when the World Cup starts.</p>
          <p>7. Follow the leaderboard as results are added.</p>
        </div>
      </div>
    </div>
  )
}
