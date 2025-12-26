import { supabase } from './supabaseClient';

// Call Supabase Edge Function
async function callEdgeFunction(functionName, payload = {}) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) throw error;
  return data;
}

// Process referral bonus when a new user signs up
export async function processReferral(referralCode, newUserId) {
  return callEdgeFunction('process-referral', {
    referral_code: referralCode,
    new_user_id: newUserId,
  });
}

// External survey API integration
export async function externalSurveyAPI(action, params = {}) {
  return callEdgeFunction('external-survey-api', {
    action,
    ...params,
  });
}

// Setup Picketing account
export async function setupPicketingAccount(userId, accountData = {}) {
  return callEdgeFunction('setup-picketing-account', {
    user_id: userId,
    ...accountData,
  });
}
