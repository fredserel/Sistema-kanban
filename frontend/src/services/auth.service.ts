import api from './api';
import { AuthResponse, User, Role } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}

export async function register(
  email: string,
  password: string,
  name: string,
  role?: Role
): Promise<User> {
  const response = await api.post<User>('/auth/register', { email, password, name, role });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
