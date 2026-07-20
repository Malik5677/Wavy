import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, setOtpCredentials } from '../redux/authSlice';
import { RootState } from '../redux/store';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function OTP() {
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const phoneNumber = useSelector((state: RootState) => state.auth.phoneNumberForOtp);
  const email = useSelector((state: RootState) => state.auth.emailForOtp);

  useEffect(() => {
    if (!phoneNumber || !email) {
      navigate('/login');
    }
  }, [navigate, phoneNumber, email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

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

  const handleResend = async () => {
    if (!phoneNumber || !email) return;
    if (resendCooldown > 0) return;

    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, email }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to resend OTP';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      toast.success('OTP resent to your email');
      setResendCooldown(30);
    } catch (error: any) {
      toast.error(error.message || 'Could not resend OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeAccount = () => {
    dispatch(setOtpCredentials({ phoneNumber: null, email: null } as any));
    navigate('/login');
  };

  if (!phoneNumber || !email) {
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
              className="w-full rounded-3xl bg-[#00A884] py-3 text-sm font-semibold text-white transition hover:bg-[#01936d] disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isSending}
            >
              Verify and Login
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isSending}
              className="rounded-3xl border border-[#D1D5DB] px-5 py-3 text-sm font-medium text-[#374151] transition hover:border-[#00A884] hover:text-[#00A884] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={handleChangeAccount}
              className="rounded-3xl border border-transparent bg-slate-100 px-5 py-3 text-sm font-medium text-[#374151] transition hover:bg-slate-200"
            >
              Change email or phone
            </button>
            <div className="text-center text-sm text-[#6B7280]">
              Enter the code from email to complete login. Use the same email and phone number you provided.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
