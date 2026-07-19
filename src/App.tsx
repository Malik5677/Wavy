/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './redux/store';
import { loginSuccess, logout } from './redux/authSlice';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { API_URL } from './utils/api';
import Login from './pages/Login';
import OTP from './pages/OTP';
import Home from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            dispatch(loginSuccess({ user: data.user, token }));
          } else {
            dispatch(logout());
          }
        } catch (err) {
          console.error(err);
          dispatch(logout());
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token, user, dispatch]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#EFEAE2] text-gray-500">Loading...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OTP />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
        <AppContent />
              </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  );
}
