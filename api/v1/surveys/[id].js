import { supabaseAdmin } from '../../../lib/utils/supabase.js';
import { authenticateRequest } from '../../../lib/utils/auth.js';
import { sendResponse, sendError } from '../../../lib/utils/response.js';

export default async function handler(req, res) {
    const { id } = req.query; // Vercel route param
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    if (req.method === 'GET') {
        // Get Survey Detail (includes questions)
        const { data: survey, error } = await supabaseAdmin
            .from('surveys')
            .select(`
        *,
        questions (*)
      `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !survey) {
            return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
        }

        // Sort questions by order
        if (survey.questions) {
            survey.questions.sort((a, b) => a.order - b.order);
        }

        return sendResponse(res, 200, true, {
            survey_id: survey.id,
            title: survey.title,
            description: survey.description,
            status: survey.status,
            survey_type: survey.survey_type,
            target_participants: survey.target_participants,
            completed_responses: 0, // Placeholder
            target_persona: survey.survey_purpose, // Mapping purpose to persona desc
            target_options: survey.target_options?.cells || survey.target_options,
            questions: survey.questions.map(q => ({
                question_id: q.id,
                type: q.question_type,
                title: q.question_text,
                order: q.order,
                options: q.options
            })),
            created_at: survey.created_at,
            updated_at: survey.updated_at
        });

    } else if (req.method === 'PATCH') {
        // Update Survey
        const { title, target_participants } = req.body;

        // First check status
        const { data: existing } = await supabaseAdmin
            .from('surveys')
            .select('status')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
        if (existing.status !== 'draft') return sendError(res, 400, 'INVALID_STATUS', 'Only draft surveys can be modified');

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (target_participants !== undefined) updateData.target_participants = target_participants;
        updateData.updated_at = new Date().toISOString();

        const { data: updated, error } = await supabaseAdmin
            .from('surveys')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) return sendError(res, 500, 'UPDATE_FAILED', error.message);

        return sendResponse(res, 200, true, {
            survey_id: updated.id,
            title: updated.title,
            status: updated.status,
            updated_at: updated.updated_at
        });

    } else if (req.method === 'DELETE') {
        // Delete Survey
        const { data: existing } = await supabaseAdmin
            .from('surveys')
            .select('status')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
        if (existing.status !== 'draft') return sendError(res, 400, 'INVALID_STATUS', 'Only draft surveys can be deleted');
        // Also check responses count? Spec says "if no responses". Draft usually has no responses.

        const { error } = await supabaseAdmin
            .from('surveys')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) return sendError(res, 500, 'DELETE_FAILED', error.message);

        return sendResponse(res, 200, true, {
            survey_id: id,
            deleted: true
        });

    } else {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Allowed: GET, PATCH, DELETE');
    }
}
