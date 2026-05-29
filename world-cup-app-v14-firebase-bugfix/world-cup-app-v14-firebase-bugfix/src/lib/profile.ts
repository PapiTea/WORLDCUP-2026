export type UserProfile = {
  displayName: string;
  actualName: string;
  avatar: string;
};

export const PROFILE_KEY = "wc-user-profile";

export const FOOTBALL_AVATARS = [
  "⚽", "🏆", "🥅", "🧤", "👟", "📣", "🔥", "⭐", "🦁", "🦅", "🐉", "🐺", "🦊", "🐯", "👑", "🎯"
];

export function getStoredProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed.actualName && !parsed.displayName) return null;
    return {
      displayName: parsed.displayName || parsed.actualName || "Player",
      actualName: parsed.actualName || parsed.displayName || "Player",
      avatar: parsed.avatar || "⚽",
    };
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.localStorage.setItem("wc-player-name", profile.actualName);
}
