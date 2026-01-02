import { supabaseAdmin } from '../../../../utils/supabase.js';
import { authenticateRequest } from '../../../../utils/auth.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET is allowed');
    }

    const { id } = req.query;
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    const { data: survey, error } = await supabaseAdmin
        .from('surveys')
        .select(`
      *,
      questions (*)
    `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');

    // Calculate Stats
    // Fetch all completed responses to aggregate
    // Warning: heavy operation for large surveys. In production this should be a stored proc or incremental.
    const { data: responses } = await supabaseAdmin
        .from('responses')
        .select('answers, panel_gender, panel_age')
        .eq('survey_id', id)
        .eq('status', 'complete');

    const totalResponses = responses?.length || 0;

    // Basic Aggregation
    const questionsStats = survey.questions.map(q => {
        // Logic similar to FreeSurveyResults `getChoiceStats`
        // Simplified distribution counting
        const distribution = {};
        if (responses) {
            responses.forEach(r => {
                const ans = r.answers?.[q.id];
                if (ans) {
                    // Handle arrays (multi select) or existing values
                    const values = Array.isArray(ans) ? ans : [ans];
                    values.forEach(v => {
                        distribution[v] = (distribution[v] || 0) + 1;
                    });
                }
            });
        }

        return {
            question_id: q.id,
            title: q.question_text,
            type: q.question_type,
            summary: {
                total_answers: Object.values(distribution).reduce((a, b) => a + b, 0),
                distribution
            }
        };
    });

    return sendResponse(res, 200, true, {
        survey_id: survey.id,
        total_responses: totalResponses,
        completion_rate: survey.target_participants ? (totalResponses / survey.target_participants) : 0,
        questions: questionsStats,
        demographics: {
            // Placeholder for demo stats
            gender: { male: 0, female: 0 },
            age_range: {}
        }
    });
}
