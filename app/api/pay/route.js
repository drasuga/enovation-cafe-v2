import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { initiatePay } from '@/lib/fapshi';

export async function POST(request) {
  try {
    const { orderId } = await request.json();

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, total, table_number, status')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    }
    if (order.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Cette commande ne peut plus être payée.' }, { status: 400 });
    }

    const site = process.env.SITE_URL;

    const pay = await initiatePay({
      amount: order.total,
      externalId: order.id,
      redirectUrl: `${site}/order/${order.id}`,
      message: `Commande table ${order.table_number}`,
    });

    await supabaseAdmin
      .from('orders')
      .update({ payment_method: 'fapshi', payment_ref: pay.transId })
      .eq('id', order.id);

    return NextResponse.json({ link: pay.link });
  } catch (err) {
    console.error('Pay error:', err);
    return NextResponse.json({ error: 'Paiement indisponible. Réessayez.' }, { status: 500 });
  }
}