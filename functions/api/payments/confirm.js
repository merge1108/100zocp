export async function onRequestPost({ request, env }) {
  try {
    const { paymentKey, orderId, amount } = await request.json();
    if (!paymentKey || !orderId || !amount) {
      return new Response(JSON.stringify({ message: 'Invalid parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const secretKey = env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return new Response(JSON.stringify({ message: 'Server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const auth = btoa(`${secretKey}:`);
    const res = await fetch('https://api.tosspayments.com/v2/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) })
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ message: e?.message || 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

