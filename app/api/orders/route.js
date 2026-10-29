import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();

    const table = String(body.tableNumber || '').trim().slice(0, 10);
    const name = String(body.customerName || '').trim().slice(0, 60);
    const phone = String(body.customerPhone || '').trim().slice(0, 20);
    const cart = Array.isArray(body.items) ? body.items : [];

    if (!table) {
      return NextResponse.json({ error: 'Numéro de table requis.' }, { status: 400 });
    }
    if (cart.length === 0 || cart.length > 50) {
      return NextResponse.json({ error: 'Panier invalide.' }, { status: 400 });
    }

    // Prices always come from the database, never from the browser
    const ids = cart.map((i) => i.id);
    const { data: dbItems, error: itemsError } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, price, is_available')
      .in('id', ids);
    if (itemsError) throw itemsError;

    const lines = [];
    let total = 0;

    for (const c of cart) {
      const qty = Number.parseInt(c.quantity, 10);
      const dbItem = dbItems.find((d) => d.id === c.id);

      if (!dbItem || !dbItem.is_available || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return NextResponse.json(
          { error: 'Un article est invalide ou indisponible.' },
          { status: 400 }
        );
      }

      total += dbItem.price * qty;
      lines.push({
        menu_item_id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
      });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        table_number: table,
        customer_name: name || null,
        customer_phone: phone || null,
        total,
      })
      .select('id')
      .single();
    if (orderError) throw orderError;

    const { error: linesError } = await supabaseAdmin
      .from('order_items')
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));

    if (linesError) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw linesError;
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error('Order error:', err);
    return NextResponse.json({ error: 'Erreur serveur. Réessayez.' }, { status: 500 });
  }
}