import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/push.ts';

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Your order has been confirmed!',
  preparing: 'Your order is being prepared!',
  on_the_way: 'Your order is on the way!',
  delivered: 'Your order has been delivered!',
};

Deno.serve(async (req) => {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Create Supabase client with service_role key (server-side)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch order with restaurant name
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, user_id, restaurants:restaurant_id(name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get customer's push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', order.user_id)
      .single();

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ message: 'No push token registered' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build and send notification
    const restaurantName = (order.restaurants as { name: string }).name;
    const title = restaurantName;
    const body = STATUS_LABELS[order.status] ?? `Order status: ${order.status}`;

    await sendPush(profile.push_token, title, body, {
      orderId: order.id,
      status: order.status,
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
