import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../services/auth.service';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    height: '',
    weight: '',
    gender: 'male',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        age: formData.age ? parseInt(formData.age) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        gender: formData.gender as 'male' | 'female' | 'other',
      });

      Alert.alert(
        'Success!',
        'Registration successful! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Unable to connect to server. Please check your connection.';
      
      Alert.alert(
        'Registration Failed',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us to track your health</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={formData.fullName}
          onChangeText={(val) => updateField('fullName', val)}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(val) => updateField('email', val)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password * (min 8 characters)"
          value={formData.password}
          onChangeText={(val) => updateField('password', val)}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password *"
          value={formData.confirmPassword}
          onChangeText={(val) => updateField('confirmPassword', val)}
          secureTextEntry
          editable={!loading}
        />

        <Text style={styles.sectionTitle}>Health Information (Optional)</Text>

        <TextInput
          style={styles.input}
          placeholder="Age (years)"
          value={formData.age}
          onChangeText={(val) => updateField('age', val)}
          keyboardType="numeric"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          value={formData.height}
          onChangeText={(val) => updateField('height', val)}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={formData.weight}
          onChangeText={(val) => updateField('weight', val)}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>Gender:</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'male' && styles.genderButtonActive,
              ]}
              onPress={() => updateField('gender', 'male')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  formData.gender === 'male' && styles.genderButtonTextActive,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'female' && styles.genderButtonActive,
              ]}
              onPress={() => updateField('gender', 'female')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  formData.gender === 'female' && styles.genderButtonTextActive,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'other' && styles.genderButtonActive,
              ]}
              onPress={() => updateField('gender', 'other')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  formData.gender === 'other' && styles.genderButtonTextActive,
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/')}
          disabled={loading}
          style={styles.backButton}
        >
          <Text style={styles.linkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 10,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  genderButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  genderButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  linkTextBold: {
    color: '#3498db',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 10,
  },
});
