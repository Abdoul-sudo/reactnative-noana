import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type Address = Tables<'addresses'>;

export type CreateAddressInput = {
  user_id: string;
  label: string;
  address: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
};

/**
 * Fetch all addresses for a user. Default address listed first.
 */
export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Create a new saved address.
 */
export async function createAddress(
  address: CreateAddressInput,
): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .insert(address)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an existing address (partial update).
 */
export async function updateAddress(
  addressId: string,
  updates: Partial<CreateAddressInput>,
): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete an address permanently (hard delete).
 */
export async function deleteAddress(addressId: string): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);
  if (error) throw error;
}
