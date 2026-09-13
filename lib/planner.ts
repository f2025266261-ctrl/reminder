import { Course, Deadline, StudyTask, WeekPlan, AppData } from './types';

// Helper to format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format friendly date like "Sep 18, 2026"
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get Sunday start of the week for a given date
export function getSundayStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day; // day 0 is Sunday
  return new Date(date.setDate(diff));
}

// Add days to date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Syllabus & Deadline Text Parser
 * Parses pasted syllabus content or deadline lists.
 */
export function parsePastedSyllabus(text: string, existingCourses: Course[]): { deadlines: Partial<Deadline>[]; detectedCourses: string[] } {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const deadlines: Partial<Deadline>[] = [];
  const detectedCoursesSet = new Set<string>();

  const currentYear = new Date().getFullYear();

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Detect Course Code (e.g. CS101, MATH 201, BIO-110, ENG 102)
    const courseMatch = trimmed.match(/\b([A-Z]{2,4}\s?\d{3}[A-Z]?)\b/i);
    let matchedCourseId = '';
    if (courseMatch) {
      const codeClean = courseMatch[1].replace(/\s+/g, '').toUpperCase();
      detectedCoursesSet.add(codeClean);
      const existing = existingCourses.find(c => c.code.replace(/\s+/g, '').toUpperCase() === codeClean);
      if (existing) matchedCourseId = existing.id;
    }

    // Detect Date (Formats: YYYY-MM-DD, MM/DD/YYYY, Month DD)
    let foundDateStr = '';
    
    // Check YYYY-MM-DD
    const isoMatch = trimmed.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoMatch) {
      foundDateStr = isoMatch[1];
    } else {
      // Check MM/DD/YYYY or MM/DD
      const slashMatch = trimmed.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
      if (slashMatch) {
        const m = String(slashMatch[1]).padStart(2, '0');
        const d = String(slashMatch[2]).padStart(2, '0');
        const y = slashMatch[3] ? (slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]) : `${currentYear}`;
        foundDateStr = `${y}-${m}-${d}`;
      } else {
        // Check Month DD (e.g., Sep 25, October 12)
        const monthMatch = trimmed.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i);
        if (monthMatch) {
          const monthMap: Record<string, string> = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
          };
          const m = monthMap[monthMatch[1].substring(0, 3).toLowerCase()];
          const d = String(monthMatch[2]).padStart(2, '0');
          const y = monthMatch[3] || `${currentYear}`;
          foundDateStr = `${y}-${m}-${d}`;
        }
      }
    }

    // Default to 14 days from now if no date found
    if (!foundDateStr) {
      foundDateStr = formatDate(addDays(new Date(), 14));
    }

    // Detect Estimated Hours (e.g. 5 hours, 4 hrs, 3.5h)
    let estHours = 4; // default
    const hoursMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h\b)/i);
    if (hoursMatch) {
      estHours = parseFloat(hoursMatch[1]);
    }

    // Detect Priority
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (/exam|midterm|final|project|thesis/i.test(trimmed)) {
      priority = 'high';
      estHours = Math.max(estHours, 6);
    } else if (/quiz|reading|homework|discussion/i.test(trimmed)) {
      priority = 'low';
    }

    // Clean title
    let title = trimmed
      .replace(/\b[A-Z]{2,4}\s?\d{3}[A-Z]?\b/gi, '')
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
      .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, '')
      .replace(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h\b)/gi, '')
      .replace(/due\s*:?/gi, '')
      .replace(/[-|:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title) title = 'Assignment';

    deadlines.push({
      title,
      courseId: matchedCourseId || (existingCourses[0]?.id || 'c1'),
      dueDate: foundDateStr,
      estimatedHours: estHours,
      priority,
      status: 'pending',
      notes: `Imported from syllabus text: "${line.trim()}"`
    });
  });

  return {
    deadlines,
    detectedCourses: Array.from(detectedCoursesSet)
  };
}

/**
 * Generate Week-by-Week Plans & Balance Load
 */
export function buildWeekPlans(courses: Course[], deadlines: Deadline[], existingTasks: StudyTask[], referenceDate: Date = new Date()): WeekPlan[] {
  const sortedDeadlines = [...deadlines].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const currentSunday = getSundayStart(referenceDate);
  
  let maxDate = addDays(currentSunday, 7 * 7); // minimum 8 weeks view
  sortedDeadlines.forEach(d => {
    const dDate = parseDate(d.dueDate);
    if (dDate > maxDate) maxDate = dDate;
  });

  const weekPlans: WeekPlan[] = [];
  let tempSunday = new Date(currentSunday);

  while (tempSunday <= maxDate) {
    const weekStartStr = formatDate(tempSunday);
    const tempSaturday = addDays(tempSunday, 6);
    const weekEndStr = formatDate(tempSaturday);

    const weekDeadlines = sortedDeadlines.filter(d => d.dueDate >= weekStartStr && d.dueDate <= weekEndStr);
    const weekTasks = existingTasks.filter(t => t.date >= weekStartStr && t.date <= weekEndStr);
    const totalStudyHours = weekTasks.reduce((sum, t) => sum + (t.completed ? 0 : t.allocatedHours), 0);

    const weekLabel = `${tempSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${tempSaturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const weekKey = `week-${weekStartStr}`;

    weekPlans.push({
      weekKey,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      weekLabel,
      deadlineCount: weekDeadlines.length,
      totalStudyHours,
      deadlines: weekDeadlines,
      tasks: weekTasks,
      isOverloaded: weekDeadlines.length >= 3
    });

    tempSunday = addDays(tempSunday, 7);
  }

  return weekPlans;
}

/**
 * Sunday Night Re-balance & Automatic Study Plan Generator
 */
export function generateBalancedStudyTasks(deadlines: Deadline[], existingTasks: StudyTask[], referenceDate: Date = new Date()): StudyTask[] {
  const activeDeadlines = deadlines.filter(d => d.status !== 'completed');
  const refDateStr = formatDate(referenceDate);

  const updatedTasks: StudyTask[] = [...existingTasks.filter(t => t.completed || t.date < refDateStr)];
  const existingTaskIds = new Set(updatedTasks.map(t => t.id));

  activeDeadlines.forEach(deadline => {
    const completedTasksForDeadline = existingTasks.filter(t => t.deadlineId === deadline.id && t.completed);
    const hoursCompleted = completedTasksForDeadline.reduce((sum, t) => sum + t.allocatedHours, 0);
    const hoursRemaining = Math.max(0.5, deadline.estimatedHours - hoursCompleted);

    const due = parseDate(deadline.dueDate);
    const ref = parseDate(refDateStr);

    const diffTime = due.getTime() - ref.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const prepDaysCount = Math.min(diffDays, deadline.priority === 'high' ? 6 : 4);
    const hoursPerSession = Number((hoursRemaining / prepDaysCount).toFixed(1));

    for (let i = prepDaysCount - 1; i >= 0; i--) {
      const taskDate = formatDate(addDays(due, -i));
      
      if (taskDate < refDateStr) continue;

      const taskId = `task-${deadline.id}-${taskDate}`;
      if (!existingTaskIds.has(taskId)) {
        updatedTasks.push({
          id: taskId,
          deadlineId: deadline.id,
          courseId: deadline.courseId,
          title: `Study / Prep: ${deadline.title}`,
          date: taskDate,
          allocatedHours: hoursPerSession > 0 ? hoursPerSession : 1,
          completed: false
        });
        existingTaskIds.add(taskId);
      }
    }
  });

  return updatedTasks;
}
