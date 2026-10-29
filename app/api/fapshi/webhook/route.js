import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { syncPayment } from '@/lib/syncPayment';

export async function POST(request) {
  try {
    const body = await request.json();
    const transId = body?.transId;
    if (!transId || typeof transId !== 'string') {
      return NextResponse.json({ ok: true });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_ref')
      .eq('payment_ref', transId)
      .single();

    if (order) await syncPayment(order);
  } catch (err) {
    console.error('Webhook error:', err);
  }
  return NextResponse.json({ ok: true });
}