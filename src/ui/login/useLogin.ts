import { useState } from 'react';
import { login } from '../../data/api/authApi';
import { LoginUiState, initialLoginState } from './login.state';

export function useLogin(onSuccess: () => void) {
  const [uiState, setUiState] = useState<LoginUiState>(initialLoginState);

  const onEmailChange = (email: string) => {
    setUiState((prev: LoginUiState) => ({ ...prev, email, error: null }));
  };

  const onPasswordChange = (password: string) => {
    setUiState((prev: LoginUiState) => ({ ...prev, password, error: null }));
  };

  const onLoginClick = async () => {
    if (!uiState.email || !uiState.password) {
      setUiState((prev: LoginUiState) => ({
        ...prev,
        error: 'فیلدها نباید خالی باشند',
      }));
      return;
    }

    setUiState((prev: LoginUiState) => ({ ...prev, isLoading: true, error: null }));

    try {
      await login({
        emailOrPhone: uiState.email.trim(),
        password: uiState.password,
      });
      setUiState((prev: LoginUiState) => ({ ...prev, isLoading: false }));
      onSuccess();
    } catch (e: any) {
      const message =
        e?.response?.data?.message ?? e?.message ?? 'خطا در ارتباط با سرور';
      setUiState((prev: LoginUiState) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  };

  return {
    uiState,
    onEmailChange,
    onPasswordChange,
    onLoginClick,
  };
}
