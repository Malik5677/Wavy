import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setOtpCredentials } from '../redux/authSlice';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import { API_URL } from '../utils/api';

const normalizePhoneNumber = (input: string) => {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const isValidPhoneNumber = (phone: string) => {
  const digits = normalizePhoneNumber(phone);
  return /^[6789][0-9]{9}$/.test(digits);
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error('Phone number must be 10 digits and start with 6, 7, 8, or 9');
      return;
    }

    if (!email || !isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalizedPhone, email }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to send OTP';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }
      const data = await res.json();

      dispatch(setOtpCredentials({ phoneNumber: normalizedPhone, email }));
      toast.success('OTP sent to your email');
      if (data.mockCode) {
        toast.success(`Mock Code: ${data.mockCode}`, { duration: 8000 });
      }
      navigate('/verify-otp');
    } catch (error: any) {
      toast.error(error.message || 'Could not send OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden">
        <div className="bg-[#00A884] px-8 py-10 text-white text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">WaveChat</h1>
          <p className="mt-2 text-sm opacity-90">Secure chat login with phone and email OTP</p>
        </div>

        <div className="px-8 py-10">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#111827] mb-2">Login to your account</h2>
            <p className="text-sm text-[#6B7280]">Enter your mobile number and email. OTP will be sent to your email only.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-3xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Mobile Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 9876543210 or +91 9876543210"
                className="w-full rounded-3xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20"
              />
              <p className="mt-2 text-xs text-[#6B7280]">Phone number must be 10 digits and start with 6, 7, 8, or 9. Country code is optional.</p>
            </div>

            <button
              type="submit"
              className="w-full rounded-3xl bg-[#00A884] py-3 text-sm font-semibold text-white transition hover:bg-[#01936d]"
            >
              Send OTP
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6B7280]">
            By continuing, you agree to receive OTP via email only.<br />This is a one-time secure verification step.
          </div>
        </div>
      </div>
    </div>
  );
}
