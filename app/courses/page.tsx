'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { AppData, Course } from '@/lib/types';
import { loadAppData, saveAppData } from '@/lib/storage';
import { BookOpen, Plus, Trash2, Edit2, RefreshCw, X, Palette, User } from 'lucide-react';

export default function CoursesPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Course Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState('bg-blue-500/10 text-blue-400 border-blue-500/20');

  useEffect(() => {
    setData(loadAppData());
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  const colorOptions = [
    { label: 'Blue', value: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Emerald', value: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { label: 'Amber', value: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { label: 'Purple', value: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { label: 'Rose', value: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { label: 'Cyan', value: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  ];

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    const newCourse: Course = {
      id: `c-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      color,
      instructor
    };

    const updatedCourses = [...data.courses, newCourse];
    const updatedData: AppData = { ...data, courses: updatedCourses };

    setData(updatedData);
    saveAppData(updatedData);
    setShowAddModal(false);
    
    setCode('');
    setName('');
    setInstructor('');
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? Associated deadlines will also be deleted.')) return;

    const updatedCourses = data.courses.filter(c => c.id !== courseId);
    const updatedDeadlines = data.deadlines.filter(d => d.courseId !== courseId);
    const updatedTasks = data.tasks.filter(t => t.courseId !== courseId);

    const updatedData: AppData = {
      ...data,
      courses: updatedCourses,
      deadlines: updatedDeadlines,
      tasks: updatedTasks
    };

    setData(updatedData);
    saveAppData(updatedData);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-12 text-slate-100">
      <Navbar overloadedWeeksCount={0} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Course Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Organize your academic courses and set color coding for your study plan.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Course</span>
          </button>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.courses.map(course => {
            const courseDeadlines = data.deadlines.filter(d => d.courseId === course.id);
            const pendingCount = courseDeadlines.filter(d => d.status !== 'completed').length;

            return (
              <div key={course.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${course.color}`}>
                    {course.code}
                  </span>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{course.name}</h3>
                  {course.instructor && (
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{course.instructor}</span>
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{courseDeadlines.length} Total Deadlines</span>
                  <span className="font-semibold text-indigo-400">{pendingCount} Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 101 or MATH 201"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Fundamentals"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instructor (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alan Turing"
                  value={instructor}
                  onChange={e => setInstructor(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setColor(opt.value)}
                      className={`rounded-lg p-2 text-xs font-bold border transition-all ${opt.value} ${
                        color === opt.value ? 'ring-2 ring-indigo-500' : 'opacity-70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
