'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import OverlapWarningBanner from '@/components/OverlapWarningBanner';
import { AppData } from '@/lib/types';
import { loadAppData, saveAppData } from '@/lib/storage';
import { buildWeekPlans, generateBalancedStudyTasks, formatFriendlyDate } from '@/lib/planner';
import { CalendarDays, AlertTriangle, RefreshCw, Check } from 'lucide-react';

export default function PlannerPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setData(loadAppData());
  }, []);

  if (!mounted || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
          <span>Loading weekly planner...</span>
        </div>
      </div>
    );
  }

  const weekPlans = buildWeekPlans(data.courses, data.deadlines, data.tasks);
  const overloadedWeeks = weekPlans.filter(w => w.isOverloaded);

  const handleRebalance = () => {
    const updatedTasks = generateBalancedStudyTasks(data.deadlines, data.tasks);
    const updatedData: AppData = {
      ...data,
      tasks: updatedTasks,
      lastRebalanced: new Date().toISOString()
    };
    setData(updatedData);
    saveAppData(updatedData);
  };

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = data.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const updatedData: AppData = { ...data, tasks: updatedTasks };
    setData(updatedData);
    saveAppData(updatedData);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-12 text-slate-100" suppressHydrationWarning>
      <Navbar onRebalance={handleRebalance} overloadedWeeksCount={overloadedWeeks.length} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <CalendarDays className="h-4 w-4" />
              <span>Week-by-Week Load Balancing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Study Schedule &amp; Load Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Automatically distributes assignment prep hours across days before deadlines to prevent cramming.
            </p>
          </div>

          <button
            onClick={handleRebalance}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sunday Night Re-Run</span>
          </button>
        </div>

        {/* 3+ Overlapping Deadline Warning */}
        <OverlapWarningBanner overloadedWeeks={overloadedWeeks} />

        {/* Week Plans List */}
        <div className="space-y-6">
          {weekPlans.map((week, idx) => (
            <div
              key={week.weekKey}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                week.isOverloaded
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-slate-900 to-slate-900 shadow-amber-500/5'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Week Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                    week.isOverloaded
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    W{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        Week of {week.weekLabel}
                      </h2>
                      {week.isOverloaded && (
                        <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          3+ Overlapping Deadlines
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {week.deadlineCount} {week.deadlineCount === 1 ? 'Deadline' : 'Deadlines'} • {week.totalStudyHours} total prep hours planned
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Week Load:</span>
                  <div className="h-2.5 w-28 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        week.deadlineCount >= 3
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : week.deadlineCount >= 2
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(15, (week.deadlineCount / 4) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Deadlines in this week */}
              <div className="mt-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deadlines Falling in this Week ({week.deadlines.length})
                </h3>

                {week.deadlines.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No deadlines due this week.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {week.deadlines.map(deadline => {
                      const course = data.courses.find(c => c.id === deadline.courseId);
                      return (
                        <div key={deadline.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <div className="flex items-center justify-between">
                            {course && (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${course.color}`}>
                                {course.code}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Due: {formatFriendlyDate(deadline.dueDate)}
                            </span>
                          </div>
                          <h4 className="mt-1.5 text-xs font-bold text-slate-100 line-clamp-1">
                            {deadline.title}
                          </h4>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Est: {deadline.estimatedHours} hrs</span>
                            <span className={`capitalize font-semibold ${
                              deadline.priority === 'high' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {deadline.priority} Priority
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Daily Study Schedule Tasks */}
              <div className="mt-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Balanced Preparation Tasks
                </h3>

                {week.tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No preparation tasks generated for this week.</p>
                ) : (
                  <div className="space-y-1.5">
                    {week.tasks.map(task => {
                      const course = data.courses.find(c => c.id === task.courseId);
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleTaskToggle(task.id)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer text-xs transition-colors ${
                            task.completed
                              ? 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                              task.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 bg-slate-800'
                            }`}>
                              {task.completed && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <span className="font-semibold text-slate-400 min-w-[75px]">
                              {formatFriendlyDate(task.date)}
                            </span>
                            <span className={task.completed ? 'line-through' : 'font-medium'}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {course && (
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                {course.code}
                              </span>
                            )}
                            <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {task.allocatedHours} hrs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
