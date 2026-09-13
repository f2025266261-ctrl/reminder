'use client';

import { Deadline, Course } from '@/lib/types';
import { formatFriendlyDate, parseDate } from '@/lib/planner';
import { Clock, CheckCircle2, Circle, Trash2, Tag, Edit3 } from 'lucide-react';

interface DeadlineCardProps {
  deadline: Deadline;
  courses: Course[];
  onStatusChange?: (id: string, status: Deadline['status']) => void;
  onEdit?: (deadline: Deadline) => void;
  onDelete?: (id: string) => void;
}

export default function DeadlineCard({ deadline, courses, onStatusChange, onEdit, onDelete }: DeadlineCardProps) {
  const course = courses.find(c => c.id === deadline.courseId);

  const priorityColors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const statusIcons = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
  };

  const StatusIcon = statusIcons[deadline.status];

  // Calculate days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseDate(deadline.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let dueBadgeText = `${diffDays} days left`;
  let dueBadgeClass = 'text-slate-400 bg-slate-800/80';
  if (diffDays === 0) {
    dueBadgeText = 'Due Today!';
    dueBadgeClass = 'text-rose-400 bg-rose-500/20 font-bold border border-rose-500/40 animate-pulse';
  } else if (diffDays === 1) {
    dueBadgeText = 'Due Tomorrow';
    dueBadgeClass = 'text-amber-400 bg-amber-500/20 font-semibold border border-amber-500/40';
  } else if (diffDays < 0) {
    dueBadgeText = `${Math.abs(diffDays)} days overdue`;
    dueBadgeClass = 'text-rose-500 bg-rose-500/10 border border-rose-500/30';
  }

  return (
    <div className={`group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/90 ${
      deadline.status === 'completed' ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {course ? (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${course.color}`}>
                {course.code}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border bg-slate-800 text-slate-400 border-slate-700">
                General
              </span>
            )}
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border capitalize ${priorityColors[deadline.priority]}`}>
              {deadline.priority} Priority
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${dueBadgeClass}`}>
              {dueBadgeText}
            </span>
          </div>

          <h3 className={`text-base font-semibold text-slate-100 ${deadline.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
            {deadline.title}
          </h3>

          {deadline.notes && (
            <p className="text-xs text-slate-400 line-clamp-2">{deadline.notes}</p>
          )}

          <div className="flex items-center gap-4 pt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Due: {formatFriendlyDate(deadline.dueDate)}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-slate-500" />
              Est. {deadline.estimatedHours} hrs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(deadline)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors"
              title="Edit deadline"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}

          {onStatusChange && (
            <button
              onClick={() => {
                const nextStatus: Record<Deadline['status'], Deadline['status']> = {
                  pending: 'in_progress',
                  in_progress: 'completed',
                  completed: 'pending'
                };
                onStatusChange(deadline.id, nextStatus[deadline.status]);
              }}
              className={`rounded-lg p-2 transition-colors ${
                deadline.status === 'completed'
                  ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : deadline.status === 'in_progress'
                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title={`Status: ${deadline.status}. Click to advance.`}
            >
              <StatusIcon className="h-5 w-5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(deadline.id)}
              className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Delete deadline"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
