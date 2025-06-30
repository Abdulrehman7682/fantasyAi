import { supabase } from "utils/supabase";

export const sendToWhisper = async (uri: string): Promise<string | null> => {
    console.log("uri", uri);
  // 🔐 Step 1: Fetch OpenRouter API key from Supabase
  const { data, error } = await supabase
    .from('ai_key')
    .select('*')
    .eq('key_name', 'openrouter')
    .single();

  if (error || !data?.api_key) {
    console.error("Error fetching OpenRouter API key:", error);
    return null;
  }

  const apiKey = data.api_key;
  console.log("Fetched OpenRouter API key from Supabase" , apiKey);

  // 🎤 Step 2: Prepare audio form data
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  } as any);
  formData.append('model', 'whisper');

  // 📡 Step 3: Send to OpenRouter Whisper endpoint
  try {
    console.log("Sending file to OpenRouter...");
    const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    const result = await response.json();
    console.log('Transcription result:', result);

    return result.text ?? null;
  } catch (err) {
    console.error('Failed to transcribe audio:', err);
    return null;
  }
};