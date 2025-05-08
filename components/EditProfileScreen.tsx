import React, { useState, useCallback, useContext, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext, useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

// --- Types ---

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  interests: string[];
  profileImageUrl?: string | null; // Add optional profile image URL
}

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>; // Use RootStackParamList

// --- Constants ---

// Placeholder profile data - In a real app, this would be fetched via userService
// potentially using useEffect and useState for loading/error states.
const INITIAL_PROFILE_DATA = {
  username: 'johnsmith',
  displayName: 'John Smith',
  bio: 'Fantasy AI enthusiast and avid storyteller. I love creating unique character interactions and exploring different narratives.',
  location: 'San Francisco, CA',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  interests: ['AI Characters', 'Storytelling', 'Science Fiction', 'Fantasy Worlds', 'Interactive Fiction'],
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { isGuest, user } = useAuth();
  const { colors, styles: themeStyles } = useTheme(); // Use theme context

  // TODO: Fetch initial profile data from userService based on user?.id
  // Example: const { data: initialData, isLoading, error } = useFetchUserProfile(user?.id);
  const [profileData, setProfileData] = useState<UserProfile>({
    // Initialize with potentially fetched data or defaults
    username: '', // Default to empty or fetched value
    displayName: '',
    bio: '',
    location: '',
    email: user?.email || '', // Pre-fill email if available
    phone: '',
    interests: [],
    profileImageUrl: null,
  });
  const [newInterest, setNewInterest] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // Add loading state for initial data fetch

  // --- Fetch Initial Data (Example) ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (isGuest || !user?.id) {
        setIsLoadingData(false);
        return; // No profile to fetch for guests or unidentified users
      }
      setIsLoadingData(true);
      try {
        // Replace with your actual data fetching logic (e.g., using supabase or userService)
        // const fetchedData = await userService.getProfile(user.id);
        // Simulating fetch
        await new Promise(resolve => setTimeout(resolve, 500));
        const fetchedData = { // Replace with actual fetched data
          username: 'johnsmith_fetched',
          displayName: 'John Smith Fetched',
          bio: 'Fetched bio.',
          location: 'Fetched Location',
          email: user.email || 'fetched@example.com',
          phone: '555-555-5555',
          interests: ['Fetched Interest 1', 'Fetched Interest 2'],
          profileImageUrl: null, // Replace with actual URL if available
        };
        setProfileData(fetchedData);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        Alert.alert("Load Failed", "Could not load your profile data.");
        // Keep default/empty data or navigate back
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProfile();
  }, [user?.id, isGuest, user?.email]);


  // --- Handlers ---

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    console.log("Saving profile data:", profileData);
    try {
      // TODO: Replace with actual API call: await userService.updateProfile(user?.id, profileData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      Alert.alert(
        "Profile Updated",
        "Your profile has been successfully updated.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Save Failed", "Could not update your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [profileData, navigation, isSaving, user?.id]); // Added user?.id dependency

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddInterest = useCallback(() => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest === '' || profileData.interests.includes(trimmedInterest)) {
      setNewInterest('');
      return;
    }
    setProfileData(prevData => ({
      ...prevData,
      interests: [...prevData.interests, trimmedInterest]
    }));
    setNewInterest('');
  }, [newInterest, profileData.interests]);

  const handleRemoveInterest = useCallback((indexToRemove: number) => {
    setProfileData(prevData => ({
      ...prevData,
      interests: prevData.interests.filter((_, index) => index !== indexToRemove)
    }));
  }, []);

  const handleInputChange = useCallback((field: keyof UserProfile, value: string) => {
    setProfileData(prevData => ({
      ...prevData,
      [field]: value
    }));
  }, []);

  // --- Styles ---
  // Use useMemo to create styles based on theme colors
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Use theme background
    },
    loadingContainer: { // Added loading container
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    keyboardAvoidView: {
      flex: 1,
    },
    scrollContainer: {
      padding: 16,
      paddingBottom: 40, // Ensure space at the bottom
    },
    profileImageSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.border, // Use theme border/placeholder color
      marginBottom: 12,
    },
    changePhotoButton: {
      backgroundColor: colors.primary, // Use theme primary
      borderRadius: 20, // Make it rounded
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    changePhotoText: {
      color: colors.buttonText, // Use theme button text
      fontWeight: '600', // Make it bolder
      fontSize: 14,
    },
    formSection: {
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // Use theme border
      paddingBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text, // Use theme text
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.secondaryText, // Use theme secondary text
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.inputBackground, // Use theme input background
      borderRadius: 10, // Consistent rounding
      borderWidth: 1,
      borderColor: colors.border, // Use theme border
      paddingHorizontal: 14, // Adjust padding
      paddingVertical: 12, // Adjust padding
      fontSize: 16,
      color: colors.text, // Use theme text
    },
    multilineInput: {
      minHeight: 100,
      paddingTop: 12,
      textAlignVertical: 'top', // Ensure text starts at the top for multiline
    },
    interestsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    interestItem: {
      backgroundColor: colors.tileBg, // Use theme tile background
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    interestText: {
      fontSize: 14,
      color: colors.text, // Use theme text
    },
    removeInterestButton: {
      marginLeft: 8,
      padding: 2, // Add padding for easier touch
    },
    removeInterestText: {
      fontSize: 18,
      color: colors.secondaryText, // Use theme secondary text
      fontWeight: 'bold', // Make 'x' bolder
    },
    addInterestContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addInterestInput: {
      flex: 1,
      backgroundColor: colors.inputBackground, // Use theme input background
      borderRadius: 10, // Consistent rounding
      borderWidth: 1,
      borderColor: colors.border, // Use theme border
      paddingHorizontal: 14, // Adjust padding
      paddingVertical: 10, // Adjust padding
      fontSize: 16,
      color: colors.text, // Use theme text
      marginRight: 8,
    },
    addInterestButton: {
      backgroundColor: colors.primary, // Use theme primary
      borderRadius: 10, // Consistent rounding
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    addInterestText: {
      color: colors.buttonText, // Use theme button text
      fontWeight: '600', // Make it bolder
    },
    buttonContainer: {
      marginTop: 24, // Add more space above buttons
      marginBottom: 40,
    },
    saveButton: {
      backgroundColor: colors.primary, // Use theme primary
      borderRadius: 25, // Consistent rounded buttons
      paddingVertical: 15, // Consistent padding
      alignItems: 'center',
      marginBottom: 12,
    },
    saveButtonText: {
      color: colors.buttonText, // Use theme button text
      fontWeight: '600',
      fontSize: 16,
    },
    cancelButton: {
      backgroundColor: colors.cardBg, // Use theme card background for secondary action
      borderRadius: 25, // Consistent rounded buttons
      paddingVertical: 15, // Consistent padding
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border, // Add border for definition
    },
    cancelButtonText: {
      color: colors.text, // Use theme text
      fontWeight: '600',
      fontSize: 16,
    },
    // Guest view styles
    guestContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background, // Use theme background
    },
    guestTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text, // Use theme text
      marginBottom: 16,
      textAlign: 'center',
    },
    guestText: {
      fontSize: 16,
      color: colors.secondaryText, // Use theme secondary text
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    createAccountButton: {
      backgroundColor: colors.primary, // Use theme primary
      borderRadius: 25, // Consistent rounded buttons
      paddingVertical: 15, // Consistent padding
      paddingHorizontal: 30, // Wider padding
    },
    createAccountText: {
      color: colors.buttonText, // Use theme button text
      fontWeight: '600',
      fontSize: 16,
    },
  }), [colors]); // Recompute styles when colors change

  // --- Render Functions ---
  const renderInterestItem = (interest: string, index: number) => (
    <View key={`${interest}-${index}`} style={styles.interestItem}>
      <Text style={styles.interestText}>{interest}</Text>
      <TouchableOpacity
        onPress={() => handleRemoveInterest(index)}
        style={styles.removeInterestButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {/* Use Ionicons for remove button */}
        <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
      </TouchableOpacity>
    </View>
  );

  // --- Conditional Rendering ---

  // Loading state for initial data fetch
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Guest view
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.secondaryText} style={{ marginBottom: 20 }} />
          <Text style={styles.guestTitle}>Guest Account</Text>
          <Text style={styles.guestText}>
            Create an account to set up your profile, save your chats, and unlock more features.
          </Text>
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigation.navigate('Login')} // Navigate to Login or SignUp
          >
            <Text style={styles.createAccountText}>Create Account / Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main Edit Profile view for logged-in users
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Use undefined for Android height behavior
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust offset if needed
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside
        >
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <Image
              source={profileData.profileImageUrl ? { uri: profileData.profileImageUrl } : require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.changePhotoButton} onPress={() => Alert.alert("Feature Not Implemented", "Changing profile photo is coming soon!")}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={profileData.username}
                onChangeText={(text) => handleInputChange('username', text)}
                placeholder="Enter your username"
                placeholderTextColor={colors.secondaryText} // Use theme placeholder color
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={profileData.displayName}
                onChangeText={(text) => handleInputChange('displayName', text)}
                placeholder="Enter your display name"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={profileData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                placeholder="Write a short bio..."
                placeholderTextColor={colors.secondaryText}
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={profileData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter your location"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.disabledInputBackground }]} // Make email non-editable visually
                value={profileData.email}
                // onChangeText={(text) => handleInputChange('email', text)} // Disable editing
                placeholder="Enter your email address"
                placeholderTextColor={colors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Make email non-editable
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter your phone number (optional)"
                placeholderTextColor={colors.secondaryText}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Interests Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {profileData.interests.map(renderInterestItem)}
            </View>
            <View style={styles.addInterestContainer}>
              <TextInput
                style={styles.addInterestInput}
                value={newInterest}
                onChangeText={setNewInterest}
                placeholder="Add an interest"
                placeholderTextColor={colors.secondaryText}
                returnKeyType="done"
                onSubmitEditing={handleAddInterest} // Add interest on submit
              />
              <TouchableOpacity
                style={styles.addInterestButton}
                onPress={handleAddInterest}
              >
                <Text style={styles.addInterestText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSaving} // Also disable cancel during save
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Export the component
export default EditProfileScreen;

// Remove the old StyleSheet definition
// const styles = StyleSheet.create({ ... });