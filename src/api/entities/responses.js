import { supabase } from '../supabaseClient';

export const Response = {
  // Create a new response
  create: async (data) => {
    const { data: response, error } = await supabase
      .from('responses')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return response;
  },

  // Get response by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update response
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('responses')
      .update({
        ...updates,
        last_activity: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete response
  delete: async (id) => {
    const { error } = await supabase
      .from('responses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Filter responses (mimics base44 SDK filter method)
  filter: async (filters = {}, orderBy = 'created_at', ascending = false) => {
    let query = supabase.from('responses').select('*');

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

  // Get responses by survey
  getBySurvey: async (surveyId, status = null) => {
    let query = supabase
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Get completed responses count
  getCompletedCount: async (surveyId) => {
    const { count, error } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId)
      .eq('status', 'completed');

    if (error) throw error;
    return count || 0;
  },

  // Check if IP has already responded
  checkIpResponse: async (surveyId, ipAddress) => {
    const { data, error } = await supabase
      .from('responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('ip_address', ipAddress)
      .eq('status', 'completed')
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  },

  // Get response statistics
  getStats: async (surveyId) => {
    const { data, error } = await supabase
      .from('responses')
      .select('status')
      .eq('survey_id', surveyId);

    if (error) throw error;

    const stats = {
      total: data.length,
      completed: 0,
      in_progress: 0,
      abandoned: 0
    };

    data.forEach(r => {
      if (r.status === 'completed') stats.completed++;
      else if (r.status === 'in_progress') stats.in_progress++;
      else if (r.status === 'abandoned') stats.abandoned++;
    });

    return stats;
  }
};

export default Response;
