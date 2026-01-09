import { supabaseAdmin } from './supabase.js';
import { sendError } from './response.js';

/**
 * Middleware-like function to authenticate Partner requests.
 * @param {Request} req 
 * @param {Response} res 
 * @param {boolean} requireUserToken - Whether to also validate X-User-Token
 * @returns {Promise<{partner: object, userLink: object|null}|null>} Returns context object if auth success, null if response sent.
 */
export const authenticateRequest = async (res, req, requireUserToken = true) => {
    const partnerKey = req.headers['x-partner-key'];
    const partnerSecret = req.headers['x-partner-secret'];
    const userToken = req.headers['x-user-token'];

    if (!partnerKey || !partnerSecret) {
        sendError(res, 401, 'UNAUTHORIZED', 'Missing Partner Key or Secret');
        return null;
    }

    // 1. Validate Partner
    const { data: partners, error: partnerError } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('api_key', partnerKey)
        .limit(1);

    if (partnerError || !partners || partners.length === 0) {
        sendError(res, 401, 'UNAUTHORIZED', 'Invalid Partner Key');
        return null;
    }

    const partner = partners[0];

    // In production, we should hash the incoming secret and compare.
    // For MVP/Demo as per SQL, we compare directly.
    if (partner.secret_key_hash !== partnerSecret) {
        sendError(res, 401, 'UNAUTHORIZED', 'Invalid Partner Secret');
        return null;
    }

    let userLink = null;

    // 2. Validate User Token (if required or provided)
    if (requireUserToken) {
        if (!userToken) {
            sendError(res, 401, 'INVALID_TOKEN', 'Missing X-User-Token header');
            return null;
        }

        const { data: links, error: linkError } = await supabaseAdmin
            .from('user_links')
            .select('*')
            .eq('user_token', userToken)
            .eq('partner_id', partner.id) // Ensure token belongs to this partner
            .limit(1);

        if (linkError || !links || links.length === 0) {
            sendError(res, 401, 'INVALID_TOKEN', 'Invalid or Expired User Token');
            return null;
        }

        userLink = links[0];
    }

    return { partner, userLink };
};
