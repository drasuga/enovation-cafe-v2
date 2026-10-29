'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login');
      else setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin/login');
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (!ready) return <p style={{ padding: 20 }}>Chargement...</p>;

  return (
    <>
      <header className="header">
        <h1>Administration</h1>
        <p>Café Terrasse</p>
      </header>

      <nav className="admin-nav">
        <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
          Commandes
        </Link>
        <Link href="/admin/menu" className={pathname === '/admin/menu' ? 'active' : ''}>
          Menu
        </Link>
        <button onClick={logout}>Déconnexion</button>
      </nav>

      <main className="container admin-wide">{children}</main>
    </>
  );
}