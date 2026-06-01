"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { subscribeGlobalMessage } from "@/lib/firebase-service"

export function GlobalMessagePopup() {
  const [message, setMessage] = useState("")
  const [dismissedMessage, setDismissedMessage] = useState("")

  useEffect(() => {
    const unsub = subscribeGlobalMessage((nextMessage) => {
      setMessage(nextMessage)
    })

    return () => unsub()
  }, [])

  if (!message || dismissedMessage === message) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
              Admin Message
            </p>
            <h2 className="font-headline text-2xl font-black">
              Quick update
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setDismissedMessage(message)}
            className="rounded-full bg-muted p-2"
          >
            <X size={18} />
          </button>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        <Button
          className="mt-6 h-12 w-full rounded-2xl font-black"
          onClick={() => setDismissedMessage(message)}
        >
          Got it!
        </Button>
      </div>
    </div>
  )
}
