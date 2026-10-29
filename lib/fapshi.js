const BASE = process.env.FAPSHI_API_KEY?.startsWith('FAK_TEST_')
  ? 'https://sandbox.fapshi.com'
  : 'https://live.fapshi.com';

function headers() {
  return {
    'Content-Type': 'application/json',
    apiuser: process.env.FAPSHI_API_USER,
    apikey: process.env.FAPSHI_API_KEY,
  };
}

export async function initiatePay({ amount, externalId, redirectUrl, message }) {
  const res = await fetch(`${BASE}/initiate-pay`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ amount, externalId, redirectUrl, message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Fapshi error ${res.status}`);
  return data; // contains { link, transId }
}

export async function getPaymentStatus(transId) {
  const res = await fetch(`${BASE}/payment-status/${transId}`, {
    headers: headers(),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Fapshi error ${res.status}`);
  return data; // contains { status, ... }
}