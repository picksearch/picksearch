import { supabase } from '../supabaseClient';

export const CoinTransaction = {
  // Create a new coin transaction
  create: async (data) => {
    const { data: transaction, error } = await supabase
      .from('coin_transactions')
      .insert({
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's coin balance if transaction is adding coins
    if (data.amount > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('search_coins')
        .eq('id', data.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            search_coins: (profile.search_coins || 0) + data.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user_id);
      }
    }

    return transaction;
  },

  // Get transaction by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Filter transactions
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('coin_transactions').select('*');

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
      .from('coin_transactions')
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

    return CoinTransaction.getByUser(user.id);
  },

  // Grant coins to user (admin)
  grantCoins: async (userId, amount, description = 'Admin grant') => {
    return CoinTransaction.create({
      user_id: userId,
      amount,
      transaction_type: 'admin_grant',
      description
    });
  },

  // Process referral bonus
  processReferralBonus: async (referrerId, referredId) => {
    // Grant bonus to referrer
    await CoinTransaction.create({
      user_id: referrerId,
      amount: 3,
      transaction_type: 'referral_bonus',
      description: 'Referral bonus',
      related_user_id: referredId
    });

    // Grant bonus to referred user
    await CoinTransaction.create({
      user_id: referredId,
      amount: 10,
      transaction_type: 'referred_bonus',
      description: 'Welcome bonus (referred)',
      related_user_id: referrerId
    });
  },

  // Use coins
  useCoins: async (userId, amount, description = 'Usage') => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('search_coins')
      .eq('id', userId)
      .single();

    if (!profile || profile.search_coins < amount) {
      throw new Error('Insufficient coins');
    }

    // Create usage transaction
    const transaction = await CoinTransaction.create({
      user_id: userId,
      amount: -amount,
      transaction_type: 'usage',
      description
    });

    // Update user's coin balance
    await supabase
      .from('profiles')
      .update({
        search_coins: profile.search_coins - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return transaction;
  }
};

export default CoinTransaction;
