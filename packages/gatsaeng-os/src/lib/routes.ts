/** Mapping from entity type to URL prefix */
export const ENTITY_ROUTES: Record<string, string> = {
  note: '/notes',
  task: '/tasks',
  goal: '/goals',
  project: '/projects',
  book: '/books',
}

/** Build href for an entity */
export function entityHref(type: string, id: string): string {
  const prefix = ENTITY_ROUTES[type]
  if (!prefix) return '/'
  return `${prefix}/${id}`
}
