import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileTabScreenProps } from '../types/screens';
import { Tables } from '../types/database';
import { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type ProfileDataType = Partial<Tables<'profiles'>>;

export const ProfileScreen: React.FC<ProfileTabScreenProps> = ({ navigation: propNavigation }) => {
  const { user, signOut: contextSignOut, isGuest } = useAuth();
  const { colors, styles: themeStyles, isDarkMode, toggleTheme } = useTheme();
  const navigation = useNavigation<ProfileTabScreenProps['navigation']>();
  const parentNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();


  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDataType>({
    name: null,
    bio: null,
    email: user?.email || '',
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [userSubscribed, setUserSubscribed] = useState(false);

  const fetchUserSubscriptionStatus = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('is_subscribed, user_id')
      .eq('user_id', user!.id);
    if (data) {
      setUserSubscribed(data[0]?.is_subscribed);
    } else {
      setUserSubscribed(false);
    }
  };

  useEffect(() => {
    fetchUserSubscriptionStatus();
  }, [user, userSubscribed]);

  function generateNameFromEmail(email: string): string {
  if (!email) return 'User';
  const namePart = email.split('@')[0];
  return namePart
    .replace(/[._]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        if (isGuest) {
          const guestProfileString = await AsyncStorage.getItem('guestProfile');
          const guestProfile = guestProfileString ? JSON.parse(guestProfileString) : {};
          const name = guestProfile.name || 'Guest User';
          const bio = guestProfile.bio || '';
          setProfileData({ name, bio, email: 'guest@example.com' });
          setNewDisplayName(name);
          setNewBio(bio);
        } else if (user?.id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, bio, email')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (data) {
            const name = data.name || '';
            const bio = data.bio || '';
            setProfileData({ id: user.id, name, bio, email: data.email || user.email || '' });
            setNewDisplayName(name);
            setNewBio(bio);
          } else {
           const initialEmail = user.email || '';
const generatedName = generateNameFromEmail(initialEmail);
console.log("generatedName", generatedName);
const { error: insertError } = await supabase
  .from('profiles')
  .insert({ id: user.id, email: initialEmail, name: generatedName, bio: null });

if (insertError) throw insertError;

setProfileData({ id: user.id, name: "ali", bio: null, email: initialEmail });
setNewDisplayName(generatedName);
setNewBio('');
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, isGuest, user?.email]);

  // Edit profile handlers
  const handleEditDisplayNameClick = useCallback(() => {
    setNewDisplayName(profileData.name || '');
    setIsEditingDisplayName(true);
  }, [profileData.name]);

  const handleCancelDisplayNameEdit = useCallback(() => {
    setIsEditingDisplayName(false);
    setNewDisplayName(profileData.name || '');
  }, [profileData.name]);

  const handleSaveDisplayName = useCallback(async () => {
    if (newDisplayName === profileData.name) {
      setIsEditingDisplayName(false);
      return;
    }
    setIsSaving(true);
    try {
      if (isGuest) {
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...profileData,
          name: newDisplayName,
        }));
      } else if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: newDisplayName, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      }

      setProfileData(prev => ({ ...prev, name: newDisplayName }));
      setIsEditingDisplayName(false);
    } catch (error) {
      Alert.alert('Error', `Failed to update display name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [newDisplayName, profileData, isGuest, user?.id]);

  const handleEditBioClick = useCallback(() => {
    setNewBio(profileData.bio || '');
    setIsEditingBio(true);
  }, [profileData.bio]);

  const handleCancelBioEdit = useCallback(() => {
    setIsEditingBio(false);
    setNewBio(profileData.bio || '');
  }, [profileData.bio]);

  const handleSaveBio = useCallback(async () => {
    if (newBio === profileData.bio) {
      setIsEditingBio(false);
      return;
    }
    setIsSaving(true);
    try {
      if (isGuest) {
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...profileData,
          bio: newBio,
        }));
      } else if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ bio: newBio, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      }

      setProfileData(prev => ({ ...prev, bio: newBio }));
      setIsEditingBio(false);
    } catch (error) {
      Alert.alert('Error', `Failed to update bio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [newBio, profileData, isGuest, user?.id]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: contextSignOut }
      ]
    );
  }, [contextSignOut]);

  const renderGoProButton = () => {
    if (userSubscribed) return null;
    
    return (
      <TouchableOpacity
        style={styles.goProContainer}
        onPress={() => parentNavigation?.navigate('SubscriptionScreen', { isSpecialOffer: false })}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.goProContent}
        >
          <View style={styles.goProLeftContent}>
            <View style={styles.goProIconContainer}>
              <Ionicons name="diamond" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.goProText}>Upgrade to Pro</Text>
              <Text style={styles.goProSubText}>Unlock exclusive features</Text>
            </View>
          </View>
          <View style={styles.goProBadge}>
            <Text style={styles.goPriceText}>LIMITED OFFER</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[themeStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const renderDisplayNameEdit = () => (
    <View style={styles.editContainer}>
      <TextInput
        style={[styles.editInput, { 
          backgroundColor: colors.inputBackground, 
          borderColor: colors.border, 
          color: colors.text 
        }]}
        value={newDisplayName}
        onChangeText={setNewDisplayName}
        placeholder="Enter your name"
        placeholderTextColor={colors.secondaryText}
        autoFocus
      />
      <View style={styles.editButtonsContainer}>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.primary }]} 
          onPress={handleSaveDisplayName}
          disabled={isSaving}
        >
          {isSaving ? 
            <ActivityIndicator size="small" color="#FFFFFF" /> : 
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          }
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.secondaryText }]} 
          onPress={handleCancelDisplayNameEdit}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBioEdit = () => (
    <View style={styles.editContainer}>
      <TextInput
        style={[styles.editInput, styles.bioInput, { 
          backgroundColor: colors.inputBackground, 
          borderColor: colors.border, 
          color: colors.text 
        }]}
        value={newBio}
        onChangeText={setNewBio}
        placeholder="Tell us about yourself"
        placeholderTextColor={colors.secondaryText}
        multiline
        numberOfLines={3}
        autoFocus
      />
      <View style={styles.editButtonsContainer}>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.primary }]} 
          onPress={handleSaveBio}
          disabled={isSaving}
        >
          {isSaving ? 
            <ActivityIndicator size="small" color="#FFFFFF" /> : 
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          }
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.secondaryText }]} 
          onPress={handleCancelBioEdit}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap, 
    text: string, 
    onPress?: () => void, 
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { 
        borderBottomColor: colors.border,
        backgroundColor: colors.card
      }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconContainer, { backgroundColor: colors.tileBg }]}>
          <Ionicons name={icon} size={20} color={colors.icon} />
        </View>
        <Text style={[styles.settingText, { color: colors.text }]}>{text}</Text>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={themeStyles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { 
            backgroundColor: colors.tileBg,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8
          }]}>
            <Image
              source={require('../assets/adaptive-icon.png')}
              style={[styles.avatar, { tintColor: colors.primary }]}
            />
          </View>
          
          <View style={styles.nameContainer}>
            {!isEditingDisplayName ? (
              <>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {profileData.name || 'Set user name'}
                </Text>
                <TouchableOpacity 
                  onPress={handleEditDisplayNameClick} 
                  style={styles.editIcon}
                >
                  <Ionicons name="create-outline" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </>
            ) : renderDisplayNameEdit()}
          </View>
          
          <View style={styles.bioContainer}>
            {!isEditingBio ? (
              <>
                <Text style={[styles.userBio, { color: colors.secondaryText }]}>
                  {profileData.bio || 'No bio set.'}
                </Text>
                <TouchableOpacity 
                  onPress={handleEditBioClick} 
                  style={styles.editIcon}
                >
                  <Ionicons name="create-outline" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </>
            ) : renderBioEdit()}
          </View>
          
          <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
            {profileData.email || 'guest@example.com'}
          </Text>
        </View>

        {/* Go Pro Button */}
        {renderGoProButton()}

        {/* Preferences Section */}
        {renderSection('Preferences', 
          renderSettingItem('contrast', 'Dark Mode', undefined, 
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#D1D5DB'}
            />
          )
        )}
        
        {/* Account Section */}
        {renderSection('Account',
          <>
            {renderSettingItem('key', 'Change Password', () => parentNavigation?.navigate('ChangePassword'))}
            {renderSettingItem('notifications', 'Notification Settings', () => parentNavigation?.navigate('NotificationSettings'))}
          </>
        )}

        {/* Support Section */}
        {renderSection('Support', 
          <>
            {renderSettingItem('help-circle', 'Help Center', () => parentNavigation?.navigate('HelpCenter'))}
            {renderSettingItem('bug', 'Report a Problem', () => parentNavigation?.navigate('ReportProblem'))}
            {renderSettingItem('mail', 'Contact Us', () => parentNavigation?.navigate('ContactUs'))}
          </>
        )}

        {/* Legal Section */}
        {renderSection('Legal',
          <>
            {renderSettingItem('document-text', 'Terms & Conditions', () => parentNavigation?.navigate('TermsAndConditions'))}
            {renderSettingItem('shield-checkmark', 'Privacy Policy', () => parentNavigation?.navigate('PrivacyPolicy'))}
          </>
        )}

        {/* Sign Out Button */}
        {!isGuest && (
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: colors.primary }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={22} color="black" />
            <Text style={[styles.signOutText, { color: "black" }]}>Sign Out</Text>
          </TouchableOpacity>
        )}

        {/* <View style={styles.bottomSpacer} /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    margin: 16,
    borderRadius: 24,
    marginTop: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  editIcon: {
    marginLeft: 8,
    padding: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  userBio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 15,
    opacity: 0.8,
    letterSpacing: 0.3,
  },
  editContainer: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  editInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  goProContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  goProContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  goProLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goProIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goProText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  goProSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  goProBadge: {
    backgroundColor: '#FF9E3B',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  goPriceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});