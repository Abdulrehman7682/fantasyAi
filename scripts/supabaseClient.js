const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://pmrcbkekxnsbpkqdemev.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcmNia2VreG5zYnBrcWRlbWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUxOTYsImV4cCI6MjA1OTAzMTE5Nn0.2DpAXazhkfIGK793ZamTBxheyOcPFjuu_ScryoJ32aA";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Not needed for migration script
  }
});

module.exports = { supabase };