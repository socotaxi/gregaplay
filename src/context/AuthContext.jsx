import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // Check for active session with enhanced error recovery
    const checkSession = async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptSessionCheck = async () => {
        try {
          console.log(`Checking Supabase session (attempt ${retryCount + 1}/${maxRetries + 1})...`);
          const response = await supabase.auth.getSession();
          console.log('Session response:', response);
          
          if (response && response.data && response.data.session) {
            const { session } = response.data;
            console.log('Active session found');
            
            // Check if token is expired or about to expire (within 5 minutes)
            const expiryTime = session.expires_at * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeToExpiry = expiryTime - currentTime;
            
            if (timeToExpiry <= 0) {
              console.warn('Session token is expired, refreshing...');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error('Failed to refresh session:', refreshError);
                // Force sign out to clear invalid state
                await supabase.auth.signOut();
                setUser(null);
                setProfile(null);
                localStorage.removeItem('supabase.auth.token');
                sessionStorage.removeItem('supabase.auth.token');
                return false;
              } else if (refreshData && refreshData.session) {
                console.log('Session refreshed successfully');
                setUser(refreshData.session.user);
                await fetchUserProfile(refreshData.session.user.id);
              }
            } else if (timeToExpiry < 300000) { // Less than 5 minutes
              console.log('Session token expiring soon, refreshing...');
              await supabase.auth.refreshSession();
              // Continue with the current session for now
              setUser(session.user);
              await fetchUserProfile(session.user.id);
            } else {
              setUser(session.user);
              // Fetch user profile
              await fetchUserProfile(session.user.id);
            }
          } else {
            console.log('No active session');
            // Clear any potentially corrupted session data
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          }
          return true; // Success
        } catch (error) {
          console.error(`Error checking session (attempt ${retryCount + 1}):`, error);
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`Retrying session check in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return attemptSessionCheck();
          }
          setAuthError({
            type: 'session',
            message: 'Failed to check authentication status',
            details: error
          });
          return false; // Failed after retries
        }
      };
      
      try {
        await attemptSessionCheck();
      } catch (finalError) {
        console.error('Fatal error in session check:', finalError);
        // Clear any corrupted state
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes with additional token expiry handling
    let authListener;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          try {
            if (session && event === 'SIGNED_IN') {
              console.log('User signed in');
              setUser(session.user);
              await fetchUserProfile(session.user.id);
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('Token refreshed');
              if (session) {
                setUser(session.user);
                await fetchUserProfile(session.user.id);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out');
              setUser(null);
              setProfile(null);
              // Clear any potentially corrupted session data
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.removeItem('supabase.auth.token');
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
          }
        }
      );
      authListener = data;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      try {
        if (authListener && authListener.subscription) {
          console.log('Unsubscribing from auth listener');
          authListener.subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing from auth listener:', error);
      }
    };
  }, []);

  // Fetch user profile from database - with better error handling, timeout, and fallback mechanism
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      console.error('Cannot fetch profile: userId is undefined');
      // Create a fallback minimal profile to prevent UI blocking
      setProfile({ id: 'temp-' + Date.now(), email: 'user@example.com', full_name: 'User', is_fallback: true });
      return null;
    }
    
    try {
      setIsRecovering(true);
      console.log('Fetching user profile for:', userId);
      
      // Add timeout to profile fetching
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000);
      });
      
      // Race between actual fetch and timeout
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])
        .catch(err => {
          console.error('Profile fetch failed or timed out:', err.message);
          return { data: null, error: err };
        });

      if (error) {
        console.error('Error fetching user profile:', error);
        // Handle case where profile doesn't exist yet - create a minimal one
        if (error.code === 'PGRST116') { // No rows returned
          console.log('Profile not found, attempting to create minimal profile');
          
          // Create a minimal profile if one doesn't exist
          const userInfo = user || await supabase.auth.getUser().then(res => res.data?.user);
          
          if (userInfo) {
            const minimalProfile = {
              id: userId,
              email: userInfo.email,
              full_name: userInfo.user_metadata?.full_name || '',
              updated_at: new Date(),
            };
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([minimalProfile])
              .select()
              .single();
              
            if (insertError) {
              console.warn('Failed to create minimal profile:', insertError);
              // Still create a fallback profile for the UI
              const fallbackProfile = { ...minimalProfile, is_fallback: true };
              console.info('Using fallback profile:', fallbackProfile);
              setProfile(fallbackProfile);
              return fallbackProfile;
            } else {
              console.log('Created minimal profile:', newProfile);
              setProfile(newProfile);
              return newProfile;
            }
          }
        } else {
          // For other errors, create a fallback profile
          const fallbackProfile = {
            id: userId,
            email: user?.email || 'user@example.com',
            full_name: user?.user_metadata?.full_name || 'User',
            is_fallback: true
          };
          console.warn('Using fallback profile due to error:', fallbackProfile);
          setProfile(fallbackProfile);
          return fallbackProfile;
        }
      } else if (data) {
        console.log('Profile found:', data);
        setProfile(data);
        return data;
      } else {
        console.log('No profile data returned, using fallback');
        const fallbackProfile = {
          id: userId,
          email: user?.email || 'user@example.com',
          full_name: user?.user_metadata?.full_name || 'User',
          is_fallback: true
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
      // Create a fallback profile in case of any error
      const fallbackProfile = {
        id: userId || 'temp-' + Date.now(),
        email: user?.email || 'user@example.com',
        full_name: user?.user_metadata?.full_name || 'User',
        is_fallback: true
      };
      console.warn('Using fallback profile due to exception:', fallbackProfile);
      setProfile(fallbackProfile);
      return fallbackProfile;
    } finally {
      setIsRecovering(false);
    }
  }, [user]);

  // Sign up new user with enhanced error handling
  const signUp = async ({ email, password, fullName }) => {
    try {
      setAuthError(null);
      
      // Register the new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        setAuthError({
          type: 'signup',
          message: error.message || 'Failed to sign up',
          details: error
        });
        throw error;
      }

      if (data.user) {
        console.log('User created, profile will be created by database trigger');
        // Attendre un moment pour que le trigger de DB crée le profil
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier si le profil a été créé
        const { data: profileData, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (checkError) {
          console.log('Note: Profile may not be created yet, will be handled by fetchUserProfile');
        } else if (profileData) {
          console.log('Profile was successfully created by trigger:', profileData);
          setProfile(profileData);
        }
      }

      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      setAuthError({
        type: 'signup',
        message: error.message || 'An unexpected error occurred during sign up',
        details: error
      });
      throw error;
    }
  };

  // Sign in user with enhanced error handling
  const signIn = async ({ email, password }) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Authentication error:', error);
        setAuthError({
          type: 'signin',
          message: error.message || 'Failed to sign in',
          details: error
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      // Set error state for UI display
      setAuthError({
        type: 'signin',
        message: error.message || 'An unexpected error occurred during sign in',
        details: error
      });
      throw error;
    }
  };

  // Sign in with social provider (OAuth)
  const signInWithProvider = async (provider) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + '/dashboard' }
      });
      if (error) {
        console.error('OAuth sign in error:', error);
        setAuthError({
          type: 'signin',
          message: error.message || 'Failed to sign in with provider',
          details: error
        });
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error signing in with provider:', error);
      setAuthError({
        type: 'signin',
        message: error.message || 'Failed to sign in with provider',
        details: error
      });
      throw error;
    }
  };


  // Sign out user
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error('Merci de confirmer votre mail');

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('Profile update returned no data, refetching profile');
        const refreshed = await fetchUserProfile(user.id);
        return refreshed;
      }

      setProfile(data[0]);
      return data[0];
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    authError,
    isRecovering,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
    fetchUserProfile,
    resetAuthError: () => setAuthError(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};