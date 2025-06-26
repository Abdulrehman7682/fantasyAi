import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ImageSourcePropType, Dimensions, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import CategoryTile from './CategoryTile';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import * as characterService from '../services/characterService';

import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add this import
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native'; // Or use any icon lib
import { categories, prompts } from './src/Categories';
import { CHARACTER_PROMPTS } from 'utils/aiConfig';
// Define Category type (make sure it includes all used fields)

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
}


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

  const filters = ['Funny', 'Motivational', 'Romantic', 'Sad', 'Other'];

  const [selectedFilter, setSelectedFilter] = useState('All');
  let characterToPass: ChatCharacter;

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
  };

  const getWelcomeMessage = () => {
    return "Welcome Back";
  };
  const handleMessagePress = async (prompt: string, title: string) => {
    //const fetchedChar = await characterService.getCharacter('3');
     characterToPass = {
          id: 0, // Ensure we use the stable category.id
          name: title,
         // description: fetchedChar.description || category.description, // Fallback description
          avatar: require('../assets/profile-placeholder.png'),
          tags: [title],
          category:title,
          openingMessage: prompt,
         // exampleQuestions: exampleQuestions, // Use the derived exampleQuestions
         // suggestedQuestions: (fetchedChar as any).suggested_questions || [], // Keep existing logic for suggested
        //  greeting: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}.`,
          image_url: require('../assets/profile-placeholder.png'),
         // model: fetchedChar.model || undefined,
        //  system_prompt: fetchedChar.system_prompt || undefined,
        //  subTasks: subTasks, // Use the derived subTasks
        };
    navigation.navigate('Chat', { character: characterToPass, initialMessage: prompt });
  };

  const handleCategoryPress = async (category: Category, subscribeHandler: SubscribeHandler) => {
    console.log(`[HomeScreen] Category tile pressed: ${category.title} (ID: ${category.id})`);
    setIsLoading(true);
    try {
      // Use the category.id as the unique identifier for the assistant
      const assistantId = category.id;

      // Attempt to fetch specific character details using the category.id
      // getCharacter should handle fallbacks if no DB entry exists
      const fetchedChar = await characterService.getCharacter(assistantId);

      

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
    appBar: {
      height: 60,
      backgroundColor: '#6200EE',
      borderRadius: 30,
      marginTop: insets.top,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 25,
      elevation: 4, // Android shadow
      shadowColor: '#000', // iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    greeting: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
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
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 10,
      backgroundColor: colors.cardBg,
    },
    filterButton2: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 10,
    },
    filterButtonActive: {
      backgroundColor: colors.cardBg,
    },
    filterButtonText2: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: "white",
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    filterButtonSelected: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '500',
    },
    filterButtonTextSelected: {
      color: "white",
      backgroundColor: colors.primary,
      fontWeight: '600',
    },
    tilesGrid: {
      flexDirection: 'row', // Keep row direction
      flexWrap: 'wrap', // Change from wrap to nowrap for horizontal scroll
      justifyContent: 'flex-start', // Change from space-between
      paddingBottom: 20,
      overflow: 'visible', // Ensure tiles are fully visible
    },
    tileContainer: {
      width: Dimensions.get('window').width / 2.4, // Slightly less than half for spacing
      marginRight: 7, // Add horizontal spacing
      marginBottom: 1,
      aspectRatio: 1.1,
      height: undefined,
      flexShrink: 0, // Prevent shrinking
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
      marginTop: 16,
      marginBottom: 0,
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
    // Add this in your styles
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border, // light gray
      backgroundColor: colors.cardBg,
      borderRadius: 10,
      marginBottom: 5,
    },
    listText: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
    },
    listIcon: {
      marginLeft: 8,
      color: '#ff2e63',
    },
    getProButton: {
      // backgroundColor: '#FFA500',
      // height: 40,
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderRadius: 0,
    },
    getProGradient: {
      paddingVertical: 3,
      paddingHorizontal: 14,
      borderRadius: 12,
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6, // For Android shadow
    },
    getProText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    quickAction: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,

    }

  }), [colors]);

  // const renderCategoryTile = (category: Category) => {
  //   // Log the category title and the iconName being passed
  //   console.log(`[HomeScreen] Rendering tile: "${category.title}", Icon: ${category.iconName}`);
  //   return (
  //     <View key={category.id} style={styles.tileContainer}>
  //       <CategoryTile
  //         title={category.title}
  //         subtitle={category.description}
  //         iconName={category.iconName} // This should be correct based on the categories array
  //         colors={category.colors}
  //         onPress={() => handleCategoryPress(category, handleSubscribe)}
  //         onPressIn={() => console.log(`Category tile pressed in: ${category.title}`)}
  //         onPressOut={() => console.log(`Category tile pressed out: ${category.title}`)}
  //       />
  //     </View>
  //   );
  // };


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
  // Calculate half the categories
  const halfLength = Math.ceil(filteredCategories.length / 2);
  const firstHalf = filteredCategories.slice(0, halfLength);
  const secondHalf = filteredCategories.slice(halfLength);
  const renderCategorySection = (categories: Category[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tilesGrid}
    >
      {categories.map((category) => (
        <View key={category.id} style={styles.tileContainer}>
          <CategoryTile
            title={category.title}
            subtitle={category.description}
            iconName={category.iconName}
            colors={category.colors}
            onPress={() => handleCategoryPress(category, handleSubscribe)}
          />
        </View>
      ))}
    </ScrollView>
  );

  const filteredPrompts =
    selectedFilter === 'All'
      ? prompts
      : prompts.filter(item => item.category === selectedFilter);


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
          <View style={!userSubscribed ? styles.header : styles.header2}>
            <View style={styles.appBar}>
              <Text style={styles.greeting}>{getWelcomeMessage()}</Text>

              {!userSubscribed && (
                <TouchableOpacity onPress={() => navigation.navigate('SubscriptionScreen')} style={styles.getProButton}>
                  <LinearGradient
                    colors={['#1bffff', '#008192']} // Adjust colors for branding
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.getProGradient}
                  >
                    <Text style={styles.getProText}>PRO</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
            {/* <Text style={styles.subheading}>
              Explore your path to growth
            </Text> */}
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
          <View>
            {/* Second half of categories */}
            {renderCategorySection(filteredCategories)}
          </View>
          <View>
            <Text style={styles.quickAction}>Quick Actions</Text>

            {/* Filter Buttons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10, marginBottom: 10 }}
            >
              {filters.map(filter => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterButton2,
                    selectedFilter === filter && styles.filterButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText2,
                      selectedFilter === filter && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtered Prompt List */}
            <FlatList
              data={filteredPrompts}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleMessagePress(item.title, item.category)}
                >
                  <Text style={styles.listText}>{item.title}</Text>
                  <ChevronRight size={20} style={styles.listIcon} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Define and export the categories array


export default HomeScreen;