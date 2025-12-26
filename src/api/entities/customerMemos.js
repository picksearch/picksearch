import { supabase } from '../supabaseClient';

export const CustomerMemo = {
  // Create a new memo
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: memo, error } = await supabase
      .from('customer_memos')
      .insert({
        ...data,
        admin_id: user?.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return memo;
  },

  // Get memo by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('customer_memos')
      .select('*, profiles:admin_id(email, full_name, custom_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update memo
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('customer_memos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete memo
  delete: async (id) => {
    const { error } = await supabase
      .from('customer_memos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter memos
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('customer_memos').select('*, profiles:admin_id(email, full_name, custom_name)');

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Get memos by user
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('customer_memos')
      .select('*, profiles:admin_id(email, full_name, custom_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

export default CustomerMemo;
