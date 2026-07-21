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

    if (!isValidPhoneNumber(normalizedPhone)) {
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
        } catch (e) {
          // ignore
        }
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
    <div className="min-h-screen bg-[#f2f7f2] text-[#202c33]">
      <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[30px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-white shadow-sm">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-semibold">WaveChat</h1>
            <p className="mt-2 text-sm text-[#54656f]">Login with phone or email. OTP is sent to your inbox.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#202c33]">Phone number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full rounded-[20px] border border-[#d8e1dc] bg-[#f7fbf7] px-4 py-3 text-sm text-[#202c33] outline-none transition focus:border-[#25d366] focus:ring-2 focus:ring-[#25d366]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#202c33]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[20px] border border-[#d8e1dc] bg-[#f7fbf7] px-4 py-3 text-sm text-[#202c33] outline-none transition focus:border-[#25d366] focus:ring-2 focus:ring-[#25d366]/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1fbf5d]"
            >
              Send OTP
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#6d7a78]">
            OTP is delivered by email only.
          </p>
        </div>
      </div>
    </div>
  );
}
