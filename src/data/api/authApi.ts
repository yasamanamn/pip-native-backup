
import axios from 'axios';
import { AUTH_BASE_URL, API_TIMEOUT } from '../../config/api.config';

const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: API_TIMEOUT,
});

export type LoginRequest = {
  emailOrPhone: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  refreshToken?: string;
  user?: { id: string; email?: string; name?: string };
};

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const res = await authApi.post<LoginResponse>('/users/signin', {
    email: credentials.emailOrPhone,
    password: credentials.password,
  });
  return res.data;
}
