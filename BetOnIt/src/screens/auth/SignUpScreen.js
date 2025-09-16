import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createUserProfile } from '../../services/database';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const SignUpScreen = ({ navigation }) => {
  // --- FIX: Each input now has its own state to prevent re-render loops ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  // --------------------------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signUp } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (!username) {
      newErrors.username = 'Username is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, {
        full_name: fullName,
        username: username,
        payment_info: paymentInfo,
      });

      if (error) {
        Alert.alert('Sign Up Error', error.message);
      } else if (data.user) {
        // Create user profile
        await createUserProfile(data.user.id, {
          username: username,
          full_name: fullName,
          payment_info: paymentInfo,
        });
        
        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the fun and start betting with friends</Text>
          </View>

          <View style={styles.form}>
            {/* --- FIX: Inputs now bind to their individual state hooks --- */}
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              error={errors.fullName}
              autoCapitalize="words"
            />

            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              error={errors.username}
              autoCapitalize="none"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              error={errors.password}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              secureTextEntry
            />

            <Input
              label="Payment Info (Optional)"
              value={paymentInfo}
              onChangeText={setPaymentInfo}
              placeholder="Venmo username, PayPal email, etc."
            />
            {/* -------------------------------------------------------------------- */}

            <Text style={styles.disclaimer}>
              Bet On It does not handle real money transactions. Payment info is only used to help friends settle bets outside the app.
            </Text>

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.signUpButton}
            />

            <Button
              title="Already have an account? Sign In"
              onPress={() => navigation.navigate('SignIn')}
              variant="outline"
              style={styles.signInButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    paddingBottom: 40,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  signUpButton: {
    marginBottom: 16,
  },
  signInButton: {
    marginBottom: 32,
  },
});

export default SignUpScreen;
