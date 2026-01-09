import { supabaseAdmin } from '../../../lib/utils/supabase.js';
import { authenticateRequest } from '../../../lib/utils/auth.js';
import { sendResponse, sendError } from '../../../lib/utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST is allowed');
    }

    // 1. Authenticate Partner (No User Token required for linking)
    const authContext = await authenticateRequest(res, req, false);
    if (!authContext) return; // Response sent inside auth

    const { partner } = authContext;
    const { external_user_id, email, name } = req.body;

    if (!external_user_id) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'external_user_id is required');
    }

    try {
        // 2. Check if link already exists
        const { data: existingLink } = await supabaseAdmin
            .from('user_links')
            .select('*')
            .eq('partner_id', partner.id)
            .eq('external_user_id', external_user_id)
            .maybeSingle();

        if (existingLink) {
            return sendResponse(res, 200, true, {
                user_id: existingLink.picksearch_user_id,
                user_token: existingLink.user_token,
                is_new: false
            });
        }

        // 3. Create new Supabase Auth User
        const userEmail = email || `${external_user_id}@${partner.api_key}.external.picksearch.com`;
        const userPassword = uuidv4();

        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password: userPassword,
            email_confirm: true, // Auto-confirm since email confirmation is disabled
            user_metadata: {
                full_name: name || 'External User',
                is_external: true,
                partner_id: partner.id,
                external_id: external_user_id
            }
        });

        if (createError) {
            console.error('Supabase createUser error:', createError);
            return sendError(res, 400, 'USER_CREATION_FAILED', createError.message, createError);
        }

        const picksearchUserId = userData.user.id;

        // 4. Generate Token and Save Link
        const newToken = `usr_${uuidv4().replace(/-/g, '')}`;

        const { data: newLink, error: linkError } = await supabaseAdmin
            .from('user_links')
            .insert({
                partner_id: partner.id,
                external_user_id: external_user_id,
                picksearch_user_id: picksearchUserId,
                user_token: newToken
            })
            .select()
            .single();

        if (linkError) {
            console.error('Link creation error:', linkError);
            return sendError(res, 500, 'LINK_CREATION_FAILED', linkError.message, linkError);
        }

        return sendResponse(res, 201, true, {
            user_id: picksearchUserId,
            user_token: newToken,
            is_new: true
        });

    } catch (error) {
        console.error('Link Error:', error);
        return sendError(res, 500, 'INTERNAL_SERVER_ERROR', error.message);
    }
}
