import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../scripts/supabaseClient'; // Adjust path to your supabase client

const SubscriptionScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<keyof Plans>();;
  const [subscriptionStatus, setSubscriptionStatus] = useState("");

  // Replace these with your actual price IDs

// Define the Plan type
type Plan = {
  id: string;
  name: string;
  price: string;
  interval: string;
  savings?: string; // Optional field for savings text
};

// Define the Plans type that contains both monthly and yearly plans
type Plans = {
  monthly: Plan;
  yearly: Plan;
};

// Create your PLANS object with proper typing
const PLANS: Plans = {
  monthly: {
    id: 'prod_SFR2NRC1c62kkX', // Your monthly price ID
    name: 'Monthly Plan',
    price: '$12.00',
    interval: 'month',
  },
  yearly: {
    id: 'prod_SFR3pO6vcc5g5W', // Your yearly price ID
    name: 'Yearly Plan',
    price: '$100.00',
    interval: 'year',
    savings: 'Save 20%',
  },
};
  // Check if user already has a subscription
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('subscriptions') // Replace with your subscriptions table
        .select('status')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setSubscriptionStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (planId : string) => {
    if (subscriptionStatus === 'active') {
      Alert.alert('You already have an active subscription');
      return;
    }

    setLoading(true);
    try {
      // 1. Create a payment intent on your server (you'll need to set up a Supabase function)
      const { data: { session }, error } = await supabase.functions.invoke('create-subscription', {
        body: { price_id: planId },
      });

      if (error) throw error;

      // 2. Initialize the payment sheet
      const { error: stripeError } = await initPaymentSheet({
        paymentIntentClientSecret: session.payment_intent_client_secret,
        merchantDisplayName: 'merchant.com.fantasyai.app',
      });

      if (stripeError) throw stripeError;

      // 3. Present the payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw presentError;
      } else {
        // Payment successful
        setSubscriptionStatus("active")
        Alert.alert('Subscription successful! Thank you.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(`Payment failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Plan</Text>
      
      {subscriptionStatus === 'active' ? (
        <View style={styles.activeSubscription}>
          <Text style={styles.activeText}>You have an active subscription!</Text>
        </View>
      ) : (
        <>
          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={styles.planName}>{PLANS.monthly.name}</Text>
            <Text style={styles.planPrice}>{PLANS.monthly.price}</Text>
            <Text style={styles.planInterval}>per {PLANS.monthly.interval}</Text>
          </TouchableOpacity>

          {/* Yearly Plan */}
          <TouchableOpacity 
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <Text style={styles.planName}>{PLANS.yearly.name}</Text>
            <Text style={styles.planPrice}>{PLANS.yearly.price}</Text>
            <Text style={styles.planInterval}>per {PLANS.yearly.interval}</Text>
            {PLANS.yearly.savings && (
              <Text style={styles.savingsText}>{PLANS.yearly.savings}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => selectedPlan && handleSubscribe(PLANS[selectedPlan].id)}
            disabled={!selectedPlan || loading}
          >
            <Text style={styles.subscribeButtonText}>
              {loading ? 'Processing...' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedPlan: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  planInterval: {
    fontSize: 14,
    color: '#666',
  },
  savingsText: {
    fontSize: 14,
    color: 'green',
    marginTop: 5,
    fontStyle: 'italic',
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeSubscription: {
    backgroundColor: '#e1f5e1',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeText: {
    color: 'green',
    fontWeight: 'bold',
  },
});

export default SubscriptionScreen;