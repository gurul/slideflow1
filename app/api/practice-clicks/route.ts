import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('practice_clicks')
    .select('count')
    .eq('id', 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.count ?? 0 });
}

export async function POST() {
  // Use the increment function for atomic update
  const { data, error } = await supabase.rpc('increment', { x: 1 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // The function returns the new count
  return NextResponse.json({ count: data });
} 