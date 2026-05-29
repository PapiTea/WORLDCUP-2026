"use client"

import { useEffect, useRef, useState } from "react"
import { Group } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TeamFlag } from "@/components/TeamFlag"
import { Check, Lock } from "lucide-react"
import { useAuth } from "@/components/AuthGate"
import {
  saveGroupPrediction,
  subscribeUserGroupPredictions,
} from "@/lib/firebase-service"

interface GroupTableProps {
  group: Group
  locked?: boolean
}

export function GroupTable({ group, locked = false }: GroupTableProps) {
  const { user } = useAuth()
  const storageKey = `wc-group-picks-${group.id}`
  const [selected, setSelected] = useState<string[]>([])
  const selectedRef = useRef<string[]>([])

  const updateSelected = (next: string[]) => {
    selectedRef.current = next
    setSelected(next)
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) updateSelected(parsed)
      } catch {}
    }

    if (!user) return

    const unsub = subscribeUserGroupPredictions(user.uid, (items) => {
      const remote = items[group.id]

      if (!remote) return

      const current = selectedRef.current

      if (JSON.stringify(remote) !== JSON.stringify(current)) {
        updateSelected(remote)
        window.localStorage.setItem(storageKey, JSON.stringify(remote))
      }
    })

    return () => unsub()
  }, [storageKey, user, group.id])

  const persistSelected = async (next: string[]) => {
    if (locked) return

    updateSelected(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))

    if (user) {
      await saveGroupPrediction(user.uid, group.id, next)
    }
  }

  const toggleTeam = (teamId: string) => {
    if (locked) return

    const current = selectedRef.current
    let next: string[]

    if (current.includes(teamId)) {
      next = current.filter((id) => id !== teamId)
    } else if (current.length >= 2) {
      next = [current[1], teamId]
    } else {
      next = [...current, teamId]
    }

    void persistSelected(next)
  }

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-3xl border border-white/10 bg-card/70 p-5 shadow-xl backdrop-blur",
        locked && "opacity-85"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Group {group.id}
          </p>
          <h3 className="mt-1 font-headline text-xl font-bold">
            {group.name}
          </h3>
        </div>

        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-black",
            locked
              ? "bg-destructive/10 text-destructive"
              : selected.length === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          {locked ? "Locked" : `${selected.length}/2 picked`}
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {locked
          ? "Group qualifier picks are locked because the World Cup has started."
          : "Tap two teams you think will qualify."}
      </p>

      <div className="space-y-2.5">
        {group.teams.map((team) => {
          const isPicked = selected.includes(team.id)
          const pickNumber = selected.indexOf(team.id) + 1

          return (
            <button
              type="button"
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              disabled={locked}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all",
                locked && "cursor-not-allowed",
                isPicked
                  ? "border-primary bg-primary/15 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                  : locked
                    ? "border-border bg-background/25"
                    : "border-border bg-background/45 hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <TeamFlag team={team} className="h-7 w-10" />
                <div className="min-w-0">
                  <div className="truncate font-bold leading-tight">
                    {team.name}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {team.code}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                  isPicked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {locked && !isPicked ? (
                  <Lock size={13} />
                ) : isPicked ? (
                  pickNumber === 1 ? "1" : "2"
                ) : (
                  <Check size={13} className="opacity-0 group-hover:opacity-60" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
        {locked
          ? "Selections are final and can no longer be changed."
          : selected.length === 2
            ? "Saved ✓ You can still change this before lock time."
            : "Your picks save automatically."}
      </div>
    </Card>
  )
}
