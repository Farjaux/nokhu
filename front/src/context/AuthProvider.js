import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useMutation, useReactiveVar, useLazyQuery } from '@apollo/client';
import {
  LOGIN,
  LOGOUT,
  REFRESH_TOKEN,
  GET_USER,
  REGISTER,
} from '../graphql/authMutations';
import { accessTokenVar } from '../apollo/tokenVar';
import { useApolloClient } from '@apollo/client';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const token = useReactiveVar(accessTokenVar);
  const client = useApolloClient();
  const isAuthenticated = !!token;
  const [user, setUser] = useState(null);
  const isRefreshing = useRef(false);

  // 3) GraphQL mutations
  const [loginMutation] = useMutation(LOGIN);
  const [logoutMutation] = useMutation(LOGOUT);
  const [registerMutation] = useMutation(REGISTER);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN);
  const [getUser] = useLazyQuery(GET_USER);

  async function login(email, password) {
    try {
      console.log('🚀 Attempting login...');
      const { data } = await loginMutation({ variables: { email, password } });

      if (data?.login?.accessToken && data?.login?.user) {
        // Set the access token in memory (Apollo Reactive Variable)
        accessTokenVar(data.login.accessToken);

        // Store user in React state or a global context
        setUser(data.login.user);

        // Force Apollo Client to refetch queries with the new token
        if (client.getObservableQueries().size > 0) {
          await client.refetchQueries({ include: 'active' });
        }

        return true;
      } else {
        throw new Error('Invalid credentials or missing tokens.');
      }
    } catch (err) {
      console.error('⛔ Login error:', err.message);
      return false;
    }
  }

  /**
   * 🔹 OAuth Login (Google, Facebook)
   */
  const loginWithOAuth = provider => {
    window.location.href = `http://localhost:5000/auth/${provider}`;
  };

  /**
   * 🔹 OAuth Callback Handler
   * Extracts token from the URL after OAuth login
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      console.log('🔹 OAuth Login Success - Storing Token in Memory');
      accessTokenVar(token);

      // Fetch user info
      getUser()
        .then(({ data }) => {
          if (data?.me) {
            console.log('✅ OAuth User Info Loaded:', data.me);
            setUser(data.me);
          }
        })
        .catch(err => {
          console.error('⛔ Error fetching user:', err);
        });
    }
  }, [getUser]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
      accessTokenVar(null);
      setUser(null);
      await client.clearStore();
    } catch (err) {
      console.error('⛔ Logout error:', err);
    }
  }, [logoutMutation, client]);

  async function register(firstName, lastName, username, email, password) {
    try {
      console.log('🚀 Attempting registration...');
      const fullName = `${firstName} ${lastName}`;
      const { data } = await registerMutation({
        variables: { full_name: fullName, username, email, password },
      });

      if (data?.register?.id) {
        console.log('✅ Registration successful:', data.register);

        // ✅ Automatically log in after registration
        return await login(email, password);
      } else {
        throw new Error('Registration failed.');
      }
    } catch (err) {
      console.error('⛔ Registration error:', err.message);
      return false;
    }
  }

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      if (isRefreshing.current) return; // Prevent multiple calls
      isRefreshing.current = true;

      try {
        console.log('🔄 Checking if user session exists...');
        const { data } = await refreshTokenMutation();

        if (data?.refreshToken?.accessToken) {
          console.log('✅ Session restored:', data.refreshToken);

          // Store refreshed token in memory
          accessTokenVar(data.refreshToken.accessToken);

          // Fetch user data separately
          const { data: userData } = await getUser();
          console.log('🧑 User data response:', userData);
          if (userData?.me) {
            console.log('✅ User data restored:', userData.me);
            setUser(userData.me);
          }
        } else {
          console.log('⚠️ No active session found.');
        }
      } catch (error) {
        console.error('⛔ Error restoring session:', error.message);
      } finally {
        isRefreshing.current = false;
      }
    };

    if (!token) {
      restoreSession();
    }
  }, [refreshTokenMutation, getUser, token, logout]);

  const value = {
    token,
    isAuthenticated,
    user,
    register,
    login,
    logout,
    loginWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
