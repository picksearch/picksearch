import { supabaseAdmin } from '../../../../utils/supabase.js';
import { authenticateRequest } from '../../../../utils/auth.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only PUT is allowed');
    }

    const { id } = req.query; // survey_id
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    // Verify survey
    const { data: survey } = await supabaseAdmin
        .from('surveys')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (!survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    if (survey.status !== 'draft') return sendError(res, 400, 'INVALID_STATUS', 'Only draft surveys can reorder questions');

    const { orders } = req.body; // [{ question_id, order }, ...]

    if (!orders || !Array.isArray(orders)) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'orders array is required');
    }

    // Execute updates
    try {
        const updatePromises = orders.map(({ question_id, order }) =>
            supabaseAdmin
                .from('questions')
                .update({ order })
                .eq('id', question_id)
                .eq('survey_id', id)
        );

        await Promise.all(updatePromises);

        return sendResponse(res, 200, true, { message: 'Reordered successfully' });

    } catch (error) {
        return sendError(res, 500, 'REORDER_FAILED', error.message);
    }
}
