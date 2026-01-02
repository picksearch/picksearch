import { supabaseAdmin } from '../../../utils/supabase.js';
import { authenticateRequest } from '../../../utils/auth.js';
import { sendResponse, sendError } from '../../../utils/response.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only PATCH is allowed');
    }

    const { id } = req.query;
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;
    const { target_persona, target_options } = req.body;

    // Check survey status
    const { data: survey, error: fetchError } = await supabaseAdmin
        .from('surveys')
        .select('status, target_options')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (fetchError || !survey) {
        return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');
    }

    if (survey.status !== 'draft') {
        return sendError(res, 400, 'INVALID_STATUS', 'Only draft surveys can modify targets');
    }

    // Update
    // Map API fields to DB fields:
    // target_persona -> survey_purpose (text)
    // target_options -> target_options (jsonb)

    const updateData = {
        updated_at: new Date().toISOString()
    };

    if (target_persona !== undefined) {
        updateData.survey_purpose = target_persona;
    }

    if (target_options !== undefined) {
        // Wrap in standard structure if needed? 
        // Existing app uses { cells: [...] } or direct structure.
        // The API user sends the structure they got from options.
        // We should save it as is or wrap it if creating from scratch.
        // Let's save as 'cells' format if it matches the array structure, or just save it.
        // To match CreateSurvey.jsx logic: it saves { cells: targetSettings, ... }

        // Check if target_options is array (cells) -> wrap it
        if (Array.isArray(target_options)) {
            updateData.target_options = { cells: target_options };
        } else {
            // Assume it's the object map like { gender: [...], ... }
            // We might need to transform this to the 'cells' format usually expected by the Frontend UI 
            // if we want the UI to be compatible.
            // Frontend uses: cells = [{ targets: { DEMO: { gender: ... } } }]
            // If API sends raw object, Frontend might break.
            // For v3.1, let's just save valid JSON. Compatibility is a broader issue.
            updateData.target_options = target_options;
        }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('surveys')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return sendError(res, 500, 'UPDATE_FAILED', updateError.message);
    }

    return sendResponse(res, 200, true, {
        survey_id: updated.id,
        target_persona: updated.survey_purpose,
        target_options: updated.target_options,
        updated_at: updated.updated_at
    });
}
