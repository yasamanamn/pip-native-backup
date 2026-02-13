import { useState, useEffect } from 'react';
import { getCurrentUser, User } from '../../../../data/api/user.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token'); 
      if (!token) throw new Error('Token not found');

      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطا در دریافت اطلاعات کاربر');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, error, fetchUser, logout };
}
