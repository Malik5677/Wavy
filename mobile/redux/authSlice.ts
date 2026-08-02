import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
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
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  phoneNumberForOtp: string | null;
  emailForOtp: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  phoneNumberForOtp: null,
  emailForOtp: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate: (state, action: PayloadAction<{ user: User | null; token: string | null }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
      state.hydrated = true;
    },
    setOtpCredentials: (state, action: PayloadAction<{ phoneNumber: string; email: string }>) => {
      state.phoneNumberForOtp = action.payload.phoneNumber;
      state.emailForOtp = action.payload.email;
    },
    clearOtpCredentials: (state) => {
      state.phoneNumberForOtp = null;
      state.emailForOtp = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.phoneNumberForOtp = null;
      state.emailForOtp = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  hydrate,
  setOtpCredentials,
  clearOtpCredentials,
  loginSuccess,
  logout,
  updateUser,
} = authSlice.actions;
export default authSlice.reducer;

