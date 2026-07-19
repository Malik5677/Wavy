import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPhoneNumberForOtp } from '../redux/authSlice';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
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

      dispatch(setPhoneNumberForOtp(phoneNumber));
      toast.success('OTP Sent');
      if (data.mockCode) {
        toast.success(`Mock Code: ${data.mockCode}`, { duration: 8000 });
      }
      navigate('/verify-otp');
    } catch (error) {
      toast.error('Could not send OTP');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to WaveChat</h1>
        <p className="text-gray-500 mb-8 text-center">Enter your phone number to continue</p>
        
        <form onSubmit={handleLogin} className="w-full">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
