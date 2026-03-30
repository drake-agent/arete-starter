// ─── Base Types ───
export type GoalStatus = 'active' | 'completed' | 'archived'
export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type EnergyLevel = 'low' | 'medium' | 'high'
export type ViewType = 'kanban' | 'table' | 'calendar' | 'list'
export type SessionType = 'pomodoro_25' | 'focus_90' | 'deep_work'
export type TriggerType = 'time' | 'event' | 'location'
export type WidgetId = 'routine' | 'goals' | 'heatmap' | 'kanban' | 'timer' | 'zeigarnik' | 'energy' | 'dday' | 'proactive'
export type ReviewType = 'daily' | 'weekly' | 'monthly'
export type CreatedBy = 'user' | 'ai'

// ─── Area (영역) ───
export interface Area {
  id: string
  title: string
  icon: string
  status: GoalStatus
  linked_goals: string[]
  created?: string
}

// ─── Goal (목표) ───
export interface KeyMetric {
  name: string
  current: number
  target: number
  unit: string
}

export interface Goal {
  id: string
  area_id?: string
  title: string
  description?: string
  type: string
  status: GoalStatus
  color: string
  created?: string
  ai_next_review?: string
  ai_diagnosis?: string
  ai_direction?: string
  linked_milestones: string[]
  linked_routines: string[]
  linked_projects: string[]
  key_metrics: KeyMetric[]
  why_statement?: string
  identity_statement?: string
  when_where_how?: string
  // v2 compat
  target_value?: number
  current_value?: number
  unit?: string
  due_date?: string
  core_value?: string
  created_at?: string
  updated_at?: string
}

// ─── Milestone (마일스톤) ───
export interface Milestone {
  id: string
  goal_id: string
  title: string
  target_value: number
  current_value: number
  unit: string
  due_date: string
  status: GoalStatus
  created_by: CreatedBy
  created?: string
}

// ─── Project (프로젝트) ───
export interface Project {
  id: string
  goal_id?: string
  milestone_id?: string
  title: string
  description?: string
  status: GoalStatus
  color: string
  due_date?: string
  default_view: ViewType
  created_by?: CreatedBy
  created_at: string
  updated_at: string
}

// ─── Task (프로젝트 소속 태스크 — 개별 파일) ───
export interface Task {
  id: string
  project_id: string
  parent_task_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  energy_required?: EnergyLevel
  tag?: string
  due_date?: string
  position: number
  goal_ids?: string[]
  area_id?: string
  created_at: string
  updated_at: string
}

// ─── Book (독서) ───
export type BookStatus = 'reading' | 'completed' | 'want_to_read' | 'dropped'

export interface Book {
  id: string
  title: string
  author: string
  status: BookStatus
  rating?: number
  total_pages?: number
  current_page?: number
  goal_id?: string
  started_at?: string
  finished_at?: string
  created_at?: string
}

// ─── CalendarEvent (캘린더) ───
export type CalendarCategory = 'work' | 'personal' | 'health' | 'study' | 'social' | 'other'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time_start?: string
  time_end?: string
  all_day?: boolean
  category?: CalendarCategory
  location?: string
  description?: string
  goal_id?: string
  created_by?: 'user' | 'ai' | 'telegram'
  created_at?: string
}

// ─── Note (노트) ───
export type NoteType = 'note' | 'file' | 'reference' | 'link'
export type NotePriority = 1 | 2 | 3

export interface Note {
  id: string
  title: string
  type: NoteType
  priority: NotePriority
  area_id?: string
  project_id?: string
  url?: string
  created_at: string
  updated_at: string
}

// ─── DailyManifest (일일 매니페스트 — 날짜별 파일) ───
export interface DailyManifest {
  date: string
  gatsaeng_score: number
  routines_done: number
  routines_total: number
  focus_minutes: number
}

