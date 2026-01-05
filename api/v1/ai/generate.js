export const config = {
  maxDuration: 60, // 60초 타임아웃 (Pro 플랜 필요, Hobby는 10초)
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, system_prompt, model = 'gpt-4o-mini', response_json_schema } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 두 가지 환경변수명 모두 지원
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        debug: {
          envKeys: Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API'))
        }
      });
    }

    const messages = [];

    // Add system prompt for JSON response if schema is provided
    if (response_json_schema) {
      messages.push({
        role: 'system',
        content: system_prompt
          ? `${system_prompt}\n\nYou must respond with valid JSON only.`
          : 'You are a helpful assistant. You must respond with valid JSON only.'
      });
    } else if (system_prompt) {
      messages.push({ role: 'system', content: system_prompt });
    }

    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model,
      messages,
      temperature: 0.7,
    };

    // Add response format if JSON schema is provided
    if (response_json_schema) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'OpenAI API error' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // If JSON schema was requested, parse the response
    if (response_json_schema && content) {
      try {
        const parsed = JSON.parse(content);
        return res.status(200).json(parsed);
      } catch (e) {
        return res.status(200).json({ response: content });
      }
    }

    return res.status(200).json({ response: content });

  } catch (error) {
    console.error('AI Generate error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
