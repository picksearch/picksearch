import crypto from 'crypto';

/**
 * Dispatch a webhook event to the partner.
 * @param {object} partner - Partner object from DB (must include webhook_url, webhook_secret)
 * @param {string} eventName - Type of event (e.g., 'survey.deployed')
 * @param {object} data - Event payload data
 */
export const dispatchWebhook = async (partner, eventName, data) => {
    if (!partner.webhook_url) {
        // Webhook not configured
        return;
    }

    const payload = JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        data
    });

    // Calculate Signature
    // Default to empty secret if not set (should be set)
    const secret = partner.webhook_secret || '';
    const signature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    try {
        const response = await fetch(partner.webhook_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Picksearch-Signature': signature,
                'User-Agent': 'Picksearch-Webhook/1.0'
            },
            body: payload
        });

        if (!response.ok) {
            console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
            // In production, we would retry or log to a dead-letter queue
        }
    } catch (error) {
        console.error('Webhook dispatch error:', error.message);
    }
};
