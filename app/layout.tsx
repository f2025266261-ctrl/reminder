import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyPulse - Assignment Tracker & Weekly Study Planner',
  description: 'Track course deadlines, balance weekly study load, parse syllabi, and re-run study plans every Sunday night.',
  manifest: '/manifest.json',
  themeColor: '#0b0f17',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StudyPulse',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
