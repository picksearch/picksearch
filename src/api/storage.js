import { supabase } from './supabaseClient';

// Storage bucket name
const BUCKET_NAME = 'picksearch';

export const storage = {
  // Upload a file
  upload: async (file, path = null, options = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    // Generate file path if not provided
    const fileName = file.name || `file_${Date.now()}`;
    const fileExt = fileName.split('.').pop();
    const filePath = path || `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  },

  // Upload file from base64
  uploadBase64: async (base64Data, fileName, mimeType = 'image/jpeg') => {
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    const file = new File([blob], fileName, { type: mimeType });

    return storage.upload(file);
  },

  // Upload private file
  uploadPrivate: async (file, path = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be authenticated to upload private files');

    const fileName = file.name || `file_${Date.now()}`;
    const fileExt = fileName.split('.').pop();
    const filePath = path || `private/${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return {
      path: data.path
    };
  },

  // Get signed URL for private file
  getSignedUrl: async (path, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  // Get public URL
  getPublicUrl: (path) => {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Delete file
  delete: async (path) => {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
    return true;
  },

  // Delete multiple files
  deleteMany: async (paths) => {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) throw error;
    return true;
  },

  // List files in a folder
  list: async (folder = '', options = {}) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
        ...options
      });

    if (error) throw error;
    return data;
  }
};

// Legacy function names for backward compatibility
export const UploadFile = async (file) => {
  const result = await storage.upload(file);
  return result.url;
};

export const UploadPrivateFile = async (file) => {
  const result = await storage.uploadPrivate(file);
  return result.path;
};

export const CreateFileSignedUrl = async (path) => {
  return storage.getSignedUrl(path);
};

export default storage;
