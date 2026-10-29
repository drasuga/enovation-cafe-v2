import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { syncPayment } from '@/lib/syncPayment';
import OrderActions from '@/components/OrderActions';

export const dynamic = 'force-dynamic';

const fmt = (n) => n.toLocaleString('fr-FR') + ' FCFA';

const STATUS = {
  pending_payment: 'En attente de paiement',
  paid: 'Payée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Servie',
  cancelled: 'Annulée',
};

async function loadOrder(id) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, table_number, total, status, payment_ref, order_items(name, price, quantity)')
    .eq('id', id)
    .single();
  return data;
}

export default async function OrderPage({ params }) {
  const { id } = await params;

  let order = await loadOrder(id);

  if (order && order.status === 'pending_payment') {
    const newStatus = await syncPayment(order);
    if (newStatus !== order.status) order = await loadOrder(id);
  }

  return (
    <>
      <header className="header">
        <h1>Café Terrasse</h1>
        <p>Enovation Factory</p>
      </header>

      <main className="container">
        {!order ? (
          <p>Commande introuvable.</p>
        ) : (
          <>
            <h2 className="category-title">
              {order.status === 'pending_payment' ? 'Finalisez votre paiement' : 'Votre commande'}
            </h2>
            <p>
              Table <strong>{order.table_number}</strong>
            </p>
            <p style={{ margin: '10px 0' }}>
              <span className="status-badge">{STATUS[order.status] || order.status}</span>
            </p>

            {order.order_items.map((l, i) => (
              <div className="line" key={i}>
                <span>
                  {l.quantity} × {l.name}
                </span>
                <span>{fmt(l.price * l.quantity)}</span>
              </div>
            ))}

            <div className="total-row">
              <span>Total</span>
              <span>{fmt(order.total)}</span>
            </div>

            <OrderActions orderId={order.id} status={order.status} />
          </>
        )}
      </main>
    </>
  );
}