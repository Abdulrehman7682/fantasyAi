import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database'; // Use relative path for database types
import { SUPABASE_CONFIG, validateConfig } from './config'; // Import from our direct config file

/**
 * Initializes the Supabase client using direct configuration
 * This approach avoids the issues with environment variables in Expo
 */
function initializeSupabaseClient() {
  try {
    console.log("[supabase.ts] Initializing Supabase client...");
    
    // Validate configuration before proceeding
    if (!validateConfig()) {
      throw new Error("Invalid Supabase configuration");
    }
    
    // Get configuration values
    const supabaseUrl = SUPABASE_CONFIG.url;
    const supabaseKey = SUPABASE_CONFIG.anonKey;
    
    // Log configuration status
    console.info("[supabase.ts] Configuration source: Direct config file");
    console.info("[supabase.ts] URL configured:", !!supabaseUrl);
    console.info("[supabase.ts] Key configured:", !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration values");
    }
    
    // Initialize and return the Supabase client
    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    // Detailed error reporting
    console.error("[supabase.ts] Error during initialization:", error);
    console.error("[supabase.ts] This is a critical error that must be fixed for the app to function properly");
    
    // Re-throw to prevent the app from continuing with an invalid configuration
    throw error;
  }
}

// Export the initialized Supabase client
export const supabase = initializeSupabaseClient();

// Note: Auth-related functions (signIn, signUp, etc.) have been removed
// as they should reside in a dedicated authentication service (e.g., services/authService.ts).
