import { supabase } from '../supabaseClient';

// Generate a random secret key
const generateSecretKey = () => {
  return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generate a completion secret code
const generateCompletionCode = () => {
  return 'SC' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const Survey = {
  // Create a new survey
  create: async (data) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('인증 오류: ' + authError.message);
    }

    if (!user) {
      console.error('No user found');
      throw new Error('로그인이 필요합니다');
    }

    const surveyData = {
      ...data,
      user_id: user.id,
      secret_key: data.secret_key || generateSecretKey(),
      completion_secret_code: data.completion_secret_code || generateCompletionCode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating survey with data:', surveyData);

    const { data: survey, error } = await supabase
      .from('surveys')
      .insert(surveyData)
      .select()
      .single();

    if (error) {
      console.error('Survey create error:', error);
      throw error;
    }

    console.log('Survey created:', survey);
    return survey;
  },

  // Get survey by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update survey
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('surveys')
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

  // Delete survey
  delete: async (id) => {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter surveys (mimics base44 SDK filter method)
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('surveys').select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Get surveys by user
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get my surveys
  getMine: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    return Survey.getByUser(user.id);
  },

  // Get live surveys
  getLive: async () => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', 'live')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get survey by secret key
  getBySecretKey: async (secretKey) => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('secret_key', secretKey)
      .single();

    if (error) throw error;
    return data;
  },

  // List all surveys (for admin)
  list: async (options = {}) => {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('surveys')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count };
  }
};

export default Survey;
