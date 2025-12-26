import { supabase, getCurrentUser } from './supabaseClient';

// Auth object that mimics base44.auth interface for easier migration
export const auth = {
  // Get current user with profile data
  me: async () => {
    const user = await getCurrentUser();
    if (!user) return null;

    // Fetch profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return {
        id: user.id,
        email: user.email,
        ...user.user_metadata
      };
    }

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      custom_name: profile?.custom_name || '',
      role: profile?.role || 'user',
      referred_by: profile?.referred_by || '',
      search_coins: profile?.search_coins || 0,
      refund_bank_name: profile?.refund_bank_name || '',
      refund_account_number: profile?.refund_account_number || '',
      created_at: profile?.created_at,
      updated_at: profile?.updated_at
    };
  },

  // Update current user's profile
  updateMe: async (updates) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // Sign in with OAuth provider (Google, Kakao, etc.)
  signInWithProvider: async (provider, options = {}) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...options
      }
    });
    if (error) throw error;
    return data;
  },

  // Sign in with magic link
  signInWithMagicLink: async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  },

  // Logout
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/login';
  },

  // Check if authenticated
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Redirect to login page
  redirectToLogin: () => {
    window.location.href = '/login';
  },

  // Get session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    if (error) throw error;
    return data;
  },

  // Update password
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
};

export default auth;
