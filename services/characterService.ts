import { Database } from '../types/database';
import { AI_MODELS, CHARACTER_PROMPTS } from '../utils/aiConfig';
import { Tables } from '../types/database';
import { getOrComputeCacheItem } from './cacheService';
import { DatabaseService, PaginatedResult } from './databaseService'; // Assuming PaginatedResult is exported
// Import Category interface and categories array directly from constants
import { Category, categories as homeScreenCategories } from '../constants/categories'; // Corrected import path

// *** Add log to check the imported value ***
console.log('[characterService] Imported homeScreenCategories:', homeScreenCategories);

// Define Character type using the Tables helper
// Ensure this type aligns with the actual 'characters' table schema
type CharacterFromDB = Tables<'characters'>; // Type strictly from DB schema

// Define a more comprehensive Character type used within the service and potentially for defaults
// Ensure this aligns with what ChatScreen expects via navigation params
type Character = Omit<CharacterFromDB, 'id'> & { // Omit DB id if it's always number, use string/number union below
  id: number | string; // Allow string IDs from categories
  category?: string; // Keep for application logic if needed
  avatar?: any; // Allow require() or string URI
  tags?: string[];
  openingMessage?: string;
  model?: string;
  system_prompt?: string;
  exampleQuestions?: string[];
  suggestedQuestions?: string[];
  subTasks?: string[];
};


// Define QueryFilter, QueryOrderBy, QueryOptions interfaces if not already globally available
interface QueryFilter {
  column: string;
  operator: string;
  value: any;
}

interface QueryOrderBy {
  column: string;
  direction: 'asc' | 'desc';
}

interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: QueryOrderBy;
  limit?: number;
  offset?: number;
}


const CHARACTER_CACHE_TTL = 30; // Cache characters for 30 minutes

// --- Define Category to Enum Type Map FIRST ---

const categoryToEnumTypeMap: Record<string, Database['public']['Enums']['character_type']> = {
   'fitness': 'wellness_guide',
   'nutrition': 'wellness_guide',
   'mental health': 'wellness_guide',
   'career': 'career_helper',
   'education': 'study_partner',
   'creativity': 'creative_buddy',
   'productivity': 'problem_solver',
   'relationships': 'social_coach',
   'finance': 'problem_solver',
   'lifestyle': 'life_coach',
   'spirituality': 'wellness_guide',
   'self-growth': 'life_coach',
   'emails and communication': 'career_helper',
   'travel planner': 'problem_solver',
   'resume builder': 'career_helper',
   'industry research': 'problem_solver',
   'interview prep': 'career_helper',
   'language learning': 'study_partner',
   'tutoring': 'study_partner',
   'writing assistance': 'creative_buddy',
   'social media': 'creative_buddy',
   'decision support': 'problem_solver',
   'meal planner': 'wellness_guide',
   'personal stylist': 'life_coach',
};


// --- Generate Default Characters Map (Keyed by ID string) ---
const defaultCharactersById: Record<string, Character> = {};

