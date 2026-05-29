"use client"

import { BottomNav } from "@/components/BottomNav"
import { GROUPS } from "@/lib/mock-data"
import { GroupTable } from "@/components/GroupTable"
import { Trophy } from "lucide-react"

export default function GroupsPage() {
  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
                <Trophy size={14} /> Group stage
              </div>
              <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">Group Picks</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Choose two qualifiers from each group. Clean cards, real flags, and no fake leaderboard names.
              </p>
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm font-bold text-muted-foreground">
              Picks save on this device for now
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map((group) => (
            <GroupTable key={group.id} group={group} />
          ))}
        </div>
      </section>
      <BottomNav />
    </main>
  )
}
