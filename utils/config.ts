/**
 * Central configuration file for the FantasyAI app
 * 
 * This file provides direct access to configuration values
 * without relying on environment variables at runtime.
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: "https://pmrcbkekxnsbpkqdemev.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcmNia2VreG5zYnBrcWRlbWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUxOTYsImV4cCI6MjA1OTAzMTE5Nn0.2DpAXazhkfIGK793ZamTBxheyOcPFjuu_ScryoJ32aA"
};

// Helper function to validate configuration
export function validateConfig() {
  try {
    // Check Supabase configuration
    if (!SUPABASE_CONFIG.url) {
      console.error("Missing Supabase URL in configuration");
      return false;
    }
    if (!SUPABASE_CONFIG.anonKey) {
      console.error("Missing Supabase anon key in configuration");
      return false;
    }
    
    console.info("Configuration validated successfully");
    return true;
  } catch (error) {
    console.error("Error validating configuration:", error);
    return false;
  }
}

// Export any other app configuration values here
