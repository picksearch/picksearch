import { supabaseAdmin } from '../../../../../lib/utils/supabase.js';
import { authenticateRequest } from '../../../../../lib/utils/auth.js';
import { sendResponse, sendError } from '../../../../../lib/utils/response.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST is allowed');
    }

    const { id } = req.query; // survey_id
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    // Verify survey ownership and status
    const { data: survey } = await supabaseAdmin
        .from('surveys')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (!survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    if (survey.status !== 'draft') return sendError(res, 400, 'INVALID_STATUS', 'Only draft surveys can add questions');

    const { type, title, options, order } = req.body;

    if (!type || !title) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Type and Title are required');
    }

    // Calculate order if not provided
    let nextOrder = order;
    if (nextOrder === undefined) {
        const { count } = await supabaseAdmin
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('survey_id', id);
        nextOrder = count;
    }

    // Insert Question
    const { data: newQuestion, error } = await supabaseAdmin
        .from('questions')
        .insert({
            survey_id: id,
            question_type: type,
            question_text: title,
            options: options || [], // DB expects array for choices, or jsonb.
            order: nextOrder
        })
        .select()
        .single();

    if (error) {
        return sendError(res, 500, 'CREATION_FAILED', error.message);
    }

    return sendResponse(res, 201, true, {
        question_id: newQuestion.id,
        survey_id: id,
        type: newQuestion.question_type,
        title: newQuestion.question_text,
        order: newQuestion.order,
        created_at: newQuestion.created_at
    });
}
