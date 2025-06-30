import { supabase } from "scripts/supabaseClient";

const fetchApiKeyFromSupabase = async (keyName: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('ai_key')
    .select('*')
    .eq('key_name', keyName)
    .single();

  if (error) {
    console.error("Error fetching API key:", error);
    return null;
  }

  console.log("Fetched API key from Supabase:", data.api_key);
  return data?.api_key || null;
};
