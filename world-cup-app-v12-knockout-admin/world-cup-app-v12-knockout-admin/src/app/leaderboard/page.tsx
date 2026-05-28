"use client"

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Star, Calculator } from 'lucide-react';
import { getStoredProfile, type UserProfile } from '@/lib/profile';
import { calculateLocalScore } from '@/lib/scoring';

type Pool = { id: string; name: string; code: string };

type ScoreSummary = ReturnType<typeof calculateLocalScore>;

export default function LeaderboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [score, setScore] = useState<ScoreSummary | null>(null);

  useEffect(() => {
    const refresh = () => {
      const storedProfile = getStoredProfile();
      const legacyName = window.localStorage.getItem('wc-player-name');
      setProfile(storedProfile || (legacyName ? { actualName: legacyName, displayName: legacyName, avatar: '⚽' } : null));
      const savedPools = window.localStorage.getItem('wc-pools');
      if (savedPools) setPools(JSON.parse(savedPools));
      setScore(calculateLocalScore(window.localStorage));
    }
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const hasPlayer = Boolean(profile);

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-6 px-4 md:pl-28 md:pr-8 max-w-lg mx-auto md:max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-headline font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Scores are calculated from your saved predictions and the admin results stored on this device.</p>
      </header>

      {score && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Total" value={score.total} icon={<Trophy size={18} />} />
          <Stat label="Match points" value={score.matchPoints} icon={<Calculator size={18} />} />
          <Stat label="Group points" value={score.groupPoints} icon={<Users size={18} />} />
        </div>
      )}

      <Tabs defaultValue="my-leagues" className="space-y-6">
        <TabsList className="glass-card w-full grid grid-cols-2 p-1 h-12">
          <TabsTrigger value="my-leagues" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold">My Leagues</TabsTrigger>
          <TabsTrigger value="overall" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold">Overall</TabsTrigger>
        </TabsList>

        <TabsContent value="my-leagues" className="space-y-4">
          {pools.length === 0 ? (
            <EmptyState title="No league leaderboard yet" text="Create or join a league first. Once Firebase is connected, everyone in each invite link will show here." />
          ) : pools.map(pool => (
            <Card key={pool.code} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"><Users className="text-primary" size={20} /></div>
                <div>
                  <h2 className="font-headline font-bold">{pool.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">League code {pool.code}</p>
                </div>
              </div>
              {hasPlayer && profile ? <PlayerRow profile={profile} score={score?.total ?? 0} /> : <p className="text-sm text-muted-foreground">Set up your profile to appear here.</p>}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="overall" className="space-y-3">
          {hasPlayer && profile ? <PlayerRow profile={profile} score={score?.total ?? 0} /> : <EmptyState title="Leaderboard is blank" text="It will stay blank until real users join. The previous fake names have been removed." />}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <Card className="glass-card p-4"><div className="flex items-center justify-between text-primary">{icon}<span className="text-2xl font-headline font-black">{value}</span></div><p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p></Card>
}

function PlayerRow({ profile, score }: { profile: UserProfile; score: number }) {
  const name = profile.actualName || profile.displayName;
  return (
    <Card className="bg-card/70 border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold font-headline w-6 text-center text-primary">1</span>
        <Avatar className="w-10 h-10 border border-border">
          <AvatarFallback className="text-xl">{profile.avatar || name[0]?.toUpperCase() || '⚽'}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-bold text-sm leading-tight flex items-center gap-2">{name}<span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">You</span></h4>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1"><Star size={8} fill="currentColor" /> @{profile.displayName}</p>
        </div>
      </div>
      <div className="flex flex-col items-end"><span className="font-headline font-bold text-lg">{score}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">pts</span></div>
    </Card>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="glass-card p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><Trophy className="text-primary" /></div>
      <h3 className="font-headline font-bold text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}
