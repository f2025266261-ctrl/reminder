'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DeadlineCard from '@/components/DeadlineCard';
import { AppData, Deadline, Priority } from '@/lib/types';
import { loadAppData, saveAppData, clearAllData } from '@/lib/storage';
import { parsePastedSyllabus, generateBalancedStudyTasks, formatDate } from '@/lib/planner';
import { Plus, Search, FileText, RefreshCw, X, Sparkles, Trash2 } from 'lucide-react';

export default function DeadlinesPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('4');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const loaded = loadAppData();
    setData(loaded);
    if (loaded.courses.length > 0) {
      setCourseId(loaded.courses[0].id);
    }
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    setDueDate(formatDate(defaultDue));
  }, []);

  if (!mounted || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
          <span>Loading deadlines...</span>
        </div>
      </div>
    );
  }

  const filteredDeadlines = data.deadlines.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCourse = selectedCourse === 'all' || d.courseId === selectedCourse;
    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleStatusChange = (id: string, status: Deadline['status']) => {
    const updatedDeadlines = data.deadlines.map(d => (d.id === id ? { ...d, status } : d));
    const updatedTasks = generateBalancedStudyTasks(updatedDeadlines, data.tasks);
    const updatedData: AppData = { ...data, deadlines: updatedDeadlines, tasks: updatedTasks };
    setData(updatedData);
    saveAppData(updatedData);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this deadline?')) return;
    const updatedDeadlines = data.deadlines.filter(d => d.id !== id);
    const updatedTasks = data.tasks.filter(t => t.deadlineId !== id);
    const updatedData: AppData = { ...data, deadlines: updatedDeadlines, tasks: updatedTasks };
    setData(updatedData);
    saveAppData(updatedData);
  };

  const handleOpenAdd = () => {
    setEditingDeadline(null);
    setTitle('');
    setNotes('');
    setEstimatedHours('4');
    setPriority('medium');
    setCourseId(data.courses[0]?.id || '');
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    setDueDate(formatDate(defaultDue));
    setShowAddModal(true);
  };

  const handleOpenEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setTitle(deadline.title);
    setCourseId(deadline.courseId);
    setDueDate(deadline.dueDate);
    setEstimatedHours(String(deadline.estimatedHours));
    setPriority(deadline.priority);
    setNotes(deadline.notes || '');
    setShowAddModal(true);
  };

  const handleSaveDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    let updatedDeadlines: Deadline[];

    if (editingDeadline) {
      updatedDeadlines = data.deadlines.map(d => 
        d.id === editingDeadline.id
          ? {
              ...d,
              title,
              courseId: courseId || data.courses[0]?.id || '',
              dueDate,
              estimatedHours: parseFloat(estimatedHours) || 4,
              priority,
              notes
            }
          : d
      );
    } else {
      const newDeadline: Deadline = {
        id: `d-${Date.now()}`,
        courseId: courseId || data.courses[0]?.id || '',
        title,
        dueDate,
        estimatedHours: parseFloat(estimatedHours) || 4,
        priority,
        status: 'pending',
        notes,
        createdAt: new Date().toISOString()
      };
      updatedDeadlines = [...data.deadlines, newDeadline];
    }

    const updatedTasks = generateBalancedStudyTasks(updatedDeadlines, data.tasks);
    const updatedData: AppData = { ...data, deadlines: updatedDeadlines, tasks: updatedTasks };

    setData(updatedData);
    saveAppData(updatedData);
    setShowAddModal(false);
    setEditingDeadline(null);
  };

  const handleParseSyllabus = () => {
    if (!pastedText.trim()) return;

    const { deadlines: parsedList } = parsePastedSyllabus(pastedText, data.courses);
    if (parsedList.length === 0) {
      alert('Could not detect deadlines in pasted text. Please make sure dates and assignment names are included.');
      return;
    }

    const newDeadlines: Deadline[] = parsedList.map((item, idx) => ({
      id: `d-pasted-${Date.now()}-${idx}`,
      courseId: item.courseId || data.courses[0]?.id || '',
      title: item.title || 'Assignment',
      dueDate: item.dueDate || formatDate(new Date()),
      estimatedHours: item.estimatedHours || 4,
      priority: item.priority || 'medium',
      status: 'pending',
      notes: item.notes || 'Parsed from syllabus paste',
      createdAt: new Date().toISOString()
    }));

    const updatedDeadlines = [...data.deadlines, ...newDeadlines];
    const updatedTasks = generateBalancedStudyTasks(updatedDeadlines, data.tasks);
    const updatedData: AppData = { ...data, deadlines: updatedDeadlines, tasks: updatedTasks };

    setData(updatedData);
    saveAppData(updatedData);
    setShowPasteModal(false);
    setPastedText('');
    alert(`Successfully parsed and added ${newDeadlines.length} deadlines!`);
  };

  const handleClearSampleData = () => {
    if (confirm('Clear all sample courses, deadlines, and study tasks to start completely fresh?')) {
      const emptyData = clearAllData();
      setData(emptyData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-12 text-slate-100" suppressHydrationWarning>
      <Navbar overloadedWeeksCount={0} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Assignments &amp; Deadlines
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Add your own course deadlines or paste your syllabus text to auto-create assignments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearSampleData}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Clear pre-populated demo data"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Sample Data</span>
            </button>

            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 px-3.5 py-2 text-xs sm:text-sm font-semibold text-purple-300 hover:bg-purple-600/30 transition-colors"
            >
              <FileText className="h-4 w-4 text-purple-400" />
              <span>Paste Syllabus Text</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Deadline</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search assignments or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Courses ({data.courses.length})</option>
              {data.courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Deadline Grid */}
        <div className="space-y-3">
          {filteredDeadlines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400">
              <FileText className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <p className="font-semibold text-slate-300">No deadlines added yet.</p>
              <p className="text-xs text-slate-500 mt-1">Click &quot;Add Deadline&quot; or &quot;Paste Syllabus Text&quot; above to create your deadlines.</p>
            </div>
          ) : (
            filteredDeadlines.map(deadline => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                courses={data.courses}
                onStatusChange={handleStatusChange}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </main>

      {/* Add / Edit Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingDeadline ? 'Edit Deadline' : 'Add New Deadline'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeadline} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus Midterm Exam"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {data.courses.length === 0 && (
                      <option value="">(No courses created)</option>
                    )}
                    {data.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. Prep Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Optional details, submission link..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
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
                  Save Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Syllabus Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Paste Syllabus / Deadlines Text</h3>
              </div>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste course deadlines or syllabus text below. The parser extracts assignment titles, course codes, due dates, and preparation hours automatically.
            </p>

            <textarea
              rows={6}
              placeholder={`Example format:\nCS101 Problem Set 3 due 2026-09-28 5 hours\nMATH201 Calculus Midterm Exam due Oct 12 8 hrs`}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleParseSyllabus}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500"
              >
                Parse &amp; Add Deadlines
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
