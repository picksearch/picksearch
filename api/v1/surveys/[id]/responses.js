import { supabaseAdmin } from '../../../../utils/supabase.js';
import { authenticateRequest } from '../../../../utils/auth.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET is allowed');
    }

    const { id } = req.query; // survey_id
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    // Verify survey ownership
    const { data: survey } = await supabaseAdmin
        .from('surveys')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (!survey) return sendError(res, 404, 'SURVEY_NOT_FOUND', 'Survey not found');

    // List Responses
    const { page = 1, per_page = 20, status } = req.query;
    const limit = Math.min(parseInt(per_page), 100);
    const from = (parseInt(page) - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
        .from('responses')
        .select('*', { count: 'exact' })
        .eq('survey_id', id)
        .range(from, to)
        .order('created_at', { ascending: false });

    if (status) {
        if (status === 'completed') query = query.eq('status', 'complete'); // Map 'completed' to 'complete' if needed
        else query = query.eq('status', status);
    }

    const { data: responses, error, count } = await query;

    if (error) {
        return sendError(res, 500, 'DB_ERROR', error.message);
    }

    // Map response structure
    // The 'responses' table structure might vary. Assuming it handles answer JSON or related table.
    // Actually responses usually have 'answers' jsonb column in Picksearch?
    // Let's assume 'answers' column exists or we might need to join 'survey_response_details' if structured differently.
    // Current schema check suggested 'responses' table.

    const mappedResponses = responses.map(r => ({
        response_id: r.id,
        status: r.status === 'complete' ? 'completed' : 'in_progress',
        respondent: {
            gender: r.panel_gender,
            age: r.panel_age,
            region: r.panel_region
        },
        answers: r.answers || {}, // JSONB column expected
        created_at: r.created_at,
        completed_at: r.finished_at || r.updated_at
    }));

    return sendResponse(res, 200, true, mappedResponses, {
        pagination: {
            page: parseInt(page),
            per_page: limit,
            total_count: count,
            total_pages: Math.ceil(count / limit)
        }
    });
}
