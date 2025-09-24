import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiService, User } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  // Firebase user
  firebaseUser: FirebaseUser | null;
  // App user (from our database)
  user: User | null;
  // Loading states
  loading: boolean;
  initializing: boolean;
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; avatarURL?: string }) => Promise<void>;
  // Utility methods
  isAdmin: boolean;
  isBanned: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Fetch user profile from our API
  const fetchUserProfile = async (firebaseUser: FirebaseUser, displayName?: string): Promise<User | null> => {
    try {
      console.log('Fetching profile for user:', firebaseUser.uid);
      const response = await apiService.getProfile();
      console.log('Profile found:', response.user.displayName);
      return response.user;
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      
      // If user doesn't exist in our database, create them
      if (error.status === 404) {
        try {
          // Prioritize the displayName parameter passed to this function
          const nameToUse = displayName || firebaseUser.displayName || undefined;
          console.log('User not found, creating with displayName:', nameToUse);
          const registerResponse = await apiService.registerUser(nameToUse);
          console.log('User created:', registerResponse.user.displayName);
          return registerResponse.user;
        } catch (registerError: any) {
          console.error('Failed to register user:', registerError);
          
          // If user already exists (409 conflict), fetch the existing user
          if (registerError.status === 409) {
            console.log('User already exists, fetching existing profile');
            try {
              const response = await apiService.getProfile();
              return response.user;
            } catch (fetchError) {
              console.error('Failed to fetch existing user:', fetchError);
              return null;
            }
          }
          
          return null;
        }
      }
      
      return null;
    }
  };

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      console.log('Auth state changed:', firebaseUser ? `User ${firebaseUser.uid}` : 'No user');
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in - fetch their profile
        console.log('User signed in, fetching profile...');
        const userProfile = await fetchUserProfile(firebaseUser);
        console.log('Setting user profile:', userProfile?.displayName || 'null');
        setUser(userProfile);
        
        // Check if user is banned
        if (userProfile?.isBanned) {
          toast.error('Your account has been banned. Please contact support.');
          await signOut(auth);
          setUser(null);
          setFirebaseUser(null);
        }
      } else {
        // User is signed out - clear all user data
        console.log('User signed out, clearing user data');
        setUser(null);
      }
      
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile
      const userProfile = await fetchUserProfile(userCredential.user);
      
      if (userProfile?.isBanned) {
        await signOut(auth);
        throw new Error('Your account has been banned. Please contact support.');
      }
      
      setUser(userProfile);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to log in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('Starting registration process with displayName:', displayName);
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase user created:', userCredential.user.uid);
      
      // Update Firebase profile
      await updateProfile(userCredential.user, { displayName });
      console.log('Firebase profile updated with displayName:', displayName);
      
      // Force token refresh to ensure displayName is in the token
      await userCredential.user.getIdToken(true);
      console.log('Firebase token refreshed');
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Create user in our database
      console.log('Creating user in database with displayName:', displayName);
      const userProfile = await fetchUserProfile(userCredential.user, displayName);
      console.log('User profile created:', userProfile?.displayName);
      setUser(userProfile);
      
      toast.success('Account created successfully! Please check your email for verification.');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Failed to create account';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      console.log('Logging out user...');
      // Clear user state immediately
      setUser(null);
      setFirebaseUser(null);
      
      // Sign out from Firebase
      await signOut(auth);
      
      console.log('User logged out successfully');
      toast.success('Successfully logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: { displayName?: string; avatarURL?: string }): Promise<void> => {
    setLoading(true);
    try {
      // Update in our database
      const response = await apiService.updateProfile(data);
      setUser(response.user);
      
      // Update Firebase profile if displayName changed
      if (data.displayName && firebaseUser) {
        await updateProfile(firebaseUser, { displayName: data.displayName });
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (firebaseUser) {
      console.log('Refreshing user profile...');
      try {
        const response = await apiService.getProfile();
        console.log('Profile refreshed:', response.user.displayName);
        setUser(response.user);
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
        // If profile fetch fails, user might have been deleted
        if ((error as any).status === 404) {
          console.log('User profile not found during refresh, logging out...');
          await logout();
        }
      }
    }
  };

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    initializing,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    isAdmin: user?.role === 'admin',
    isBanned: user?.isBanned || false,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
