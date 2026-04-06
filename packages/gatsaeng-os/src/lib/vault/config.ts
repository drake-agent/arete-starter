import path from 'path'

if (!process.env.VAULT_PATH) {
  throw new Error('VAULT_PATH environment variable is required. Set it in .env')
}
export const VAULT_PATH = process.env.VAULT_PATH

export const FOLDERS = {
  areas: path.join(VAULT_PATH, 'areas'),
  goals: path.join(VAULT_PATH, 'goals'),
  milestones: path.join(VAULT_PATH, 'milestones'),
  projects: path.join(VAULT_PATH, 'projects'),
  tasks: path.join(VAULT_PATH, 'tasks'),
  routines: path.join(VAULT_PATH, 'routines'),
  reviews: path.join(VAULT_PATH, 'reviews'),
  sessions: path.join(VAULT_PATH, 'sessions'),
  timing: path.join(VAULT_PATH, 'timing'),
  books: path.join(VAULT_PATH, 'books'),
  calendar: path.join(VAULT_PATH, 'calendar'),
  notes: path.join(VAULT_PATH, 'notes'),
  // v2 compat — kept for existing data
  routineLogs: path.join(VAULT_PATH, 'logs', 'routine'),
  energyLogs: path.join(VAULT_PATH, 'logs', 'energy'),
  focusSessions: path.join(VAULT_PATH, 'logs', 'focus'),
} as const

export const PROFILE_PATH = path.join(VAULT_PATH, 'profile.md')

export type FolderKey = keyof typeof FOLDERS
