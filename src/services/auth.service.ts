import { api } from '../config/api.config';

export const signin = (email: string, password: string) => {
  return api.post('/users/signin', {
    email,
    password,
  });
};
