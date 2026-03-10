import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Verify that the request comes from an authenticated user.
 * Returns the user object if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth(): Promise<
  { user: { id: string; email?: string }; error?: never } |
  { user?: never; error: NextResponse }
> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { user: { id: user.id, email: user.email } };
  } catch {
    return { error: NextResponse.json({ error: 'Auth check failed' }, { status: 401 }) };
  }
}
