import { Course, Deadline, StudyTask, AppData } from './types';
import { generateBalancedStudyTasks } from './planner';

const STORAGE_KEY = 'reminder_tracker_app_data_v1';

export const INITIAL_COURSES: Course[] = [
  { id: 'c1', code: 'CS 101', name: 'Computer Science Fundamentals', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', instructor: 'Dr. Alan Turing' },
  { id: 'c2', code: 'MATH 201', name: 'Multivariable Calculus', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', instructor: 'Prof. Katherine Johnson' },
  { id: 'c3', code: 'ENG 102', name: 'Academic Writing & Rhetoric', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', instructor: 'Dr. Maya Angelou' },
  { id: 'c4', code: 'PHYS 105', name: 'Classical Mechanics & Lab', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', instructor: 'Prof. Richard Feynman' },
];

export function getInitialDeadlines(): Deadline[] {
  const today = new Date();

  const addDaysStr = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'd1',
      courseId: 'c1',
      title: 'Algorithm & Data Structure Problem Set 3',
      dueDate: addDaysStr(4),
      estimatedHours: 5,
      priority: 'high',
      status: 'pending',
      notes: 'Implement Dijkstra and A* search algorithms in Python',
      createdAt: today.toISOString()
    },
    {
      id: 'd2',
      courseId: 'c2',
      title: 'Multivariable Calculus Midterm Exam',
      dueDate: addDaysStr(9),
      estimatedHours: 8,
      priority: 'high',
      status: 'pending',
      notes: 'Covers Partial Derivatives, Double Integrals, and Vector Fields',
      createdAt: today.toISOString()
    },
    {
      id: 'd3',
      courseId: 'c3',
      title: 'Analytical Literature Essay (First Draft)',
      dueDate: addDaysStr(10),
      estimatedHours: 5,
      priority: 'medium',
      status: 'pending',
      notes: '2000-word essay comparing narrative perspectives',
      createdAt: today.toISOString()
    },
    {
      id: 'd4',
      courseId: 'c4',
      title: 'Physics Lab Report: Rotational Dynamics',
      dueDate: addDaysStr(11),
      estimatedHours: 4,
      priority: 'medium',
      status: 'pending',
      notes: 'Include uncertainty analysis and error graphs',
      createdAt: today.toISOString()
    },
    {
      id: 'd5',
      courseId: 'c1',
      title: 'CS 101 Code Review & Refactoring',
      dueDate: addDaysStr(16),
      estimatedHours: 3,
      priority: 'low',
      status: 'pending',
      notes: 'Peer code review assignment',
      createdAt: today.toISOString()
    }
  ];
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') {
    const deadlines = getInitialDeadlines();
    return {
      courses: INITIAL_COURSES,
      deadlines,
      tasks: generateBalancedStudyTasks(deadlines, [], new Date()),
      lastRebalanced: new Date().toISOString()
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AppData = JSON.parse(stored);
      // Return parsed data even if empty (user cleared it)
      if (parsed && Array.isArray(parsed.courses) && Array.isArray(parsed.deadlines)) {
        if (!Array.isArray(parsed.tasks)) {
          parsed.tasks = generateBalancedStudyTasks(parsed.deadlines, [], new Date());
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load local storage data:', err);
  }

  // Initial demo data fallback
  const initialDeadlines = getInitialDeadlines();
  const initialTasks = generateBalancedStudyTasks(initialDeadlines, [], new Date());
  const initialData: AppData = {
    courses: INITIAL_COURSES,
    deadlines: initialDeadlines,
    tasks: initialTasks,
    lastRebalanced: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  } catch (e) {}

  return initialData;
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
}

export function clearAllData(): AppData {
  const emptyData: AppData = {
    courses: [],
    deadlines: [],
    tasks: [],
    lastRebalanced: new Date().toISOString()
  };
  saveAppData(emptyData);
  return emptyData;
}

// 1-Click JSON Backup Export
export function exportAppDataJSON(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `study_planner_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1-Click Backup Import
export function importAppDataJSON(jsonStr: string): AppData | null {
  try {
    const data: AppData = JSON.parse(jsonStr);
    if (Array.isArray(data.courses) && Array.isArray(data.deadlines)) {
      if (!Array.isArray(data.tasks)) {
        data.tasks = generateBalancedStudyTasks(data.deadlines, [], new Date());
      }
      saveAppData(data);
      return data;
    }
  } catch (e) {
    console.error('Invalid backup JSON format', e);
  }
  return null;
}