// Explicitly type 'category' parameter
// *** This is where the error likely occurs if homeScreenCategories is undefined ***
if (homeScreenCategories && typeof homeScreenCategories.forEach === 'function') {
  homeScreenCategories.forEach((category: Category) => {
    // Determine model based on category group or title (example logic)
    let model = AI_MODELS.default;
    const lowerCaseTitle = category.title.toLowerCase();
    if (category.group === 'Professional' || category.group === 'Learning') {
      model = AI_MODELS.academic;
    } else if (lowerCaseTitle === 'creativity') {
      model = AI_MODELS.creative;
    } else if (category.group === 'Health') {
       model = AI_MODELS.fitness; // Or AI_MODELS.nutrition based on title?
       if (lowerCaseTitle === 'nutrition') model = AI_MODELS.nutrition;
    } else if (category.group === 'Personal' || category.group === 'Lifestyle') {
       model = AI_MODELS.coaching;
    }

    // Generate system prompt - use ?? undefined for description
    const system_prompt = CHARACTER_PROMPTS.getCategoryPrompt(category.title, category.title) ||
                          CHARACTER_PROMPTS.getDefaultPrompt(category.title, category.description ?? undefined);

    const characterIdString = category.id;
    // Attempt to parse to number for the 'id' field if DB expects number, but use string key for map
    const characterIdNumeric = parseInt(category.id, 10);

    defaultCharactersById[characterIdString] = {
      // --- Core Fields (matching CharacterFromDB structure as much as possible) ---
      // Use numeric ID if DB expects number, otherwise keep string/union type handles it
      id: isNaN(characterIdNumeric) ? characterIdString : characterIdNumeric,
      created_at: new Date().toISOString(), // Default timestamp
      name: category.title,
      description: category.description,
      // Map category title/group to a valid DB enum type if possible, otherwise null/default
      type: categoryToEnumTypeMap[lowerCaseTitle] || null,
      greeting: `Hello! I'm your ${category.title} assistant.`,
      image_url: null, // No default image URL

      // --- Extended Fields (matching Character interface) ---
      category: category.title,
      avatar: require('../assets/profile-placeholder.png'), // Default placeholder
      tags: [category.group],
      openingMessage: `Hello! How can I help you with ${category.title}?`,
      model: model,
      system_prompt: system_prompt,
      exampleQuestions: category.subTasks ? category.subTasks.slice(0, 2) : [], // Use first few subtasks as examples
      suggestedQuestions: category.subTasks ? category.subTasks.slice(2, 4) : [], // Use next few subtasks as suggestions
      subTasks: category.subTasks || [],
    };
  });
} else {
  console.error('[characterService] ERROR: homeScreenCategories is not an array or is undefined. Cannot generate default characters.');
  // Potentially throw an error here or handle the lack of defaults gracefully
}


console.debug('[characterService] Generated default characters map keys:', Object.keys(defaultCharactersById));


/**
 * Define an extended character type that includes AI fields (can be same as Character if comprehensive)
 */
type ExtendedCharacter = Character; // Use the comprehensive Character type

// Update enhanceWithAIFields to ensure all fields from Character are handled
export const enhanceWithAIFields = (character: Partial<Character>): ExtendedCharacter => {
  // Start with default values for potentially missing fields
  const defaults: Partial<Character> = {
    name: 'Assistant',
    description: 'A helpful AI assistant.',
    avatar: require('../assets/profile-placeholder.png'),
    tags: [],
    exampleQuestions: [],
    suggestedQuestions: [],
    subTasks: [],
    model: AI_MODELS.default,
    greeting: 'Hello!',
    openingMessage: 'How can I help you today?',
  };

  // Merge provided character data with defaults
  const merged = { ...defaults, ...character } as Character;

  // Ensure model and system_prompt are set if missing or invalid
  if (!merged.model || !Object.values(AI_MODELS).includes(merged.model)) {
     // Basic model determination logic (can be expanded)
     const modelMap: Record<string, string> = {
       'wellness_guide': AI_MODELS.fitness, // Example mapping
       'career_helper': AI_MODELS.academic,
       'study_partner': AI_MODELS.academic,
       'creative_buddy': AI_MODELS.creative,
       'problem_solver': AI_MODELS.default,
       'social_coach': AI_MODELS.coaching,
       'life_coach': AI_MODELS.coaching,
       'default': AI_MODELS.default
     };
     // Use 'type' if available and valid, otherwise category or name for prompt, default for model
     const characterTypeKey = typeof merged.type === 'string' ? merged.type : 'default';
     merged.model = modelMap[characterTypeKey] || modelMap.default;
  }

  // Ensure system_prompt is set - use ?? undefined for description
  if (!merged.system_prompt) {
    merged.system_prompt = CHARACTER_PROMPTS.getCategoryPrompt(merged.category || merged.name, merged.name) ||
                              CHARACTER_PROMPTS.getDefaultPrompt(merged.name, merged.description ?? undefined);
  }

  // Ensure greeting and openingMessage are consistent if one is missing
  merged.greeting = merged.greeting || `Hello! I'm ${merged.name}.`;
  merged.openingMessage = merged.openingMessage || merged.greeting;

  // Ensure ID is present (should always be passed in practice)
  if (merged.id === undefined || merged.id === null) {
      console.error("[enhanceWithAIFields] Character is missing an ID!", merged);
      // Assign a temporary ID or throw error? For now, log and assign placeholder
      merged.id = 'temp-' + Date.now();
  }

  // Type assertion to ExtendedCharacter (which is currently = Character)
  return merged as ExtendedCharacter;
};


