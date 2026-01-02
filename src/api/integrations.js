import { supabase } from './supabaseClient';

// Core integrations object for backward compatibility
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile
};

// Invoke LLM (calls Supabase Edge Function)
export async function InvokeLLM(options) {
  const { prompt, system_prompt, model = 'gpt-4o-mini', response_json_schema } = options;

  try {
    const { data, error } = await supabase.functions.invoke('invoke-llm', {
      body: {
        prompt,
        system_prompt,
        model,
        response_json_schema
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('InvokeLLM error:', error);
    throw error;
  }
}

// Send email (calls Supabase Edge Function)
export async function SendEmail(options) {
  const { to, subject, html, text, from } = options;

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        text,
        from
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SendEmail error:', error);
    throw error;
  }
}

// Upload file to Supabase Storage
export async function UploadFile(file) {
  const { storage } = await import('./storage');
  const result = await storage.upload(file);
  return result.url;
}

// Generate image (calls Supabase Edge Function or OpenAI directly)
export async function GenerateImage(options) {
  const { prompt, size = '1024x1024', quality = 'standard' } = options;

  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt,
        size,
        quality
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GenerateImage error:', error);
    throw error;
  }
}

// Extract data from uploaded file
export async function ExtractDataFromUploadedFile(options) {
  const { file_url, extraction_prompt } = options;

  try {
    const { data, error } = await supabase.functions.invoke('extract-file-data', {
      body: {
        file_url,
        extraction_prompt
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('ExtractDataFromUploadedFile error:', error);
    throw error;
  }
}

// Create signed URL for file
export async function CreateFileSignedUrl(path) {
  const { storage } = await import('./storage');
  return storage.getSignedUrl(path);
}

// Upload private file
export async function UploadPrivateFile(file) {
  const { storage } = await import('./storage');
  const result = await storage.uploadPrivate(file);
  return result.path;
}

export default Core;
