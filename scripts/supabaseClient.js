const { createClient } = require('@supabase/supabase-js');
// import Constants from 'expo-constants'; // ✅ This is the missing impor

const supabaseUrl = "https://jphpomjcsnqyiliphmcs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHBvbWpjc25xeWlsaXBobWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTQ5NzYsImV4cCI6MjA1ODY5MDk3Nn0.MxS3pbhH9oGSDF-uUH3E4NSPO58W_VIW-kx8Yukslfw";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Not needed for migration script
  }
});

module.exports = { supabase };