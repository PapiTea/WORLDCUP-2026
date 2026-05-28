"use client"

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Share2, Crown, Copy, Link as LinkIcon, Trash2, ShieldCheck, UserMinus, UserCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FOOTBALL_AVATARS, getStoredProfile, saveStoredProfile, type UserProfile } from '@/lib/profile';

type Pool = { id: string; name: string; code: string; isCreator?: boolean };

const STORAGE_KEY = 'wc-pools';
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [poolName, setPoolName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [actualName, setActualName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('⚽');

  useEffect(() => {
    const savedProfile = getStoredProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      setActualName(savedProfile.actualName);
      setDisplayName(savedProfile.displayName);
      setAvatar(savedProfile.avatar);
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setPools(JSON.parse(saved));

    const params = new URLSearchParams(window.location.search);
    const league = params.get('league');
    const name = params.get('name');
    if (league) {
      const code = league.toUpperCase();
      const newPool = { id: code, code, name: name || `League ${code}` };
      const existing = saved ? JSON.parse(saved) as Pool[] : [];
      if (!existing.some(pool => pool.code === code)) {
        const next = [...existing, newPool];
        setPools(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    }
  }, []);

  const savePools = (next: Pool[]) => {
    setPools(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveProfile = () => {
    const cleanActual = actualName.trim();
    const cleanDisplay = displayName.trim();
    if (!cleanActual || !cleanDisplay) return;
    const next = { actualName: cleanActual, displayName: cleanDisplay, avatar };
    saveStoredProfile(next);
    setProfile(next);
  };

  const createPool = (name: string) => {
    const cleanName = name.trim() || 'My League';
    const code = makeCode();
    savePools([...pools, { id: code, name: cleanName, code, isCreator: true }]);
    setPoolName('');
  };

  const joinPool = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || pools.some(pool => pool.code === code)) return;
    savePools([...pools, { id: code, name: `League ${code}`, code }]);
    setJoinCode('');
  };


  const deletePool = (pool: Pool) => {
    const action = pool.isCreator ? 'delete this league from your device' : 'leave this league';
    const ok = window.confirm(`Are you sure you want to ${action}?`);
    if (!ok) return;
    savePools(pools.filter((item) => item.code !== pool.code));
  };

  const copyLink = async (pool: Pool) => {
    const url = `${window.location.origin}/pools?league=${pool.code}&name=${encodeURIComponent(pool.name)}`;
    await navigator.clipboard.writeText(url);
    setCopied(pool.code);
    setTimeout(() => setCopied(''), 1600);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 pt-6 px-4 md:pl-28 md:pr-8 max-w-lg mx-auto md:max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-headline font-bold mb-2 text-gradient">Leagues</h1>
        <p className="text-muted-foreground text-sm">Create separate mini-leagues for colleagues, friends or family. League owners can copy invites and remove accidental leagues from this device.</p>
      </header>

      <Card className="glass-card mb-6 p-4 space-y-4">
        <div className="flex items-center gap-2 font-headline font-bold"><UserCircle size={18} className="text-primary" /> Player profile</div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={actualName} onChange={(e) => setActualName(e.target.value)} placeholder="Actual name for leaderboard" />
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nickname / display name" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FOOTBALL_AVATARS.map((item) => (
            <button key={item} type="button" onClick={() => setAvatar(item)} className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xl transition ${avatar === item ? 'border-primary bg-primary/20 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]' : 'border-border bg-background/45 hover:border-primary/40'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{profile ? `Saved as ${profile.actualName} (@${profile.displayName})` : 'Set this before sharing your league link.'}</p>
          <Button className="rounded-2xl font-black" onClick={saveProfile} disabled={!actualName.trim() || !displayName.trim()}>Save profile</Button>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-headline font-bold"><Plus size={18} className="text-primary" /> Create a league</div>
          <Input value={poolName} onChange={(e) => setPoolName(e.target.value)} placeholder="e.g. Friends League or Office League" />
          <Button variant="outline" className="w-full h-11 border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20" onClick={() => createPool(poolName)}>
            Create share link
          </Button>
        </Card>
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-headline font-bold"><Users size={18} className="text-primary" /> Join a league</div>
          <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Paste league code" />
          <Button variant="outline" className="w-full h-11 border-border bg-card hover:bg-muted" onClick={joinPool}>
            Join league
          </Button>
        </Card>
      </section>

      <h2 className="text-lg font-headline font-bold mb-4">Your Leagues</h2>
      <div className="space-y-4">
        {pools.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><Users className="text-primary" /></div>
            <h3 className="font-headline font-bold text-xl mb-2">No leagues yet</h3>
            <p className="text-sm text-muted-foreground">Create one for colleagues and one for friends, then share each link separately.</p>
          </Card>
        ) : pools.map(pool => (
          <Card key={pool.id} className="glass-card p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Users size={24} className="text-primary" /></div>
                <div>
                  <h3 className="font-headline font-bold text-lg leading-tight flex items-center gap-2">
                    {pool.name}{pool.isCreator && <Crown size={14} className="text-secondary" />}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">Code: {pool.code}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{pool.isCreator ? <><ShieldCheck size={10} /> League owner</> : 'Joined league'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary" title="Copy invite link" onClick={() => copyLink(pool)}>
                  {copied === pool.code ? <Copy size={18} /> : <Share2 size={18} />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title={pool.isCreator ? 'Delete league' : 'Leave league'}
                  onClick={() => deletePool(pool)}
                >
                  {pool.isCreator ? <Trash2 size={18} /> : <UserMinus size={18} />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground">
              <LinkIcon size={14} />
              <span className="truncate">{typeof window !== 'undefined' ? `${window.location.origin}/pools?league=${pool.code}` : pool.code}</span>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
