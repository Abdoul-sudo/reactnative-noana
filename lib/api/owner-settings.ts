import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type RestaurantRow = Database['public']['Tables']['restaurants']['Row'];

// ── Types ───────────────────────────────────────────────

export type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

export type OperatingHours = Record<string, DaySchedule>;

export type RestaurantSettings = {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  cuisineType: string | null;
  priceRange: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  deliveryFee: number | null;
  deliveryRadiusKm: number | null;
  minimumOrder: number | null;
  deliveryTimeMin: number | null;
  operatingHours: OperatingHours | null;
  isOpen: boolean;
};

const WEEKDAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;

function parseOperatingHours(raw: unknown): OperatingHours | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const result: OperatingHours = {};
  const obj: Record<string, unknown> = Object.assign({}, raw);

  for (const day of WEEKDAYS) {
    const dayData = obj[day];
    if (dayData && typeof dayData === 'object' && !Array.isArray(dayData)) {
      const d: Record<string, unknown> = Object.assign({}, dayData);
      result[day] = {
        open: typeof d.open === 'string' ? d.open : '09:00',
        close: typeof d.close === 'string' ? d.close : '22:00',
        closed: typeof d.closed === 'boolean' ? d.closed : false,
      };
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function mapRestaurantSettings(row: RestaurantRow): RestaurantSettings {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    logoUrl: row.logo_url,
    cuisineType: row.cuisine_type,
    priceRange: row.price_range,
    phone: row.phone,
    website: row.website,
    address: row.address,
    deliveryFee: row.delivery_fee,
    deliveryRadiusKm: row.delivery_radius_km,
    minimumOrder: row.minimum_order,
    deliveryTimeMin: row.delivery_time_min,
    operatingHours: parseOperatingHours(row.operating_hours),
    isOpen: row.is_open ?? true,
  };
}

// ── API Functions ───────────────────────────────────────

export async function fetchRestaurantSettings(
  restaurantId: string,
): Promise<RestaurantSettings> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return mapRestaurantSettings(data);
}

export async function updateRestaurantInfo(
  restaurantId: string,
  info: {
    name: string;
    description: string | null;
    coverImageUrl?: string | null;
    logoUrl?: string | null;
  },
): Promise<void> {
  const updates: Record<string, unknown> = {
    name: info.name,
    description: info.description || null,
    updated_at: new Date().toISOString(),
  };

  if (info.coverImageUrl !== undefined) {
    updates.cover_image_url = info.coverImageUrl;
  }
  if (info.logoUrl !== undefined) {
    updates.logo_url = info.logoUrl;
  }

  const { error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function updateOperatingHours(
  restaurantId: string,
  hours: OperatingHours,
): Promise<void> {
  const { error } = await supabase
    .from('restaurants')
    .update({
      operating_hours: hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', restaurantId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function updateDeliverySettings(
  restaurantId: string,
  settings: {
    deliveryRadiusKm: number;
    deliveryFee: number;
    minimumOrder: number;
  },
): Promise<void> {
  const { error } = await supabase
    .from('restaurants')
    .update({
      delivery_radius_km: settings.deliveryRadiusKm,
      delivery_fee: settings.deliveryFee,
      minimum_order: settings.minimumOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', restaurantId)
    .is('deleted_at', null);

  if (error) throw error;
}
