import { z } from 'zod'

// ─── Area ───
export const areaSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().default('📌'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  linked_goals: z.array(z.string()).default([]),
  created: z.string(),
})

// ─── Key Metric ───
const keyMetricSchema = z.object({
  name: z.string(),
  current: z.number(),
  target: z.number(),
  unit: z.string(),
})

// ─── Goal ───
export const goalSchema = z.object({
  id: z.string(),
  area_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  type: z.string().default('general'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  color: z.string().default('#f5a623'),
  created: z.string().optional(), // v2 files may only have created_at
  ai_next_review: z.string().optional(),
  ai_diagnosis: z.string().optional(),
  ai_direction: z.string().optional(),
  linked_milestones: z.array(z.string()).default([]),
  linked_routines: z.array(z.string()).default([]),
  linked_projects: z.array(z.string()).default([]),
  key_metrics: z.array(keyMetricSchema).default([]),
  why_statement: z.string().optional(),
  identity_statement: z.string().optional(),
  when_where_how: z.string().optional(),
  // v2 compat
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  unit: z.string().optional(),
  due_date: z.string().optional(),
  core_value: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

// ─── Milestone ───
export const milestoneSchema = z.object({
  id: z.string(),
  goal_id: z.string(),
  title: z.string(),
  target_value: z.number(),
  current_value: z.number().default(0),
  unit: z.string(),
  due_date: z.string(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  created_by: z.enum(['user', 'ai']).default('user'),
  created: z.string(),
})

// ─── Project ───
export const projectSchema = z.object({
  id: z.string(),
  goal_id: z.string().optional(),
  milestone_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  color: z.string().default('#7c5cbf'),
  due_date: z.string().optional(),
  default_view: z.enum(['kanban', 'table', 'calendar', 'list']).default('kanban'),
  created_by: z.enum(['user', 'ai']).optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ─── Task (project-level) ───
export const taskSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  parent_task_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'doing', 'done']).default('backlog'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  energy_required: z.enum(['low', 'medium', 'high']).optional(),
  tag: z.string().optional(),
  due_date: z.string().optional(),
  position: z.number().default(0),
  goal_ids: z.array(z.string()).optional(),
  area_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ─── Book ───
export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  status: z.enum(['reading', 'completed', 'want_to_read', 'dropped']).default('want_to_read'),
  rating: z.number().min(1).max(5).optional(),
  total_pages: z.number().optional(),
  current_page: z.number().optional(),
  goal_id: z.string().optional(),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
  created_at: z.string().optional(),
})

// ─── Calendar Event ───
export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  all_day: z.boolean().optional(),
  category: z.enum(['work', 'personal', 'health', 'study', 'social', 'other']).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  goal_id: z.string().optional(),
  created_by: z.enum(['user', 'ai', 'telegram']).optional(),
  created_at: z.string().optional(),
})

// ─── Note ───
export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['note', 'file', 'reference', 'link']).default('note'),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  area_id: z.string().optional(),
  project_id: z.string().optional(),
  url: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ─── Daily Manifest ───
export const dailyManifestSchema = z.object({
  date: z.string(),
  gatsaeng_score: z.number().default(0),
  routines_done: z.number().default(0),
  routines_total: z.number().default(0),
  focus_minutes: z.number().default(0),
  timing_note: z.string().optional(),
  growth_actions: z.object({
    core: z.array(z.string()).default([]),
    filler: z.array(z.string()).default([]),
    missed: z.array(z.string()).default([]),
  }).optional(),
})

// ─── Routine ───
export const routineSchema = z.object({
  id: z.string(),
  title: z.string(),
  area_id: z.string().optional(),
  goal_id: z.string().optional(),
  scheduled_time: z.string().optional(),
  scheduled_days: z.array(z.number()).default([1, 2, 3, 4, 5, 6, 7]),
  trigger_cue: z.string().optional(),
  trigger_type: z.enum(['time', 'event', 'location']).default('time'),
  after_routine_id: z.string().nullable().optional(),
  reward_note: z.string().optional(),
  energy_required: z.enum(['low', 'medium', 'high']).default('medium'),
  streak: z.number().default(0),
  longest_streak: z.number().default(0),
  is_active: z.boolean().default(true),
  position: z.number().default(0),
  created_by: z.enum(['user', 'ai']).optional(),
  created: z.string().optional(), // v2 files may only have created_at
  // v2 compat
  days_of_week: z.array(z.number()).optional(),
  created_at: z.string().optional(),
})

// ─── Routine Log ───
export const routineLogSchema = z.object({
  date: z.string(),
  completions: z.array(z.object({
    routine_id: z.string(),
    completed_at: z.string(),
    mood: z.number().min(1).max(5).optional(),
  })),
})

// ─── Energy Log ───
export const energyLogSchema = z.object({
  date: z.string(),
  entries: z.array(z.object({
    hour: z.number().min(0).max(23),
    level: z.number().min(1).max(5),
    note: z.string().optional(),
  })),
})

// ─── Focus Session ───
export const focusSessionSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  task_id: z.string().optional(),
  duration_minutes: z.number(),
  session_type: z.enum(['pomodoro_25', 'focus_90', 'deep_work']).default('pomodoro_25'),
  energy_level: z.number().min(1).max(5).optional(),
  completed: z.boolean().default(false),
  started_at: z.string(),
})

// ─── Review ───
export const reviewSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['daily', 'weekly']).default('weekly'),
  date: z.string().optional(),
  week: z.string().optional(),
  week_start: z.string().optional(),
  week_end: z.string().optional(),
  routines_completion_rate: z.number().optional(),
  tasks_completed: z.number().optional(),
  gatsaeng_score_total: z.number().optional(),
  ai_reanalysis_triggered: z.boolean().optional(),
  goal_ids_to_review: z.array(z.string()).optional(),
  accomplished: z.string().optional(),
  struggled: z.string().optional(),
  learnings: z.string().optional(),
  next_week_focus: z.string().optional(),
  energy_pattern: z.string().optional(),
  habit_insight: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
  score: z.number().optional(),
  created_at: z.string().optional(),
})

// ─── Profile ───
export const profileSchema = z.object({
  display_name: z.string(),
  level: z.number().default(1),
  total_score: z.number().default(0),
  longest_streak: z.number().default(0),
  current_streak: z.number().default(0),
  peak_hours: z.array(z.number()),
  dashboard_widgets: z.array(z.enum(['routine', 'goals', 'heatmap', 'kanban', 'timer', 'zeigarnik', 'energy', 'dday', 'proactive'])),
  created_at: z.string(),
  updated_at: z.string(),
})

// ─── Timing Context (사주) ───
export const timingContextSchema = z.object({
  year: z.number(),
  month_name: z.string(),
  month_hanja: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  rating: z.number().min(1).max(5),
  theme: z.string(),
  key_insight: z.string(),
  action_guide: z.string(),
})

// ─── Growth Scorecard (사주 L1~L4) ───
export const growthScorecardSchema = z.object({
  date: z.string(),
  l4_timing: z.enum(['aligned', 'misaligned', 'counter']),
  l3_chain: z.enum(['active', 'weak', 'depleted']),
  l2_expansion: z.enum(['forward', 'stagnant', 'retreat']),
  l1_correction: z.enum(['corrected', 'in_progress', 'stuck']),
  health_defense: z.enum(['maintained', 'warning', 'collapsed']),
  note: z.string().optional(),
})
