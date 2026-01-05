import { supabase } from '../supabaseClient';

export const SurveyCategory = {
  // 카테고리 목록 조회 (일반 user는 본인 것만, admin은 전체)
  async list() {
    const { data, error } = await supabase
      .from('survey_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 카테고리 생성
  async create(name) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { data, error } = await supabase
      .from('survey_categories')
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('이미 존재하는 카테고리입니다');
      }
      throw error;
    }
    return data;
  },

  // 카테고리 삭제
  async delete(id) {
    const { error } = await supabase
      .from('survey_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // 이름으로 삭제
  async deleteByName(name) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { error } = await supabase
      .from('survey_categories')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name);

    if (error) throw error;
    return true;
  }
};
