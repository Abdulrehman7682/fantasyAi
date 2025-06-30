import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Animated,
  ImageSourcePropType,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // Ensure Ionicons is imported
import { useAuth } from '../contexts/AuthContext';
// Import getRecentChats directly if it's a named export
// Assuming the service exports these correctly. If errors persist, check the service file.
import { getRecentChats, RecentChatInfo } from '../services/conversationService';
import * as characterService from '../services/characterService';
import { Tables } from '../types/database';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// --- Type Aliases ---
type Character = Tables<'characters'>;

// --- Constants ---
const GUEST_CHATS_STORAGE_KEY = 'guestChats';
const PLACEHOLDER_AVATAR = require('../assets/profile-placeholder.png');
const GUEST_AVATAR = require('../assets/crystalball.png'); // Use crystalball for guest avatar

// --- Category to Icon Mapping (Based on HomeScreen) ---
// Ensure this map includes ALL categories from HomeScreen.tsx and keys match exactly
const categoryIconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'Self-Growth': 'medal-outline',
  'Lifestyle': 'sunny-outline',
  'Spirituality': 'sparkles-outline',
  'Fitness': 'fitness-outline',
  'Nutrition': 'nutrition-outline',
  'Career': 'briefcase-outline',
  'Emails and Communication': 'mail-outline', // Corrected key
  'Relationships': 'heart-outline',
  'Mental Health': 'medical-outline',
  'Finance': 'cash-outline',
  'Education': 'book-outline',
  'Creativity': 'color-palette-outline',
  'Productivity': 'timer-outline',
  'Travel Planner': 'airplane-outline',
  'Resume Builder': 'document-text-outline',
  'Industry Research': 'analytics-outline',
  'Interview Prep': 'chatbubbles-outline',
  'Language Learning': 'language-outline',
  'Tutoring': 'school-outline',
  'Writing Assistance': 'pencil-outline',
  'Social Media': 'share-social-outline',
  'Decision Support': 'bulb-outline',
  'Meal Planner': 'restaurant-outline',
  'Personal Stylist': 'shirt-outline',
  // Add any other categories if they exist in HomeScreen.tsx
};
const DEFAULT_ICON_NAME: keyof typeof Ionicons.glyphMap = 'chatbubble-ellipses-outline'; // Fallback icon


// --- Navigation Types ---
type MainTabsParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

type RootStackParamList = {
  MainTabs: undefined;
  Chat: { character: { id: number; name: string; avatar: ImageSourcePropType } };
  // Add other stack screens if needed
};

// Reinstate the missing type alias
type ChatListScreenNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'ChatTab'>;

// --- Data Types ---
// Simplified Guest Session structure stored in AsyncStorage
interface GuestSessionData {
    id: string; // Typically characterId for guest sessions
    name: string;
    lastMessage: string;
    avatar: string | null; // Store URI string or null
    characterId: number; // Ensure this is stored as number if possible, or parse
    lastInteractionAt: string; // ISO timestamp string
    category?: string; // Add category if stored for guests
}

// UI Data structure - Add iconName
interface ChatSession {
  id: number; // Use character ID as the unique key for the list from getRecentChats
  name: string;
  lastMessage: string;
  avatar: ImageSourcePropType; // Keep for potential fallback or other uses
  iconName?: keyof typeof Ionicons.glyphMap; // Added icon name
  time: string; // Formatted time string
  characterId: number;
  lastInteractionAt: string; // ISO timestamp string (used for sorting)
  category?: string; // Add category to potentially fetch/store it
}

// --- Helper Functions ---

// Reinstate the missing helper function
function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
}

// Reinstate the missing helper function
function getParentNavigator(navigation: ChatListScreenNavigationProp): any {
  try {
    return navigation.getParent();
  } catch (e) {
    console.error("Could not get parent navigator. Ensure ChatListScreen is nested correctly.", e);
    return undefined;
  }
}

// Format conversation data from Supabase into ChatSession for UI
// ... (Keep existing formatConversation if needed, though it might not be used directly anymore)