/**
 * Get a character by ID, enhanced with AI fields.
 * Tries DB first, then falls back to predefined defaults.
 */
export const getCharacter = async (id: string): Promise<ExtendedCharacter | null> => {
  // ID must be a non-empty string for map lookup and DB query
  if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error(`[getCharacter] Invalid or empty ID provided: ${id}`);
      return null;
  }
  const trimmedId = id.trim();
  const cacheKey = `character:${trimmedId}`;
  console.log(`[getCharacter] Attempting to fetch character with ID: ${trimmedId}`); // Log entry

  try {
    // Attempt to fetch from DB via cache
    const characterFromDB = await getOrComputeCacheItem<CharacterFromDB | null>(
      cacheKey,
      async () => {
        let data: CharacterFromDB[] | null = null;
        try {
          console.debug(`[getCharacter] Querying DB for ID: ${trimmedId}`);
          // Use query with limit 1
           const result: PaginatedResult<CharacterFromDB> = await DatabaseService.query('characters', {
             // Assuming DB 'id' column is numeric, attempt conversion
             // If DB 'id' can be string, use trimmedId directly
             filters: [{ column: 'id', operator: 'eq', value: parseInt(trimmedId, 10) }], // Adjust if DB ID is string
             limit: 1
           });
           // Access data from the result object
           data = result.data;

           if (data && data.length > 0) {
             console.info(`[getCharacter] Found character in DB for ID: ${trimmedId}`);
             return data[0]; // Return the first result
           } else {
             console.info(`[getCharacter] Character ID ${trimmedId} not found in DB. Proceeding to fallback.`);
             return null; // Indicate not found in DB
           }

        } catch (dbError: any) { // Catch specific DB errors if possible
           // Check if it's a "not found" type error or something else
           // Supabase might throw specific error types/codes
           if (dbError?.message?.includes('multiple (or no) rows returned') || dbError?.code === 'PGRST116') {
                console.info(`[getCharacter] DB query for ID ${trimmedId} returned 0 rows (caught error). Proceeding to fallback.`);
           } else {
                console.error(`[getCharacter] DB query error for ID ${trimmedId}:`, dbError?.message || dbError);
           }
           return null; // Indicate DB fetch failed or returned no rows
        }
      },
      CHARACTER_CACHE_TTL
    );

    // If found in DB, enhance and return
    if (characterFromDB) {
      console.info(`[getCharacter] Enhancing character found in DB for ID: ${trimmedId}`);
      // Cast needed: DB type might miss fields defined in Character/ExtendedCharacter
      return enhanceWithAIFields(characterFromDB as Partial<Character>);
    }

    // --- Fallback Logic ---
    console.info(`[getCharacter] Checking default characters map for ID: ${trimmedId}`);
    const defaultChar = defaultCharactersById[trimmedId];

    if (defaultChar) {
      console.info(`[getCharacter] Found default character for ID: ${trimmedId}. Enhancing...`);
      // Enhance the default character data (ensures model/prompt consistency)
      // Pass a copy to avoid modifying the original default object
      return enhanceWithAIFields({ ...defaultChar });
    }

    // If not found in DB or defaults, return null
    console.warn(`[getCharacter] Character ID: ${trimmedId} not found in DB or defaults.`);
    return null;

  } catch (error) {
    // Catch errors from cache mechanism or unexpected issues
    console.error(`[getCharacter] Unexpected outer error for ID ${trimmedId}:`, error);
    return null;
  }
};

