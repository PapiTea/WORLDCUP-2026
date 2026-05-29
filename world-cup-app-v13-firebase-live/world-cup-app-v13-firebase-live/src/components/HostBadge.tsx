import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

type HostInfo = {
  code: "mx" | "ca" | "us"
  label: "Mexico" | "Canada" | "USA"
  image: string
}

export function getHostInfo(location: string): HostInfo {
  const text = location.toLowerCase()
  if (text.includes("mexico")) return { code: "mx", label: "Mexico", image: "https://flagcdn.com/w40/mx.png" }
  if (text.includes("canada")) return { code: "ca", label: "Canada", image: "https://flagcdn.com/w40/ca.png" }
  return { code: "us", label: "USA", image: "https://flagcdn.com/w40/us.png" }
}

export function HostBadge({ location, venue, compact = false, className }: { location: string; venue: string; compact?: boolean; className?: string }) {
  const host = getHostInfo(location)
  return (
    <div className={cn("flex items-start gap-2 rounded-2xl bg-background/45 p-3 text-xs font-semibold text-muted-foreground", className)}>
      <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
      <img src={host.image} alt={`${host.label} flag`} className="mt-0.5 h-4 w-6 shrink-0 rounded-sm object-cover ring-1 ring-border" />
      <span className="min-w-0">
        <strong className="text-foreground">{compact ? host.label : `${host.label} · ${venue}`}</strong>
        {!compact && <><br />{location}</>}
      </span>
    </div>
  )
}
