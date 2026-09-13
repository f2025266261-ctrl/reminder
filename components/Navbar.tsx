'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, BookOpen, Clock, Download, RefreshCw, Bell } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission, sendBrowserNotification, triggerTestNotification } from '@/lib/notifications';

interface NavbarProps {
  onRebalance?: () => void;
  overloadedWeeksCount?: number;
}

export default function Navbar({ onRebalance, overloadedWeeksCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      sendBrowserNotification('🔔 Notifications Enabled!', 'StudyPulse will remind you of upcoming deadlines and Sunday night study plans.');
    } else {
      alert('Notifications were not granted. Please enable notification permissions in your browser address bar.');
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/planner', label: 'Weekly Planner', icon: CalendarDays, badge: overloadedWeeksCount > 0 ? overloadedWeeksCount : undefined },
    { href: '/deadlines', label: 'Deadlines', icon: Clock },
    { href: '/courses', label: 'Courses & Syllabus', icon: BookOpen },
    { href: '/backup', label: 'Backup & Sync', icon: Download },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                StudyPulse
              </span>
              <span className="ml-2 hidden text-xs font-semibold text-indigo-400 sm:inline-block bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                PWA Ready
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400 font-semibold shadow-inner'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500/20 px-1 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <button
              onClick={notifPermission === 'granted' ? triggerTestNotification : handleEnableNotifications}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                notifPermission === 'granted'
                  ? 'bg-slate-900 text-emerald-400 border-emerald-500/30 hover:bg-slate-800'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title={notifPermission === 'granted' ? 'Notifications active! Click to send test alert.' : 'Enable browser notifications'}
            >
              <Bell className={`h-4 w-4 ${notifPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400 animate-bounce'}`} />
              <span className="hidden sm:inline">
                {notifPermission === 'granted' ? 'Alerts Active' : 'Enable Notifications'}
              </span>
            </button>

            {onRebalance && (
              <button
                onClick={onRebalance}
                className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all"
                title="Recalculate study load & re-balance schedule"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sunday Re-Run</span>
                <span className="sm:hidden">Re-run</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center space-y-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
