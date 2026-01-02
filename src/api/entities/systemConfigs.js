import { supabase } from '../supabaseClient';

export const SystemConfig = {
  // Create or update a config
  set: async (key, value, description = '') => {
    const { data: existing } = await supabase
      .from('system_configs')
      .select('id')
      .eq('key', key)
      .single();

    if (existing) {
      return SystemConfig.update(existing.id, { value, description });
    }

    const { data, error } = await supabase
      .from('system_configs')
      .insert({
        key,
        value,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get config by key
  get: async (key) => {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.value;
  },

  // Get config by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update config
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('system_configs')
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
      .from('system_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter configs
  filter: async (filters = {}, orderBy = 'key', ascending = true) => {
    let query = supabase.from('system_configs').select('*');

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

  // Get all configs
  getAll: async () => {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

export default SystemConfig;
