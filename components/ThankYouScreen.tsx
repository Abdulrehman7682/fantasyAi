import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ThankYouScreen() {
  const navigation = useNavigation();

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }], // Change to your actual Home screen route
    });
  };

  return (
    <LinearGradient colors={['#8ec5fc', '#e0c3fc']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <View style={styles.card}>
        <Text style={styles.title}>🎉 Thank You!</Text>
        <Text style={styles.description}>
          Your subscription was successful. Enjoy unlimited access to all AI characters!
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width * 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4f46e5',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
