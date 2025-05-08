import React, { useMemo, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ImageSourcePropType
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as characterService from '../services/characterService';

// Define interfaces for Category and ChatCharacter
interface Category {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  colors: string[];
  group: string;
  subTasks?: string[];
}

interface ChatCharacter {
  id: number;
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
}

// Define route param list using types from App.tsx
interface RootStackParamList {
  SubTask: { category: Category };
  Chat: { character: ChatCharacter; initialMessage?: string };
}

type SubTaskScreenRouteProp = RouteProp<RootStackParamList, 'SubTask'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SubTaskScreen: React.FC = () => {
  const route = useRoute<SubTaskScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { category } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  console.log(`[SubTaskScreen] Mounted with category: ${category.title}`);

  // Memoized styles based on theme
  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    header: {
      marginBottom: 30,
      alignItems: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 20,
    },
    subTaskButton: {
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
    },
    subTaskText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
      marginRight: 10,
    },
    customQuestionButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginTop: 10,
      alignItems: 'center',
    },
    customQuestionText: {
      color: colors.buttonText,
      fontSize: 17,
      fontWeight: '600',
    },
    loadingOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    iconStyle: {
      marginLeft: 10,
    }
  }), [colors]);

  // Function to navigate to chat with optional initial message
  const navigateToChat = useCallback(async (initialMessage?: string) => {
    console.log(`[SubTaskScreen] Navigating to chat for ${category.title} ${initialMessage ? `with message: ${initialMessage}` : 'without initial message'}`);
    setIsLoading(true);
    
    try {
      // Fetch character data based on the category
      const characters = await characterService.getCharactersByCategory(category.title.toLowerCase());
      let characterToPass: ChatCharacter;

      if (characters && characters.length > 0) {
        const fetchedChar = characters[0];
        let characterId: number;
        
        // Ensure we have a valid numeric ID
        const fetchedId = fetchedChar.id;
        if (typeof fetchedId === 'number' && !isNaN(fetchedId)) {
          characterId = fetchedId;
        } else if (typeof fetchedId === 'string') {
          const parsedId = parseInt(fetchedId, 10);
          characterId = !isNaN(parsedId) ? parsedId : parseInt(category.id, 10);
        } else {
          characterId = parseInt(category.id, 10);
        }

        console.log(`[SubTaskScreen] Found specific character: ${fetchedChar.name} (ID: ${characterId})`);

        // Construct character object
        characterToPass = {
          id: characterId,
          name: fetchedChar.name,
          description: fetchedChar.description || category.description,
          avatar: fetchedChar.image_url ? { uri: fetchedChar.image_url } : require('../assets/profile-placeholder.png'),
          tags: [category.group],
          category: category.title,
          openingMessage: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}. How can I help?`,
          exampleQuestions: (fetchedChar as any).example_questions || [`Tell me more about yourself.`, `What can you help me with?`],
          suggestedQuestions: (fetchedChar as any).suggested_questions || [],
          greeting: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}.`,
          image_url: fetchedChar.image_url || undefined,
          model: fetchedChar.model || undefined,
          system_prompt: fetchedChar.system_prompt || undefined
        };
      } else {
        // Fallback when no specific character is found
        const characterId = parseInt(category.id, 10);
        console.log(`[SubTaskScreen] No specific character found for ${category.title}, using fallback (ID: ${characterId})`);
        
        characterToPass = {
          id: characterId,
          name: category.title,
          description: category.description,
          avatar: require('../assets/profile-placeholder.png'),
          tags: [category.group],
          category: category.group,
          openingMessage: `Hello! I'm your ${category.title} assistant. How can I help you today?`,
          exampleQuestions: [
            `Tell me about ${category.title}`,
            `How can you help me with ${category.title}?`,
            `What tips do you have about ${category.title}?`
          ],
          suggestedQuestions: category.subTasks || [
            `What are the best practices for ${category.title.toLowerCase()}?`,
            `How can I improve my ${category.title.toLowerCase()} skills?`,
            `What are common mistakes in ${category.title.toLowerCase()}?`
          ],
          greeting: `Hello! I'm your ${category.title} assistant. I'm here to help with all your ${category.title.toLowerCase()} needs!`,
          model: undefined,
          system_prompt: undefined
        };
      }

      // Navigate to Chat screen with character and optional initialMessage
      navigation.navigate('Chat', {
        character: characterToPass,
        initialMessage: initialMessage,
      });

    } catch (error) {
      console.error('[SubTaskScreen] Error navigating to chat:', error);
      Alert.alert("Error", "Could not load chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [category, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name={category.iconName} size={40} color={colors.primary} style={{ marginBottom: 15 }} />
          <Text style={styles.title}>{category.title}</Text>
          <Text style={styles.description}>{category.description}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {category.subTasks?.map((task, index) => (
            <TouchableOpacity
              key={index}
              style={styles.subTaskButton}
              onPress={() => navigateToChat(task)} // Pass subtask as initial message
            >
              <Text style={styles.subTaskText}>{task}</Text>
              <Ionicons name="chevron-forward-outline" size={22} color={colors.secondaryText} style={styles.iconStyle} />
            </TouchableOpacity>
          ))}

          {/* Custom Question Button */}
          <TouchableOpacity
            style={styles.customQuestionButton}
            onPress={() => navigateToChat()} // Navigate without initial message
          >
            <Text style={styles.customQuestionText}>Ask a Custom Question</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default SubTaskScreen;
