"use client"

import { BottomNav } from "@/components/BottomNav"
import { GROUPS } from "@/lib/mock-data"
import { GroupTable } from "@/components/GroupTable"
import { Trophy, Lock, Clock } from "lucide-react"

const GROUP_PICKS_LOCK_TIME = new Date("2026-06-11T19:00:00Z")

export default function GroupsPage() {
  const groupPicksLocked = new Date() >= GROUP_PICKS_LOCK_TIME

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
                <Trophy size={14} /> Group stage
              </div>

              <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">
                Group Picks
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
Choose the two teams you think will finish highest in each group.
The best third-placed teams will be added to the knockout stage by the admin once confirmed. Group picks lock when the World Cup starts and cannot be changed afterwards.
              </p>
            </div>

            <div
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                groupPicksLocked
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                {groupPicksLocked ? <Lock size={16} /> : <Clock size={16} />}
                {groupPicksLocked
                  ? "Group picks are locked"
                  : "Locks Thu 11 Jun 2026, 20:00 UK"}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`mb-6 rounded-[1.5rem] border p-4 text-sm font-bold ${
            groupPicksLocked
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {groupPicksLocked
            ? "Group qualifier selections are now locked because the World Cup has started."
            : "You can change your group qualifier picks until the opening match kicks off on Thu 11 June 2026 at 20:00 UK time."}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map((group) => (
            <GroupTable
              key={group.id}
              group={group}
              locked={groupPicksLocked}
            />
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
