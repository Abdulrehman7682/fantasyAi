import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { startOfToday } from "date-fns";
import Purchases from 'react-native-purchases';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  Modal,
  ImageBackground,
  Animated,
  Alert,
  Pressable,
  ImageSourcePropType,
  ActivityIndicator,
  // Add missing imports
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext'; // Ensure useAuth is imported
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import {
  getChatMessages,
  sendMessage as sendMessageToDb,
  subscribeToNewMessages,
  unsubscribeFromChat,
  Message,
} from '../services/conversationService';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { OPENROUTER_API_KEY, AI_MODELS, CHARACTER_PROMPTS } from '../utils/aiConfig';

// --- Types and Interfaces ---

type GuestChatSessionData = {
  id: number;
  characterId: number;
  name: string;
  avatar: string | number | null;
  lastMessage: string;
  lastInteractionAt: string;
  category?: string; // <-- Added optional category field
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Character {
  id: number | string; // Allow string or number ID to match navigation params
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
  subTasks?: string[]; // Added field for important subtasks/prompts
}

interface UIMessage {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  image_url?: string;
  audio_url?: string;
  type: 'message';
}

// Define type for Date Separator item
interface DateSeparatorItem {
  id: string;
  type: 'date-separator';
  date: string; // Formatted date string (e.g., "Today", "Yesterday", "April 15, 2025")
}

// Combined type for FlatList data
type ListItem = UIMessage | DateSeparatorItem;


interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

interface MessageItemProps {
  item: UIMessage;
  characterAvatar: ImageSourcePropType | string;
  characterIconName?: keyof typeof Ionicons.glyphMap; // Add icon name prop
}

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: () => void;
  isAISpeaking: boolean;
  sendButtonScale: Animated.Value;
  handlePressInSend: () => void;
  handlePressOutSend: () => void;
  onMicPress?: () => void;
  onAttachPress?: () => void;
  stagedMedia: StagedMedia | null;
  clearStagedMedia: () => void;
  isRecording: boolean;
}

// Add props for the new SubtaskSuggestions component
interface SubtaskSuggestionsProps {
  subTasks: string[];
  onSelectSubtask: (task: string) => void;
}

interface ChatHeaderProps {
  character: Character | null;
  handleBack: () => void;
}

interface TypingIndicatorDisplayProps {
  character: Character | null;
}

interface DateSeparatorProps {
  date: string;
}

interface ChatTheme {
  id: string;
  name: string;
  background: ImageSourcePropType | null;
}

interface StagedMedia {
  uri: string;
  base64: string;
  type: 'image' | 'audio';
  mimeType?: string;
}

type OpenRouterMessageContent =
  | string
  | Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
  >;

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: OpenRouterMessageContent;
}

// --- Constants ---
const GUEST_MESSAGE_LIMIT = 3; // Define the limit

const GUEST_CHATS_STORAGE_KEY = 'guestChats';
const MESSAGE_ANIMATION_DURATION = 300;
const FLATLIST_OPTIMIZATION_PROPS = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 11,
};

const CHAT_THEMES: ChatTheme[] = [
  { id: 'default', name: 'Default', background: null },
  { id: 'gradient1', name: 'Sunset', background: require('../assets/chat-bg/gradient1.png') },
  { id: 'gradient2', name: 'Ocean', background: require('../assets/chat-bg/gradient2.png') },
  { id: 'pattern1', name: 'Bubbles', background: require('../assets/chat-bg/pattern1.png') },
  { id: 'pattern2', name: 'Stars', background: require('../assets/chat-bg/pattern2.png') },
];

// --- Helper Functions ---

/**
 * Get appropriate avatar source based on avatar value
 */
const getAvatarSource = (avatar: Character['avatar'] | undefined | null): ImageSourcePropType => {
  if (!avatar) {
    return require('../assets/profile-placeholder.png');
  }
  if (typeof avatar === 'number') {
    return avatar;
  }
  if (typeof avatar === 'string' && avatar.startsWith('http')) {
    return { uri: avatar };
  }
  console.warn("Avatar is a string but not a URL, using placeholder:", avatar);
  return require('../assets/profile-placeholder.png');
};

/**
 * Map database message to UI message format
 */
function mapDbMessageToUIMessage(dbMsg: Message): UIMessage {
  if (!dbMsg) {
    console.warn("Attempted to map undefined or null database message");
    return {
      id: Crypto.randomUUID(),
      text: '[Message Error]',
      sender: 'ai',
      timestamp: Date.now(),
      type: 'message',
    };
  }

  return {
    id: dbMsg.id ?? Crypto.randomUUID(),
    text: dbMsg.content ?? '[empty message]',
    sender: (dbMsg.sender ?? 'ai') as 'user' | 'ai',
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
    type: 'message',
  };
}

/**
 * Generate welcome message for character
 */
function generateWelcomeMessage(char: Character): string {
  if (!char) return "Welcome! How can I help you today?";

  if (char.greeting) return char.greeting;
  if (char.openingMessage) {
    const questionList = (char.exampleQuestions || []).map((q: string) => `• ${q}`).join('\n');
    return `${char.openingMessage}${questionList ? `\n\nHere are some things I can help with:\n${questionList}` : ''}`;
  }
  return `Hello! I'm ${char.name}. How can I help you today?`;
}

/**
 * Load guest chat history from AsyncStorage
 */
