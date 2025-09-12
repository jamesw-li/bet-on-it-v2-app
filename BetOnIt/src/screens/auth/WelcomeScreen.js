import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/common/Button';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🎲</Text>
            <Text style={styles.title}>Bet On It</Text>
            <Text style={styles.subtitle}>
              Turn any gathering into an exciting competition with friendly wagers
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Create custom bets for any event</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>👥</Text>
              <Text style={styles.featureText}>Invite friends with a simple code</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureText}>Track winnings and leaderboards</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <Button
              title="Get Started"
              onPress={() => navigation.navigate('SignUp')}
              variant="secondary"
              size="large"
              style={styles.button}
              textStyle={styles.primaryButtonText}
            />
            <Button
              title="I already have an account"
              onPress={() => navigation.navigate('SignIn')}
              variant="outline"
              size="large"
              style={[styles.button, styles.outlineButton]}
              textStyle={styles.outlineButtonText}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#e0e7ff',
    flex: 1,
  },
  buttons: {
    gap: 16,
  },
  button: {
    width: '100%',
  },
  primaryButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  outlineButton: {
    borderColor: '#ffffff',
  },
  outlineButtonText: {
    color: '#ffffff',
  },
});

export default WelcomeScreen;