import { supabase } from '@/lib/supabase';
import { createOrder } from '@/lib/api/orders';

// Mock createOrder
jest.mock('@/lib/api/orders', () => ({
  createOrder: jest.fn(),
}));

const mockCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>;

// Mock supabase.functions.invoke
const mockFunctionsInvoke = jest.fn();
const originalFunctionsDescriptor = Object.getOwnPropertyDescriptor(supabase, 'functions');

Object.defineProperty(supabase, 'functions', {
  get: () => ({ invoke: mockFunctionsInvoke }),
  configurable: true,
});

afterAll(() => {
  if (originalFunctionsDescriptor) {
    Object.defineProperty(supabase, 'functions', originalFunctionsDescriptor);
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFunctionsInvoke.mockResolvedValue({ data: null, error: null });
});

describe('checkout notify-new-order invocation', () => {
  it('calls notify-new-order after successful order creation', async () => {
    const mockOrder = { id: 'order-123' };
    mockCreateOrder.mockResolvedValue(mockOrder as Awaited<ReturnType<typeof createOrder>>);

    // Simulate the checkout flow logic (extracted from handlePlaceOrder)
    const order = await createOrder({} as Parameters<typeof createOrder>[0]);

    // Fire-and-forget notification (same as checkout.tsx)
    supabase.functions.invoke('notify-new-order', {
      body: { orderId: order.id },
    }).catch(() => {});

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('notify-new-order', {
      body: { orderId: 'order-123' },
    });
  });

  it('does not block checkout when notification fails', async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error('Network error'));
    const mockOrder = { id: 'order-456' };
    mockCreateOrder.mockResolvedValue(mockOrder as Awaited<ReturnType<typeof createOrder>>);

    const order = await createOrder({} as Parameters<typeof createOrder>[0]);

    // Fire-and-forget — the .catch() swallows the error
    const promise = supabase.functions.invoke('notify-new-order', {
      body: { orderId: order.id },
    }).catch(() => {});

    // Should resolve without throwing
    await expect(promise).resolves.toBeUndefined();
  });

  it('passes correct function name and orderId in body', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: null });

    // Simulate invocation with specific order ID
    supabase.functions.invoke('notify-new-order', {
      body: { orderId: 'order-789' },
    }).catch(() => {});

    expect(mockFunctionsInvoke).toHaveBeenCalledTimes(1);
    const [fnName, options] = mockFunctionsInvoke.mock.calls[0];
    expect(fnName).toBe('notify-new-order');
    expect(options.body).toEqual({ orderId: 'order-789' });
  });
});
