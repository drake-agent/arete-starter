/**
 * Shared card color palette — used by cardRegistry, AddCardPanel, GridCanvas, card-builder API.
 * Single source of truth for accent/border/bg Tailwind classes.
 *
 * Key names match CardDefinition + CardMeta fields:
 *   accentColor, borderColor, bgTint
 */

export interface CardColor {
  accentColor: string   // text-{color}-400
  borderColor: string   // border-l-{color}-400
  bgTint: string        // bg-{color}-500/[0.03]
}

export const CARD_COLORS = {
  purple:  { accentColor: 'text-purple-400',  borderColor: 'border-l-purple-400',  bgTint: 'bg-purple-500/[0.03]' },
  emerald: { accentColor: 'text-emerald-400', borderColor: 'border-l-emerald-400', bgTint: 'bg-emerald-500/[0.03]' },
  pink:    { accentColor: 'text-pink-400',    borderColor: 'border-l-pink-400',    bgTint: 'bg-pink-500/[0.03]' },
  amber:   { accentColor: 'text-amber-400',   borderColor: 'border-l-amber-400',   bgTint: 'bg-amber-500/[0.03]' },
  green:   { accentColor: 'text-green-400',   borderColor: 'border-l-green-400',   bgTint: 'bg-green-500/[0.03]' },
  yellow:  { accentColor: 'text-yellow-400',  borderColor: 'border-l-yellow-400',  bgTint: 'bg-yellow-500/[0.03]' },
  red:     { accentColor: 'text-red-400',     borderColor: 'border-l-red-400',     bgTint: 'bg-red-500/[0.03]' },
  cyan:    { accentColor: 'text-cyan-400',    borderColor: 'border-l-cyan-400',    bgTint: 'bg-cyan-500/[0.03]' },
  orange:  { accentColor: 'text-orange-400',  borderColor: 'border-l-orange-400',  bgTint: 'bg-orange-500/[0.03]' },
  blue:    { accentColor: 'text-blue-400',    borderColor: 'border-l-blue-400',    bgTint: 'bg-blue-500/[0.03]' },
  slate:   { accentColor: 'text-slate-400',   borderColor: 'border-l-slate-400',   bgTint: 'bg-slate-500/[0.03]' },
  violet:  { accentColor: 'text-violet-400',  borderColor: 'border-l-violet-400',  bgTint: 'bg-violet-500/[0.03]' },
} as const satisfies Record<string, CardColor>

export type CardColorName = keyof typeof CARD_COLORS

/** Resolve a color name → CardColor, with violet fallback */
export function resolveCardColor(name: string): CardColor {
  return (CARD_COLORS as Record<string, CardColor>)[name] ?? CARD_COLORS.violet
}
