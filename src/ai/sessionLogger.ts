import { supabase } from './supabaseClient.js';

export async function logSessionStart(deviceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ device_id: deviceId })
    .select('id')
    .single();

  if (error) {
    console.error('[SessionLogger] Failed to log start:', error.message);
    throw error;
  }

  console.log(`[SessionLogger] Session started: ${data.id}`);
  return data.id;
}

export async function logSessionEnd(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('[SessionLogger] Failed to log end:', error.message);
  } else {
    console.log(`[SessionLogger] Session ended: ${sessionId}`);
  }
}
