import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // shared_profilesにレコードがなければ作成
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: existing } = await supabase.from('shared_profiles').select('id').eq('id', user.id).single()
          if (!existing) {
            const displayName = user.user_metadata?.full_name || user.user_metadata?.name || ''
            await supabase.from('shared_profiles').insert({
              id: user.id,
              display_name: displayName || (user.email ? user.email.split('@')[0] : ''),
              updated_at: new Date().toISOString(),
            })
          }
        }
      } catch (e) {
        console.warn('shared_profiles init error:', e)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
