import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  phoneNumber: string;
  username: string | null;
  displayName: string | null;
  profilePhoto: string | null;
  bio?: string | null;
  wallpaper?: string | null;
  privacyLastSeen?: string | null;
  privacyProfilePhoto?: string | null;
  privacyStatus?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  phoneNumberForOtp: string | null;
  emailForOtp: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  phoneNumberForOtp: null,
  emailForOtp: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhoneNumberForOtp: (state, action: PayloadAction<string>) => {
      state.phoneNumberForOtp = action.payload;
    },
    setOtpCredentials: (state, action: PayloadAction<{ phoneNumber: string; email: string }>) => {
      state.phoneNumberForOtp = action.payload.phoneNumber;
      state.emailForOtp = action.payload.email;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.phoneNumberForOtp = null;
      state.emailForOtp = null;
      localStorage.removeItem('token');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setPhoneNumberForOtp, setOtpCredentials, loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