// ─── Routine (루틴) ───
export interface Routine {
  id: string
  title: string
  area_id?: string
  goal_id?: string
  scheduled_time?: string
  scheduled_days: number[]
  trigger_cue?: string
  trigger_type: TriggerType
  after_routine_id?: string | null
  reward_note?: string
  energy_required: EnergyLevel
  streak: number
  longest_streak: number
  is_active: boolean
  position: number
  created_by?: CreatedBy
  created?: string
  // v2 compat
  days_of_week?: number[]
  created_at?: string
}

export interface RoutineCompletion {
  routine_id: string
  completed_at: string
  mood?: number
}

export interface RoutineLog {
  date: string
  completions: RoutineCompletion[]
}

// ─── Energy ───
export interface EnergyEntry {
  hour: number
  level: number
  note?: string
}

export interface EnergyLog {
  date: string
  entries: EnergyEntry[]
}

// ─── Focus Session ───
export interface FocusSession {
  id: string
  date?: string
  task_id?: string
  duration_minutes: number
  session_type: SessionType
  energy_level?: number
  completed: boolean
  started_at: string
}

// ─── Review (회고) ───
export interface Review {
  id?: string
  type: ReviewType
  // daily
  date?: string
  // weekly
  week?: string
  week_start?: string
  week_end?: string
  routines_completion_rate?: number
  tasks_completed?: number
  gatsaeng_score_total?: number
  ai_reanalysis_triggered?: boolean
  goal_ids_to_review?: string[]
  // shared
  accomplished?: string
  struggled?: string
  learnings?: string
  next_week_focus?: string
  energy_pattern?: string
  habit_insight?: string
  mood?: number
  score?: number
  created_at?: string
}

// ─── Profile ───
export interface Profile {
  display_name: string
  level: number
  total_score: number
  longest_streak: number
  current_streak: number
  peak_hours: number[]
  dashboard_widgets: WidgetId[]
  created_at: string
  updated_at: string
}

// ─── Derived / UI Types ───
export interface RoutineWithStatus extends Routine {
  completed_today: boolean
}

export interface MilestoneWithDDay extends Milestone {
  d_day: number
}

export interface GoalWithMilestones extends Goal {
  milestones: MilestoneWithDDay[]
  area?: Area
}

export interface ProactiveAlert {
  id: string
  type: 'skipped_routine' | 'deadline' | 'milestone_dday' | 'reanalysis_due'
  title: string
  message: string
  actions?: { label: string; value: string }[]
  created_at: string
}

export type ScoreEventType =
  | 'routine_complete'
  | 'task_done'
  | 'task_done_urgent'
  | 'milestone_complete'
  | 'review_written'
  | 'data_uploaded'
  | 'goal_25pct'
  | 'goal_50pct'
  | 'goal_100pct'

export interface ScoreEvent {
  type: ScoreEventType
  streakCount?: number
}

export interface ScoreResult {
  points: number
  bonus_message: string | null
}

// ─── Constraints (제약 원칙) ───
export const LIMITS = {
  MAX_ACTIVE_GOALS: 5,
  MAX_ACTIVE_ROUTINES: 6,
  MAX_DAILY_TASKS: 6,
  MAX_ACTIVE_PROJECTS: 3,
  MAX_MILESTONES_PER_GOAL: 4,
  MIN_REANALYSIS_WEEKS: 2,
} as const

// ─── Meeting (미팅 인텔) ───
export interface DrakeAction {
  text: string
  done: boolean
}

export interface PlaybookCandidate {
  title?: string
  domains?: string[]
  transferability?: string
  context?: string
  signal?: string
  diagnosis?: string
  intervention?: string
  observed_or_expected_outcome?: string
  eaas_translation?: string
  [key: string]: unknown
}

export interface Meeting {
  fileId: string
  title: string
  date: string
  duration: string
  domains: string[]
  drakeActions: DrakeAction[]
  content?: string // deprecated: no longer returned by API (security)
  playbooks: PlaybookCandidate[]
}
