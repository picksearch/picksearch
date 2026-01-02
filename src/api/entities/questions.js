import { supabase } from '../supabaseClient';

export const Question = {
  // Create a new question
  create: async (data) => {
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return question;
  },

  // Create multiple questions at once
  createMany: async (questions) => {
    const questionsWithTimestamp = questions.map(q => ({
      ...q,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsWithTimestamp)
      .select();

    if (error) throw error;
    return data;
  },

  // Get question by ID
  get: async (id) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update question
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete question
  delete: async (id) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Delete all questions for a survey
  deleteBySurvey: async (surveyId) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('survey_id', surveyId);

    if (error) throw error;
    return true;
  },

  // Filter questions (mimics base44 SDK filter method)
  filter: async (filters = {}, orderBy = 'order', ascending = true) => {
    let query = supabase.from('questions').select('*');

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

  // Get questions by survey
  getBySurvey: async (surveyId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get root questions (no parent)
  getRootQuestions: async (surveyId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .is('parent_question_id', null)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get child questions (for branching)
  getChildQuestions: async (parentQuestionId, branchOption) => {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('parent_question_id', parentQuestionId);

    if (branchOption) {
      query = query.eq('parent_branch_option', branchOption);
    }

    query = query.order('order', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
};

export default Question;
