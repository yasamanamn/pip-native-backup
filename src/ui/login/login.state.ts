export type LoginUiState = {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
};

export const initialLoginState: LoginUiState = {
  email: '',
  password: '',
  isLoading: false,
  error: null,
};
