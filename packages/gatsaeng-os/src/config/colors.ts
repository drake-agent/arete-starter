// Shared color constants — import from here instead of redefining per-page

export const DOMAIN_COLORS: Record<string, string> = {
  Work: 'bg-blue-500/20 text-blue-400',
  Finance: 'bg-green-500/20 text-green-400',
  Relationship: 'bg-pink-500/20 text-pink-400',
  Energy: 'bg-orange-500/20 text-orange-400',
  Meaning: 'bg-purple-500/20 text-purple-400',
  Lifestyle: 'bg-teal-500/20 text-teal-400',
}

export const TRANSFERABILITY_COLORS: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-orange-400',
}

export const TRANSFERABILITY_BADGE: Record<string, string> = {
  high: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-orange-500/20 text-orange-400',
}
