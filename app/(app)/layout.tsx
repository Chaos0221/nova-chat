import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AppShell
      conversations={conversations ?? []}
      userEmail={user?.email ?? ''}
      userAvatar={user?.user_metadata?.avatar_url ?? null}
    >
      {children}
    </AppShell>
  )
}
