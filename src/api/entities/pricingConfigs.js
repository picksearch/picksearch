import { supabase } from '../supabaseClient';

export const PricingConfig = {
  // Create a new pricing config
  create: async (data) => {
    const { data: config, error } = await supabase
      .from('pricing_configs')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return config;
  },

  // Get config by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update config
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('pricing_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete config
  delete: async (id) => {
    const { error } = await supabase
      .from('pricing_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter configs
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('pricing_configs').select('*');

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

  // Get all active configs
  getActive: async () => {
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('*')
      .eq('is_active', true)
      .order('price_per_response', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get all configs (for admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

export default PricingConfig;
