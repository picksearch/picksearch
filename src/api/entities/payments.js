import { supabase } from '../supabaseClient';

export const Payment = {
  // Create a new payment
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        ...data,
        user_id: data.user_id || user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return payment;
  },

  // Get payment by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update payment
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('payments')
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

  // Delete payment
  delete: async (id) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter payments
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('payments').select('*');

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

  // Get payments by user
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get my payments
  getMine: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    return Payment.getByUser(user.id);
  },

  // Get pending payments (for admin)
  getPending: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, profiles(email, full_name, custom_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Approve payment (admin)
  approve: async (id, adminNotes = '') => {
    return Payment.update(id, {
      status: 'approved',
      admin_notes: adminNotes
    });
  },

  // Reject payment (admin)
  reject: async (id, adminNotes = '') => {
    return Payment.update(id, {
      status: 'rejected',
      admin_notes: adminNotes
    });
  }
};

export default Payment;
