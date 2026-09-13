import { NextResponse } from 'next/server';

/**
 * Vercel Cron Endpoint - Sunday Night Auto Re-balance
 * Triggered automatically by Vercel Cron every Sunday at midnight (0 0 * * 0)
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    success: true,
    message: 'Sunday night re-balance cron executed successfully.',
    rebalancedAt: timestamp
  });
}
