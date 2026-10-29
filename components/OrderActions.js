'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderActions({ orderId, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'pending_payment') return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [status, router]);

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Paiement indisponible.');
      window.location.href = data.link;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (status === 'pending_payment') {
    return (
      <>
        {error && <p className="error">{error}</p>}
        <button className="primary-btn" onClick={pay} disabled={loading}>
          {loading ? 'Redirection...' : 'Payer maintenant'}
        </button>
      </>
    );
  }

  if (status === 'cancelled') {
    return (
      <a href="/" className="primary-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
        Retour au menu
      </a>
    );
  }

  return null;
}