// Get guest chats from AsyncStorage
async function getGuestChats(): Promise<ChatSession[]> {
  try {
    const storedChats = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
    console.log(`[ChatListScreen - getGuestChats] Raw data from AsyncStorage: ${storedChats}`); // Log raw string
    if (!storedChats) return [];

    const parsedChats: GuestSessionData[] = JSON.parse(storedChats);
    if (!Array.isArray(parsedChats)) return [];
    // Log the first parsed object to check its structure
    if (parsedChats.length > 0) console.log(`[ChatListScreen - getGuestChats] First parsed chat object:`, parsedChats[0]);

    return parsedChats.map((chat: GuestSessionData): ChatSession => {
      const assistantId = chat.characterId || parseInt(chat.id, 10) || 0;
      const category = chat.category; // Get category
      // *** Add detailed logging here ***
      console.log(`[ChatListScreen - getGuestChats] Processing guest chat: ID=${assistantId}, Raw Category="${category}"`);
      const iconName = category ? categoryIconMap[category] || DEFAULT_ICON_NAME : DEFAULT_ICON_NAME;
      console.log(`[ChatListScreen - getGuestChats] -> Derived Icon: "${iconName}"`);

      return {
        id: assistantId,
        characterId: assistantId,
        name: chat.name || 'Unknown Assistant',
        lastMessage: chat.lastMessage || 'No messages',
        avatar: GUEST_AVATAR,
        iconName: iconName, // Use derived icon name
        category: category,
        time: formatTimeAgo(chat.lastInteractionAt),
        lastInteractionAt: chat.lastInteractionAt || new Date(0).toISOString(),
      };
    });
  } catch (error) {
    console.error('[ChatListScreen] Error retrieving guest chats:', error);
    return [];
  }
}


// --- Chat List Item Component ---
interface ChatListItemProps {
  item: ChatSession;
  index: number;
  onPress: (item: ChatSession) => void;
  colors: any;
  avatarSize: number;
  isDarkMode: boolean;
  isGuest: boolean; // Add isGuest prop
}

