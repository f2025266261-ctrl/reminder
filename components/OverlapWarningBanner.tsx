'use client';

import { WeekPlan } from '@/lib/types';
import { AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface OverlapWarningBannerProps {
  overloadedWeeks: WeekPlan[];
}

export default function OverlapWarningBanner({ overloadedWeeks }: OverlapWarningBannerProps) {
  if (!overloadedWeeks || overloadedWeeks.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-300">
                Heavy Load Warning: 3+ Overlapping Deadlines Flagged!
              </h3>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/30">
                {overloadedWeeks.length} {overloadedWeeks.length === 1 ? 'Week' : 'Weeks'} Flagged
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              You have weeks with 3 or more major course deadlines overlapping. We recommend using Sunday Re-Run to distribute your preparation tasks earlier.
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {overloadedWeeks.map((week) => (
                <div key={week.weekKey} className="flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{week.weekLabel}:</span>
                  <span className="text-white font-bold">{week.deadlineCount} Deadlines</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/planner"
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-colors"
        >
          <span>View Weekly Plan</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
