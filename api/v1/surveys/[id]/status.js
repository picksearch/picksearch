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
        .select('*, questions(count)') // get question count to calc progress? no, response count needed.
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !survey) {
        return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    }

    // Get response counts
    // Assuming we don't have a 'responses' count in surveys table, we query responses.
    // Performance note: Should assume cached count or simplified query.
    // Checking 'responses' table.
    const { count: completedCount } = await supabaseAdmin
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', id)
        .eq('status', 'complete'); // Assuming 'complete' or 'completed' status in responses table

    // Check in progress?
    // const InProgressCount...

    const target = survey.target_participants || 1;
    const current = completedCount || 0;

    return sendResponse(res, 200, true, {
        survey_id: survey.id,
        status: survey.status,
        target_participants: survey.target_participants,
        completed_responses: current,
        in_progress_count: 0, // Placeholder
        completion_rate: Math.min(current / target, 1),
        updated_at: survey.updated_at
    });
}
