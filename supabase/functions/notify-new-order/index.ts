import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Extract caller user ID from JWT for authorization
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    let callerId: string;
    try {
      const jwtPayload = JSON.parse(atob(payloadSegment));
      callerId = jwtPayload.sub;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Service role client for DB queries (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, restaurant_id, items, total')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Verify caller is the order creator
    if (order.user_id !== callerId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch restaurant to get owner_id
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('owner_id')
      .eq('id', order.restaurant_id)
      .single();

    if (!restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch owner's push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', restaurant.owner_id)
      .single();

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ message: 'No push token registered' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build notification with order summary
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    const title = 'New Order!';
    const body = `${itemCount} item${itemCount !== 1 ? 's' : ''} — ${order.total} DA`;

    await sendPush(profile.push_token, title, body, {
      orderId: order.id,
      type: 'new_order',
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
