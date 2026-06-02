"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db, ADMIN_EMAIL } from "@/lib/firebase"
import { FOOTBALL_AVATARS, type UserProfile } from "@/lib/profile"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trophy, LogOut, ShieldCheck } from "lucide-react"

type AppUser = UserProfile & {
  uid: string
  email: string
  isAdmin: boolean
}

type AuthContextValue = {
  user: User | null
  profile: AppUser | null
  loading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthGate")
  return ctx
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    const current = auth.currentUser

    if (!current) {
      setProfile(null)
      return
    }

    const ref = doc(db, "users", current.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data = snap.data() as Partial<UserProfile> & { email?: string }

      setProfile({
        uid: current.uid,
        email: current.email || data.email || "",
        actualName: data.actualName || current.email || "Player",
        displayName: data.displayName || data.actualName || "player",
        avatar: data.avatar || "⚽",
        isAdmin:
          (current.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase(),
      })
    } else {
      const next = {
        email: current.email || "",
        actualName: current.email?.split("@")[0] || "Player",
        displayName: current.email?.split("@")[0] || "player",
        avatar: "⚽",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(ref, next, { merge: true })

      setProfile({
        uid: current.uid,
        ...next,
        isAdmin:
          (current.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase(),
      })
    }
  }

  useEffect(() => {
const unsub = onAuthStateChanged(auth, async (current) => {
  setUser(current)

  try {
    if (current) {
      await refreshProfile()
    } else {
      setProfile(null)
    }
  } catch (error) {
    console.error("Failed to refresh profile:", error)
    setProfile(null)
  } finally {
    setLoading(false)
  }
})
    return () => unsub()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: Boolean(profile?.isAdmin),
      refreshProfile,
      logout: () => signOut(auth),
    }),
    [user, profile, loading]
  )

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="glass-card p-8 text-center font-black">
          Loading World Cup App...
        </Card>
      </main>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <AuthContext.Provider value={value}>
      <div className="fixed right-4 top-4 z-[60] hidden items-center gap-2 rounded-full border border-white/10 bg-background/85 px-3 py-2 text-xs font-bold shadow-xl backdrop-blur md:flex">
        <span>{profile?.avatar || "⚽"}</span>
        <span className="max-w-[160px] truncate">
          {profile?.actualName || user.email}
        </span>
        {profile?.isAdmin && <ShieldCheck size={14} className="text-primary" />}
        <button
          onClick={() => signOut(auth)}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>

      {children}
    </AuthContext.Provider>
  )
}

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [actualName, setActualName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState("⚽")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError("")
    setBusy(true)

    try {
      if (mode === "signup") {
        if (!actualName.trim() || !displayName.trim()) {
          throw new Error("Add your real name and display name first.")
        }

        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        )

        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            email: email.trim(),
            actualName: actualName.trim(),
            displayName: displayName.trim(),
            avatar,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="glass-card w-full max-w-xl p-6 shadow-2xl md:p-8">
       <div className="mb-6 text-center">
  <div className="mb-6 flex justify-center">
    <img
      src="/flags/world-cup-logo-light.png"
      alt="World Cup 2026"
      className="h-52 w-52 object-contain dark:hidden"
    />

    <img
      src="/flags/world-cup-logo-dark.png"
      alt="World Cup 2026"
      className="hidden h-52 w-52 object-contain dark:block"
    />
  </div>

  <p className="text-center text-sm font-medium text-muted-foreground">
    Sign up to join leagues, save predictions and compete with friends.
  </p>
</div>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1">
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "ghost"}
            className="rounded-xl font-black"
            onClick={() => setMode("signup")}
          >
            Sign up
          </Button>

          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            className="rounded-xl font-black"
            onClick={() => setMode("login")}
          >
            Log in
          </Button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!busy && email.trim() && password.trim()) {
              submit()
            }
          }}
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            autoComplete="email"
          />

          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {mode === "signup" && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={actualName}
                  onChange={(event) => setActualName(event.target.value)}
                  placeholder="Actual name for leaderboard"
                  autoComplete="name"
                />

                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display name / nickname"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FOOTBALL_AVATARS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xl transition ${
                      avatar === item
                        ? "border-primary bg-primary/20"
                        : "border-border bg-background/45 hover:border-primary/40"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl font-black"
            disabled={busy || !email.trim() || !password.trim()}
          >
            {busy ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>
      </Card>
    </main>
  )
}