async function loadGuestHistory(characterId: number): Promise<UIMessage[]> {
  if (isNaN(characterId)) {
    console.warn("loadGuestHistory called with invalid characterId:", characterId);
    return [];
  }
  const storageKey = `guestMessages_${characterId}`;
  try {
    const storedMessages = await AsyncStorage.getItem(storageKey);
    if (storedMessages) {
      const parsedMessages: UIMessage[] = JSON.parse(storedMessages);
      // Basic validation
      if (Array.isArray(parsedMessages) && parsedMessages.every(msg => msg && typeof msg === 'object' && 'id' in msg && 'text' in msg && 'sender' in msg && 'timestamp' in msg)) {
        console.log(`[ChatScreen] Loaded ${parsedMessages.length} messages for guest chat ${characterId} from AsyncStorage.`);
        return parsedMessages;
      } else {
        console.warn(`[ChatScreen] Invalid message format found in AsyncStorage for key ${storageKey}. Clearing.`);
        await AsyncStorage.removeItem(storageKey); // Clear invalid data
        return [];
      }
    }
    console.log(`[ChatScreen] No guest messages found in AsyncStorage for key ${storageKey}.`);
    return [];
  } catch (error) {
    console.error(`[ChatScreen] Error loading guest history from AsyncStorage (key: ${storageKey}):`, error);
    return [];
  }
}

/**
 * Save guest chat history to AsyncStorage
 */
async function saveGuestMessage(characterId: number, message: UIMessage): Promise<void> {
  if (isNaN(characterId)) {
    console.warn("saveGuestMessage called with invalid characterId:", characterId);
    return;
  }
  const storageKey = `guestMessages_${characterId}`;
  try {
    const existingMessages = await loadGuestHistory(characterId); // Reuse loading logic to get current state
    const updatedMessages = [...existingMessages, message];
    // Optional: Limit history size
    // const limitedMessages = updatedMessages.slice(-50); // Keep last 50 messages
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    console.log(`[ChatScreen] Saved message for guest chat ${characterId} to AsyncStorage.`);
  } catch (error) {
    console.error(`[ChatScreen] Error saving guest message to AsyncStorage (key: ${storageKey}):`, error);
  }
}


/**
 * Update guest chat session summary in AsyncStorage (for ChatListScreen)
 */
async function updateGuestChatSessionSummary(
  characterId: number,
  characterName: string,
  lastMessageText: string,
  category?: string
): Promise<void> {
  if (!characterId || isNaN(characterId) || characterId <= 0) {
    console.warn("Invalid character ID for guest chat session summary:", characterId);
    return;
  }

  try {
    const now = new Date().toISOString();
    const currentChatsRaw = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
    let currentChats: GuestChatSessionData[] = [];

    // Parse existing chats or initialize empty array
    if (currentChatsRaw) {
      try {
        const parsed = JSON.parse(currentChatsRaw);
        // Ensure parsed data is an array of objects with expected structure
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'characterId' in item)) {
          currentChats = parsed;
        } else {
          console.warn("Invalid data found in guest chat storage, resetting.");
          currentChats = [];
        }
      } catch (parseError) {
        console.error("Error parsing guest chats:", parseError);
        currentChats = []; // Reset on parse error
      }
    }

    const existingIndex = currentChats.findIndex(chat => chat.characterId === characterId);
    const sessionData: GuestChatSessionData = {
      id: characterId, // Use characterId for the main ID as well
      characterId: characterId,
      name: characterName,
      avatar: null, // Avatar might need updating if available
      lastMessage: lastMessageText.substring(0, 100), // Limit message length
      lastInteractionAt: now,
      category: category, // Store the category
    };

    if (existingIndex > -1) {
      // Update existing entry
      currentChats[existingIndex] = sessionData;
    } else {
      // Add new entry
      currentChats.push(sessionData);
    }

    // Sort by most recent interaction
    currentChats.sort((a, b) =>
      new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime()
    );

    // Limit to a reasonable number (e.g., 15)
    const limitedChats = currentChats.slice(0, 15);

    await AsyncStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(limitedChats));
    console.log("Guest chat session summary updated in storage for ID:", characterId);
  } catch (error) {
    console.error("Error updating guest chat session summary in storage:", error);
  }
}


/**
 * Format date for separators
 */
function formatDateSeparator(timestamp: number): string {
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  messageDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  return messageDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Adds a new message and ensures date separators are present/updated.
 */
function addMessageWithSeparator(existingMessages: ListItem[], newMessage: UIMessage): ListItem[] {
  const updatedMessages = [...existingMessages, newMessage];
  return addDateSeparators(updatedMessages);
}

/**
 * Adds or updates date separators in a sorted list of messages.
 */
function addDateSeparators(messagesToSort: ListItem[]): ListItem[] {
  const messagesWithSeparators: ListItem[] = [];
  let lastDateString = '';

  // Ensure messages are sorted by timestamp before adding separators
  const sortedMessages = messagesToSort
    .filter((item): item is UIMessage => item.type === 'message') // Only sort actual messages
    .sort((a, b) => a.timestamp - b.timestamp);

  sortedMessages.forEach((message) => {
    const messageDateString = formatDateSeparator(message.timestamp);
    if (messageDateString !== lastDateString) {
      messagesWithSeparators.push({
        id: `sep-${messageDateString}`,
        type: 'date-separator',
        date: messageDateString,
      });
      lastDateString = messageDateString;
    }
    messagesWithSeparators.push(message);
  });

  return messagesWithSeparators;
}

// --- Subcomponents ---

/**
 * Typing indicator animation component
 */
const TypingIndicator = React.memo(() => {
  const { colors } = useTheme();
  const yAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay)
        ])
      );
    };

    const animations = yAnims.map((anim, index) => createAnimation(anim, index * 150));
    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [yAnims]);

  const styles = useMemo(() => StyleSheet.create({
    typingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondaryText,
      marginHorizontal: 2,
    },
  }), [colors]);

  return (
    <View style={styles.typingContainer}>
      {yAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            { transform: [{ translateY: anim }] },
          ]}
        />
      ))}
    </View>
  );
});

/**
 * Typing indicator display with avatar
 */
const TypingIndicatorDisplay = React.memo(({ character }: TypingIndicatorDisplayProps) => {
  const { colors } = useTheme();

  if (!character) return null;

  const avatarSource = getAvatarSource(character.avatar);

  const styles = useMemo(() => StyleSheet.create({
    typingDisplayContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginVertical: 8,
      paddingHorizontal: 10,
    },
    typingAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 8,
      marginBottom: 5,
    },
    typingBubble: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 5,
      maxWidth: '70%',
    },
  }), [colors]);

  return (
    <View style={styles.typingDisplayContainer}>
      <Image
        source={avatarSource}
        style={styles.typingAvatar}
      />
      <View style={styles.typingBubble}>
        <TypingIndicator />
      </View>
    </View>
  );
});

