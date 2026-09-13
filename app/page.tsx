'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DeadlineCard from '@/components/DeadlineCard';
import OverlapWarningBanner from '@/components/OverlapWarningBanner';
import { AppData, Deadline } from '@/lib/types';
import { loadAppData, saveAppData } from '@/lib/storage';
import { buildWeekPlans, generateBalancedStudyTasks, formatDate, formatFriendlyDate } from '@/lib/planner';
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Plus, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [todayStr, setTodayStr] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const loaded = loadAppData();
    setData(loaded);
    setTodayStr(formatDate(new Date()));
  }, []);

  if (!mounted || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
          <span>Loading study tracker...</span>
        </div>
      </div>
    );
  }

  const weekPlans = buildWeekPlans(data.courses, data.deadlines, data.tasks);
  const overloadedWeeks = weekPlans.filter(w => w.isOverloaded);

  // Filter tasks scheduled for today
  const todaysTasks = data.tasks.filter(t => t.date === todayStr);

  // Upcoming pending deadlines
  const upcomingDeadlines = data.deadlines
    .filter(d => d.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const handleStatusChange = (deadlineId: string, status: Deadline['status']) => {
    const updatedDeadlines = data.deadlines.map(d => (d.id === deadlineId ? { ...d, status } : d));
    const updatedTasks = generateBalancedStudyTasks(updatedDeadlines, data.tasks);
    const updatedData: AppData = { ...data, deadlines: updatedDeadlines, tasks: updatedTasks };
    setData(updatedData);
    saveAppData(updatedData);
  };

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = data.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const updatedData: AppData = { ...data, tasks: updatedTasks };
    setData(updatedData);
    saveAppData(updatedData);
  };

  const handleRebalance = () => {
    const newTasks = generateBalancedStudyTasks(data.deadlines, data.tasks);
    const updatedData: AppData = {
      ...data,
      tasks: newTasks,
      lastRebalanced: new Date().toISOString()
    };
    setData(updatedData);
    saveAppData(updatedData);
    alert('Sunday Night Re-Run completed! Study schedule balanced across available days.');
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-12 text-slate-100" suppressHydrationWarning>
      <Navbar onRebalance={handleRebalance} overloadedWeeksCount={overloadedWeeks.length} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Sparkles className="h-4 w-4" />
              <span>Smart Study Load Balancer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Course & Deadline Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {formatFriendlyDate(todayStr)} • {data.deadlines.filter(d => d.status === 'pending').length} active deadlines
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/deadlines"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add / Paste Deadlines</span>
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Courses ({data.courses.length})</span>
            </Link>
          </div>
        </div>

        {/* 3+ Overlap Warning Banner */}
        <OverlapWarningBanner overloadedWeeks={overloadedWeeks} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Deadlines</span>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {data.deadlines.filter(d => d.status !== 'completed').length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Today's Prep Hours</span>
              <CalendarDays className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {todaysTasks.reduce((sum, t) => sum + (t.completed ? 0 : t.allocatedHours), 0)} hrs
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Overloaded Weeks</span>
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {overloadedWeeks.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Completed Tasks</span>
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {data.tasks.filter(t => t.completed).length}
            </p>
          </div>
        </div>

        {/* Content Layout: Today's Tasks + Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Study Tasks */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-400" />
                Today's Study Plan
              </h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                {todaysTasks.length} tasks
              </span>
            </div>

            <div className="space-y-2.5">
              {todaysTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/40 mb-2" />
                  No study tasks scheduled for today! Enjoy your break or trigger a Sunday Re-Run.
                </div>
              ) : (
                todaysTasks.map(task => {
                  const course = data.courses.find(c => c.id === task.courseId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskToggle(task.id)}
                      className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                        task.completed
                          ? 'border-slate-800 bg-slate-900/40 opacity-60'
                          : 'border-slate-800 bg-slate-900 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTaskToggle(task.id);
                          }}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <p className={`text-xs font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </p>
                          {course && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {course.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {task.allocatedHours} hrs
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                Upcoming Deadlines
              </h2>
              <Link href="/deadlines" className="text-xs font-semibold text-indigo-400 hover:underline">
                View All ({data.deadlines.length})
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
                  No upcoming deadlines! Add deadlines from your course syllabus.
                </div>
              ) : (
                upcomingDeadlines.map(deadline => (
                  <DeadlineCard
                    key={deadline.id}
                    deadline={deadline}
                    courses={data.courses}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
