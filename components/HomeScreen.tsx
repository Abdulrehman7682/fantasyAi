import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import CategoryTile from './CategoryTile';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import * as characterService from '../services/characterService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add this import
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';

// Define Category type (make sure it includes all used fields)
export interface Category {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons['glyphMap']; // Or a more specific type if icons are limited
  colors: string[];
  group: string;
  subTasks?: string[];
}
//for handlepress First, define the type for your handler function
type SubscribeHandler = () => Promise<void>;


// Define the Character type expected by ChatScreen (align with ChatScreen.tsx and navigation.ts)
interface ChatCharacter {
  id: number | string; // Allow string IDs (from category.id)
  name: string;
  description?: string;
  avatar: ImageSourcePropType | string;
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  suggestedQuestions?: string[];
  greeting?: string;
  image_url?: string; // Keep if used for avatar logic
  model?: string; // Add model field
  system_prompt?: string; // Add system prompt field
  subTasks?: string[]; // Added field for important subtasks/prompts
}import Superwall from '@superwall/react-native-superwall';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { user, isSubscribed, credits } = useAuth();
  const { colors, styles: commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const displayName = user?.email?.split('@')[0] || 'Alex';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [userSubscribed, setUserSubscribed] = useState(false); // <-- Track total messages count

  //Add M
  // const [freeCharactersUsed, setFreeCharactersUsed] = useState(0);
  // Inside your component:
  // const [freeCharactersUsed, setFreeCharactersUsed] = useState<string[]>([]); // Track character IDs

  useEffect(() => {
    console.log('%c HomeScreen mounted', 'background: #000; color: #bada55; font-size: 12px;');
    console.log('%c User info:', 'color: #3498db; font-weight: bold;', {
      user: user ? 'Logged In' : 'Not Logged In',
      isSubscribed: isSubscribed || false,
      credits: credits || 0
    });

    return () => {
      console.log('%c HomeScreen unmounted', 'background: #000; color: #ff6b6b; font-size: 12px;');
    };
  }, [user, isSubscribed, credits]);
  useEffect(() => {
    // // Corrected Superwall configuration
    Purchases.configure({ apiKey: 'goog_TYefKLFczjVYSNRiGHwWaTYnTpm' });
    console.log('RevenueCat Initialized successfully');
  }, []);

  const fetchUserSubscriptionStatus = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('is_subscribed, user_id')
      .eq('user_id', user!.id)
    console.log("data of subscription status:", data);
    if (data) {
      setUserSubscribed(data[0]?.is_subscribed);
    } else {
      setUserSubscribed(false);
    }
  }

  useEffect(() => {
    fetchUserSubscriptionStatus();
  }, [user, userSubscribed]);

  const handleSubscribe = async () => {
    // navigation.navigate('SubscriptionScreen');
    console.log('[HomeScreen] Subscribe button pressed');
    // Your existing handleSubscribe function with proper typing
    // const handleSubscribe: SubscribeHandler = async () => {
    //     try {
    //       console.log("try")
    //       await <RevenueCatUI.Paywall
    //         onDismiss={() => {
    //           // Dismiss the paywall, i.e. remove the view, navigate to another screen, etc.
    //           // Will be called when the close button is pressed (if enabled) or when a purchase succeeds.
    //         }}
    //       />
    //     } catch (error) {
    //       console.log(error)
    //     }
  };

  const getWelcomeMessage = () => {
    return "Welcome Back";
  };

  // Load previously used characters on component mount
  // useEffect(() => {
  //   const loadUsedCharacters = async () => {
  //     try {
  //       const storedChars = await AsyncStorage.getItem('freeCharactersUsed');
  //       if (storedChars) {
  //         setFreeCharactersUsed(JSON.parse(storedChars));
  //       }
  //     } catch (error) {
  //       console.error('Failed to load used characters:', error);
  //     }
  //   };
  //   loadUsedCharacters();
  // }, []);

  const handleCategoryPress = async (category: Category, subscribeHandler: SubscribeHandler) => {
    console.log(`[HomeScreen] Category tile pressed: ${category.title} (ID: ${category.id})`);
    // ⭐ Check before proceeding
    // ⭐ Check subscription status and free usage
    // if (!isSubscribed) {
    //   // If already used 3 unique characters (and this is a new one)
    //   if (freeCharactersUsed.length >= 3 && !freeCharactersUsed.includes(category.id)) {
    //     navigation.navigate('SubscriptionScreen');
    //     // Alert.alert(
    //     //   "Subscription Required",
    //     //   "You've reached the free limit (3 characters). Subscribe to chat with more!",
    //     //   [
    //     //     { text: "Cancel", style: "cancel" },
    //     //     {
    //     //       text: "Subscribe",
    //     //       onPress: () => subscribeHandler(),
    //     //     }
    //     //   ]
    //     // );
    //     return; // Block further action
    //   }
    // }
    setIsLoading(true);
    try {
      // Use the category.id as the unique identifier for the assistant
      const assistantId = category.id;

      // Attempt to fetch specific character details using the category.id
      // getCharacter should handle fallbacks if no DB entry exists
      const fetchedChar = await characterService.getCharacter(assistantId);

      let characterToPass: ChatCharacter;

      if (fetchedChar) {
        // Character found in DB (or default fallback in getCharacter)
        console.info(`[HomeScreen] Found character details for ID: ${assistantId}. Name: ${fetchedChar.name}`);
        // Use fetched questions if available, otherwise fallback to category subTasks
        const exampleQuestions = (fetchedChar as any).example_questions?.length > 0
          ? (fetchedChar as any).example_questions
          : category.subTasks || []; // Fallback to category.subTasks
        // Use fetched subtasks if available, otherwise fallback to category subTasks
        const subTasks = (fetchedChar as any).sub_tasks?.length > 0
          ? (fetchedChar as any).sub_tasks
          : category.subTasks || []; // Fallback to category.subTasks

        characterToPass = {
          id: assistantId, // Ensure we use the stable category.id
          name: fetchedChar.name,
          description: fetchedChar.description || category.description, // Fallback description
          avatar: fetchedChar.image_url ? { uri: fetchedChar.image_url } : require('../assets/profile-placeholder.png'),
          tags: fetchedChar.tags || [category.group],
          category: fetchedChar.category || category.title,
          openingMessage: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}. How can I help?`,
          exampleQuestions: exampleQuestions, // Use the derived exampleQuestions
          suggestedQuestions: (fetchedChar as any).suggested_questions || [], // Keep existing logic for suggested
          greeting: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}.`,
          image_url: fetchedChar.image_url || undefined,
          model: fetchedChar.model || undefined,
          system_prompt: fetchedChar.system_prompt || undefined,
          subTasks: subTasks, // Use the derived subTasks
        };
      } else {
        // No specific character found in DB for this ID, construct from category info
        console.warn(`[HomeScreen] No specific character found for ID: ${assistantId}. Constructing default from category: ${category.title}`);
        characterToPass = {
          id: assistantId, // Use the stable category.id
          name: category.title, // Use category title as name
          description: category.description,
          avatar: require('../assets/profile-placeholder.png'), // Default avatar
          tags: [category.group],
          category: category.title,
          openingMessage: `Hello! How can I help you with ${category.title}?`,
          exampleQuestions: category.subTasks || [], // Use category subTasks as fallback
          suggestedQuestions: [], // Provide defaults or leave empty
          greeting: `Hello! I'm your ${category.title} assistant.`,
          image_url: undefined,
          model: undefined, // Use default model in ChatScreen if needed
          system_prompt: undefined, // Use default prompt in ChatScreen if needed
          subTasks: category.subTasks || [], // Use category subTasks
        };
      }

      // //Add m 
      //   // ⭐ Update used count
      //   if (!isSubscribed) {
      //     setFreeCharactersUsed(prev => prev + 1);
      //   }
      // if (!isSubscribed && !freeCharactersUsed.includes(category.id)) {
      //   const updatedUsedChars = [...freeCharactersUsed, category.id];
      //   setFreeCharactersUsed(updatedUsedChars);
      //   await AsyncStorage.setItem('freeCharactersUsed', JSON.stringify(updatedUsedChars));
      //   // await AsyncStorage.removeItem('freeCharactersUsed');

      // }
      console.info(`[HomeScreen] Navigating to Chat with Assistant ID: ${characterToPass.id}, Name: ${characterToPass.name}`);
      console.debug("[HomeScreen] Character data being passed:", characterToPass);
      navigation.navigate('Chat', { character: characterToPass });

    } catch (error) {
      console.error('[HomeScreen] Error handling category press:', error);
      Alert.alert(
        "Error",
        "Could not load the assistant. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const categoryGroups = ['All', ...new Set(categories.map(cat => cat.group))];

  // Memoize styles to prevent recreation on every render unless colors change
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 16,
    },
    header: {
      marginTop: 0,
      marginBottom: 28,
    },
     header2: {
      marginTop: 30,
      marginBottom: 28,
    },
    greeting: {
      fontSize: 28,
      marginTop: 5,// Further reduced font size
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4, // Slightly reduced margin
    },
    subheading: {
      fontSize: 18,
      color: colors.secondaryText,
      fontWeight: '400',
      marginBottom: 4,
    },
    creditsCounter: {
      fontSize: 16,
      color: colors.success,
      fontWeight: '500',
    },
    filterContainer: {
      marginBottom: 24,
    },
    filterScroll: {
      paddingVertical: 8,
    },
    filterButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      marginRight: 12,
      backgroundColor: colors.cardBg,
    },
    filterButtonSelected: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
    },
    filterButtonTextSelected: {
      color: colors.buttonText,
      fontWeight: '600',
    },
    tilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingBottom: 24,
    },
    tileContainer: {
      width: '48%',
      marginBottom: 16,
      aspectRatio: 1.2,
      height: undefined,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    premiumBannerGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      marginTop : 16,
      marginBottom : 0,
    },

    premiumBannerText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },

    premiumBannerButton: {
      backgroundColor: 'white',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      marginLeft: 12,
    },

    premiumBannerButtonText: {
      color: '#ff2e63',
      fontSize: 14,
      fontWeight: 'bold',
    },

  }), [colors]);

  const renderCategoryTile = (category: Category) => {
    // Log the category title and the iconName being passed
    console.log(`[HomeScreen] Rendering tile: "${category.title}", Icon: ${category.iconName}`);
    return (
      <View key={category.id} style={styles.tileContainer}>
        <CategoryTile
          title={category.title}
          subtitle={category.description}
          iconName={category.iconName} // This should be correct based on the categories array
          colors={category.colors}
          onPress={() => handleCategoryPress(category, handleSubscribe)}
          onPressIn={() => console.log(`Category tile pressed in: ${category.title}`)}
          onPressOut={() => console.log(`Category tile pressed out: ${category.title}`)}
        />
      </View>
    );
  };

  const filteredCategories = selectedCategory === 'All'
    ? categories
    : categories.filter(cat => cat.group === selectedCategory);

  const renderCategoryFilter = (group: string) => {
    const isSelected = selectedCategory === group;
    return (
      <TouchableOpacity
        key={group}
        style={[
          styles.filterButton,
          isSelected && styles.filterButtonSelected
        ]}
        onPress={() => setSelectedCategory(group)}
      >
        <Text style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextSelected
        ]}>
          {group}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: !userSubscribed ? 40 : 0 }}
        >
          {!userSubscribed && (
            <TouchableOpacity
              onPress={() => navigation.navigate('SubscriptionScreen')}
              activeOpacity={0.9}
              style={{ borderRadius: 16, marginBottom: 20 }}
            >
              <LinearGradient
                colors={['#ff8c00', '#ff2e63']} // adjust for branding
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBannerGradient}
              >
                <Text style={styles.premiumBannerText}>
                  Upgrade to Premium for unlimited access
                </Text>
                <View style={styles.premiumBannerButton}>
                  <Text style={styles.premiumBannerButtonText}>Upgrade</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={!userSubscribed ? styles.header : styles.header2}>
            <Text style={styles.greeting}>
              {getWelcomeMessage()}
            </Text>
            <Text style={styles.subheading}>
              Explore your path to growth
            </Text>
            {credits !== null && (
              <Text style={styles.creditsCounter}>
                Credits: {credits}
              </Text>
            )}
          </View>

          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categoryGroups.map(renderCategoryFilter)}
            </ScrollView>
          </View>

          <View style={styles.tilesGrid}>
            {filteredCategories.map(renderCategoryTile)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Define and export the categories array
export const categories: Category[] = [
  {
    id: '1',
    title: 'Self-Growth',
    description: 'Become a better version of yourself',
    iconName: 'medal-outline',
    colors: ['#10B981', '#34D399'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Help me set a goal for this week.',
      'Suggest a book about overcoming procrastination.',
      'Give me a 5-minute mindfulness exercise.',
    ]
  },
  {
    id: '2',
    title: 'Lifestyle',
    description: 'Fill your life with purpose and joy',
    iconName: 'sunny-outline',
    colors: ['#F59E0B', '#FBBF24'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Suggest a new hobby based on my interests.',
      'Give me ideas for a relaxing weekend.',
      'How can I incorporate more joy into my daily routine?',
    ]
  },
  {
    id: '3',
    title: 'Spirituality',
    description: 'Enrich your life with wisdom',
    iconName: 'sparkles-outline',
    colors: ['#8B5CF6', '#A78BFA'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Explain the concept of mindfulness.',
      'Share a quote about inner peace.',
      'Suggest a simple meditation technique.',
    ]
  },
  {
    id: '4',
    title: 'Fitness',
    description: 'Achieve your fitness goals',
    iconName: 'fitness-outline',
    colors: ['#EF4444', '#F87171'], // Updated Gradient
    group: 'Health',
    subTasks: [
      'Create a 15-minute home workout plan.',
      'What are the benefits of stretching daily?',
      'Suggest healthy post-workout snacks.',
    ]
  },
  {
    id: '13',
    title: 'Nutrition',
    description: 'Eat healthy and feel great',
    iconName: 'nutrition-outline',
    colors: ['#22C55E', '#4ADE80'], // Updated Gradient
    group: 'Health',
    subTasks: [
      'Give me ideas for healthy breakfasts.',
      'Explain the benefits of drinking more water.',
      'Suggest ways to reduce sugar intake.',
    ]
  },
  {
    id: '5',
    title: 'Career',
    description: 'Get your work done faster',
    iconName: 'briefcase-outline',
    colors: ['#6366F1', '#818CF8'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me prepare for a performance review.',
      'How can I improve my time management skills?',
      'Draft a professional email asking for feedback.',
    ]
  },
  {
    id: '6',
    title: 'Emails and Communication', // Ensure title matches map key
    description: 'Craft emails in seconds',
    iconName: 'mail-outline',
    colors: ['#0EA5E9', '#38BDF8'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Draft a follow-up email after a meeting.',
      'Help me write a polite decline email.',
      'Give tips for clear and concise communication.',
    ]
  },
  {
    id: '7',
    title: 'Relationships',
    description: 'Build stronger connections',
    iconName: 'heart-outline',
    colors: ['#EC4899', '#F472B6'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'How can I improve communication with my partner?',
      'Suggest ways to resolve conflicts healthily.',
      'Give tips for maintaining long-distance relationships.',
    ]
  },
  {
    id: '8',
    title: 'Mental Health',
    description: 'Calm your mind and reduce stress',
    iconName: 'medical-outline',
    colors: ['#3B82F6', '#60A5FA'], // Updated Gradient
    group: 'Health',
    subTasks: [
      'Suggest techniques to manage anxiety.',
      'How can I practice self-compassion?',
      'Give me tips for improving sleep quality.',
    ]
  },
  {
    id: '9',
    title: 'Finance',
    description: 'Manage your money efficiently',
    iconName: 'cash-outline',
    colors: ['#14B8A6', '#2DD4BF'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me create a simple monthly budget.',
      'Explain the basics of investing.',
      'Suggest ways to save money on groceries.',
    ]
  },
  {
    id: '10',
    title: 'Education',
    description: 'Learn new skills and concepts',
    iconName: 'book-outline',
    colors: ['#D946EF', '#E879F9'], // Updated Gradient
    group: 'Learning', // Changed group to Learning
    subTasks: [
      'Explain the concept of [topic].',
      'Suggest resources for learning [skill].',
      'Help me create a study plan.',
    ]
  },
  {
    id: '11',
    title: 'Creativity',
    description: 'Unlock your creative potential',
    iconName: 'color-palette-outline',
    colors: ['#A855F7', '#C084FC'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Give me a creative writing prompt.',
      'Suggest ways to overcome creative blocks.',
      'How can I find inspiration for my art?',
    ]
  },
  {
    id: '12',
    title: 'Productivity',
    description: 'Get more done in less time',
    iconName: 'timer-outline',
    colors: ['#F43F5E', '#FB7185'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me prioritize my tasks for today.',
      'Suggest tools for better time management.',
      'How can I avoid distractions while working?',
    ]
  },
  // --- New Assistants Start ---
  {
    id: '14',
    title: 'Travel Planner',
    description: 'Plan your next adventure',
    iconName: 'airplane-outline',
    colors: ['#06B6D4', '#22D3EE'], // Updated Gradient
    group: 'Lifestyle',
    subTasks: [
      'Suggest destinations for a weekend trip.',
      'Create a packing list for a beach vacation.',
      'Find budget-friendly travel tips.',
    ]
  },
  {
    id: '15',
    title: 'Resume Builder',
    description: 'Craft professional resumes & letters',
    iconName: 'document-text-outline',
    colors: ['#059669', '#10B981'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me write a summary for my resume.',
      'What are common resume mistakes to avoid?',
      'Draft a cover letter template.',
    ]
  },
  {
    id: '16',
    title: 'Industry Research',
    description: 'Analyze market trends & insights',
    iconName: 'analytics-outline',
    colors: ['#F97316', '#FB923C'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Summarize recent trends in the tech industry.',
      'Find statistics about renewable energy growth.',
      'Who are the key competitors in the e-commerce market?',
    ]
  },
  {
    id: '17',
    title: 'Interview Prep',
    description: 'Ace your next job interview',
    iconName: 'chatbubbles-outline',
    colors: ['#7C3AED', '#9333EA'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Give me common behavioral interview questions.',
      'Help me practice the STAR method for answering questions.',
      'What questions should I ask the interviewer?',
    ]
  },
  {
    id: '18',
    title: 'Language Learning',
    description: 'Master a new language',
    iconName: 'language-outline',
    colors: ['#EA580C', '#F97316'], // Updated Gradient
    group: 'Learning',
    subTasks: [
      'Translate "[phrase]" to [language].',
      'Give me tips for practicing speaking skills.',
      'Suggest resources for learning vocabulary.',
    ]
  },
  {
    id: '19',
    title: 'Tutoring',
    description: 'Get help with any subject',
    iconName: 'school-outline',
    colors: ['#0891B2', '#06B6D4'], // Updated Gradient
    group: 'Learning',
    subTasks: [
      'Explain the Pythagorean theorem.',
      'Help me understand [historical event].',
      'Quiz me on [subject topic].',
    ]
  },
  {
    id: '20',
    title: 'Writing Assistance',
    description: 'Improve your writing skills',
    iconName: 'pencil-outline',
    colors: ['#DC2626', '#EF4444'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Proofread this paragraph for errors.',
      'Suggest alternative phrasing for "[sentence]".',
      'Help me brainstorm ideas for an essay.',
    ]
  },
  {
    id: '21',
    title: 'Social Media',
    description: 'Craft engaging posts & captions',
    iconName: 'share-social-outline',
    colors: ['#0E7490', '#0891B2'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Write a catchy caption for a photo of [subject].',
      'Suggest hashtags for a post about [topic].',
      'Give ideas for engaging Instagram stories.',
    ]
  },
  {
    id: '22',
    title: 'Decision Support',
    description: 'Make informed choices',
    iconName: 'bulb-outline',
    colors: ['#D97706', '#F59E0B'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Help me weigh the pros and cons of [decision].',
      'What factors should I consider when choosing [option A] vs [option B]?',
      'Give me a framework for making difficult decisions.',
    ]
  },
  {
    id: '23',
    title: 'Meal Planner',
    description: 'Personalized recipes & meal plans',
    iconName: 'restaurant-outline',
    colors: ['#F472B6', '#EC4899'], // Pink/Rose Gradient
    group: 'Lifestyle',
    subTasks: [
      'Suggest a healthy dinner recipe using chicken.',
      'Create a meal plan for a vegetarian diet.',
      'Give me ideas for quick and easy lunches.',
    ]
  },
  {
    id: '24',
    title: 'Personal Stylist',
    description: 'Shopping advice & style tips',
    iconName: 'shirt-outline',
    colors: ['#A78BFA', '#8B5CF6'], // Purple Gradient
    group: 'Lifestyle',
    subTasks: [
      'What should I wear for a job interview?',
      'Suggest outfits for a casual weekend.',
      'Give tips for building a capsule wardrobe.',
    ]
  }
  // --- Additional Assistants End ---
  // --- New Assistants End ---
];

export default HomeScreen;