/**
 * Message item component
 */
const MessageItem = React.memo(({ item, characterAvatar, characterIconName }: MessageItemProps) => {
  const { colors, isDarkMode } = useTheme();
  const isUser = item.sender === 'user';
  const formattedTime = useMemo(() => {
    return new Date(item.timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }, [item.timestamp]);

  const aiAvatarSource = useMemo(() => getAvatarSource(characterAvatar), [characterAvatar]);

  // Animation refs (no changes needed here)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const styles = useMemo(() => StyleSheet.create({
    messageRow: {
      flexDirection: 'row',
      marginVertical: 8,
      paddingHorizontal: 10,
    },
    userMessageRow: {
      justifyContent: 'flex-end',
      marginLeft: '20%',
    },
    aiMessageRow: {
      justifyContent: 'flex-start',
      marginRight: '20%',
    },
    // Container for AI avatar/icon
    aiIconAvatarContainer: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 8,
      alignSelf: 'flex-end',
      marginBottom: 5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.border, // Background for icon view
      overflow: 'hidden', // Clip image corners if image is used
    },
    avatar: { // Style for the Image component when used
      width: '100%',
      height: '100%',
    },
    userMessageContainer: {
      alignItems: 'flex-end',
    },
    userMessageBubble: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      borderBottomRightRadius: 5,
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
      elevation: 3,
    },
    userMessageText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.buttonText,
    },
    timestampReadStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      alignSelf: 'flex-end',
    },
    userTimestamp: {
      fontSize: 11,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.75)',
      marginRight: 5,
    },
    readStatusIcon: {
      // Style for the checkmark icon
    },
    aiMessageBubble: {
      backgroundColor: colors.cardBg,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      borderBottomLeftRadius: 5,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.1,
      shadowRadius: 2.5,
      elevation: 2,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    timestamp: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 6,
      alignSelf: 'flex-start',
    },
  }), [colors, isDarkMode]);

  // Determine AI avatar/icon content
  const aiRepresentation = characterIconName ? (
    <Ionicons
      name={characterIconName}
      size={18} // Smaller size for message item
      color={colors.primary}
    />
  ) : (
    <Image
      source={aiAvatarSource}
      style={styles.avatar}
      onError={(e) => console.warn("AI avatar error:", e.nativeEvent.error)}
    />
  );

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.userMessageRow : styles.aiMessageRow,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {!isUser && (
        // Use the container for both icon and avatar
        <View style={styles.aiIconAvatarContainer}>
          {aiRepresentation}
        </View>
      )}

      {isUser ? (
        // User message bubble
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>{item.text}</Text>
            <View style={styles.timestampReadStatusContainer}>
              <Text style={styles.userTimestamp}>{formattedTime}</Text>
              <Ionicons
                name="checkmark-done"
                size={15}
                color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)'}
                style={styles.readStatusIcon}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.aiMessageBubble}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
      )}
    </Animated.View>
  );
});

/**
 * Subtask Suggestions Component
 */
