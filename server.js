import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// AI Generate endpoint
app.post('/api/v1/ai/generate', async (req, res) => {
  try {
    const { prompt, system_prompt, model = 'gpt-4o-mini', response_json_schema } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const messages = [];

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
      return res.status(response.status).json({
        error: errorData.error?.message || 'OpenAI API error'
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (response_json_schema && content) {
      try {
        const parsed = JSON.parse(content);
        return res.json(parsed);
      } catch (e) {
        return res.json({ response: content });
      }
    }

    return res.json({ response: content });

  } catch (error) {
    console.error('AI Generate error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
