import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../../config/api.config';

const userApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export async function getCurrentUser(token: string): Promise<User> {
  const res = await userApi.get<User>('/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
