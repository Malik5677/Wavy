import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { RootState } from '../redux/store';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function OTP() {
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const phoneNumber = useSelector((state: RootState) => state.auth.phoneNumberForOtp);
  const email = useSelector((state: RootState) => state.auth.emailForOtp);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          email,
          code,
          displayName,
        }),
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

  if (!phoneNumber || !email) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden">
        <div className="bg-[#00A884] px-8 py-10 text-white text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Verify OTP</h1>
          <p className="mt-2 text-sm opacity-90">A one-time code was sent to {email}.</p>
        </div>

        <div className="px-8 py-10">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-3xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">OTP Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full rounded-3xl border border-[#D1D5DB] px-4 py-3 text-sm text-center outline-none transition focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-3xl bg-[#00A884] py-3 text-sm font-semibold text-white transition hover:bg-[#01936d]"
            >
              Verify and Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6B7280]">
            Enter the code from email to complete login. Use the same email and phone number you provided.
          </div>
        </div>
      </div>
    </div>
  );
}
