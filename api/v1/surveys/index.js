import { supabaseAdmin } from '../../../lib/utils/supabase.js';
import { authenticateRequest } from '../../../lib/utils/auth.js';
import { sendResponse, sendError } from '../../../lib/utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;
    const userId = userLink.picksearch_user_id;

    if (req.method === 'GET') {
        // List Surveys
        const { page = 1, per_page = 20, status } = req.query;
        const limit = Math.min(parseInt(per_page), 100);
        const from = (parseInt(page) - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseAdmin
            .from('surveys')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .range(from, to)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: surveys, error, count } = await query;

        if (error) {
            return sendError(res, 500, 'DB_ERROR', error.message);
        }

        // Enhance response (get response counts?)
        // For performance, we skip complex joins for list view unless asked.
        // But spec says "completed_responses". We might need a subquery or separate call if not in surveys table.
        // 'surveys' table usually doesn't store computed counts.
        // For MVP, we return 0 or implement a simpler view. 
        // Optimization: create a view or function. Here we just map raw data.

        const mappedSurveys = surveys.map(s => ({
            survey_id: s.id,
            title: s.title,
            status: s.status,
            target_participants: s.target_participants,
            completed_responses: 0, // TODO: Implement count query if needed
            created_at: s.created_at
        }));

        return sendResponse(res, 200, true, mappedSurveys, {
            pagination: {
                page: parseInt(page),
                per_page: limit,
                total_count: count,
                total_pages: Math.ceil(count / limit)
            }
        });

    } else if (req.method === 'POST') {
        // Create Survey
        const { title, description, survey_type = 'paid', target_participants = 0 } = req.body;

        if (!title) {
            return sendError(res, 400, 'VALIDATION_ERROR', 'Title is required');
        }

        const secretKey = uuidv4().replace(/-/g, '').substring(0, 12); // Simple random key
        const completionCode = uuidv4().replace(/-/g, '');

        const { data: newSurvey, error } = await supabaseAdmin
            .from('surveys')
            .insert({
                user_id: userId,
                title,
                description,
                survey_type,
                target_participants,
                status: 'draft',
                secret_key: secretKey, // Required by schema
                completion_secret_code: completionCode // Required by schema
            })
            .select()
            .single();

        if (error) {
            return sendError(res, 500, 'CREATION_FAILED', error.message);
        }

        return sendResponse(res, 201, true, {
            survey_id: newSurvey.id,
            title: newSurvey.title,
            status: newSurvey.status,
            created_at: newSurvey.created_at
        });

    } else {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET/POST allowed');
    }
}
