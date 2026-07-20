import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { API_URL } from '../utils/api';
import { ArrowLeft, User as UserIcon, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileShare() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}/api/user/share/${userId}`, { headers });

        if (!res.ok) {
          const error = await res.json().catch(() => null);
          if (res.status === 404) {
            toast.error('Profile not found');
            setProfile(null);
          } else {
            toast.error(error?.error || 'Failed to load profile');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, token, userId]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#111B21] text-[#E9EDEF]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111B21] text-[#E9EDEF] p-4 md:p-10">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 mb-6 text-[#AEBAC1] hover:text-[#E9EDEF]"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="max-w-2xl mx-auto bg-[#202C33] rounded-3xl border border-[#222E35] shadow-lg overflow-hidden">
        <div className="p-6 border-b border-[#222E35]">
          <h1 className="text-2xl font-semibold">Shared Profile</h1>
          <p className="mt-2 text-sm text-[#8696A0]">This profile respects the user's current privacy settings.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#111B21] overflow-hidden flex items-center justify-center border border-[#2A3942]">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-[#8696A0]" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.displayName || profile?.username || 'Unknown User'}</h2>
              <p className="text-sm text-[#8696A0]">{profile?.username || profile?.phoneNumber || 'No contact available'}</p>
            </div>
          </div>

          {profile?.bio && (
            <div className="rounded-3xl bg-[#111B21] p-4 border border-[#2A3942]">
              <p className="text-sm text-[#E9EDEF]">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-3xl bg-[#111B21] p-4 border border-[#2A3942]">
              <p className="text-sm text-[#8696A0]">Last seen</p>
              <p className="mt-2 text-[#E9EDEF]">{profile?.lastSeen ? new Date(profile.lastSeen).toLocaleString() : 'Hidden'}</p>
            </div>
            <div className="rounded-3xl bg-[#111B21] p-4 border border-[#2A3942]">
              <p className="text-sm text-[#8696A0]">Privacy</p>
              <div className="mt-2 text-[#E9EDEF] space-y-2 text-sm">
                <div className="flex items-center gap-2"><Lock size={14} /> Last seen: {profile?.privacyLastSeen || 'everyone'}</div>
                <div className="flex items-center gap-2"><Shield size={14} /> Profile photo: {profile?.privacyProfilePhoto || 'everyone'}</div>
                <div className="flex items-center gap-2"><Lock size={14} /> Status: {profile?.privacyStatus || 'everyone'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
