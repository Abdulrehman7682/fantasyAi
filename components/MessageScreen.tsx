import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar,
  Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Camera, Mic, Paperclip, Send, ChevronLeft } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'contexts/ThemeContext';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { initialUserMessage } = route.params || {};

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const sendButtonScale = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    if (initialUserMessage) {
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: initialUserMessage,
        type: 'text',
      };
      setMessages([userMessage]);
      handleAIResponse(initialUserMessage);
    }
  }, [initialUserMessage]);

 const handleAIResponse = (text: string) => {
  setLoading(true);
  setTimeout(() => {
    const aiReplyText = generateAIResponse;
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiReplyText,
      type: 'text',
    };
    setMessages((prev) => [...prev, aiMessage]);
    setLoading(false);
  }, 1500);
};
const generateAIResponse = `🤖 Thanks for your message:\n"${initialUserMessage}"\n\nI'm really glad you reached out! Based on what you've shared, here's something that might help:\n\n✨ It's always a great idea to pause, reflect, and take meaningful steps forward — no matter how small. If you'd like, I can help you break this down into simple goals or offer practical suggestions. Just let me know how you'd like to continue!`

  const sendText = () => {
    if (!inputText.trim()) return;
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      type: 'text',
    };
    setMessages((prev) => [...prev, userMessage]);
    handleAIResponse(inputText);
    setInputText('');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const image = result.assets[0];
      const msg = {
        id: Date.now().toString(),
        role: 'user',
        type: 'image',
        uri: image.uri,
      };
      setMessages((prev) => [...prev, msg]);
      handleAIResponse('Image received');
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      const msg = {
        id: Date.now().toString(),
        role: 'user',
        type: 'audio',
        uri,
      };
      setMessages((prev) => [...prev, msg]);
      handleAIResponse('Voice message received');
    } catch (err) {
      console.error('Stop recording error:', err);
    } finally {
      setIsRecording(false);
      setRecording(null);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.alignEnd : styles.alignStart]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {item.type === 'text' && <Text style={styles.messageText}>{item.content}</Text>}
          {item.type === 'image' && <Image source={{ uri: item.uri }} style={styles.image} />}
          {item.type === 'audio' && <Text style={styles.messageText}>🎙 Voice Message</Text>}
        </View>
        <Text style={styles.timestamp}>3:44 PM</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#000" size={28} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image source={require('../assets/profile-placeholder.png')} style={styles.avatar} />
          <View>
            <Text style={styles.headerTitle}>Ai Chat</Text>
            <Text style={styles.online}>Online</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.typingText}>AI is typing...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handlePickImage}><Ionicons name="attach-outline" size={24} /></TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}><Camera color="#555" /></TouchableOpacity>
          {/* <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording}>
            <Mic color={isRecording ? 'red' : '#555'} />
          </TouchableOpacity> */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            style={styles.input}
          />
         {inputText.trim() ? (
  <TouchableOpacity onPress={sendText}>
     <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}  style={styles.color}>
                  <Ionicons name="send" size={20} color={colors.buttonText} style={{ marginLeft: -1 }} />
                </Animated.View>
  </TouchableOpacity>
) : (
  <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
    <Ionicons
                  name={isRecording ? "stop-circle-outline" : "mic-outline"}
                  size={24}
                  
                />
  </TouchableOpacity>
)}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    gap: 12,
    marginTop: 30 
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8},
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  online: { color: 'green', fontSize: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ccc' },
  messageRow: { marginVertical: 4 },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F1F1F1',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 22,
    fontSize: 16,
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  typingText: {
    marginLeft: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  color:{
    backgroundColor: "#0080FF",
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
