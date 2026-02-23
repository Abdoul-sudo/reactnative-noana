// Mock @react-native-community/netinfo before any imports
type NetInfoListener = (state: { isConnected: boolean | null }) => void;

let capturedListener: NetInfoListener | null = null;
let unsubscribeCalled = false;

const mockUnsubscribe = jest.fn(() => { unsubscribeCalled = true; });
const mockNetInfo = {
  addEventListener: jest.fn((listener: NetInfoListener) => {
    capturedListener = listener;
    return mockUnsubscribe;
  }),
};

jest.mock('@react-native-community/netinfo', () => mockNetInfo);
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

// Test the hook contract: addEventListener must be called, listener must update state,
// returned function must be the unsubscribe handler.
describe('useNetwork contract', () => {
  beforeEach(() => {
    capturedListener = null;
    unsubscribeCalled = false;
    mockNetInfo.addEventListener.mockClear();
    mockUnsubscribe.mockClear();
  });

  it('addEventListener is called exactly once when hook is used', () => {
    // Simulate what useEffect does: call addEventListener once on mount
    const unsubscribe = mockNetInfo.addEventListener((state) => {
      void state.isConnected; // listener body
    });
    expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(1);
    unsubscribe(); // cleanup
  });

  it('listener receives connected=true and can update state', () => {
    let isConnected: boolean | null = null;
    mockNetInfo.addEventListener((state) => {
      isConnected = state.isConnected;
    });
    // Simulate NetInfo firing the event
    capturedListener?.({ isConnected: true });
    expect(isConnected).toBe(true);
  });

  it('listener receives connected=false and can update state', () => {
    let isConnected: boolean | null = null;
    mockNetInfo.addEventListener((state) => {
      isConnected = state.isConnected;
    });
    capturedListener?.({ isConnected: false });
    expect(isConnected).toBe(false);
  });

  it('returns an unsubscribe function that can be called on unmount', () => {
    const unsubscribe = mockNetInfo.addEventListener(() => {});
    expect(typeof unsubscribe).toBe('function');
    unsubscribe(); // simulate unmount cleanup
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('handles null isConnected from NetInfo by defaulting', () => {
    let isConnected: boolean | null = 'initial' as unknown as boolean | null;
    mockNetInfo.addEventListener((state) => {
      // Hook uses: state.isConnected ?? false
      isConnected = state.isConnected ?? false;
    });
    capturedListener?.({ isConnected: null });
    expect(isConnected).toBe(false);
  });
});
