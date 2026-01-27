import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  const register = async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      const { data } = await api.post('/auth/register', { email, password });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      console.error('Registration Error:', error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Registration failed. Please try again.',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
