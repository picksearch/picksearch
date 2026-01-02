import { supabaseAdmin } from '../../../../utils/supabase.js';
import { authenticateRequest } from '../../../../utils/auth.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export default async function handler(req, res) {
    const { id, qid } = req.query; // id=survey_id, qid=question_id
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    // Verify survey ownership and status
    const { data: survey } = await supabaseAdmin
        .from('surveys')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId) // Ownership check
        .single();

    if (!survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    if (survey.status !== 'draft') return sendError(res, 400, 'INVALID_STATUS', 'Only draft surveys can be modified');

    if (req.method === 'PATCH') {
        const { title, options, order } = req.body;
        const updateData = {};
        if (title) updateData.question_text = title;
        if (options) updateData.options = options;
        if (order !== undefined) updateData.order = order;

        const { data: updated, error } = await supabaseAdmin
            .from('questions')
            .update(updateData)
            .eq('id', qid)
            .eq('survey_id', id) // Ensure question belongs to survey
            .select()
            .single();

        if (error) return sendError(res, 500, 'UPDATE_FAILED', error.message);
        if (!updated) return sendError(res, 404, 'QUESTION_NOT_FOUND', 'Question not found');

        return sendResponse(res, 200, true, {
            question_id: updated.id,
            title: updated.question_text,
            options: updated.options,
            order: updated.order
        });

    } else if (req.method === 'DELETE') {
        const { error } = await supabaseAdmin
            .from('questions')
            .delete()
            .eq('id', qid)
            .eq('survey_id', id);

        if (error) return sendError(res, 500, 'DELETE_FAILED', error.message);

        return sendResponse(res, 200, true, {
            question_id: qid,
            deleted: true
        });

    } else {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only PATCH/DELETE allowed');
    }
}