const SubtaskSuggestions = React.memo(({ subTasks, onSelectSubtask }: SubtaskSuggestionsProps) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    suggestionsContainer: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background, // Match background
    },
    suggestionChip: {
      backgroundColor: colors.cardBg, // Use card background for chips
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border, // Subtle border
    },
    suggestionText: {
      color: colors.text, // Use primary text color
      fontSize: 13,
    },
  }), [colors]);

  if (!subTasks || subTasks.length === 0) {
    return null; // Don't render if no subtasks
  }

  return (
    <View style={styles.suggestionsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {subTasks.map((task, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => onSelectSubtask(task)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionText}>{task}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

/**
 * Chat Input Component
 */
const ChatInput = React.memo(({
  inputText,
  setInputText,
  handleSend,
  isAISpeaking,
  isRecording,
  sendButtonScale,
  handlePressInSend,
  handlePressOutSend,
  onMicPress,
  onAttachPress,
  stagedMedia,
  clearStagedMedia
}: ChatInputProps) => {
  const { colors } = useTheme();
  const hasStagedMedia = stagedMedia !== null;
  const canSendText = inputText.trim().length > 0;
  const canSend = !isAISpeaking && (canSendText || hasStagedMedia);
  const showMicButton = !canSendText;

  const styles = useMemo(() => StyleSheet.create({
    inputAreaContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      paddingBottom: Platform.OS === 'ios' ? 25 : 15,
      paddingTop: 8,
    },
    stagedMediaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBg,
      marginHorizontal: 10,
      borderRadius: 10,
      marginBottom: 5,
    },
    stagedMediaText: {
      flex: 1,
      fontSize: 14,
      color: colors.secondaryText,
      marginLeft: 5,
    },
    clearMediaButton: {
      padding: 5,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    inputActionButton: {
      padding: 10,
      marginHorizontal: 3,
      marginBottom: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputActionButtonDisabled: {
      opacity: 0.4,
    },
    inputActionButtonPressed: {
      opacity: 0.6,
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      marginHorizontal: 5,
      minHeight: 44,
      maxHeight: 120,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    textInput: {
      fontSize: 16,
      color: colors.text,
      paddingTop: 0,
      paddingBottom: 0,
    },
    micSendButtonBase: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
      marginBottom: 0,
    },
    micButtonStyle: {
      // Mic usually doesn't need a background unless recording indicator is added
    },
    sendButtonStyle: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    buttonDisabled: {
      backgroundColor: colors.secondaryText,
      opacity: 0.5,
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonPressed: {
      transform: [{ scale: 0.92 }],
      shadowOpacity: 0.15,
    },
    sendButtonPressedSpecific: {
      backgroundColor: colors.primaryDark,
      transform: [{ scale: 0.92 }],
      shadowOpacity: 0.1,
    }
  }), [colors]);

  const iconColor = colors.icon;
  const placeholderTextColor = colors.secondaryText;

  const isButtonDisabled = showMicButton ? (isAISpeaking || hasStagedMedia) : !canSend;
  const buttonOnPress = showMicButton ? onMicPress : handleSend;
  const buttonOnPressIn = showMicButton ? undefined : handlePressInSend;
  const buttonOnPressOut = showMicButton ? undefined : handlePressOutSend;

  return (
    <View style={styles.inputAreaContainer}>
      {hasStagedMedia && (
        <View style={[styles.stagedMediaContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.stagedMediaText, { color: colors.secondaryText }]}>
            {stagedMedia.type === 'image' ? 'Image' : 'Audio'} ready
          </Text>
          <Pressable
            onPress={clearStagedMedia}
            style={({ pressed }) => [
              styles.clearMediaButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={onAttachPress}
          disabled={isAISpeaking || hasStagedMedia}
          style={({ pressed }) => [
            styles.inputActionButton,
            (isAISpeaking || hasStagedMedia) && styles.inputActionButtonDisabled,
            pressed && !(isAISpeaking || hasStagedMedia) && styles.inputActionButtonPressed
          ]}
        >
          <Ionicons name="attach-outline" size={24} color={iconColor} />
        </Pressable>

        <Pressable
          onPress={() => console.log('Camera pressed')}
          disabled={isAISpeaking}
          style={({ pressed }) => [
            styles.inputActionButton,
            isAISpeaking && styles.inputActionButtonDisabled,
            pressed && !isAISpeaking && styles.inputActionButtonPressed
          ]}
        >
          <Ionicons name="camera-outline" size={24} color={iconColor} />
        </Pressable>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={placeholderTextColor}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isAISpeaking}
          />
        </View>

        <Pressable
          onPress={buttonOnPress}
          onPressIn={buttonOnPressIn}
          onPressOut={buttonOnPressOut}
          disabled={isButtonDisabled}
          style={({ pressed }) => [
            styles.micSendButtonBase,
            showMicButton ? styles.micButtonStyle : styles.sendButtonStyle,
            isButtonDisabled && styles.buttonDisabled,
            pressed && !isButtonDisabled && styles.buttonPressed,
            pressed && !isButtonDisabled && !showMicButton && styles.sendButtonPressedSpecific,
          ]}
        >
          {showMicButton ? (
            <Ionicons
              name={isRecording ? "stop-circle-outline" : "mic-outline"}
              size={24}
              color={iconColor}
            />
          ) : (
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <Ionicons name="send" size={18} color={colors.buttonText} style={{ marginLeft: -1 }} />
            </Animated.View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

/**
 * Chat header component
 */
const ChatHeader = React.memo(({ character, handleBack }: ChatHeaderProps) => {
  const { colors } = useTheme();
  const avatarSource = useMemo(() => getAvatarSource(character?.avatar), [character?.avatar]);
  const characterName = character?.name || 'Chat';

  // Determine icon name based on category
  const iconName = useMemo(() => {
    if (character?.category) {
      return categoryIconMap[character.category] || DEFAULT_ICON_NAME;
    }
    return null; // No category, will fallback to avatar image
  }, [character?.category]);

  const styles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButtonLeft: {
      padding: 8,
      marginLeft: 0,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginLeft: 10,
      marginRight: 40, // Make space for potential right-side buttons
    },
    // Style for the container holding either the icon or the avatar
    iconAvatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.border, // Background for icon view
      overflow: 'hidden', // Ensure image corners are rounded if image is used
    },
    headerAvatar: { // Style specifically for the Image if used
      width: '100%',
      height: '100%',
    },
    headerTextContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    headerStatus: {
      fontSize: 12,
      color: colors.success, // Or use colors.secondaryText for a more neutral status
      marginTop: 2,
    },
    // ... rest of header styles ...
  }), [colors]);

  return (
    <View style={styles.header}>
      <Pressable onPress={handleBack} style={styles.headerButtonLeft}>
        <Ionicons name="chevron-back" size={30} color={colors.icon} />
      </Pressable>
      <View style={styles.headerCenter}>
        <View style={styles.iconAvatarContainer}>
          {iconName ? (
            <Ionicons
              name={iconName}
              size={24} // Adjust size as needed for the header
              color={colors.primary}
            />
          ) : (
            <Image
              source={avatarSource}
              style={styles.headerAvatar}
              onError={(e) => console.warn("Header avatar error:", e.nativeEvent.error)}
            />
          )}
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{characterName}</Text>
          {/* You might want to adjust the status text or remove it */}
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>
      {/* Add any right-side header buttons here if needed */}
    </View>
  );
});

/**
 * Date separator component
 */
const DateSeparator = React.memo(({ date }: DateSeparatorProps) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    dateSeparatorContainer: {
      alignItems: 'center',
      marginVertical: 10,
    },
    dateSeparatorText: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: '500',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
  }), [colors]);

  return (
    <View style={styles.dateSeparatorContainer}>
      <Text style={styles.dateSeparatorText}>{date}</Text>
    </View>
  );
});

// --- Main Chat Screen Component ---

export default function ChatScreen({ route }: ChatScreenProps) {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, isGuest } = useAuth();
  const { character: routeCharacter } = route.params;
  const [character, setCharacter] = useState<Character | null>(routeCharacter);
  const [messages, setMessages] = useState<ListItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [chatTheme, setChatTheme] = useState<ChatTheme>(CHAT_THEMES[0]); // <-- This state holds the theme
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // <-- Add state for keyboard visibility
  const isMounted = useRef(true); // <-- Add isMounted ref
  const [messagesCount, setMessagesCount] = useState(0); // <-- Track total messages count
  const [userSubscribed, setUserSubscribed] = useState(false); // <-- Track total messages count
  
  // let userSubscribed: boolean = false; 
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const GUEST_LIMIT = 3;

  // Derive iconName from the character state
  const characterIconName = useMemo(() => {
    if (character?.category) {
      return categoryIconMap[character.category] || DEFAULT_ICON_NAME;
    }
    return undefined; // Explicitly undefined if no category
  }, [character?.category]);

  // --- Callback Functions (Defined only once) ---

  // Add scrollToBottom definition
  const scrollToBottom = useCallback((animated = true) => {
    // Add a slight delay to ensure layout is complete before scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 50);
  }, []);

  // Add loadGuestMessageCount definition
  const loadGuestMessageCount = useCallback(async () => {
    if (isGuest && character) {
      const charId = Number(character.id);
      if (!isNaN(charId)) {
        const countStr = await AsyncStorage.getItem(`guestMessageCount_${charId}`);
        if (isMounted.current) {
          setGuestMessageCount(countStr ? parseInt(countStr, 10) : 0);
        }
      } else {
        console.warn("Cannot load guest message count due to invalid character ID:", character.id);
      }
    }
  }, [isGuest, character]);

  const handlePressInSend = useCallback(() => {
    Animated.spring(sendButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }, [sendButtonScale]);

  const handlePressOutSend = useCallback(() => {
    Animated.spring(sendButtonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [sendButtonScale]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const clearStagedMedia = useCallback(() => {
    setStagedMedia(null);
  }, []);

  /**
   * Handle selecting a subtask suggestion
   */
  const handleSelectSubtask = useCallback((task: string) => {
    console.debug(`[ChatScreen] Subtask selected: "${task}"`);
    setInputText(task);
  }, [setInputText]); // <-- Added dependency

  /**
   * Recording status update handler
   */
  const onRecordingStatusUpdate = useCallback((status: Audio.RecordingStatus) => {
    if (!isMounted.current) return; // Check if component is still mounted
    if (!status.isRecording) {
      // If recording stops unexpectedly, ensure state is updated
      if (recording) { // Check if we thought we were recording
        console.warn("Recording stopped unexpectedly");
        setRecording(null);
        setIsRecording(false);
      }
    }
    // Update UI based on status if needed (e.g., show recording duration)
  }, [recording, setRecording, setIsRecording]); // Add dependencies

  const stopRecording = useCallback(async (save = true) => {
    if (!recording) {
      console.warn("stopRecording called but no recording object exists.");
      setIsRecording(false); // Ensure state consistency
      return;
    }

    console.log('Stopping recording..');
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ // Reset audio mode
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      if (save && uri) {
        // Read the file and get base64 data
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (isMounted.current) {
          setStagedMedia({
            uri: uri,
            base64: base64,
            type: 'audio',
            mimeType: 'audio/m4a', // Adjust if using a different format
          });
        }
      } else if (!save) {
        console.log("Recording discarded.");
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert("Error", "Could not stop recording properly.");
    } finally {
      if (isMounted.current) {
        setRecording(null); // Clear the recording object in state
      }
    }
  }, [recording, setIsRecording, setRecording, setStagedMedia]); // <-- Added dependencies

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "You need to grant microphone permission to record audio.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate // Pass the status update handler
      );
      if (isMounted.current) {
        setRecording(recording);
        setIsRecording(true);
      }
      console.log('Recording started');

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert("Error", "Could not start recording.");
      if (isMounted.current) {
        setIsRecording(false); // Ensure state is correct on error
        setRecording(null);
      }
    }
  }, [setIsRecording, setRecording, onRecordingStatusUpdate]); // <-- Added dependencies

  /**
   * Handle pressing the microphone icon
   */
  const handleMicPress = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]); // <-- Added dependencies

  const pickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You need to grant permission to access the photo library.");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Reduce quality slightly for faster uploads
        base64: true, // Request base64 data
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        if (asset.uri && asset.base64) {
          console.log("Image picked:", asset.uri.substring(0, 100) + "...");
          if (isMounted.current) {
            setStagedMedia({
              uri: asset.uri,
              base64: asset.base64,
              type: 'image',
              mimeType: asset.mimeType || 'image/jpeg', // Get mimeType if available
            });
          }
        } else {
          console.warn("Picked image missing URI or base64 data");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image.");
    }
  }, [setStagedMedia]); // <-- Added dependency

  /**
   * Handle pressing the attachment icon
   */
  const handleAttachPress = useCallback(() => {
    pickImage();
  }, [pickImage]); // <-- Added dependency

  /**
   * Handle sending a message
   * 
   */
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('message_and_subscription')
          .select('message, user_id')
          .eq('user_id', user!.id)
        console.log("data of user messages and subscription status:", data);
        console.error("error of user messages and subscription status:", error);

        setMessagesCount(data?.length || 0); // Get the number of messages
        




      } catch (error) {
        console.error("Error fetching user messages and subscription status:", error);
      }
      const { data, error } = await supabase
        .from('subscriptions')
        .select('is_subscribed, user_id')
        .eq('user_id', user!.id)
      console.log("data of subscription status:", data);
      if (data) {
        setUserSubscribed(data[0]?.is_subscribed);
      }else{
      setUserSubscribed(false);
      }
    }
    fetchMessages();
    console.log( "messagesCount:", messagesCount, "userSubscribed:", userSubscribed);
    console.log("userid", user!.id)


  },[messagesCount]);


  const handleSend = useCallback(async () => {
    if (!character) return;

    const textToSend = inputText.trim();
    const mediaToSend = stagedMedia;

    if (!textToSend && !mediaToSend) return;
    if (isAISpeaking) return;

    // Guest message limit check
    if (isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      if (isMounted.current) setShowLimitModal(true);
      return;
    }

    const characterIdNum = Number(character.id); // Ensure ID is number
    if (isNaN(characterIdNum)) {
      console.error("Invalid character ID for sending message:", character.id);
      if (isMounted.current) {
        setError("Invalid character ID.");
        setIsAISpeaking(false); // Reset speaking state if error occurs early
      }
      return;
    }

    const userMessage: UIMessage = {
      id: Crypto.randomUUID(),
      text: textToSend,
      sender: 'user',
      timestamp: Date.now(),
      image_url: mediaToSend?.type === 'image' ? mediaToSend.uri : undefined,
      audio_url: mediaToSend?.type === 'audio' ? mediaToSend.uri : undefined,
      type: 'message',
    };

    // Optimistically add user message
    if (isMounted.current) {
      setInputText('');
      setStagedMedia(null);
      scrollToBottom();
    }

    // Increment guest count and save user message for guests
    if (isGuest) {
      const newCount = guestMessageCount + 1;
      if (isMounted.current) setGuestMessageCount(newCount);
      await AsyncStorage.setItem(`guestMessageCount_${characterIdNum}`, newCount.toString());
      await saveGuestMessage(characterIdNum, userMessage); // <-- Save user message for guest
    }
    // getting user messages and subscription status before sending messages







    // try {
    //   setMessagesCount(prevCount => prevCount + 1); // Increment messages count
    //   // Send message to DB (if logged in)
    //   if (!isGuest && user) {
    //     if (!userSubscribed && messagesCount >= 3) {
    //        setIsAISpeaking(false); // Set AI speaking *after* user message is added
    //       Alert.alert(
    //         "Subscription Required",
    //         "You need to subscribe to send more messages.",
    //         [
    //           {
    //             text: "Cancel",
    //             style: "cancel",
    //           },
    //           {
    //             text: "Subscribe",
    //             onPress: () => {
    //               // Navigate to your subscription screen here
    //               navigation.navigate('SubscriptionScreen');
    //             },
    //           },
    //         ],
    //         { cancelable: true }
    //       );


    //     } else {
    //       const { data, error } = await supabase
    //         .from('message_and_subscription')
    //         .insert([
    //           { user_id: user.id, message: textToSend },
    //         ])
    //         .select()
    //          setMessages(prevMessages => addMessageWithSeparator(prevMessages, userMessage));
    //           setIsAISpeaking(true); // Set AI speaking *after* user message is added
    //       console.log("first insert result:", data, error);
    //       await sendMessageToDb(user.id, characterIdNum, textToSend, 'user', mediaToSend?.uri, mediaToSend?.type);
    //     }
    //   }


    try {
  setMessagesCount(prevCount => prevCount + 1); // Local state update

  // Send message to DB (if logged in)
  if (!isGuest && user) {
    // Check subscription status from RevenueCat
    // const customerInfo = await Purchases.getCustomerInfo();
    // const isSubscribed = customerInfo.entitlements.active["your_entitlement_id"] !== undefined;

    // Get message count
    if (userSubscribed) {
      // Subscribed user: allow 50 messages per day
      const { data, error } = await supabase
        .from("message_and_subscription")
        .select("message", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", startOfToday().toISOString());

      const todayMessageCount = data?.length || 0;
      console.log("Today's message count:", todayMessageCount);

      if (todayMessageCount >= 50) {
        setIsAISpeaking(false);
        //  try {
        //   const customerInfo = await Purchases.getCustomerInfo();
        //   console.log("customerInfo:", customerInfo);
        // } catch (error) {
        //   console.log("Error fetching customer info:", error);
        // }
        Alert.alert(
          "Daily Limit Reached",
          "You have reached your 50-message limit for today. Please try again tomorrow."
        );
        return;
      }

    } else {
      // Free user: allow only 3 lifetime messages
      if (messagesCount >= 3) {
        setIsAISpeaking(false);
        Alert.alert(
          "Subscription Required",
          "You need to subscribe to send more messages.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Subscribe", onPress: () => navigation.navigate('SubscriptionScreen') },
          ],
          { cancelable: true }
        );
        return;
      }
    }

    // Save message in Supabase
    const { data, error } = await supabase
      .from("message_and_subscription")
      .insert([{ user_id: user.id, message: textToSend }])
      .select();

    setMessages(prevMessages => addMessageWithSeparator(prevMessages, userMessage));
    setIsAISpeaking(true);
    console.log("insert result:", data, error);

    await sendMessageToDb(
      user.id,
      characterIdNum,
      textToSend,
      'user',
      mediaToSend?.uri,
      mediaToSend?.type
    );
  }


      // Prepare context for AI
      let currentMessages: ListItem[] = [];
      setMessages(prev => { currentMessages = prev; return prev; }); // Read current state

      const history = currentMessages
        .filter((msg): msg is UIMessage => msg.type === 'message' && msg.id !== userMessage.id) // Exclude optimistic user message
        .slice(-10) // Limit history
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text // Assuming simple text history for now
        })) as OpenRouterMessage[];

      // Construct messages for OpenRouter API
      const apiMessages: OpenRouterMessage[] = [];

      // Add system prompt if available
      let systemPromptContent: string | undefined;
      const promptLookup = CHARACTER_PROMPTS[character.name as keyof typeof CHARACTER_PROMPTS];
      if (character.system_prompt) {
        systemPromptContent = character.system_prompt;
      } else if (typeof promptLookup === 'string') {
        systemPromptContent = promptLookup;
      } else {
        systemPromptContent = `You are ${character.name}. ${character.description || ''}`;
      }
      if (systemPromptContent) {
        apiMessages.push({ role: 'system', content: systemPromptContent });
      }


      // Add history
      apiMessages.push(...history);

      // Add current user message (text and/or image)
      let userMessageContent: OpenRouterMessageContent = [];
      if (textToSend) {
        userMessageContent.push({ type: 'text', text: textToSend });
      }
      if (mediaToSend?.type === 'image' && mediaToSend.base64) {
        userMessageContent.push({
          type: 'image_url',
          image_url: { url: `data:${mediaToSend.mimeType || 'image/jpeg'};base64,${mediaToSend.base64}` }
        });
      }
      // If only text, send as string; otherwise send as array
      apiMessages.push({ role: 'user', content: userMessageContent.length === 1 && userMessageContent[0].type === 'text' ? textToSend : userMessageContent });


      // Call AI model
      const modelToUse = character.model || AI_MODELS.default;
      console.log(`Calling AI model: ${modelToUse} with ${apiMessages.length} messages.`);
      if(messagesCount>=3 && userSubscribed == false){

      }else{

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: apiMessages,
          })
        });
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`AI API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        const data = await response.json();
        const aiText = data.choices[0]?.message?.content?.trim() || "Sorry, I couldn't process that.";
        const aiMessage: UIMessage = {
          id: data.id || Crypto.randomUUID(),
          text: aiText,
          sender: 'ai',
          timestamp: Date.now(),
          type: 'message',
        };
  
        if (isMounted.current) {
          setMessages(prevMessages => addMessageWithSeparator(prevMessages, aiMessage));
          scrollToBottom();
        }
  
        // Save AI message to DB (if logged in)
        if (!isGuest && user) {
          await sendMessageToDb(user.id, characterIdNum, aiText, 'ai');
        }
  
        // Update guest chat session summary AND save AI message for guests
        if (isGuest) {
          // *** Add logging here to check character object ***
          console.log(`[ChatScreen - handleSend] Updating guest summary for ID ${characterIdNum}. Character object:`, character);
          console.log(`[ChatScreen - handleSend] -> Passing category: ${character.category}`);
          await updateGuestChatSessionSummary( // <-- Use the correct function name for summary
            characterIdNum,
            character.name,
            aiText,
            character.category // <-- Pass category
          );
          await saveGuestMessage(characterIdNum, aiMessage); // <-- Save AI message for guest
        }
      }





    } catch (err) {
      console.error("Error during AI interaction or DB/Storage save:", err);
      const errorMessage: UIMessage = {
        id: Crypto.randomUUID(),
        text: `Sorry, an error occurred. ${err instanceof Error ? err.message : 'Please try again.'} `,
        sender: 'ai',
        timestamp: Date.now(),
        type: 'message',
      };
      if (isMounted.current) {
        setMessages(prevMessages => addMessageWithSeparator(prevMessages, errorMessage));
        scrollToBottom();
      }
    } finally {
      if (isMounted.current) {
        setIsAISpeaking(false);
      }
    }
  }, [character, inputText, stagedMedia, isAISpeaking, user, isGuest, guestMessageCount, scrollToBottom, setMessages, setInputText, setStagedMedia, setIsAISpeaking, setError, setShowLimitModal, setGuestMessageCount]); // <-- Removed updateGuestChatSessionInStorage, added saveGuestMessage if needed (it's called directly)


  // --- Audio and Image Picker Functions ---
  const playAudio = useCallback(async (uri: string) => {
    console.log("Loading Sound from URI:", uri);
    try {
      // Unload previous sound if exists
      if (sound) {
        console.log("Unloading previous sound...");
        await sound.unloadAsync();
        if (isMounted.current) setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      if (isMounted.current) setSound(newSound);
      console.log("Playing Sound");
      await newSound.playAsync();

      // Use the directly imported AVPlaybackStatus type
      newSound.setOnPlayba
;
      ckStatusUpdate(async (status: AVPlaybackStatus) => {
        if (!isMounted.current) return; // Check mount status in callback
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log("Sound finished playing");
            await newSound.unloadAsync();
            console.log("Sound unloaded");
            if (isMounted.current) setSound(null);
          }
        } else {
          if (status.error) {
            console.error(`Playback Error: ${status.error}`);
            await newSound.unloadAsync().catch(unloadError => console.error("Error unloading sound after playback error:", unloadError));
            if (isMounted.current) setSound(null);
          }
        }
      });
    } catch (error) {
      console.error("Failed to load or play sound", error);
      if (isMounted.current) setSound(null); // Clear sound state on error
    }
  }, [sound]); // <-- Added dependency

  // Effect to load messages and subscribe
  const loadMessages = useCallback(async () => {
    // Guard against missing character or user/guest status
    if (!character || (!user && !isGuest)) {
      console.warn("loadMessages called without character or user/guest status.");
      if (isMounted.current) setIsLoading(false);
      return;
    }
    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    const characterIdNum = Number(character.id);
    if (isNaN(characterIdNum)) {
      console.error("Invalid character ID for loading messages:", character.id);
      if (isMounted.current) {
        setError("Invalid character ID.");
        setIsLoading(false);
      }
      return;
    }


    try {
      let loadedMessages: UIMessage[] = []; // Use UIMessage type directly

      if (!isGuest && user) {
        const dbMessages: Message[] = await getChatMessages(user.id, characterIdNum);
        loadedMessages = dbMessages.map(mapDbMessageToUIMessage); // Map DB messages

        // Subscribe to new messages for logged-in users
        if (channelRef.current) {
          unsubscribeFromChat(channelRef.current);
        }
        channelRef.current = subscribeToNewMessages(user.id, characterIdNum, (newMessage) => {
          console.log('Received new message via subscription:', newMessage);
          if (isMounted.current && newMessage && newMessage.sender === 'ai' && newMessage.content) {
            setMessages(prevMessages =>
              addMessageWithSeparator(prevMessages, mapDbMessageToUIMessage(newMessage))
            );
            scrollToBottom();
          } else {
            console.warn("Received invalid or non-AI message via subscription, ignoring:", newMessage);
          }
        });

      } else if (isGuest) {
        // Load guest messages from AsyncStorage
        console.log(`[ChatScreen] Guest mode: Loading messages for character ${characterIdNum} from AsyncStorage.`);
        loadedMessages = await loadGuestHistory(characterIdNum); // <-- Load guest history
      } else {
        console.warn("loadMessages: Neither logged in nor guest mode detected.");
      }

      // Generate welcome message (only if no history exists or for specific logic)
      const welcomeNeeded = loadedMessages.length === 0; // Example: Show welcome only if history is empty
      const initialMessages: UIMessage[] = [];
      if (welcomeNeeded) {
        initialMessages.push({
          id: 'welcome-' + character.id,
          text: generateWelcomeMessage(character),
          sender: 'ai',
          timestamp: Date.now() - 1000, // Slightly before load time
          type: 'message',
        });
      }


      // Add separators to the combined list
      const messagesWithSeparators = addDateSeparators([...initialMessages, ...loadedMessages]);

      if (isMounted.current) {
        setMessages(messagesWithSeparators);
        scrollToBottom(false); // Scroll without animation on initial load
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      if (isMounted.current) {
        setError('Failed to load messages.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [character, user, isGuest, scrollToBottom, setMessages, setError, setIsLoading]); // <-- Added dependencies

  // --- useEffect Hooks ---

  useEffect(() => {
    // ... (existing mount, loadMessages, loadGuestMessageCount, keyboard listeners setup) ...
    isMounted.current = true;
    if (character) {
      loadMessages();
      loadGuestMessageCount();
    }

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => { if (isMounted.current) setKeyboardVisible(true); }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => { if (isMounted.current) setKeyboardVisible(false); }
    );


    return () => {
      // ... (existing cleanup: isMounted, channel, sound, keyboard listeners, recording) ...
      isMounted.current = false;
      if (channelRef.current) {
        unsubscribeFromChat(channelRef.current);
        channelRef.current = null;
      }
      if (sound) {
        sound.unloadAsync();
      }
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (recording) {
        console.log("Unmounting: Stopping recording...");
        stopRecording(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, user]); // Rerun only if character or user changes

  // --- Render Functions ---

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    // ... (existing renderItem logic) ...
    if (item.type === 'date-separator') {
      return <DateSeparator date={item.date} />;
    }
    // Pass characterIconName to MessageItem
    return (
      <MessageItem
        item={item}
        characterAvatar={character?.avatar || require('../assets/profile-placeholder.png')}
        characterIconName={characterIconName} // Pass the derived icon name
      />
    );
  }, [character?.avatar, characterIconName]); // Add characterIconName here

  // --- Main Return ---

  // Define subTasks based on character or default to empty array
  const subTasks = character?.subTasks || [];


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Use chatTheme state variable */}
      {chatTheme.background ? (
        <ImageBackground
          source={chatTheme.background}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <ChatHeader character={character} handleBack={handleBack} />
          {/* Loading/Error/Content states */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading chat...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={40} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <Pressable onPress={loadMessages} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContentContainer}
              ListFooterComponent={isAISpeaking ? <TypingIndicatorDisplay character={character} /> : null}
              keyboardShouldPersistTaps="handled"
              {...FLATLIST_OPTIMIZATION_PROPS}
            />
          )}
          {/* Keyboard Avoiding View */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            style={styles.keyboardAvoidingContainer}
          >
            <SubtaskSuggestions subTasks={subTasks} onSelectSubtask={handleSelectSubtask} />
            <ChatInput
              // ... (pass props) ...
              inputText={inputText}
              setInputText={setInputText}
              handleSend={handleSend}
              isAISpeaking={isAISpeaking}
              sendButtonScale={sendButtonScale}
              handlePressInSend={handlePressInSend}
              handlePressOutSend={handlePressOutSend}
              onMicPress={handleMicPress}
              onAttachPress={handleAttachPress}
              stagedMedia={stagedMedia}
              clearStagedMedia={clearStagedMedia}
              isRecording={isRecording}
            />
          </KeyboardAvoidingView>
        </ImageBackground>
      ) : (
        // ... (existing structure for no background) ...
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ChatHeader character={character} handleBack={handleBack} />
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading chat...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={40} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <Pressable onPress={loadMessages} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContentContainer}
              ListFooterComponent={isAISpeaking ? <TypingIndicatorDisplay character={character} /> : null}
              keyboardShouldPersistTaps="handled"
              {...FLATLIST_OPTIMIZATION_PROPS}
            />
          )}
          {/* Keyboard Avoiding View */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            style={styles.keyboardAvoidingContainer}
          >
            <SubtaskSuggestions subTasks={subTasks} onSelectSubtask={handleSelectSubtask} />
            <ChatInput
              // ... (pass props) ...
              inputText={inputText}
              setInputText={setInputText}
              handleSend={handleSend}
              isAISpeaking={isAISpeaking}
              sendButtonScale={sendButtonScale}
              handlePressInSend={handlePressInSend}
              handlePressOutSend={handlePressOutSend}
              onMicPress={handleMicPress}
              onAttachPress={handleAttachPress}
              stagedMedia={stagedMedia}
              clearStagedMedia={clearStagedMedia}
              isRecording={isRecording}
            />
          </KeyboardAvoidingView>
        </View>
      )}
      {/* Guest Limit Modal */}
      {/* ... (existing modal code) ... */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLimitModal}
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.primary} style={{ marginBottom: 15 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Message Limit Reached</Text>
            <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
              You've reached the message limit for guest users. Please sign up or log in to continue chatting.
            </Text>
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: colors.border },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => setShowLimitModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Later</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalPrimaryButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => {
                  setShowLimitModal(false);
                  navigation.navigate('AuthStack' as any, { screen: 'Login' } as any);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Sign Up / Log In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backgroundImage: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingBottom: 10,
  },
  keyboardAvoidingContainer: {
    // Styles for the container holding suggestions and input
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 16,
    marginVertical: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
  },
  modalPrimaryButton: {
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});

// --- Category to Icon Mapping (Copied from ChatListScreen for consistency) ---
const categoryIconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'Self-Growth': 'medal-outline',
  'Lifestyle': 'sunny-outline',
  'Spirituality': 'sparkles-outline',
  'Fitness': 'fitness-outline',
  'Nutrition': 'nutrition-outline',
  'Career': 'briefcase-outline',
  'Emails': 'mail-outline',
  'Relationships': 'heart-outline',
  'Mental Health': 'medical-outline',
  'Finance': 'cash-outline',
  'Education': 'book-outline',
  'Creativity': 'color-palette-outline',
  'Productivity': 'timer-outline',
  // Add more mappings if needed
};
const DEFAULT_ICON_NAME: keyof typeof Ionicons.glyphMap = 'chatbubble-ellipses-outline'; // Fallback icon
