import { supabase } from "./supabase-client";

/**
 * Gets a valid access token for a social account, refreshing it if necessary.
 * @param {string} accountId - The ID of the social account (conta_social).
 * @param {string} provider - The provider name ('youtube', 'instagram', 'facebook').
 * @returns {Promise<string>} - The valid access token.
 */
export async function getValidSocialToken(accountId, provider) {
  // 1. Get current token from DB
  const { data: tokenData, error: tokenError } = await supabase
    .from('social_tokens')
    .select('*')
    .eq('conta_social_id', accountId)
    .eq('provider', provider)
    .single();

  if (tokenError || !tokenData) {
    throw new Error(`Token não encontrado para ${provider}.`);
  }

  // 2. Check if expired (with 5 min buffer)
  const now = new Date();
  const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
  
  // If we have an expiration date and it's less than 5 minutes from now, refresh
  if (expiresAt && (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
    if (!tokenData.refresh_token) {
      throw new Error(`Token expirado e sem refresh_token disponível.`);
    }

    // 3. Get API configs
    const { data: config, error: configError } = await supabase
      .from('social_app_configs')
      .select('*')
      .eq('provider', provider === 'facebook' ? 'instagram' : provider)
      .single();

    if (configError || !config) {
      throw new Error(`Configurações de API não encontradas para ${provider}.`);
    }

    // 4. Call Refresh API
    if (provider === 'youtube') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.client_id,
          client_secret: config.client_secret,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Erro ao renovar token do YouTube: ${result.error_description || result.error}`);
      }

      const newAccessToken = result.access_token;
      const newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();

      // 5. Update DB
      const { error: updateError } = await supabase
        .from('social_tokens')
        .update({
          access_token: newAccessToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);

      if (updateError) throw updateError;

      return newAccessToken;
    }
    
    // TODO: Add refresh logic for Instagram/Facebook if needed
    // Usually these are long-lived tokens that don't need frequent refresh
  }

  return tokenData.access_token;
}
