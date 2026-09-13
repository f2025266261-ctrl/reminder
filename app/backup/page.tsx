'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { AppData } from '@/lib/types';
import { loadAppData, exportAppDataJSON, importAppDataJSON, clearAllData } from '@/lib/storage';
import { Download, Upload, Globe, RefreshCw, ShieldCheck, Copy, Check, Trash2 } from 'lucide-react';

export default function BackupPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <span>Loading backup &amp; export tools...</span>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    exportAppDataJSON(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importAppDataJSON(content);
      if (imported) {
        setData(imported);
        alert('Backup successfully imported! All courses and deadlines updated.');
      } else {
        alert('Error parsing backup file. Please ensure it is a valid StudyPulse JSON export.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all sample data? This will wipe demo courses and deadlines so you can start fresh.')) {
      const reset = clearAllData();
      setData(reset);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const gitCommands = `git init
git add .
git commit -m "Initial commit of StudyPulse Planner PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/study-planner.git
git push -u origin main`;

  const vercelCommands = `npm i -g vercel
vercel`;

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-12 text-slate-100" suppressHydrationWarning>
      <Navbar overloadedWeeksCount={0} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Data Protection &amp; Deployment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Backup, Sync &amp; Reset Data
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Export your data, clear sample demo entries to start fresh, or sync to GitHub and Vercel.
            </p>
          </div>

          <button
            onClick={handleClearData}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All Sample Data</span>
          </button>
        </div>

        {/* Grid Section 1: Backup & Restore */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Backup */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Export Local Backup</h2>
                <p className="text-xs text-slate-400">Download a full JSON file containing courses, deadlines, and tasks.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Courses:</span>
                <span className="font-bold text-white">{data.courses.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Deadlines:</span>
                <span className="font-bold text-white">{data.deadlines.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Study Tasks:</span>
                <span className="font-bold text-white">{data.tasks.length}</span>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Restore Backup</h2>
                <p className="text-xs text-slate-400">Upload a previously saved StudyPulse JSON backup file.</p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
              Upload `.json` backup file to restore all course schedules and deadline records.
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Select &amp; Upload JSON File</span>
            </button>
          </div>
        </div>

        {/* Grid Section 2: GitHub & Vercel Deployment Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub Guide */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Save Project in GitHub</h2>
                  <p className="text-xs text-slate-400">Initialize git repository and sync code to GitHub.</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-md"
              >
                {copiedCmd === 'git' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCmd === 'git' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
              {gitCommands}
            </pre>
          </div>

          {/* Vercel & Mobile PWA Deployment */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Deploy on Vercel &amp; Phone</h2>
                  <p className="text-xs text-slate-400">Production web application hosting + PWA setup.</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(vercelCommands, 'vercel')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-md"
              >
                {copiedCmd === 'vercel' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCmd === 'vercel' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">1</span>
                <p>Deploy to Vercel via GitHub auto-import or CLI (`npx vercel`).</p>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">2</span>
                <p>Open your Vercel web URL on your iPhone Safari or Android Chrome browser.</p>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">3</span>
                <p>Tap <strong>&quot;Share&quot;</strong> (Safari) or <strong>&quot;Options (3 dots)&quot;</strong> (Chrome) and select <strong>&quot;Add to Home Screen&quot;</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
