export interface Course {
  id: string;
  code: string;
  name: string;
  color: string; // Tailwind color class or hex, e.g., 'blue', 'emerald', 'amber', 'purple', 'rose'
  instructor?: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type DeadlineStatus = 'pending' | 'in_progress' | 'completed';

export interface Deadline {
  id: string;
  courseId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  estimatedHours: number;
  priority: Priority;
  status: DeadlineStatus;
  notes?: string;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  deadlineId: string;
  courseId: string;
  title: string;
  date: string; // YYYY-MM-DD
  allocatedHours: number;
  completed: boolean;
}

export interface WeekPlan {
  weekKey: string; // e.g. "2026-W38"
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  weekLabel: string; // e.g., "Sept 14 - Sept 20"
  deadlineCount: number;
  totalStudyHours: number;
  deadlines: Deadline[];
  tasks: StudyTask[];
  isOverloaded: boolean; // Flagged true when 3+ deadlines overlap
}

export interface AppData {
  courses: Course[];
  deadlines: Deadline[];
  tasks: StudyTask[];
  lastRebalanced?: string; // ISO Timestamp of Sunday night re-run
}
