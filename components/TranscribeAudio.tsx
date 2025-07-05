

export const sendToWhisper = async (uri: string): Promise<string | null> => {
   
  // 🎤 Step 2: Prepare audio form data
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  } as any);
  // formData.append('model', 'slam-1');

  // 📡 Step 3: Send to OpenRouter Whisper endpoint
  try {
   const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          authorization: "4ee421621622471d9f755e78b6c2c556",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: uri }),
      });

    const result = formData;
    console.log('Transcription result:', result);
    console.log('Transcription :', response);

    return result.text ?? null;
  } catch (err) {
    console.error('Failed to transcribe audio:', err);
    return null;
  }
};