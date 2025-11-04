import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
}

export interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export const authService = {
  // Register
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    
    if (response.data.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    await api.post('/auth/logout', { refreshToken });
    
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  // Verify Email
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset Password
  resetPassword: async (token: string, password: string) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  // Enable 2FA
  enable2FA: async () => {
    const response = await api.post('/auth/2fa/enable');
    return response.data;
  },

  // Verify 2FA
  verify2FA: async (token: string) => {
    const response = await api.post('/auth/2fa/verify', { token });
    return response.data;
  },

  // Disable 2FA
  disable2FA: async (password: string) => {
    const response = await api.post('/auth/2fa/disable', { password });
    return response.data;
  },

  // Check if logged in
  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  },
};