const ChatListItem = memo(({ item, index, onPress, colors, avatarSize, isDarkMode, isGuest }: ChatListItemProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  // Memoize styles inside the component - Apply HomeScreen-like styling
  const itemStyles = useMemo(() => StyleSheet.create({
    chatItemContainer: { // Outer container for shadow/border radius
      marginBottom: 12,
      borderRadius: 16, // Match HomeScreen tile rounding
      overflow: 'visible', // Allow shadow to be visible
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 }, // Slightly larger shadow like HomeScreen
      shadowOpacity: isDarkMode ? 0.35 : 0.12, // Adjusted opacity
      shadowRadius: 6,
      elevation: 5, // Consistent elevation
      backgroundColor: colors.card, // Set background color here for shadow to work correctly
    },
    touchableContent: { // Inner container for gradient and content
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16, // Match outer container rounding
      overflow: 'hidden', // Clip gradient to rounded corners
    },
     underline: {
    height: 3,
    width: 130,
    backgroundColor: '#007AFF',
    marginTop: 4,
    borderRadius: 2,
  },
    iconContainer: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      marginRight: 14,
      justifyContent: 'center',
      alignItems: 'center',
      // Use a slightly more opaque background
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
    },
    avatarImage: {
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        marginRight: 14,
    },
    chatInfo: {
      flex: 1,
      justifyContent: 'center',
      marginRight: 10,
    },
    chatName: {
      fontWeight: '600', // Slightly less bold than 'bold' maybe? Or keep 'bold'
      fontSize: 16,
      color: colors.text,
      marginBottom: 3, // Slightly more space
    },
    chatMessage: {
      fontSize: 14,
      color: colors.secondaryText, // Keep secondary for less emphasis
    },
    chatTime: {
      fontSize: 12,
      color: colors.secondaryText,
      marginLeft: 'auto',
      alignSelf: 'flex-start',
      marginTop: 2,
    },
  }), [colors, avatarSize, isDarkMode]);

  // *** Add detailed logging here ***
  console.log(`[ChatListItem] Rendering item: ID=${item.id}, Name="${item.name}", Category="${item.category}", Received Icon="${item.iconName}", IsGuest=${isGuest}`);

  // Determine the icon/avatar content - Updated Logic
  let iconContent;
  // Priority 1: Use the derived category icon if an iconName was successfully derived
  if (item.iconName) {
    console.log(`[ChatListItem] Using derived icon (category or default): ${item.iconName}`);
    iconContent = (
      <View style={itemStyles.iconContainer}>
        <Ionicons
          name={item.iconName}
          size={avatarSize * 0.6}
          // Always use primary color for the icon for better visibility
          color={colors.primary}
        />
      </View>
    );
  } else if (isGuest) {
    // Priority 2 (Guest Fallback): Use the GUEST_AVATAR image if no iconName was derived at all
    console.log(`[ChatListItem] Fallback (Guest): No iconName derived, using GUEST_AVATAR.`);
    iconContent = (
      <Image
        source={GUEST_AVATAR}
        style={itemStyles.avatarImage}
        onError={(e) => console.warn('Guest avatar load error:', e.nativeEvent.error)}
      />
    );
  } else {
    // Priority 3 (Logged-in Fallback): Use the character's specific avatar image if no iconName derived
    console.log(`[ChatListItem] Fallback (Logged-in): No iconName derived, using character avatar:`, item.avatar);
    iconContent = (
      <Image
        source={item.avatar} // Assumes item.avatar is correctly populated in loadData
        style={itemStyles.avatarImage}
        onError={(e) => console.warn('Character avatar load error:', e.nativeEvent.error)}
      />
    );
  }


  return (
    <Animated.View style={[itemStyles.chatItemContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.85} // Slightly higher opacity on press
        style={{ borderRadius: 16 }} // Ensure touchable respects border radius for ripple/highlight effect
      >
        {/* Apply a gradient similar to HomeScreen tiles - slightly more vibrant */}
        <LinearGradient
          // Use subtle gradient based on theme - adjust these colors as needed
          colors={isDarkMode
            ? [colors.card, '#2A2A3A'] // Darker subtle gradient end color
            : [colors.card, '#f5f5fa'] // Lighter subtle gradient end color with a hint of color
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={itemStyles.touchableContent}
        >
          {/* Render the determined icon/avatar content */}
          {iconContent}

          <View style={itemStyles.chatInfo}>
            <Text style={itemStyles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={itemStyles.chatMessage} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <Text style={itemStyles.chatTime}>{item.time}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});
ChatListItem.displayName = 'ChatListItem';

// --- Main Screen Component ---
// Removed redundant ChatListScreen function definition

// --- Styles ---
// Memoize styles based on theme colors and dark mode status
// Moved getStyles outside the component for clarity and potential reuse pattern
const getStyles = (colors: any, isDarkMode: boolean, themeStyles: any) => StyleSheet.create({
  // Container for the main content area (excluding SafeAreaView)
  // Note: themeStyles.container likely provides flex: 1 already
  // container: {
  //    flex: 1,
  // },
  header: { // Style for the new header section
    paddingHorizontal: 16, // Match list padding
    paddingTop: 20, // Add top padding (adjust as needed)
    paddingBottom: 18, // Space below header
    marginTop: 25,
    marginLeft:5,
    // Optional: Add border if desired, like HomeScreen filters
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: colors.border,
    backgroundColor: colors.background, // Ensure header has same background
  },
  headerTitle: { // Style for the main header text
    fontSize: 26, // Slightly smaller than HomeScreen greeting
    fontWeight: '700',
    color: colors.text,
    // textAlign : "center",
    // borderBottomWidth: 1,
    marginBottom: 4,
  },
  headerSubtitle: { // Style for the sub-header text
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '400',
  },
  centeredContainer: { // For Loading and Error states
    flex: 1, // Take remaining space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: -50, // Adjust to vertically center considering the header height approx
  },
  errorText: { // Style for "Oops!" title
    marginTop: 15,
    fontSize: 20,
    fontWeight: '600',
    // color is applied inline
  },
  errorDetails: { // Style for error message details
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    // color is applied inline
  },
  retryButton: { // Style adjustments for the retry button
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, // Keep padding from themeStyles.primaryButton if possible
  },
  listContentContainer: { // For FlatList content
    paddingHorizontal: 16, // Add horizontal padding like HomeScreen
    paddingTop: 10, // Reduced top padding as header adds space now
    paddingBottom: 20, // Add padding at the bottom
    flexGrow: 1, // Important for empty list/loading/error states to center correctly
  },
  // Remove listStyle and sectionTitle as they are no longer needed here
  emptyStateContainer: { // For Empty state
    flex: 1, // Take remaining space
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50, // Push content up slightly
    marginTop: -50, // Adjust to vertically center considering the header height approx
  },
   underline: {
    height: 3,
    width: 175,
    backgroundColor: '#007AFF',
    marginTop: 4,
    borderRadius: 2,
  },
  emptyStateTitle: { // Style for "No Chats Yet"
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    // color is applied inline
  },
  emptyStateText: { // Style for the subtitle text in empty state
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    // color is applied inline
  },
  exploreButton: { // Style adjustments for the explore button
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, // Keep padding from themeStyles.primaryButton if possible
  },
});

// --- Component Re-export with Style Hook ---
// This pattern ensures styles are recalculated when theme changes
export default function ChatListScreenWrapper({ navigation }: { navigation: ChatListScreenNavigationProp }) {
  const { colors, styles: themeStyles, isDarkMode } = useTheme();
  // Generate styles based on the current theme, passing themeStyles for potential reuse
  const styles = useMemo(() => getStyles(colors, isDarkMode, themeStyles), [colors, isDarkMode, themeStyles]);

  // Pass navigation, colors, themeStyles, isDarkMode, and generated styles down
  // Note: The actual ChatListScreen component logic is now inside the function defined above
  // We need to call that function definition here, passing the necessary props.
  // This requires restructuring the original component slightly.

  // --- State and Hooks (from original component, now inside the wrapper) ---
  const { width } = useWindowDimensions();
  const { user, isGuest } = useAuth();
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const avatarSize = useMemo(() => Math.max(45, Math.min(60, width * 0.13)), [width]);

  // --- Callbacks (from original component, now inside the wrapper) ---
   const handleRefresh = useCallback(() => {
    loadData();
  }, [/* loadData dependency */]); // Need loadData defined here or passed

  interface ChatNavCharacterParams { // Keep this interface definition
    id: number | string;
    name: string;
    description?: string;
    avatar: ImageSourcePropType | string;
    tags?: string[];
    category?: string;
    openingMessage?: string;
    exampleQuestions?: string[];
    suggestedQuestions?: string[];
    greeting?: string;
    image_url?: string;
    model?: string;
    system_prompt?: string;
    subTasks?: string[];
  }

  const handlePressItem = useCallback(async (item: ChatSession) => {
    console.log(`[ChatListScreen] Navigating to chat for Assistant ID: ${item.characterId}, Name: ${item.name}`);
    const parentNavigator = getParentNavigator(navigation);
    if (parentNavigator) {
      let characterParams: Partial<ChatNavCharacterParams> = {};
      try {
        const fetchedChar = await characterService.getCharacter(item.characterId.toString());
        if (fetchedChar) {
          console.info(`[ChatListScreen] Fetched details for ID ${item.characterId}: ${fetchedChar.name}`);
          characterParams = {
            name: fetchedChar.name,
            description: fetchedChar.description ?? undefined,
            avatar: fetchedChar.image_url
              ? { uri: fetchedChar.image_url }
              : (isGuest ? GUEST_AVATAR : PLACEHOLDER_AVATAR),
            tags: fetchedChar.tags,
            category: fetchedChar.category,
            openingMessage: fetchedChar.greeting ?? undefined,
            exampleQuestions: (fetchedChar as any).example_questions || [],
            suggestedQuestions: (fetchedChar as any).suggested_questions || [],
            greeting: fetchedChar.greeting ?? undefined,
            image_url: fetchedChar.image_url ?? undefined,
            model: fetchedChar.model,
            system_prompt: fetchedChar.system_prompt,
            subTasks: (fetchedChar as any).sub_tasks || [],
          };
        } else {
           console.warn(`[ChatListScreen] Could not fetch full details for ID ${item.characterId}. Using basic info.`);
        }
      } catch (fetchError) {
        console.error(`[ChatListScreen] Error fetching character details for ID ${item.characterId}:`, fetchError);
      }

      const finalNavParams: ChatNavCharacterParams = {
        id: item.characterId,
        name: characterParams.name || item.name,
        avatar: characterParams.avatar || (isGuest ? GUEST_AVATAR : PLACEHOLDER_AVATAR),
        description: characterParams.description,
        tags: characterParams.tags,
        category: characterParams.category || item.category,
        openingMessage: characterParams.openingMessage,
        exampleQuestions: characterParams.exampleQuestions,
        suggestedQuestions: characterParams.suggestedQuestions,
        greeting: characterParams.greeting,
        image_url: characterParams.image_url,
        model: characterParams.model,
        system_prompt: characterParams.system_prompt,
        subTasks: characterParams.subTasks,
      };

      console.debug("[ChatListScreen] Navigating with parameters:", finalNavParams);
      parentNavigator.navigate('Chat', { character: finalNavParams });

    } else {
      console.error("[ChatListScreen] Could not find parent navigator.");
      Alert.alert("Navigation Error", "Could not open chat screen.");
    }
  }, [navigation, isGuest]); // Dependencies for handlePressItem

  const loadData = useCallback(async () => { // Define loadData within the wrapper scope
    setIsLoading(true);
    setError(null);
    try {
      console.log('[ChatListScreen] Reloading chat data', { userId: user?.id || 'guest', isGuest });
      let fetchedChats: ChatSession[] = [];
      if (isGuest) {
        fetchedChats = await getGuestChats();
        console.info('[ChatListScreen] Reloaded guest chats', { count: fetchedChats.length });
      } else if (user) {
        const recentChatInfos: RecentChatInfo[] = await getRecentChats(user.id, 20);
        if (recentChatInfos && recentChatInfos.length > 0) {
          const characterIds = recentChatInfos.map(info => info.character_id.toString());
          const characters = await characterService.getCharactersByIds(characterIds);
          const characterMap = new Map(characters.map(c => [c.id, c]));

          fetchedChats = recentChatInfos.map((info): ChatSession | null => {
            const assistantId = info.character_id;
            const character = characterMap.get(assistantId);
            const characterName = character?.name || 'Unknown Assistant';
            const characterCategory = character?.category;
            console.log(`[ChatListScreen - loadData] Processing logged-in chat: ID=${assistantId}, Raw Category="${characterCategory}"`);
            const characterAvatar = character?.image_url ? { uri: character.image_url } : PLACEHOLDER_AVATAR;
            const iconName = characterCategory ? categoryIconMap[characterCategory] || DEFAULT_ICON_NAME : DEFAULT_ICON_NAME;
            console.log(`[ChatListScreen - loadData] -> Derived Icon: "${iconName}"`);

            return {
              id: assistantId,
              characterId: assistantId,
              name: characterName,
              lastMessage: info.last_message_content || 'No messages yet',
              avatar: characterAvatar,
              iconName: iconName,
              category: characterCategory,
              time: formatTimeAgo(info.last_message_time),
              lastInteractionAt: info.last_message_time || new Date(0).toISOString(),
            };
          }).filter((chat): chat is ChatSession => chat !== null);

          fetchedChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
          console.info('[ChatListScreen] Reloaded conversations for logged-in user', { count: fetchedChats.length });
        }
      }
      setRecentChats(fetchedChats);
    } catch (err) {
      console.error('[ChatListScreen] Error reloading chats:', err);
      setError(`Failed to reload chats. ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, user]); // Dependencies for loadData

  const renderItem = useCallback(({ item, index }: { item: ChatSession; index: number }) => (
    <ChatListItem
      item={item}
      index={index}
      onPress={handlePressItem} // Use handlePressItem from wrapper scope
      colors={colors}
      avatarSize={avatarSize}
      isDarkMode={isDarkMode}
      isGuest={isGuest}
    />
  ), [handlePressItem, colors, avatarSize, isDarkMode, isGuest]); // Dependencies for renderItem

  useFocusEffect( // UseFocusEffect inside the wrapper
    useCallback(() => {
      console.log('[ChatListScreen] Screen focused, reloading data.');
      loadData(); // Call loadData from wrapper scope
      return () => {
        console.log('[ChatListScreen] Screen unfocused.');
      };
    }, [loadData])
  );

  // --- Render Logic (moved into the wrapper body) ---
  const renderContent = () => { // Define renderContent within the wrapper scope
    if (isLoading && recentChats.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="cloud-offline-outline" size={60} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Oops!</Text>
          <Text style={[styles.errorDetails, { color: colors.secondaryText }]}>{error}</Text>
          <TouchableOpacity
             style={[themeStyles.primaryButton as any, styles.retryButton]}
             onPress={loadData}
          >
            <Ionicons name="refresh-outline" size={18} color={themeStyles.primaryButtonText.color} style={{ marginRight: 8 }}/>
            <Text style={themeStyles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (recentChats.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={70} color={colors.secondaryText} style={{ opacity: 0.8 }} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Chats Yet</Text>
          <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
            Start a conversation from the Home screen to see it here.
          </Text>
          <TouchableOpacity
             style={[themeStyles.primaryButton as any, styles.exploreButton]}
             onPress={() => navigation.navigate('HomeTab')}
          >
            <Ionicons name="search-outline" size={18} color={themeStyles.primaryButtonText.color} style={{ marginRight: 8 }}/>
            <Text style={themeStyles.primaryButtonText}>Explore Characters</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={recentChats}
        renderItem={renderItem} // Use renderItem from wrapper scope
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh} // Use handleRefresh from wrapper scope
        refreshing={isLoading && recentChats.length > 0}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    );
  };

  // --- Final Return Statement of the Wrapper ---
  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Chats</Text>
        <View style={styles.underline} />
        {/* <Text style={styles.headerSubtitle}>Continue your conversations</Text> */}
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}