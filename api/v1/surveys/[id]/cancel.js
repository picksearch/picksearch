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
    const { reason } = req.body;

    const { data: survey } = await supabaseAdmin
        .from('surveys')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (!survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    if (['closed', 'completed'].includes(survey.status)) {
        return sendError(res, 400, 'INVALID_STATUS', 'Survey is already closed or completed');
    }

    // Calculate refund
    const target = survey.target_participants || 1;

    // Get confirmed response count
    const { count: completedCount } = await supabaseAdmin
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', id)
        .eq('status', 'complete');

    const current = completedCount || 0;
    const remaining = Math.max(0, target - current);
    const refundRatio = (target > 0) ? (remaining / target) : 0;

    // Close the survey
    const { data: updated, error } = await supabaseAdmin
        .from('surveys')
        .update({
            status: 'closed',
            updated_at: new Date().toISOString()
            // We could store close reason if DB supports it
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return sendError(res, 500, 'UPDATE_FAILED', error.message);

    // Trigger Webhook
    dispatchWebhook(authContext.partner, 'survey.status_changed', {
        survey_id: updated.id,
        status: updated.status,
        refund_eligible: refundRatio > 0,
        refund_ratio: Number(refundRatio.toFixed(2))
    });

    return sendResponse(res, 200, true, {
        survey_id: updated.id,
        status: updated.status,
        refund_eligible: refundRatio > 0,
        refund_ratio: Number(refundRatio.toFixed(2)),
        message: `${Math.round(refundRatio * 100)}% Refundable (${current}/${target} completed)`
    });
}