/**
 * Get multiple characters by IDs, enhanced with AI fields
 */
export const getCharactersByIds = async (ids: string[]): Promise<ExtendedCharacter[]> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }
  // Filter out invalid IDs before processing
  const validIds = ids.filter(id => id && typeof id === 'string' && id.trim() !== '');
  if (validIds.length !== ids.length) {
      console.warn('[getCharactersByIds] Some invalid IDs were provided and filtered out.');
  }
  if (validIds.length === 0) {
      return [];
  }

  console.log(`[getCharactersByIds] Fetching details for IDs: ${validIds.join(', ')}`);
  const results = await Promise.all(
    validIds.map(id => getCharacter(id)) // Use the updated getCharacter which includes fallback
  );

  const foundCharacters = results.filter((char): char is ExtendedCharacter => char !== null);
  console.info(`[getCharactersByIds] Successfully fetched details for ${foundCharacters.length} out of ${validIds.length} IDs.`);
  return foundCharacters;
};


/**
 * Get characters by category, enhanced with AI fields
 * NOTE: This might be less relevant now if primarily using getCharacter(id)
 * but kept for potential future use.
 */
export const getCharactersByCategory = async (category: string): Promise<ExtendedCharacter[]> => {
  const cacheKey = `characters:category:${category}`;
  const normalizedCategory = category.toLowerCase();
  const enumType = categoryToEnumTypeMap[normalizedCategory];

  console.log(`[getCharactersByCategory] Fetching characters for category: ${category} (Normalized: ${normalizedCategory}, EnumType: ${enumType})`);

  if (!enumType) {
      console.warn(`[getCharactersByCategory] No valid enum type mapping for category: '${category}'. Attempting fallback to defaults.`);
      // Fallback: Find default characters matching this category title
      const defaultMatches = Object.values(defaultCharactersById).filter(
          char => char.category?.toLowerCase() === normalizedCategory
      );
      if (defaultMatches.length > 0) {
          console.info(`[getCharactersByCategory] Found ${defaultMatches.length} default character(s) for category: ${category}`);
          // Enhance the default characters before returning
          return defaultMatches.map(char => enhanceWithAIFields({ ...char }));
      } else {
          console.warn(`[getCharactersByCategory] No DB enum type and no default characters found for category: ${category}`);
          return [];
      }
  }

  // If enumType exists, proceed with DB query via cache
  try {
    const charactersFromDB = await getOrComputeCacheItem<CharacterFromDB[] | null>(
      cacheKey,
      async () => {
        try {
          const options: QueryOptions = {
            filters: [{ column: 'type', operator: 'eq', value: enumType }],
            // Add ordering if needed, e.g., orderBy: { column: 'name', direction: 'asc' }
          };
          console.debug(`[getCharactersByCategory] Querying DB for type: ${enumType}`);
          // Correctly call query and expect PaginatedResult or thrown error
          const result: PaginatedResult<CharacterFromDB> = await DatabaseService.query('characters', options);
          const data = result.data; // Extract data

          console.info(`[getCharactersByCategory] Found ${data?.length || 0} characters in DB for type: ${enumType}`);
          return data || []; // Return data or empty array

        } catch (dbError: any) { // Catch potential errors from query
          console.error(`[getCharactersByCategory] DB error fetching type ${enumType}:`, dbError?.message || dbError);
          return null; // Indicate error during fetch
        }
      },
      CHARACTER_CACHE_TTL
    );

    if (charactersFromDB) {
      console.info(`[getCharactersByCategory] Enhancing ${charactersFromDB.length} characters from DB for category: ${category}`);
      // Enhance DB results
      return charactersFromDB.map(char => enhanceWithAIFields(char as Partial<Character>));
    } else {
      // If cache fetch failed (returned null), return empty array
      return [];
    }

  } catch (error) {
    console.error(`[getCharactersByCategory] Unexpected outer error for category ${category}:`, error);
    return [];
  }
};