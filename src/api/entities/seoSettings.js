import { supabase } from '../supabaseClient';

export const SEOSetting = {
  // Create a new SEO setting
  create: async (data) => {
    const { data: setting, error } = await supabase
      .from('seo_settings')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return setting;
  },

  // Get setting by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get setting by page path
  getByPath: async (pagePath) => {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('page_path', pagePath)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update setting
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('seo_settings')
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

  // Upsert setting (create or update by page path)
  upsert: async (pagePath, data) => {
    const existing = await SEOSetting.getByPath(pagePath);

    if (existing) {
      return SEOSetting.update(existing.id, data);
    }

    return SEOSetting.create({
      page_path: pagePath,
      ...data
    });
  },

  // Delete setting
  delete: async (id) => {
    const { error } = await supabase
      .from('seo_settings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter settings
  filter: async (filters = {}, orderBy = 'page_path', ascending = true) => {
    let query = supabase.from('seo_settings').select('*');

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

  // Get all settings (for admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('*')
      .order('page_path', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

export default SEOSetting;
