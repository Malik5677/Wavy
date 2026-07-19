import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { RootState } from '../redux/store';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

export default function OTP() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const phoneNumber = useSelector((state: RootState) => state.auth.phoneNumberForOtp);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to verify OTP';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success('Successfully logged in');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    }
  };

  if (!phoneNumber) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Number</h1>
        <p className="text-gray-500 mb-8 text-center">We sent an SMS with a code to {phoneNumber}. For testing, use the mock code printed in the server logs.</p>
        
        <form onSubmit={handleVerify} className="w-full">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">6-Digit Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center tracking-widest text-lg"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}
