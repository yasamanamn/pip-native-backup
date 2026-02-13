import { useState } from 'react';
import { LoginUiState, initialLoginState } from './login.state';

export function useLogin(onSuccess: () => void) {
  const [uiState, setUiState] = useState<LoginUiState>(initialLoginState);

  const onEmailChange = (email: string) => {
    setUiState(prev => ({ ...prev, email, error: null }));
  };

  const onPasswordChange = (password: string) => {
    setUiState(prev => ({ ...prev, password, error: null }));
  };

  const onLoginClick = async () => {
    if (!uiState.email || !uiState.password) {
      setUiState(prev => ({
        ...prev,
        error: 'فیلدها نباید خالی باشند',
      }));
      return;
    }

    setUiState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 🔥 معادل networkService.login
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO:
      // tokenProvider.setToken(...)
      // userProvider.setCurrentUser(...)
      // setLoggedIn(true)

      setUiState(prev => ({ ...prev, isLoading: false }));
      onSuccess();
    } catch (e) {
      setUiState(prev => ({
        ...prev,
        isLoading: false,
        error: 'خطا در ارتباط با سرور',
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
