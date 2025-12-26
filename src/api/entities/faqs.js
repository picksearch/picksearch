import { supabase } from '../supabaseClient';

export const FAQ = {
  // Create a new FAQ
  create: async (data) => {
    const { data: faq, error } = await supabase
      .from('faqs')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return faq;
  },

  // Get FAQ by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update FAQ
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('faqs')
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

  // Delete FAQ
  delete: async (id) => {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter FAQs
  filter: async (filters = {}, orderBy = 'order', ascending = true) => {
    let query = supabase.from('faqs').select('*');

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

  // Get all active FAQs
  getActive: async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get FAQs by category
  getByCategory: async (category) => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get all FAQs (for admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

export default FAQ;
