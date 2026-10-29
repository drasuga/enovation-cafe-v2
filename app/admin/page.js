'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const fmt = (n) => n.toLocaleString('fr-FR') + ' FCFA';

const COLUMNS = [
  { status: 'paid', title: 'Nouvelles', next: 'preparing', action: 'Préparer' },
  { status: 'preparing', title: 'En préparation', next: 'ready', action: 'Prête' },
  { status: 'ready', title: 'Prêtes à servir', next: 'delivered', action: 'Servie' },
];

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.7 3A6 6 0 0 1 18 8c0 2.7.4 4.8.9 6.3" />
      <path d="M17 17H3s3-2 3-9c0-.7.1-1.3.3-1.9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function beep(ctx) {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.25;
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [soundOn, setSoundOn] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const audioRef = useRef(null);
  const soundRef = useRef(false);
  const knownPaid = useRef(null);

  const unlock = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => setUnlocked(ctx.state === 'running'));
      } else {
        setUnlocked(ctx.state === 'running');
      }
    } catch {}
  }, []);

  // Remember the sound choice across refreshes
  useEffect(() => {
    try {
      if (localStorage.getItem('kitchenSound') === 'on') setSoundOn(true);
    } catch {}
  }, []);

  // When sound is on, the first tap/click/key anywhere unlocks audio
  useEffect(() => {
    soundRef.current = soundOn;
    if (!soundOn) return;
    const handler = () => unlock();
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [soundOn, unlock]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, table_number, customer_name, total, status, created_at, order_items(name, quantity)')
      .in('status', ['paid', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    const list = data || [];
    const paidIds = list.filter((o) => o.status === 'paid').map((o) => o.id);

    if (
      soundRef.current &&
      knownPaid.current &&
      paidIds.some((id) => !knownPaid.current.has(id))
    ) {
      beep(audioRef.current);
    }
    knownPaid.current = new Set(paidIds);
    setOrders(list);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();

    const timer = setInterval(load, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [load]);

  function toggleSound() {
    if (soundOn) {
      setSoundOn(false);
      try { localStorage.setItem('kitchenSound', 'off'); } catch {}
      return;
    }
    try { localStorage.setItem('kitchenSound', 'on'); } catch {}
    setSoundOn(true);
    unlock();
    beep(audioRef.current);
  }

  async function setStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id);
    load();
  }

  async function cancel(id) {
    if (!confirm('Annuler cette commande ?')) return;
    setStatus(id, 'cancelled');
  }

  return (
    <>
      <div className="orders-top">
        <h2 className="category-title" style={{ margin: 0 }}>Commandes en cours</h2>
        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-icon" onClick={toggleSound}>
            {soundOn ? <BellIcon /> : <BellOffIcon />}
            {soundOn ? 'Son activé' : 'Son désactivé'}
          </button>
          {soundOn && !unlocked && (
            <div className="muted" style={{ marginTop: 4 }}>
              Touchez la page une fois pour réactiver le son.
            </div>
          )}
        </div>
      </div>

      <div className="columns">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <div className="column" key={col.status}>
              <h3>
                {col.title} ({list.length})
              </h3>
              {list.length === 0 && <p className="muted">Aucune commande</p>}
              {list.map((o) => (
                <div className="order-card" key={o.id}>
                  <div className="order-head">
                    <strong>Table {o.table_number}</strong>
                    <span className="muted">
                      {new Date(o.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {o.customer_name && <div className="muted">{o.customer_name}</div>}
                  <ul>
                    {o.order_items.map((l, i) => (
                      <li key={i}>
                        {l.quantity} × {l.name}
                      </li>
                    ))}
                  </ul>
                  <div className="order-foot">
                    <span className="price">{fmt(o.total)}</span>
                    <div>
                      <button className="btn" onClick={() => setStatus(o.id, col.next)}>
                        {col.action}
                      </button>
                      <button className="btn btn-ghost" onClick={() => cancel(o.id)}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <Orders />
    </AdminShell>
  );
}