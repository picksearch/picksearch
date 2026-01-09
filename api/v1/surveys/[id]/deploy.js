import { supabaseAdmin } from '../../../../../lib/utils/supabase.js';
import { authenticateRequest } from '../../../../../lib/utils/auth.js';
import { sendResponse, sendError } from '../../../../../lib/utils/response.js';
import { dispatchWebhook } from '../../../../../lib/utils/webhook.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST is allowed');
    }

    const { id } = req.query;
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    const { scheduled_start, transaction_ref } = req.body;

    // Fetch Survey and validate readiness
    const { data: survey, error } = await supabaseAdmin
        .from('surveys')
        .select(`
      *,
      questions(count)
    `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !survey) {
        return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    }

    if (survey.status !== 'draft') {
        return sendError(res, 400, 'INVALID_STATUS', `Survey is already ${survey.status}`);
    }

    if (survey.target_participants <= 0) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Target participants must be greater than 0');
    }

    // Check question count
    // Supabase count is object array if requested as join { questions: [{ count: 5 }] } or similar?
    // Let's do a reliable count check.
    const { count: questionCount } = await supabaseAdmin
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', id);

    if (!questionCount || questionCount === 0) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Survey must have at least 1 question');
    }

    // Activate
    const now = new Date();
    const start = scheduled_start ? new Date(scheduled_start) : now;
    const status = (start > now) ? 'scheduled' : 'live';

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('surveys')
        .update({
            status: status,
            scheduled_start: start.toISOString(),
            updated_at: now.toISOString()
            // We might store transaction_ref if we add a column, or just log it.
            // For now, ignoring ref but acknowledging receipt.
        })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return sendError(res, 500, 'DEPLOY_FAILED', updateError.message);
    }

    // Trigger Webhook
    // Note: authContext.partner should verify scopes if we had them.
    // We send the 'survey.deployed' or 'survey.status_changed' event.
    // Using fire-and-forget to avoid blocking response.
    dispatchWebhook(authContext.partner, 'survey.deployed', {
        survey_id: updated.id,
        status: updated.status,
        scheduled_start: updated.scheduled_start,
        target_participants: updated.target_participants
    });

    return sendResponse(res, 200, true, {
        survey_id: updated.id,
        status: updated.status,
        message: "Survey deployed. Please deduct credits."
    });
}

