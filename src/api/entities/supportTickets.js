import { supabase } from '../supabaseClient';

export const SupportTicket = {
  // Create a new ticket
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ...data,
        user_id: user?.id,
        user_email: data.user_email || user?.email,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return ticket;
  },

  // Get ticket by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update ticket
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('support_tickets')
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

  // Delete ticket
  delete: async (id) => {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter tickets
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('support_tickets').select('*');

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

  // Get my tickets
  getMine: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all tickets (for admin)
  getAll: async (status = null) => {
    let query = supabase
      .from('support_tickets')
      .select('*, profiles(email, full_name, custom_name)');

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Get open tickets count
  getOpenCount: async () => {
    const { count, error } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (error) throw error;
    return count || 0;
  },

  // Respond to ticket (admin)
  respond: async (id, response) => {
    return SupportTicket.update(id, {
      admin_response: response,
      status: 'resolved'
    });
  }
};

export default SupportTicket;
