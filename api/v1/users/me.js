import { supabaseAdmin } from '../../utils/supabase.js';
import { authenticateRequest } from '../../utils/auth.js';
import { sendResponse, sendError } from '../../utils/response.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET is allowed');
    }

    const authContext = await authenticateRequest(res, req, true);
    if (!authContext) return;

    const { userLink } = authContext;

    try {
        // Fetch user basic info from auth.users (via admin) or profiles
        // We can query 'profiles' table if it exists and is public, or admin getUser

        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userLink.picksearch_user_id);

        if (userError || !user) {
            return sendError(res, 404, 'USER_NOT_FOUND', 'Linked Supabase user not found');
        }

        // Get survey count
        const { count, error: countError } = await supabaseAdmin
            .from('surveys')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        return sendResponse(res, 200, true, {
            user_id: user.id,
            external_user_id: userLink.external_user_id,
            email: user.email,
            name: user.user_metadata?.full_name,
            surveys_count: count || 0,
            created_at: user.created_at
        });

    } catch (error) {
        return sendError(res, 500, 'INTERNAL_SERVER_ERROR', error.message);
    }
}
