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

  // Update response (secure version with session_id validation)
  update: async (id, updates, sessionId = null) => {
    // session_id가 제공된 경우 안전한 RPC 함수 사용
    if (sessionId) {
      const { data, error } = await supabase.rpc('update_response_safely', {
        p_response_id: id,
        p_session_id: sessionId,
        p_answers: updates.answers || null,
        p_status: updates.status || null
      });

      if (error) throw error;

      // RPC 함수 결과 확인
      if (data && !data.success) {
        const errorMessages = {
          'RESPONSE_NOT_FOUND': '응답을 찾을 수 없습니다.',
          'SESSION_MISMATCH': '세션이 일치하지 않습니다.',
          'ALREADY_COMPLETED': '이미 완료된 응답입니다.',
          'RESPONSE_EXPIRED': '응답 시간이 만료되었습니다.'
        };
        throw new Error(errorMessages[data.error] || data.error);
      }

      return data;
    }

    // 기존 방식 (RLS 정책으로 보호됨)
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
