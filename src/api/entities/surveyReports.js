import { supabase } from '../supabaseClient';

export const SurveyReport = {
  // Get report by survey ID
  getBySurveyId: async (surveyId) => {
    const { data, error } = await supabase
      .from('survey_reports')
      .select('*')
      .eq('survey_id', surveyId)
      .maybeSingle();

    if (error) throw error;
    return data; // null if not found
  },

  // Create or update report (upsert)
  upsert: async (surveyId, reportData) => {
    const { data, error } = await supabase
      .from('survey_reports')
      .upsert({
        survey_id: surveyId,
        ...reportData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'survey_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update AI analysis data
  updateAiAnalysis: async (surveyId, aiAnalysisData) => {
    return SurveyReport.upsert(surveyId, { ai_analysis_data: aiAnalysisData });
  },

  // Update hyper precision report
  updateHyperPrecisionReport: async (surveyId, hyperPrecisionReport) => {
    return SurveyReport.upsert(surveyId, { hyper_precision_report: hyperPrecisionReport });
  },

  // Delete report
  delete: async (surveyId) => {
    const { error } = await supabase
      .from('survey_reports')
      .delete()
      .eq('survey_id', surveyId);

    if (error) throw error;
    return true;
  }
};

export default SurveyReport;
