import { supabase } from '../supabaseClient';

export const CreditTransaction = {
  // Create a new transaction
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: transaction, error } = await supabase
      .from('credit_transactions')
      .insert({
        ...data,
        user_id: data.user_id || user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transaction;
  },

  // Get transaction by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update transaction
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('credit_transactions')
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

  // Delete transaction
  delete: async (id) => {
    const { error } = await supabase
      .from('credit_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter transactions
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('credit_transactions').select('*');

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

  // Get transactions by user
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get my transactions
  getMine: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    return CreditTransaction.getByUser(user.id);
  },

  // Get pending transactions (for admin)
  getPending: async () => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*, profiles(email, full_name, custom_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Approve transaction (admin)
  approve: async (id, adminNotes = '') => {
    return CreditTransaction.update(id, {
      status: 'approved',
      admin_notes: adminNotes
    });
  },

  // Reject transaction (admin)
  reject: async (id, adminNotes = '') => {
    return CreditTransaction.update(id, {
      status: 'rejected',
      admin_notes: adminNotes
    });
  }
};

export default CreditTransaction;
