import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPaymentStatus } from '@/lib/fapshi';

export async function syncPayment(order) {
  if (!order || order.status !== 'pending_payment' || !order.payment_ref) {
    return order?.status;
  }

  try {
    const tx = await getPaymentStatus(order.payment_ref);
    const s = String(tx.status || '').toUpperCase();

    if (s === 'SUCCESSFUL') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id)
        .eq('status', 'pending_payment');
      return 'paid';
    }

    if (s === 'FAILED' || s === 'EXPIRED') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('status', 'pending_payment');
      return 'cancelled';
    }
  } catch (err) {
    console.error('syncPayment error:', err);
  }

  return order.status;
}