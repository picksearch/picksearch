import { supabaseAdmin } from '../../../../utils/supabase.js';
import { authenticateRequest } from '../../../../utils/auth.js';
import { sendResponse, sendError } from '../../../../utils/response.js';
import { dispatchWebhook } from '../../../../utils/webhook.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST is allowed');
    }

    const { id } = req.query;
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    const { data: survey } = await supabaseAdmin
        .from('surveys')
        .select('status')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (!survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    if (survey.status !== 'paused') return sendError(res, 400, 'INVALID_STATUS', 'Only paused surveys can be resumed');

    const { data: updated, error } = await supabaseAdmin
        .from('surveys')
        .update({ status: 'live', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) return sendError(res, 500, 'UPDATE_FAILED', error.message);

    // Trigger Webhook
    dispatchWebhook(authContext.partner, 'survey.status_changed', {
        survey_id: updated.id,
        status: updated.status,
        timestamp: updated.updated_at
    });

    return sendResponse(res, 200, true, {
        survey_id: updated.id,
        status: updated.status,
        message: "Survey resumed."
    });
}
