import { CustomAudioPlayer } from '../components/CustomAudioPlayer';
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { useNavigate } from 'react-router-dom';
import { logout, updateUser } from '../redux/authSlice';
import { LogOut, User as UserIcon, Send, Phone, Video, Info, MessageCircle, MessageSquarePlus, PhoneCall, PhoneIncoming, PhoneOutgoing, CircleDashed, Users, Paperclip, Smile, Check, CheckCheck, Settings, Edit3, Reply, Pin, Archive, SmilePlus, Forward, Trash2, Bell, Image, Cloud, ChevronRight, Palette, Database, X, Camera, Plus, CheckSquare, Square, Moon, Sun, Lock, Mic, ArrowLeft, StopCircle, Key, Shield, Smartphone, Globe, HelpCircle, HardDrive , Copy, Star, MoreVertical } from 'lucide-react';
import { motion } from "motion/react";
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { CallModal } from '../components/CallModal';
import { GroupCallModal } from '../components/GroupCallModal';
import { StatusModal } from '../components/StatusModal';
import { CommunityView } from '../components/CommunityView';
import { AdminView } from '../components/AdminView';
import { API_URL } from "../utils/api";

export default function Home() {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ msg: any, x: number, y: number, showReact?: boolean } | null>(null);
  


  const [profileForm, setProfileForm] = useState({ displayName: user?.displayName || user?.username || '', bio: user?.bio || '', profilePhoto: user?.profilePhoto || '' });

  useEffect(() => {
    if (user) {
      setProfileForm({ displayName: user.displayName || user.username || '', bio: user.bio || '', profilePhoto: user.profilePhoto || '' });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        dispatch({ type: 'auth/loginSuccess', payload: { user: updatedUser, token } });
        setShowProfileModal(false);
        toast.success("Profile updated");
      }
    } catch(e) {
      toast.error("Failed to update profile");
    }
  };


  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const activeChatRef = useRef<any | null>(null);
  const userRef = useRef<any | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [privacyLastSeen, setPrivacyLastSeen] = useState(user?.privacyLastSeen || 'everyone');
  const [privacyProfilePhoto, setPrivacyProfilePhoto] = useState(user?.privacyProfilePhoto || 'everyone');
  const [privacyStatus, setPrivacyStatus] = useState(user?.privacyStatus || 'everyone');
  const [wallpaper, setWallpaper] = useState(user?.wallpaper || '');
  
  const saveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          privacyLastSeen,
          privacyProfilePhoto,
          privacyStatus,
          wallpaper
        })
      });
      if (res.ok) {
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const [activeTab, setActiveTab] = useState('chats');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState<{ isOpen: boolean, contactId: string, defaultName: string, customName: string }>({ isOpen: false, contactId: '', defaultName: '', customName: '' });
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  

  const saveContact = async (contactId: string, customName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/user/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactId, customName })
      });
      if (res.ok) {
        toast.success("Contact saved");
        fetchContacts();
      }
    } catch(e) {
      toast.error("Failed to save contact");
    }
  };
  const fetchContacts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedContacts(data);
      }
    } catch(e) {}
  };
  const fetchBlockedUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/blocked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setBlockedUsers(data);
      }
    } catch (e) { console.error(e); }
  };
  
  useEffect(() => {
    if (activeTab === 'settings-blocked') {
      fetchBlockedUsers();
    }
  }, [activeTab]);


  const getWallpaperClass = () => {
    if (!activeChat) return 'bg-[#222E35]';
    const wp = user?.wallpaper || 'default';
    switch (wp) {
      case 'dark': return 'bg-[#0B141A]';
      case 'light': return 'bg-[#EFEAE2]';
      case 'doodle': return 'bg-[#0B141A] chat-doodle';
      default: return 'bg-[#0B141A]';
    }
  };

  const updateSettings = async (updates: any) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/settings/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      toast.success('Settings saved');
      dispatch(updateUser(updates));
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };
  
  const blockUser = async (userId: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/users/block`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ blockedId: userId })
      });
      toast.success('Contact blocked');
      fetchBlockedUsers();
    } catch (e) {
      toast.error('Failed to block');
    }
  };

  const unblockUser = async (userId: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/users/unblock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ blockedId: userId })
      });
      toast.success('Contact unblocked');
      fetchBlockedUsers();
    } catch (e) {
      toast.error('Failed to unblock');
    }
  };

  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showChatsMenu, setShowChatsMenu] = useState(false);
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setShowChatMenu(false);
      setShowChatsMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [favouriteChats, setFavouriteChats] = useState<string[]>([]);
  const [disappearingChats, setDisappearingChats] = useState<string[]>([]);
  const [isSelectingMessages, setIsSelectingMessages] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isCalling, setIsCalling] = useState<{ 
    isVideo: boolean, 
    name: string,
    targetUserId: string,
    chatId: string,
    isIncoming?: boolean,
    offer?: any,
    candidates?: any[]
  } | null>(null);

  const [isGroupCalling, setIsGroupCalling] = useState<{
    isVideo: boolean,
    chatName: string,
    chatId: string,
    isIncoming?: boolean,
  } | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [activeStatusUser, setActiveStatusUser] = useState<any>(null);
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [statusType, setStatusType] = useState('text');
  const [statusMediaPreview, setStatusMediaPreview] = useState<string | null>(null);
  const statusFileInputRef = useRef<HTMLInputElement>(null);
  
  const handleStatusMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setStatusMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
    if (token) {
     fetch(`${API_URL}/api/status`, {  headers: { Authorization: `Bearer ${token}` }})
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => setStatuses(data))
        .catch(console.error);
    }
  }, [token, activeTab]);
  
  const handleCreateStatus = async () => {
    const isMedia = statusType === 'image' || statusType === 'video';
    const contentPayload = isMedia ? statusMediaPreview : newStatusText;
    
    if (!contentPayload) return toast.error('Content is required');
    if (statusType === 'link' && !contentPayload.startsWith('http')) {
      return toast.error('Please enter a valid URL starting with http:// or https://');
    }

    try {
      const res = await fetch(`${API_URL}/api/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: contentPayload, type: statusType })
      });
      if (res.ok) {
        toast.success('Status updated!');
        setShowCreateStatus(false);
        setNewStatusText('');
        setStatusMediaPreview(null);
        setStatusType('text');
        // Refetch
       fetch(`${API_URL}/api/status`, {  headers: { Authorization: `Bearer ${token}` }})
          .then(r => { if (!r.ok) throw new Error(); return r.json(); })
          .then(data => setStatuses(data));
      }
    } catch(e) {
      console.error(e);
      toast.error('Failed to create status');
    }
  };
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');

  // Group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAvatar, setNewGroupAvatar] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = async (field: 'displayName' | 'bio') => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(field === 'displayName' ? { displayName: editName } : { bio: editBio })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        // Just update local storage and re-auth or dispatch updated user for simplicity
        // But since user is in Redux, we should dispatch.
        // For now, since user object isn't updated in redux dynamically here without action,
        // Let's import updateUser from authSlice or just reload page. Let's do a simple update
        // We will dispatch it. We need to create an action or just reload.
        toast.success('Profile updated');
        // A quick hack for MVP: refresh page
        window.location.reload();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      toast.error('Error updating profile');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (token) {
      const newSocket = io(API_URL, {
  auth: { token },
  transports: ["websocket", "polling"],
});
      setSocket(newSocket);
      
      newSocket.on("user_status", ({ userId, isOnline, lastSeen }) => {
        setChats(prev => prev.map(c => {
          if (c.otherUser && c.otherUser.id === userId) {
            return {
              ...c,
              otherUser: {
                ...c.otherUser,
                isOnline,
                lastSeen
              }
            };
          }
          return c;
        }));
        
        if (activeChatRef.current?.otherUser?.id === userId) {
          setActiveChat((prev: any) => ({
            ...prev,
            otherUser: {
              ...prev.otherUser,
              isOnline,
              lastSeen
            }
          }));
        }
      });

      
      newSocket.on("message_reaction", (data) => {
        setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reaction: data.reaction } : m));
      });
      
      newSocket.on("receive_message", (msg) => {
         console.log("📥 RECEIVED MESSAGE", msg);
        if (msg.senderId !== userRef.current?.id) {
          newSocket.emit("message_delivered", { messageId: msg.id, chatId: msg.chatId });
        }

        setMessages((prev) => {
          if (activeChatRef.current?.chatId === msg.chatId) {
            if (msg.senderId !== userRef.current?.id) {
              newSocket.emit("message_read", { messageId: msg.id, chatId: msg.chatId });
              return [...prev, { ...msg, isRead: true, isDelivered: true }];
            }
            return [...prev, msg];
          }
          return prev;
        });
        fetchChats();
      fetchContacts();
      });
      
      
      newSocket.on("message_delivered", ({ messageId, chatId }) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDelivered: true } : m));
      });

      
      newSocket.on("messages_delivered", ({ chatId }) => {
        if (activeChatRef.current?.chatId === chatId) {
          setMessages(prev => prev.map(m => ({ ...m, isDelivered: true })));
        }
      });

      newSocket.on("message_read", ({ messageId, chatId }) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
      });

      newSocket.on("message_edited", ({ messageId, content }) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content } : m));
      });

      newSocket.on("message_deleted", ({ messageId }) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
      });

      newSocket.on("message_reacted", ({ messageId, reaction }) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reaction } : m));
      });

      newSocket.on("typing", ({ chatId, userId }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      });

      newSocket.on("stop_typing", ({ chatId, userId }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: false }));
      });

      newSocket.on("send_message_error", (data) => {
        console.error("Server error sending message:", data);
        toast.error(`Error sending message: ${data.error}`);
      });

      newSocket.on("call_offer", (data) => {
        setIsCalling({
          isVideo: data.isVideo,
          name: data.name,
          targetUserId: data.fromUserId,
          chatId: data.chatId,
          isIncoming: true,
          offer: data.offer,
          candidates: []
        });
      });
      
      newSocket.on("incoming_group_call", (data) => {
        setIsGroupCalling({
          isVideo: data.isVideo,
          chatName: `${data.chatName} (Started by ${data.callerName})`,
          chatId: data.chatId,
          isIncoming: true
        });
      });

      newSocket.on("group_call_offer", (data) => {
        // Group offers handled directly in the modal
      });

      newSocket.on("ice_candidate", (data) => {
        setIsCalling(prev => {
          if (prev) {
            return { ...prev, candidates: [...(prev.candidates || []), data.candidate] };
          }
          return prev;
        });
      });

      newSocket.on("end_call", (data) => {
        if (data?.reason === 'offline') {
          toast.error("User is offline");
        }
        setIsCalling(null);
      });
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);
  
  useEffect(() => {
    if (token) {
      fetchChats();
      fetchContacts();
    }
  }, [token]);
  

  const fetchCalls = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/call`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setCallHistory(data);
      }
    } catch(e) {}
  };

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setChats(data);
        return data;
      }
    } catch(err) { console.error("Error:", err); }
    return null;
  };
  

  const getUserDisplayInfo = (u: any) => {
    if (!u) return { name: '?', photo: '', bio: '', isSaved: false, originalName: '' };
    const saved = savedContacts.find(c => c.contactId === (u.id || u.userId));
    const isSaved = !!saved;
    const name = saved ? saved.customName : (u.phoneNumber || u.displayName || u.username || '?');
    const originalName = u.displayName || u.username;
    return {
      name,
      photo: u.profilePhoto || null,
      bio: u.bio || 'Available',
      isSaved,
      originalName
    };
  };
  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/chat/search-users?q=${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch(err) { console.error("Error:", err); }
  };
  
  const startChat = async (recipientId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/start`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipientId })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setSearchQuery('');
        setSearchResults([]);
        const updatedChats = await fetchChats();
      fetchContacts();
        if (updatedChats) {
          const openedChat = updatedChats.find((c: any) => c.chatId === data.chatId); console.log("Start chat openedChat:", openedChat);
          if (openedChat) {
            setActiveChat(openedChat);
          } else {
            setActiveChat({ chatId: data.chatId });
          }
        }
        // We'll need to fetch full chat info if it's new, but for MVP let's just trigger a full fetch
        fetchChatMessages(data.chatId, updatedChats || undefined);
      } else {
        const err = await res.text();
        console.error("Failed to start chat", err);
      }
    } catch(err) {
      toast.error('Could not start chat');
    }
  };

  const handleGroupAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File too large');
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNewGroupAvatar(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
      toast.error('Group name and at least 1 member required');
      return;
    }
    
    try {
      const res = await fetch('/api/chat/group', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newGroupName, 
          description: newGroupDesc,
          avatar: newGroupAvatar,
          memberIds: selectedGroupMembers 
        })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setActiveTab('chats');
        setNewGroupName('');
        setNewGroupDesc('');
        setNewGroupAvatar('');
        setSelectedGroupMembers([]);
        const updated = await fetchChats();
      fetchContacts();
        fetchChatMessages(data.chatId, updated || undefined);
        toast.success('Group created successfully');
      } else {
        toast.error('Failed to create group');
      }
    } catch (err) {
      toast.error('Failed to create group');
    }
  };
  

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!activeChat || activeChat.isGroup || !activeChat.otherUser) return;
    try {
      const res = await fetch(`${API_URL}/api/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: activeChat.otherUser.id, type })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        const callData = { id: data.id, callerId: user.id, callerName: user.displayName, receiverId: activeChat.otherUser.id, type, status: 'calling' };
        setActiveCall(callData);
        socket.emit("start_call", callData);
      }
    } catch (e) {
      toast.error('Failed to start call');
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch(`/api/call/${incomingCall.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed' })
      });
      setActiveCall({ ...incomingCall, status: 'connected' });
      socket.emit("accept_call", { callId: incomingCall.id, callerId: incomingCall.callerId });
      setIncomingCall(null);
    } catch (e) {}
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch(`/api/call/${incomingCall.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'rejected' })
      });
      socket.emit("reject_call", { callId: incomingCall.id });
      setIncomingCall(null);
      fetchCalls();
    } catch (e) {}
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      await fetch(`/api/call/${activeCall.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed' })
      });
      socket.emit("end_call", { callId: activeCall.id });
      setActiveCall(null);
      fetchCalls();
    } catch (e) {}
  };

  const fetchChatMessages = async (chatId: string, currentChats?: any[], offset: number = 0) => {
    if (!chatId) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/${chatId}/messages?offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        
        if (offset === 0) {
          setMessages(data);
          const listToUse = currentChats || chats;
          const chatInfo = listToUse.find(c => c.chatId === chatId);
          if (chatInfo) {
            setActiveChat(chatInfo);
          } else {
            setActiveChat({ chatId });
          }
          if (socket) {
            socket.emit("join_chat", chatId);
          }
        } else {
          // If we got new messages, prepend them
          setMessages(prev => [...data, ...prev]);
        }

        if (socket) {
          data.forEach((m: any) => {
            if (!m.isRead && m.senderId !== user.id) {
              socket.emit("message_read", { messageId: m.id, chatId });
            }
          });
        }
      }
    } catch(err) { console.error("Error:", err); }
  };

  
  const togglePinChat = async (e: any, chatId: string, isPinned: boolean) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/${chatId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isPinned: !isPinned })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => c.chatId === chatId ? { ...c, isPinned: !isPinned } : c));
      }
    } catch (e) { toast.error('Failed to pin chat'); }
  };


  const clearChatMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages([]);
        toast.success('Chat cleared');
      }
    } catch (e) {
      toast.error('Failed to clear chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveChat(null);
        setChats(prev => prev.filter(c => c.chatId !== chatId));
        toast.success('Chat deleted');
      }
    } catch (e) {
      toast.error('Failed to delete chat');
    }
  };

  const toggleArchiveChat = async (e: any, chatId: string, isArchived: boolean) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/${chatId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isArchived: !isArchived })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => c.chatId === chatId ? { ...c, isArchived: !isArchived } : c));
      }
    } catch (e) { toast.error('Failed to archive chat'); }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      if (activeChat && messages.length >= 50) {
        fetchChatMessages(activeChat.chatId, undefined, messages.length);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChat) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large (max 10MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (socket && base64) {
          let type = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('audio/')) type = 'audio';

          let content = base64;
          if (type === 'file') {
            content = JSON.stringify({ name: file.name, data: base64 });
          }

          socket.emit("send_message", {
            chatId: activeChat.chatId,
            content: content,
            type: type
          });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChat) return;
    
    socket.emit('typing', { chatId: activeChat.chatId });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId: activeChat.chatId });
    }, 1500);
  };

  const handleReact = (messageId: string, reaction: string) => {
    if (!activeChat || !socket) return;
    socket.emit("react_message", { messageId, reaction, chatId: activeChat.chatId });
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          if (socket && activeChat) {
             socket.emit("send_message", {
               chatId: activeChat.chatId,
               content: base64Audio,
               type: 'audio',
               replyToId: replyingTo?.id || null
             });
             setReplyingTo(null);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Could not access microphone");
    }
  };
  

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent sending
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !socket) return;
    
    if (editingMessageId) {
      socket.emit("edit_message", {
        messageId: editingMessageId,
        chatId: activeChat.chatId,
        content: newMessage
      });
      setEditingMessageId(null);
    } else {
      socket.emit("send_message", {
        chatId: activeChat.chatId,
        content: newMessage,
        type: 'text',
        replyToId: replyingTo?.id
      });
    }
    
    setNewMessage('');
    setReplyingTo(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { chatId: activeChat.chatId });
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated || !user) return null;

  const isBlockedByMe = activeChat && !activeChat.isGroup && activeChat.otherUser && blockedUsers.some(u => u.id === activeChat.otherUser.id);

  return (
    <div className="flex h-screen w-full bg-[#0B141A] font-sans text-[#e9edef] overflow-hidden">
      {/* Navigation Rail (Leftmost) */}
      <nav className="w-[64px] bg-[#0B141A] flex flex-col items-center py-5 space-y-8 shrink-0">
        <div className="w-10 h-10 bg-[#00A884] rounded-xl flex items-center justify-center text-[#E9EDEF] font-bold text-xl shadow-lg shadow-[#00A884]/20">
          W
        </div>
        <div className="flex flex-col space-y-6 text-[#AEBAC1]">
          <div onClick={() => setActiveTab('chats')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'chats' ? 'bg-[#202C33] text-[#E9EDEF]' : 'hover:bg-[#202C33]'}`} title="Chats">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div onClick={() => setActiveTab('calls')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'calls' ? 'bg-[#202C33] text-[#E9EDEF]' : 'hover:bg-[#202C33]'}`} title="Calls">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div onClick={() => setActiveTab('status')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'status' ? 'bg-[#202C33] text-[#E9EDEF]' : 'hover:bg-[#202C33]'}`} title="Status">
            <CircleDashed className="w-6 h-6" />
          </div>
          <div onClick={() => setActiveTab('communities')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'communities' ? 'bg-[#202C33] text-[#E9EDEF]' : 'hover:bg-[#202C33]'}`} title="Communities">
            <Users className="w-6 h-6" />
          </div>
          <div onClick={() => setActiveTab('admin')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'admin' ? 'bg-[#202C33] text-[#E9EDEF]' : 'hover:bg-[#202C33]'}`} title="Admin Dashboard">
            <Shield className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-auto mb-4 flex flex-col items-center space-y-4">
          <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'settings' ? 'bg-[#202C33] text-[#E9EDEF]' : 'text-[#AEBAC1] hover:bg-[#202C33]'}`} title="Settings">
            <Settings className="w-6 h-6" />
          </button>
          <button onClick={handleLogout} className="p-2 hover:bg-[#202C33] rounded-lg text-[#AEBAC1] cursor-pointer transition-colors" title="Logout">
            <LogOut className="w-6 h-6" />
          </button>
          <div onClick={() => setActiveTab('profile')} className="mt-4 w-10 h-10 rounded-full border-2 border-[#00A884] p-0.5 cursor-pointer">
            <div className="w-full h-full bg-[#374045] rounded-full flex items-center justify-center text-[#00A884] font-bold overflow-hidden text-[10px]">
              {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : user.displayName ? user.displayName.substring(0,2).toUpperCase() : 'ME'}
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Sidebar Column */}
      <aside className="w-[350px] bg-[#111B21] border-r border-[#222E35] flex flex-col">
        {activeTab === 'chats' && !showArchived && (
          <>
            <header className="p-4 flex flex-col shrink-0">
              <div className="flex justify-between items-center mb-4 mt-2">
                <h1 className="text-[22px] font-bold tracking-tight text-[#e9edef]">Chats</h1>
                <div className="flex space-x-1">
                  <button onClick={() => setActiveTab('new-chat')} className="text-[#AEBAC1] hover:bg-[#202C33] p-2 rounded-lg transition-colors" title="New chat">
                    <MessageSquarePlus size={20} />
                  </button>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowChatsMenu(!showChatsMenu); }} className={`hover:bg-[#202C33] p-2 rounded-lg transition-colors ${showChatsMenu ? 'bg-[#202C33] text-[#E9EDEF]' : 'text-[#AEBAC1]'}`} title="Menu">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>
                    </button>
                    {showChatsMenu && (
                      <div className="absolute right-0 top-12 w-48 bg-[#233138] shadow-[0_2px_5px_0_rgba(11,20,26,.26),0_2px_10px_0_rgba(11,20,26,.16)] rounded-sm py-2 z-50 text-[#E9EDEF]">
                        <button onClick={() => { setShowArchived(true); setShowChatsMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-[14.5px]">Archived</button>
                        <button onClick={() => { setActiveTab('settings'); setShowChatsMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-[14.5px]">Settings</button>
                        <button onClick={() => { handleLogout(); setShowChatsMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-[14.5px]">Log out</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative mb-3">
                <input 
                  type="text" 
                  placeholder="Search or start a new chat" 
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full bg-[#202C33] border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-0 outline-none placeholder-[#8696A0] text-[#e9edef]"
                />
                <svg className="w-4 h-4 text-[#8696A0] absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
                <button className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#0A332C] text-[#00A884] whitespace-nowrap">All</button>
                <button className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#202C33] text-[#8696A0] whitespace-nowrap hover:bg-[#2A3942]">Unread</button>
                <button className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#202C33] text-[#8696A0] whitespace-nowrap hover:bg-[#2A3942]">Favourites</button>
                <button className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#202C33] text-[#8696A0] whitespace-nowrap hover:bg-[#2A3942]">Groups</button>
              </div>
            </header>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="flex items-center space-x-6 px-4 py-3 hover:bg-[#202C33] cursor-pointer mb-2" onClick={() => setShowArchived(true)}>
                <Archive className="w-5 h-5 text-[#8696A0] shrink-0" />
                <span className="font-medium text-[#E9EDEF] text-[15px]">Archived</span>
              </div>
              {searchQuery ? (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-[#8696a0] uppercase">Users</div>
                  {searchResults.map(u => (
                    <div key={u.id} onClick={() => startChat(u.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#202C33] cursor-pointer">
                      <div className="w-10 h-10 bg-[#374045] rounded-full flex items-center justify-center">
                        <UserIcon size={20} className="text-[#8696a0]" />
                      </div>
                      <div>
                        <div className="font-medium text-[#E9EDEF]">{getUserDisplayInfo(u).name}</div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && <div className="p-4 text-center text-[#8696a0] text-sm">No users found</div>}

                  <div className="px-4 py-2 mt-2 text-xs font-semibold text-[#8696a0] uppercase border-t border-[#222E35]">Chats</div>
                  {chats.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
                    <div 
                      key={chat.chatId} 
                      onClick={() => fetchChatMessages(chat.chatId)}
                      className={`flex px-4 py-3 cursor-pointer ${activeChat?.chatId === chat.chatId ? 'bg-[#2A3942] border-l-4 border-[#00A884]' : 'hover:bg-[#202C33] border-l-4 border-transparent'}`}
                    >
                      <div className="relative w-12 h-12 shrink-0">
                        <div className="w-full h-full bg-[#374045] rounded-full overflow-hidden flex items-center justify-center font-semibold text-[#E9EDEF]">
                          {(!chat.isGroup && chat.otherUser) ? (getUserDisplayInfo(chat.otherUser).photo ? <img src={getUserDisplayInfo(chat.otherUser).photo} className="w-full h-full rounded-full object-cover" /> : (getUserDisplayInfo(chat.otherUser).name?.[0]?.toUpperCase() || "?")) : (chat.avatar ? <img src={chat.avatar} className="w-full h-full rounded-full object-cover" /> : (chat.name ? chat.name?.[0]?.toUpperCase() || "?" : <UserIcon size={24}/>))}
                        </div>
                        {chat.otherUser && chat.otherUser.isOnline && !blockedUsers.some(u => u.id === chat.otherUser?.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] border-2 border-[#111B21] rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="font-semibold text-[15px] truncate text-[#E9EDEF] font-medium">{!chat.isGroup && chat.otherUser ? getUserDisplayInfo(chat.otherUser).name : (chat.name || 'Unknown')}</h3>
                          {chat.lastMessage && (
                            <span className={`text-[11px] font-medium ${activeChat?.chatId === chat.chatId ? 'text-[#00A884]' : 'text-[#8696A0]'}`}>
                              {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          {chat.otherUser && typingUsers[chat.otherUser.id] ? (
                            <p className="text-sm truncate text-[#00A884] font-medium">typing...</p>
                          ) : (
                            <p className={`text-[13px] truncate ${activeChat?.chatId === chat.chatId ? 'text-[#E9EDEF] font-medium' : 'text-[#8696A0]'}`}>
                              {chat.lastMessage?.type === 'image' ? '📷 Photo' : chat.lastMessage?.type === 'audio' ? '🎤 Voice message' : (chat.lastMessage?.content || 'Started a chat')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>

                  {chats.filter(c => c.isPinned && !c.isArchived).length > 0 && (
                    <div className="px-4 py-2 mt-2 text-xs font-semibold text-[#8696a0] uppercase border-t border-[#222E35]">Pinned</div>
                  )}
                  {chats.filter(c => !c.isArchived).sort((a,b) => (b.isPinned?1:0) - (a.isPinned?1:0)).map(chat => (
                    <div 
                      key={chat.chatId} 
                      onClick={() => fetchChatMessages(chat.chatId)}
                      className={`group flex px-4 py-3 cursor-pointer ${activeChat?.chatId === chat.chatId ? 'bg-[#2A3942] border-l-4 border-[#00A884]' : 'hover:bg-[#202C33] border-l-4 border-transparent'}`}
                    >
                      <div className="relative w-12 h-12 shrink-0">
                        <div className="w-full h-full bg-[#374045] rounded-full overflow-hidden flex items-center justify-center font-semibold text-[#E9EDEF]">
                          {(!chat.isGroup && chat.otherUser) ? (getUserDisplayInfo(chat.otherUser).photo ? <img src={getUserDisplayInfo(chat.otherUser).photo} className="w-full h-full rounded-full object-cover" /> : (getUserDisplayInfo(chat.otherUser).name?.[0]?.toUpperCase() || "?")) : (chat.avatar ? <img src={chat.avatar} className="w-full h-full rounded-full object-cover" /> : (chat.name ? chat.name?.[0]?.toUpperCase() || "?" : <UserIcon size={24}/>))}
                        </div>
                        {chat.otherUser && chat.otherUser.isOnline && !blockedUsers.some(u => u.id === chat.otherUser?.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] border-2 border-[#111B21] rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden relative">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="font-semibold text-[15px] truncate text-[#E9EDEF] font-medium">{!chat.isGroup && chat.otherUser ? getUserDisplayInfo(chat.otherUser).name : (chat.name || 'Unknown')}</h3>
                          {chat.lastMessage && (
                            <span className={`text-[11px] font-medium ${activeChat?.chatId === chat.chatId ? 'text-[#00A884]' : 'text-[#8696A0]'}`}>
                              {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          {chat.otherUser && typingUsers[chat.otherUser.id] ? (
                            <p className="text-sm truncate text-[#00A884] font-medium">typing...</p>
                          ) : (
                            <p className={`text-[13px] truncate pr-16 ${activeChat?.chatId === chat.chatId ? 'text-[#E9EDEF] font-medium' : 'text-[#8696A0]'}`}>
                              {chat.lastMessage?.type === 'image' ? '📷 Photo' : chat.lastMessage?.type === 'audio' ? '🎤 Voice message' : (chat.lastMessage?.content || 'Started a chat')}
                            </p>
                          )}
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#202C33] via-[#202C33] to-transparent pl-4 pb-2 pt-2">
                          <button onClick={(e) => togglePinChat(e, chat.chatId, chat.isPinned)} className="p-1.5 text-[#AEBAC1] hover:text-[#00A884] rounded-full hover:bg-[#374045]" title={chat.isPinned ? "Unpin chat" : "Pin chat"}>
                            <Pin size={14} className={chat.isPinned ? "fill-[#00A884] text-[#00A884]" : ""} />
                          </button>
                          <button onClick={(e) => toggleArchiveChat(e, chat.chatId, chat.isArchived)} className="p-1.5 text-[#AEBAC1] hover:text-[#E9EDEF] rounded-full hover:bg-[#374045]" title="Archive chat">
                            <Archive size={14} />
                          </button>
                        </div>
                        
                        {/* Always show pinned icon if pinned and not hovered */}
                        {chat.isPinned && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 group-hover:opacity-0 transition-opacity">
                            <Pin size={14} className="text-[#8696A0] fill-[#8696A0]" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                </div>
              )}
            </div>
          </>
        )}
        

        {activeTab === 'new-chat' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-6 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('chats')} className="hover:bg-[#374045] p-2 -ml-2 rounded-full transition">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-[19px] font-semibold tracking-tight">New chat</h1>
              </div>
            </header>
            
            <div className="p-2 border-b border-[#222E35] bg-[#111B21]">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search contacts" 
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full bg-[#202C33] border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-0 outline-none placeholder-[#8696A0] text-[#e9edef]"
                />
                <svg className="w-4 h-4 text-[#8696A0] absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {!searchQuery && (
                <div className="py-2">
                  <div className="flex items-center gap-4 px-4 py-3 hover:bg-[#202C33] cursor-pointer transition" onClick={() => toast('New group feature coming soon')}>
                    <div className="w-12 h-12 bg-[#00A884] rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
                      <Users size={24} />
                    </div>
                    <div className="flex-1 border-b border-[#222E35] pb-3 pt-1">
                      <h2 className="text-[#E9EDEF] text-base">New group</h2>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="py-2">
                {searchResults.length > 0 ? (
                  <>
                    <h3 className="px-4 py-2 text-[#00A884] text-sm font-medium tracking-wide">CONTACTS ON WAVECHAT</h3>
                    {searchResults.map(user => (
                      <div key={user.id} onClick={() => { startChat(user.id); setActiveTab('chats'); }} className="flex items-center gap-4 px-4 py-3 hover:bg-[#202C33] cursor-pointer transition">
                        <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center text-[#E9EDEF] font-bold overflow-hidden shrink-0">
                          {getUserDisplayInfo(user).photo ? <img src={getUserDisplayInfo(user).photo} className="w-full h-full object-cover" /> : getUserDisplayInfo(user).name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 border-b border-[#222E35] pb-3 pt-1">
                          <h2 className="text-[#E9EDEF] text-[17px]">{getUserDisplayInfo(user).name}</h2>
                          <p className="text-sm text-[#8696A0] truncate">{user.bio || 'Hey there! I am using WaveChat.'}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchQuery ? (
                  <div className="text-center text-[#8696a0] mt-10">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <h1 className="text-[19px] font-semibold tracking-tight text-[#E9EDEF]">Calls</h1>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
               {callHistory.length === 0 ? (
                 <div className="flex-1 h-full flex flex-col items-center justify-center text-center mt-20">
                   <div className="w-20 h-20 bg-[#374045] rounded-full flex items-center justify-center mb-6">
                     <Phone size={32} className="text-[#00A884] opacity-80" />
                   </div>
                   <h2 className="text-xl font-light text-[#E9EDEF] mb-2">Keep in touch with your friends</h2>
                   <p className="text-[#8696A0] max-w-xs leading-relaxed">Start calling someone by selecting a contact. Group calls are also supported!</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <h2 className="text-[#00A884] text-[15px] font-medium px-2">Recent</h2>
                   {callHistory.map(call => (
                     <div key={call.id} className="flex items-center gap-4 p-2 hover:bg-[#202C33] rounded-lg cursor-pointer">
                       <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center text-[#E9EDEF] overflow-hidden">
                         {call.otherUser?.profilePhoto ? <img src={call.otherUser.profilePhoto} className="w-full h-full object-cover" /> : <UserIcon size={24} />}
                       </div>
                       <div className="flex-1">
                         <h3 className={`font-medium ${call.status === 'missed' && call.isIncoming ? 'text-red-500' : 'text-[#E9EDEF]'}`}>
                           {call.otherUser?.displayName || call.otherUser?.phoneNumber || 'Unknown'}
                         </h3>
                         <div className="flex items-center text-sm text-[#8696A0] gap-1">
                           {call.isIncoming ? (
                             <PhoneIncoming size={14} className={call.status === 'missed' ? 'text-red-500' : 'text-[#00A884]'} />
                           ) : (
                             <PhoneOutgoing size={14} className="text-[#00A884]" />
                           )}
                           <span>{new Date(call.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                         </div>
                       </div>
                       <div className="text-[#00A884]">
                         {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <h1 className="text-[19px] font-semibold tracking-tight text-[#E9EDEF]">Status</h1>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
              <div className="mb-6 bg-[#202C33] p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#2A3942] transition" onClick={() => setShowCreateStatus(true)}>
                <div className="relative">
                  <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center overflow-hidden">
                     {user?.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : ((user?.displayName || user?.username) ? (user.displayName || user.username)?.[0]?.toUpperCase() || "?" : <UserIcon size={24} className="text-[#AEBAC1]"/>)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#00A884] border-2 border-[#111B21] rounded-full flex items-center justify-center">
                    <Plus size={10} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[#E9EDEF] font-medium">My status</h3>
                  <p className="text-sm text-[#8696A0]">Click to add status update</p>
                </div>
              </div>
              
              <h4 className="text-[#00A884] text-xs font-semibold uppercase tracking-wider mb-4 px-2">Recent updates</h4>
              
              <div className="space-y-1">
                {statuses.length === 0 ? (
                  <p className="text-[#8696A0] text-sm px-2 italic">No updates right now</p>
                ) : (
                  statuses.map(s => {
                    const lastStatus = s.statuses[s.statuses.length - 1];
                    if (!lastStatus) return null;
                    return (
                    <div key={s.user.id} onClick={() => { setIsStatusOpen(true); setActiveStatusUser({ ...s, userName: s.user.id === user?.id ? 'You' : (s.user.displayName || s.user.username || 'Someone') }); }} className="flex items-center gap-4 p-2 hover:bg-[#202C33] rounded-lg cursor-pointer">
                      <div className="w-12 h-12 rounded-full border-2 border-[#00A884] p-0.5 shrink-0">
                         <div className="w-full h-full rounded-full bg-[#374045] flex items-center justify-center text-white overflow-hidden">
                            {lastStatus.type === 'text' ? <span className="text-xs">{lastStatus.content?.substring(0, 10)}</span> : <img src={lastStatus.content} className="w-full h-full object-cover" />}
                         </div>
                      </div>
                      <div>
                        <h3 className="text-[#E9EDEF] font-medium">{s.user.id === user?.id ? 'You' : (s.user.displayName || s.user.username || 'Someone')}</h3>
                        <p className="text-sm text-[#8696A0]">{new Date(lastStatus.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communities' && (
          <CommunityView token={token!} onOpenChat={(id) => {
            fetchChatMessages(id);
            setActiveTab('chats');
          }} />
        )}
        
        {activeTab === 'admin' && (
          <AdminView token={token!} currentUserId={user.id} savedContacts={savedContacts} />
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center text-[#E9EDEF]">
                <h1 className="text-[19px] font-semibold tracking-tight">Settings</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-8 cursor-pointer hover:bg-[#202C33] p-4 -mx-4 rounded-xl transition" onClick={() => setShowProfileModal(true)}>
                  <div className="w-16 h-16 bg-[#374045] rounded-full flex items-center justify-center text-[#E9EDEF] text-xl font-bold overflow-hidden shadow-lg">
                    {user?.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : ((user?.displayName || user?.username) ? (user.displayName || user.username)?.[0]?.toUpperCase() || "?" : <UserIcon size={32} className="text-[#AEBAC1]"/>)}
                  </div>
                  <div>
                    <h2 className="text-[#E9EDEF] text-xl mb-1">{user?.displayName || user?.username || 'Set Name'}</h2>
                    <p className="text-[#8696A0] text-sm">{user?.bio || 'Available'}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <div className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <UserIcon size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Account</div>
                  </div>
                  <div onClick={() => setActiveTab('settings-privacy')} className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <Lock size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Privacy</div>
                  </div>
                  <div onClick={() => setActiveTab('settings-chats')} className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <MessageCircle size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Chats</div>
                  </div>
                  <div className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <Bell size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Notifications</div>
                  </div>
                  <div onClick={() => setActiveTab('settings-blocked')} className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <Shield size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Blocked Contacts</div>
                  </div>
                  <div className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <HelpCircle size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Help</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings-privacy' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-4 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('settings')} className="hover:bg-[#374045] p-2 rounded-full transition"><ArrowLeft size={20} /></button>
                <h1 className="text-[19px] font-semibold tracking-tight">Privacy</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0 p-6 text-[#E9EDEF]">
              <div className="mb-6">
                <h3 className="text-[#00A884] text-sm font-semibold mb-4">Who can see my personal info</h3>
                
                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Last seen</p>
                  <select 
                    value={privacyLastSeen} 
                    onChange={(e) => setPrivacyLastSeen(e.target.value)}
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Profile Photo</p>
                  <select 
                    value={privacyProfilePhoto} 
                    onChange={(e) => setPrivacyProfilePhoto(e.target.value)}
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Status</p>
                  <select 
                    value={privacyStatus} 
                    onChange={(e) => setPrivacyStatus(e.target.value)}
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <button 
                  onClick={saveSettings}
                  className="mt-4 bg-[#00A884] text-[#111B21] px-4 py-2 rounded-lg font-semibold hover:bg-[#008f6f] transition"
                >
                  Save Privacy Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings-chats' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-4 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('settings')} className="hover:bg-[#374045] p-2 rounded-full transition"><ArrowLeft size={20} /></button>
                <h1 className="text-[19px] font-semibold tracking-tight">Chats</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0 p-6 text-[#E9EDEF]">
              <div className="mb-6">
                <h3 className="text-[#00A884] text-sm font-semibold mb-4">Display</h3>
                
                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Chat Wallpaper URL</p>
                  <input 
                    type="text"
                    value={wallpaper}
                    onChange={(e) => setWallpaper(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  />
                  <p className="text-xs text-[#8696A0] mt-2">Leave blank for default</p>
                </div>

                <button 
                  onClick={saveSettings}
                  className="mt-4 bg-[#00A884] text-[#111B21] px-4 py-2 rounded-lg font-semibold hover:bg-[#008f6f] transition"
                >
                  Save Chat Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings-blocked' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-4 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('settings')} className="hover:bg-[#374045] p-2 rounded-full transition"><ArrowLeft size={20} /></button>
                <h1 className="text-[19px] font-semibold tracking-tight">Blocked Contacts</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0 p-6 text-[#E9EDEF]">
              {blockedUsers.length === 0 ? (
                <p className="text-[#8696A0] text-center mt-10">No blocked contacts.</p>
              ) : (
                <div className="space-y-4">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-4 bg-[#202C33] p-4 rounded-xl">
                      <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center overflow-hidden">
                        {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover"/> : <UserIcon className="text-[#8696A0]"/>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#E9EDEF]">{u.displayName || u.username || u.phoneNumber}</p>
                      </div>
                      <button 
                        onClick={() => unblockUser(u.id)}
                        className="bg-[#374045] hover:bg-[#2A3942] px-4 py-2 rounded-lg text-[#00A884] font-medium transition"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'chats' && showArchived && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-6 text-[#E9EDEF]">
                <button onClick={() => setShowArchived(false)} className="hover:bg-[#374045] p-2 -ml-2 rounded-full transition">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-[19px] font-semibold tracking-tight">Archived</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 text-center">
                    <p className="text-sm text-[#8696A0] mb-4">These chats stay archived when you receive new messages. Tap to change.</p>
                </div>
                {chats.filter(c => c.isArchived).map(chat => (
                  <div 
                    key={chat.chatId} 
                    onClick={() => fetchChatMessages(chat.chatId)}
                    className={`group flex px-4 py-3 cursor-pointer ${activeChat?.chatId === chat.chatId ? 'bg-[#2A3942] border-l-4 border-[#00A884]' : 'hover:bg-[#202C33] border-l-4 border-transparent'}`}
                  >
                    <div className="relative w-12 h-12 shrink-0">
                      <div className="w-full h-full bg-[#374045] rounded-full overflow-hidden flex items-center justify-center font-semibold text-[#E9EDEF]">
                          {(!chat.isGroup && chat.otherUser) ? (getUserDisplayInfo(chat.otherUser).photo ? <img src={getUserDisplayInfo(chat.otherUser).photo} className="w-full h-full rounded-full object-cover" /> : (getUserDisplayInfo(chat.otherUser).name?.[0]?.toUpperCase() || "?")) : (chat.avatar ? <img src={chat.avatar} className="w-full h-full rounded-full object-cover" /> : (chat.name ? chat.name?.[0]?.toUpperCase() || "?" : <UserIcon size={24}/>))}
                      </div>
                      {chat.otherUser && chat.otherUser.isOnline && !blockedUsers.some(u => u.id === chat.otherUser?.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] border-2 border-[#111B21] rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden relative">
                      <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="font-semibold text-[15px] truncate text-[#E9EDEF] font-medium">{!chat.isGroup && chat.otherUser ? getUserDisplayInfo(chat.otherUser).name : (chat.name || 'Unknown')}</h3>
                        {chat.lastMessage && (
                          <span className={`text-[11px] font-medium ${activeChat?.chatId === chat.chatId ? 'text-[#00A884]' : 'text-[#8696A0]'}`}>
                            {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        {chat.otherUser && typingUsers[chat.otherUser.id] && !blockedUsers.some(u => u.id === chat.otherUser?.id) ? (
                          <p className="text-sm truncate text-[#00A884] font-medium">typing...</p>
                        ) : (
                          <p className={`text-[13px] truncate pr-16 ${activeChat?.chatId === chat.chatId ? 'text-[#E9EDEF] font-medium' : 'text-[#8696A0]'}`}>
                            {chat.lastMessage?.type === 'image' ? '📷 Photo' : chat.lastMessage?.type === 'audio' ? '🎤 Voice message' : (chat.lastMessage?.content || 'Started a chat')}
                          </p>
                        )}
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#202C33] via-[#202C33] to-transparent pl-4 pb-2 pt-2">
                        <button onClick={(e) => toggleArchiveChat(e, chat.chatId, chat.isArchived)} className="p-1.5 text-[#AEBAC1] hover:text-[#E9EDEF] rounded-full hover:bg-[#374045]" title="Unarchive chat">
                          <Archive size={14} className="fill-[#8696A0]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>

      {/* Chat Detail Main Column */}
      <main className={`flex-1 flex flex-col relative shadow-inner ${getWallpaperClass()} ${user?.wallpaper === 'light' ? 'text-gray-900' : ''}`}>
        {activeChat ? (
          <>
            <header className="h-[64px] bg-[#202c33] border-b border-[#222E35] flex items-center justify-between px-6 shrink-0 z-10">
              <div className="flex items-center cursor-pointer" onClick={() => setShowContactInfo(!showContactInfo)}>
                <div className="w-10 h-10 bg-[#374045] rounded-full flex items-center justify-center font-bold text-[#E9EDEF] mr-3 overflow-hidden">
                  {(!activeChat.isGroup && activeChat.otherUser) ? (getUserDisplayInfo(activeChat.otherUser).photo ? <img src={getUserDisplayInfo(activeChat.otherUser).photo} className="w-full h-full object-cover" /> : (getUserDisplayInfo(activeChat.otherUser).name?.[0]?.toUpperCase() || "?")) : (activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : (activeChat.name ? activeChat.name?.[0]?.toUpperCase() || "?" : <UserIcon size={20}/>))}
                </div>
                <div>
                  <h2 className="font-bold text-[15px] leading-tight">{!activeChat.isGroup && activeChat.otherUser ? getUserDisplayInfo(activeChat.otherUser).name : (activeChat.name || 'Unknown')}</h2>
                  {activeChat.otherUser && typingUsers[activeChat.otherUser.id] && !isBlockedByMe ? (
                    <span className="text-[11px] text-[#00A884] font-medium">typing...</span>
                  ) : (
                    <span className={`text-[11px] font-medium ${activeChat.isGroup || (activeChat.otherUser?.isOnline && !isBlockedByMe) ? 'text-[#00A884]' : 'text-[#8696a0]'}`}>
                      {activeChat.isGroup ? `${activeChat.description || 'Group'}` : (!activeChat.otherUser ? 'Message yourself' : (isBlockedByMe ? '' : (activeChat.otherUser.isOnline ? 'Online' : 'Offline')))}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-5 text-[#8696a0]">
                {isChatSearchOpen ? (
                  <div className="flex items-center space-x-2 bg-[#2A3942] px-3 py-1.5 rounded-full">
                    <input 
                      type="text" 
                      placeholder="Search messages..." 
                      className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none text-[#E9EDEF] text-[#E9EDEF] placeholder-[#8696A0]"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => { setIsChatSearchOpen(false); setChatSearchQuery(''); }} className="text-[#AEBAC1] hover:text-[#E9EDEF]">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button className="hover:text-[#E9EDEF]" onClick={() => setIsChatSearchOpen(true)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
                )}
                {!isBlockedByMe && (
                  <>
                    <button onClick={() => {
                      if (activeChat?.isGroup) {
                        setIsGroupCalling({ isVideo: true, chatName: activeChat.name || 'Group Call', chatId: activeChat.chatId });
                        socket?.emit('ring_group_call', { chatId: activeChat.chatId, isVideo: true });
                      } else if (activeChat?.otherUser) {
                        setIsCalling({ isVideo: true, name: activeChat.name || 'Unknown', targetUserId: activeChat.otherUser.id, chatId: activeChat.chatId });
                      } else {
                        toast.error("Can only call direct contacts");
                      }
                    }} className="hover:text-[#00A884] transition-colors"><Video size={20} /></button>
                    <button onClick={() => {
                      if (activeChat?.isGroup) {
                        setIsGroupCalling({ isVideo: false, chatName: activeChat.name || 'Group Call', chatId: activeChat.chatId });
                        socket?.emit('ring_group_call', { chatId: activeChat.chatId, isVideo: false });
                      } else if (activeChat?.otherUser) {
                        setIsCalling({ isVideo: false, name: activeChat.name || 'Unknown', targetUserId: activeChat.otherUser.id, chatId: activeChat.chatId });
                      } else {
                        toast.error("Can only call direct contacts");
                      }
                    }} className="hover:text-[#00A884] transition-colors"><Phone size={20} /></button>
                  </>
                )}
                <button onClick={(e) => { e.stopPropagation(); setShowChatMenu(!showChatMenu); }} className={`hover:text-[#E9EDEF] transition-colors relative z-20 ${showChatMenu ? 'bg-[#374045] rounded-full p-1 -m-1 text-[#E9EDEF]' : 'p-1 -m-1'}`}>
                  <MoreVertical size={20} />
                </button>
                {showChatMenu && (
                  <div className="absolute right-6 top-16 w-[220px] bg-[#233138] rounded-md shadow-lg py-2 z-50 text-[#E9EDEF] shadow-black/50 text-sm flex flex-col">
                    <button onClick={() => { setShowContactInfo(true); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Contact info</button>
                    <button onClick={() => { setIsChatSearchOpen(true); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Search</button>
                    <button onClick={() => { setIsSelectingMessages(!isSelectingMessages); setSelectedMessages([]); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">{isSelectingMessages ? 'Cancel selection' : 'Select messages'}</button>
                    <button onClick={() => { 
                      setMutedChats(prev => prev.includes(activeChat?.chatId) ? prev.filter(id => id !== activeChat?.chatId) : [...prev, activeChat?.chatId]); 
                      toast.success(mutedChats.includes(activeChat?.chatId) ? 'Chat unmuted' : 'Chat muted');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition flex justify-between items-center">{mutedChats.includes(activeChat?.chatId) ? 'Unmute notifications' : 'Mute notifications'}</button>
                    <button onClick={() => { 
                      setDisappearingChats(prev => prev.includes(activeChat?.chatId) ? prev.filter(id => id !== activeChat?.chatId) : [...prev, activeChat?.chatId]);
                      toast.success(disappearingChats.includes(activeChat?.chatId) ? 'Disappearing messages off' : 'Disappearing messages on (24 hours)');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">{disappearingChats.includes(activeChat?.chatId) ? 'Turn off disappearing messages' : 'Disappearing messages'}</button>
                    <button onClick={() => { 
                      setFavouriteChats(prev => prev.includes(activeChat?.chatId) ? prev.filter(id => id !== activeChat?.chatId) : [...prev, activeChat?.chatId]);
                      toast.success(favouriteChats.includes(activeChat?.chatId) ? 'Removed from favourites' : 'Added to favourites');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">{favouriteChats.includes(activeChat?.chatId) ? 'Remove from favourites' : 'Add to favourites'}</button>
                    <button onClick={() => { setActiveChat(null); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Close chat</button>
                    <button onClick={() => { navigator.clipboard.writeText(`https://wavechat.com/call/${activeChat?.chatId}`); toast.success('Call link copied'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Send call link</button>
                    <button onClick={() => { 
                      if (activeChat?.otherUser?.id) { blockUser(activeChat?.otherUser?.id); }
                      toast.success('Reported and blocked');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Report</button>
                    {!activeChat?.isGroup && (
                      <button onClick={() => { blockUser(activeChat?.otherUser?.id); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Block</button>
                    )}
                    <button onClick={() => { clearChatMessages(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Clear chat</button>
                    <button onClick={() => { deleteChat(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Delete chat</button>
                  </div>
                )}
              </div>
            </header>

            {/* Message Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-4 min-h-0" onScroll={handleScroll}>
              <div className="self-center bg-[#182229] text-[#ffd279] text-[11px] px-3 py-1.5 rounded-lg flex items-center shadow-sm max-w-sm text-center mb-2">
                <Lock size={12} className="mr-1.5 shrink-0 text-[#ffd279]" />
                <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
              </div>
              <div className="self-center bg-[#182229] text-[#8696A0] text-xs px-4 py-1.5 rounded-lg uppercase tracking-wider font-medium shadow-sm mb-4">
                Today
              </div>

              {messages.filter(m => !chatSearchQuery || (m.type === 'text' && m.content?.toLowerCase().includes(chatSearchQuery.toLowerCase()))).map((msg, idx) => {
                const isMe = msg.senderId === user.id;
                const repliedMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
                return (
                  <motion.div 
                    onClick={() => {
                      if (isSelectingMessages) {
                        setSelectedMessages(prev => prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]);
                      }
                    }}
                    key={msg.id || idx} 
                    className={`flex items-end max-w-[70%] relative group ${isMe ? 'self-end' : ''} ${isSelectingMessages ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ msg, x: e.clientX, y: e.clientY });
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(e, info) => {
                      if (info.offset.x > 50) setReplyingTo(msg);
                    }}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-700 mr-2 shrink-0">
                        {getUserDisplayInfo({ id: msg.senderId, displayName: msg.senderName, phoneNumber: msg.senderPhone }).name?.[0]?.toUpperCase() || "?" || 'U'}
                      </div>
                    )}
                    

                    <div className={`${isMe ? 'bg-[#00A884] text-[#E9EDEF] rounded-br-none shadow-md' : 'bg-[#202c33] text-[#e9edef] rounded-bl-none shadow-sm'} px-4 py-2 rounded-2xl relative`}>
                      {msg.isDeleted ? (
                        <p className="text-sm italic opacity-70 flex items-center"><CircleDashed size={14} className="mr-2" /> This message was deleted</p>
                      ) : (
                        <>
                          {!isMe && <p className="text-[11px] font-bold text-orange-600 mb-0.5">{getUserDisplayInfo({ id: msg.senderId, displayName: msg.senderName, phoneNumber: msg.senderPhone }).name || 'User'}</p>}
                          
                          {repliedMsg && (
                            <div className={`mb-2 p-2 rounded-lg text-sm border-l-4 ${isMe ? 'bg-black/10 border-white/50' : 'bg-[#2A3942] border-orange-500'}`}>
                              <p className={`font-semibold text-xs ${isMe ? 'text-white' : 'text-orange-600'}`}>{repliedMsg.senderId === user.id ? 'You' : (repliedMsg.sender?.name || 'User')}</p>
                              <p className="opacity-80 truncate text-xs flex items-center">
                                {repliedMsg.isDeleted ? (
                                  <><CircleDashed size={12} className="mr-1" /> Deleted message</>
                                ) : repliedMsg.type === 'image' ? (
                                  <><Image size={12} className="mr-1" /> Photo</>
                                ) : repliedMsg.type === 'audio' ? (
                                  <><Mic size={12} className="mr-1" /> Audio message</>
                                ) : (
                                  repliedMsg.content
                                )}
                              </p>
                            </div>
                          )}

                          {msg.type === 'image' ? (
                            <div className="mt-1 mb-1 max-w-xs sm:max-w-sm rounded-lg overflow-hidden">
                              <img src={msg.content} alt="Attachment" className="w-full h-auto object-cover" />
                            </div>
                          ) : msg.type === 'audio' ? (
                            <div className="mt-1 mb-1">
                              <CustomAudioPlayer src={msg.content} isMe={isMe} />
                            </div>
                          ) : msg.type === 'file' ? (
                            <div className={`mt-1 mb-1 rounded p-3 flex items-center space-x-3 ${isMe ? 'bg-black/10' : 'bg-[#2A3942]'}`}>
                              <Paperclip className="w-6 h-6 opacity-70" />
                              <a href={msg.content.startsWith('{') ? JSON.parse(msg.content).data : msg.content} download={msg.content.startsWith('{') ? JSON.parse(msg.content).name : 'file'} className="text-sm font-medium hover:underline">
                                {msg.content.startsWith('{') ? JSON.parse(msg.content).name : 'Download File'}
                              </a>
                            </div>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          <div className={`flex justify-end items-center mt-1 space-x-1`}>
                            <span className={`text-[10px] ${isMe ? 'text-white/80' : 'text-[#AEBAC1]'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span className={`w-3 h-3 ml-0.5 ${msg.isRead ? 'text-[#53bdeb]' : 'text-[#8696A0]'}`}>
                                {msg.isRead ? <CheckCheck size={14} /> : (msg.isDelivered ? <CheckCheck size={14} /> : <Check size={14} />)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                      
                      {/* Reaction */}
                      {msg.reaction && (
                        <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} bg-[#202c33] shadow-sm rounded-full px-1.5 py-0.5 text-xs border border-[#222E35]`}>
                          {msg.reaction}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              {activeChat && activeChat.otherUser && typingUsers[activeChat.otherUser.id] && (
                <div className="flex items-end max-w-[70%]">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-700 mr-2 shrink-0">
                    {activeChat.name ? activeChat.name?.[0]?.toUpperCase() || "?" : 'U'}
                  </div>
                  <div className="bg-[#202c33] text-[#e9edef] px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1">
                    <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Indicator */}
            {replyingTo && (
              <div className="bg-[#202C33] border-t border-[#222E35] p-3 px-6 flex items-center justify-between shrink-0 relative z-10">
                <div className="flex-1 border-l-4 border-[#00A884] pl-3">
                  <p className="text-sm font-semibold text-[#00A884]">{replyingTo.senderId === user.id ? 'You' : (replyingTo.sender?.name || 'User')}</p>
                  <p className="text-[13px] text-[#8696A0] truncate mt-0.5 flex items-center">
                    {replyingTo.isDeleted ? (
                      <><CircleDashed size={12} className="mr-1" /> Deleted message</>
                    ) : replyingTo.type === 'image' ? (
                      <><Image size={12} className="mr-1" /> Photo</>
                    ) : replyingTo.type === 'audio' ? (
                      <><Mic size={12} className="mr-1" /> Audio message</>
                    ) : (
                      replyingTo.content
                    )}
                  </p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-2 text-[#AEBAC1] hover:text-[#E9EDEF] rounded-full hover:bg-[#374045] transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
            
            {/* Edit Indicator */}
            {editingMessageId && (
              <div className="bg-[#2A3942] border-t border-[#374045] p-3 px-6 flex items-center justify-between shrink-0 relative z-10">
                <div className="flex-1 border-l-4 border-[#00A884] pl-3">
                  <p className="text-sm font-semibold text-[#00A884]">Editing Message</p>
                  <p className="text-[13px] text-[#8696A0] truncate mt-0.5">{messages.find(m => m.id === editingMessageId)?.content}</p>
                </div>
                <button onClick={() => { setEditingMessageId(null); setNewMessage(''); }} className="p-2 text-[#AEBAC1] hover:text-[#E9EDEF] rounded-full hover:bg-[#374045] transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <footer className="bg-[#202c33] p-4 flex items-center space-x-3 border-t border-[#222E35] relative">
              {(() => {
                if (isBlockedByMe) {
                  return (
                    <div className="flex-1 flex justify-center text-sm text-[#8696a0]">
                      <button onClick={() => unblockUser(activeChat.otherUser.id)} className="hover:underline text-[#00A884]">You blocked this contact. Tap to unblock.</button>
                    </div>
                  );
                }
                return (
                  <>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <EmojiPicker onEmojiClick={(emojiData) => {
                    setNewMessage(prev => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                  }} />
                </div>
              )}
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-[#AEBAC1] hover:text-[#00A884] transition-colors">
                <Smile className="w-6 h-6" />
              </button>
              <button type="button" onClick={() => {
                if (socket && activeChat) {
                  const randomGif = `https://media.giphy.com/media/3o7aD2saalEvp4yZsA/giphy.gif`; // simple dummy for MVP
                  socket.emit("send_message", {
                    chatId: activeChat.chatId,
                    content: randomGif,
                    type: 'image'
                  });
                }
              }} className="text-[#AEBAC1] hover:text-[#00A884] transition-colors font-bold text-[10px] bg-[#374045] rounded px-1.5 py-0.5">
                GIF
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#AEBAC1] hover:text-[#00A884] transition-colors">
                <Paperclip className="w-6 h-6" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden text-[#E9EDEF] placeholder-[#8696A0]" />
              {/* Reply Preview */}
              {replyingTo && (
                <div className="bg-[#202C33] border-t border-[#222E35] p-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0 border-l-4 border-[#00A884] pl-3">
                    <p className="text-sm font-semibold text-[#00A884] truncate">{replyingTo.sender?.name || 'User'}</p>
                    <p className="text-sm text-[#d1d7db] truncate flex items-center">
                      {replyingTo.isDeleted ? (
                        <><CircleDashed size={14} className="mr-1" /> Deleted message</>
                      ) : replyingTo.type === 'image' ? (
                        <><Image size={14} className="mr-1" /> Photo</>
                      ) : replyingTo.type === 'audio' ? (
                        <><Mic size={14} className="mr-1" /> Audio message</>
                      ) : (
                        replyingTo.content
                      )}
                    </p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 text-[#AEBAC1] hover:bg-[#374045] rounded-full ml-2">
                    <X size={16} />
                  </button>
                </div>
              )}
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between space-x-3 bg-[#202C33] rounded-full px-4 py-2">
                  <button onClick={cancelRecording} className="p-2 text-[#AEBAC1] hover:text-[#E9EDEF] transition-colors rounded-full hover:bg-[#374045]">
                    <Trash2 size={20} />
                  </button>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-2 text-[#E9EDEF]">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">{formatTime(recordingTime)}</span>
                    </div>
                  </div>
                  <button onClick={stopRecording} className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-[#E9EDEF] shadow-md transition-transform shrink-0 hover:scale-105">
                    <Send size={18} className="ml-0.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex-1 flex items-center space-x-3">
                  <div className="flex-1 bg-[#0B141A] rounded-xl flex items-center px-4 py-2">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message"
                      className="w-full bg-transparent border-none focus:ring-0 text-sm outline-none text-[#E9EDEF] placeholder-[#8696A0]"
                    />
                  </div>
                  {newMessage.trim() ? (
                    <button 
                      type="submit" 
                      className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-[#E9EDEF] shadow-md shadow-blue-500/30 active:scale-95 transition-transform shrink-0"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={startRecording}
                      className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-[#E9EDEF] shadow-md shadow-blue-500/30 active:scale-95 transition-transform shrink-0"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </>
                );
              })()}
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-[#202c33] shadow-sm rounded-full flex items-center justify-center mx-auto mb-6 text-[#00A884]">
              <MessageCircle size={48} />
            </div>
            <h2 className="text-2xl font-medium text-[#E9EDEF]">WaveChat for Web</h2>
            <p className="text-[#8696a0] mt-2 max-w-sm text-center">Send and receive messages without keeping your phone online.</p>
          </div>
        )}
      </main>
      {showContactInfo && activeChat && (
        <aside className="w-[350px] bg-[#111B21] border-l border-[#222E35] flex flex-col shrink-0">
          <header className="h-[64px] bg-[#202c33] border-b border-[#222E35] flex items-center px-4 shrink-0">
            <button onClick={() => setShowContactInfo(false)} className="mr-4 text-[#AEBAC1] hover:text-[#E9EDEF]">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
            </button>
            <h1 className="text-[16px] text-[#E9EDEF] font-medium">Contact info</h1>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            
            {/* Profile Section */}
            <div className="bg-[#111B21] flex flex-col items-center pt-8 pb-6 px-4 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)]">
              <div className="w-[200px] h-[200px] rounded-full overflow-hidden mb-6 bg-[#374045] flex items-center justify-center font-bold text-6xl text-[#E9EDEF]">
                {(!activeChat.isGroup && activeChat.otherUser) ? (getUserDisplayInfo(activeChat.otherUser).photo ? <img src={getUserDisplayInfo(activeChat.otherUser).photo} className="w-full h-full object-cover" /> : (getUserDisplayInfo(activeChat.otherUser).name?.[0]?.toUpperCase() || "?")) : (activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : (activeChat.name ? activeChat.name?.[0]?.toUpperCase() || "?" : <UserIcon size={100}/>))}
              </div>
              <h2 className="text-[24px] text-[#E9EDEF] font-normal text-center mb-1">{!activeChat.isGroup && activeChat.otherUser ? getUserDisplayInfo(activeChat.otherUser).name : (activeChat.name || 'Unknown')}</h2>
              {!activeChat.isGroup && activeChat.otherUser && !getUserDisplayInfo(activeChat.otherUser).isSaved && activeChat.otherUser.displayName && (
                <p className="text-[18px] text-[#8696a0] mb-1">~{activeChat.otherUser.displayName}</p>
              )}
              {!activeChat.isGroup && activeChat.otherUser && activeChat.otherUser.username && (
                <p className="text-[16px] text-[#8696a0]">
                  @{activeChat.otherUser.username}
                </p>
              )}
            </div>

            {/* About / Info Section */}
            {!activeChat.isGroup && activeChat.otherUser && (
              <div className="bg-[#111B21] py-4 px-8 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)] flex flex-col gap-4">
                {activeChat.otherUser.phoneNumber && (
                  <div>
                    <p className="text-[14px] text-[#8696a0] mb-1">Phone number</p>
                    <p className="text-[17px] text-[#E9EDEF]">{activeChat.otherUser.phoneNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-[14px] text-[#8696a0] mb-1">About</p>
                  <p className="text-[17px] text-[#E9EDEF]">{activeChat.otherUser.bio || 'Available'}</p>
                </div>
                {!getUserDisplayInfo(activeChat.otherUser).isSaved && (
                  <button onClick={() => {
                    setShowContactModal({ isOpen: true, contactId: activeChat.otherUser.id, defaultName: activeChat.otherUser.displayName || '', customName: activeChat.otherUser.displayName || '' });

                  }} className="mt-4 flex items-center justify-center gap-2 bg-[#202C33] hover:bg-[#374045] text-[#E9EDEF] py-2 px-4 rounded-lg transition font-medium">
                    <UserIcon size={18} /> Add to contacts
                  </button>
                )}
              </div>
            )}
            
            {activeChat.isGroup && (
              <div className="bg-[#111B21] py-4 px-8 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)]">
                <p className="text-[14px] text-[#8696a0] mb-1">Description</p>
                <p className="text-[17px] text-[#E9EDEF]">{activeChat.description || 'No description'}</p>
              </div>
            )}

            
            {/* Media/Links/Docs */}
            <div className="bg-[#111B21] py-4 px-8 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)] cursor-pointer transition-colors">
              <div className="flex justify-between items-center text-[#8696A0] mb-4 hover:text-[#E9EDEF]">
                <span className="text-[16px] text-[#E9EDEF]">Media, links and docs</span>
                <span className="flex items-center text-[14px]">
                  <span className="mr-1">14</span>
                  <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z"></path></svg>
                </span>
              </div>
              <div className="flex space-x-2 overflow-hidden">
                <div className="w-[88px] h-[88px] bg-[#202C33] rounded-lg shrink-0 flex items-center justify-center text-[#8696a0] text-xs p-2 text-center break-words overflow-hidden">Image upload...</div>
                <div className="w-[88px] h-[88px] bg-[#202C33] rounded-lg shrink-0 flex items-center justify-center text-[#8696a0] text-xs p-2 text-center break-words overflow-hidden">Toast notification...</div>
                <div className="w-[88px] h-[88px] bg-[#202C33] rounded-lg shrink-0 flex items-center justify-center text-[#8696a0] text-xs p-2 text-center break-words overflow-hidden">Advanced chat...</div>
              </div>
            </div>

            {/* Extra Options */}
            <div className="bg-[#111B21] py-2 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)]">
                <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors">
                    <svg className="text-[#8696A0] mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                    <span className="text-[16px] text-[#E9EDEF]">Starred messages</span>
                </div>
                <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors">
                    <svg className="text-[#8696A0] mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
                    <div className="flex flex-col">
                        <span className="text-[16px] text-[#E9EDEF]">Disappearing messages</span>
                        <span className="text-[14px] text-[#8696A0]">Off</span>
                    </div>
                </div>
                {!activeChat.isGroup && (
                    <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors">
                        <svg className="text-[#8696A0] mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path></svg>
                        <div className="flex flex-col">
                            <span className="text-[16px] text-[#E9EDEF]">Advanced chat privacy</span>
                            <span className="text-[14px] text-[#8696A0]">On</span>
                        </div>
                    </div>
                )}
                {!activeChat.isGroup && (
                    <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors">
                        <svg className="text-[#8696A0] mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path></svg>
                        <div className="flex flex-col">
                            <span className="text-[16px] text-[#E9EDEF]">Encryption</span>
                            <span className="text-[14px] text-[#8696A0]">Messages are end-to-end encrypted. Click to verify.</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Actions */}
            <div className="bg-[#111B21] py-2 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)]">
                <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors">
                    <svg className="text-[#8696A0] mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                    <span className="text-[16px] text-[#E9EDEF]">Add to favourites</span>
                </div>
                <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors">
                    <Archive className="text-[#8696A0] mr-4 shrink-0" size={20} />
                    <span className="text-[16px] text-[#E9EDEF]">Add to list</span>
                </div>
                <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors text-[#F15C6D]">
                    <svg className="mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"></path></svg>
                    <span className="text-[16px]">Clear chat</span>
                </div>
                <div className="px-8 py-4 flex items-center cursor-pointer hover:bg-[#202C33] transition-colors text-[#F15C6D]">
                    <svg className="mr-4 shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    <span className="text-[16px]">Delete chat</span>
                </div>
            </div>
          </div>
        </aside>
      )}

      
      {isGroupCalling && socket && (
        <GroupCallModal
          chatId={isGroupCalling.chatId}
          chatName={isGroupCalling.chatName}
          isVideo={isGroupCalling.isVideo}
          isIncoming={isGroupCalling.isIncoming}
          socket={socket}
          myId={user.id}
          onClose={() => setIsGroupCalling(null)}
        />
      )}

      {isCalling && socket && (
        <CallModal 
          isVideo={isCalling.isVideo} 
          contactName={isCalling.name} 
          onClose={() => setIsCalling(null)}
          socket={socket}
          isIncoming={isCalling.isIncoming}
          incomingOffer={isCalling.offer}
          targetUserId={isCalling.targetUserId}
          chatId={isCalling.chatId}
          initialCandidates={isCalling.candidates}
        />
      )}
      
      {isStatusOpen && activeStatusUser && (
        <StatusModal 
          userName={activeStatusUser.user.displayName || activeStatusUser.user.username}
          statuses={activeStatusUser.statuses.map((s: any) => ({
            type: s.type,
            content: s.content,
            bgColor: '#2563eb' // default fallback if needed
          }))}
          onClose={() => { setIsStatusOpen(false); setActiveStatusUser(null); }}
        />
      )}

      {showCreateStatus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#202c33] rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
            <header className="p-4 border-b border-[#222E35] flex justify-between items-center bg-[#202C33] shrink-0">
              <h2 className="font-semibold text-lg">Create Status</h2>
              <button onClick={() => { setShowCreateStatus(false); setStatusMediaPreview(null); setStatusType('text'); setNewStatusText(''); }} className="text-[#8696a0] hover:bg-[#374045] p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
                <button onClick={() => { setStatusType('text'); setStatusMediaPreview(null); }} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${statusType === 'text' ? 'bg-[#374045] text-[#E9EDEF]' : 'bg-[#2A3942] text-[#d1d7db]'}`}>Text</button>
                <button onClick={() => { setStatusType('image'); setNewStatusText(''); }} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${statusType === 'image' ? 'bg-[#374045] text-[#E9EDEF]' : 'bg-[#2A3942] text-[#d1d7db]'}`}>Image</button>
                <button onClick={() => { setStatusType('video'); setNewStatusText(''); }} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${statusType === 'video' ? 'bg-[#374045] text-[#E9EDEF]' : 'bg-[#2A3942] text-[#d1d7db]'}`}>Video</button>
                <button onClick={() => { setStatusType('link'); setStatusMediaPreview(null); }} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${statusType === 'link' ? 'bg-[#374045] text-[#E9EDEF]' : 'bg-[#2A3942] text-[#d1d7db]'}`}>Link</button>
              </div>

              {statusType === 'text' || statusType === 'link' ? (
                <textarea 
                  value={newStatusText}
                  onChange={e => setNewStatusText(e.target.value)}
                  placeholder={statusType === 'link' ? "Paste a URL here (http://...)" : "What's on your mind?"}
                  className="w-full h-32 p-4 text-lg border border-[#222E35] rounded-xl focus:ring-2 focus:ring-[#00A884] focus:outline-none resize-none shrink-0"
                />
              ) : (
                 <div className="border-2 border-dashed border-[#222E35] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#202C33] min-h-[200px]" onClick={() => statusFileInputRef.current?.click()}>
                    {statusMediaPreview ? (
                       statusType === 'image' ? (
                          <img src={statusMediaPreview} className="max-h-48 object-contain" />
                       ) : (
                          <video src={statusMediaPreview} className="max-h-48 object-contain" controls />
                       )
                    ) : (
                      <>
                        <Image className="w-10 h-10 text-[#AEBAC1] mb-2" />
                        <span className="text-sm text-[#8696a0]">Click to select {statusType}</span>
                      </>
                    )}
                 </div>
              )}
              <input type="file" className="hidden text-[#E9EDEF] placeholder-[#8696A0]" ref={statusFileInputRef} accept={statusType === 'image' ? 'image/*' : 'video/*'} onChange={handleStatusMediaSelect} />
            </div>
            <footer className="p-4 border-t border-[#222E35] flex justify-end shrink-0">
              <button 
                onClick={handleCreateStatus}
                disabled={statusType === 'text' || statusType === 'link' ? !newStatusText.trim() : !statusMediaPreview}
                className="px-6 py-2 bg-[#00A884] text-[#E9EDEF] rounded-lg font-medium hover:bg-[#06CF9C] disabled:opacity-50"
              >
                Post Status
              </button>
            </footer>
          </div>
        </div>
      )}

      {forwardingMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#202c33] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[#222E35] flex justify-between items-center bg-[#202C33]">
              <h3 className="font-bold text-[#e9edef]">Forward Message</h3>
              <button onClick={() => setForwardingMessage(null)} className="text-[#AEBAC1] hover:text-[#E9EDEF]">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
              {chats.map(chat => (
                <div 
                  key={chat.chatId} 
                  className="flex items-center space-x-3 p-3 hover:bg-[#202C33] rounded-lg cursor-pointer"
                  onClick={() => {
                    socket?.emit("send_message", {
                      chatId: chat.chatId,
                      content: forwardingMessage.content,
                      type: forwardingMessage.type
                    });
                    toast.success('Message forwarded');
                    setForwardingMessage(null);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-[#E9EDEF] font-bold overflow-hidden">
                          {(!chat.isGroup && chat.otherUser) ? (getUserDisplayInfo(chat.otherUser).photo ? <img src={getUserDisplayInfo(chat.otherUser).photo} className="w-full h-full rounded-full object-cover" /> : (getUserDisplayInfo(chat.otherUser).name?.[0]?.toUpperCase() || "?")) : (chat.avatar ? <img src={chat.avatar} className="w-full h-full rounded-full object-cover" /> : (chat.name ? chat.name?.[0]?.toUpperCase() || "?" : <UserIcon size={24}/>))}
                  </div>
                  <div className="flex-1 font-medium">{chat.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111B21] w-full max-w-md rounded-2xl shadow-xl flex flex-col border border-[#222E35]">
            <header className="px-6 py-4 border-b border-[#222E35] flex items-center justify-between">
              <h2 className="text-[#E9EDEF] text-xl font-medium">Edit Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-[#8696A0] hover:text-[#E9EDEF]">
                <X size={24} />
              </button>
            </header>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full bg-[#202C33] flex items-center justify-center text-4xl text-[#E9EDEF] overflow-hidden group cursor-pointer border-4 border-[#2A3942] hover:border-[#00A884] transition">
                  {profileForm.profilePhoto ? <img src={profileForm.profilePhoto} className="w-full h-full object-cover" /> : (user?.displayName || user?.username)?.[0]?.toUpperCase()}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                      <Camera size={32} className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm({ ...profileForm, profilePhoto: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-[#00A884] text-sm font-semibold mb-2 block">Your name</label>
                <div className="flex items-center gap-4">
                   <UserIcon size={24} className="text-[#8696A0] shrink-0" />
                   <input type="text" className="w-full bg-transparent border-b-2 border-[#202C33] focus:border-[#00A884] text-[#E9EDEF] py-2 outline-none transition" value={profileForm.displayName} placeholder="Enter your name" onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-[#00A884] text-sm font-semibold mb-2 block">About</label>
                <div className="flex items-center gap-4">
                   <Info size={24} className="text-[#8696A0] shrink-0" />
                   <input type="text" className="w-full bg-transparent border-b-2 border-[#202C33] focus:border-[#00A884] text-[#E9EDEF] py-2 outline-none transition" value={profileForm.bio} placeholder="Available" onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} />
                </div>
              </div>
              
              <button onClick={handleSaveProfile} className="mt-4 bg-[#00A884] hover:bg-[#029676] text-[#111B21] font-medium py-3 rounded-xl transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}



      {showContactModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111B21] w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-[#222E35]">
            <header className="px-6 py-4 border-b border-[#222E35] flex items-center justify-between">
              <h2 className="text-[#E9EDEF] text-xl font-medium">Add Contact</h2>
              <button onClick={() => setShowContactModal({ ...showContactModal, isOpen: false })} className="text-[#8696A0] hover:text-[#E9EDEF]">
                <X size={24} />
              </button>
            </header>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[#00A884] text-sm font-semibold mb-2 block">Name</label>
                <div className="flex items-center gap-4">
                   <UserIcon size={24} className="text-[#8696A0] shrink-0" />
                   <input type="text" className="w-full bg-transparent border-b-2 border-[#202C33] focus:border-[#00A884] text-[#E9EDEF] py-2 outline-none transition" value={showContactModal.customName} placeholder="Contact name" onChange={(e) => setShowContactModal({ ...showContactModal, customName: e.target.value })} autoFocus />
                </div>
              </div>
              
              <button onClick={() => {
                if (showContactModal.customName.trim()) {
                  saveContact(showContactModal.contactId, showContactModal.customName.trim());
                  setShowContactModal({ ...showContactModal, isOpen: false });
                }
              }} className="mt-2 bg-[#00A884] hover:bg-[#029676] text-[#111B21] font-medium py-3 rounded-xl transition">
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[999] bg-[#233138] shadow-xl rounded-lg py-2 w-56 text-[#d1d7db] font-medium"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 350), left: Math.min(contextMenu.x, window.innerWidth - 250) }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reaction Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#222E35] mb-2 bg-[#233138]">
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
              <button
                key={emoji}
                className="text-xl hover:scale-125 transition-transform"
                onClick={() => {
                  socket?.emit('react_message', { messageId: contextMenu.msg.id, chatId: activeChat.chatId, reaction: emoji });
                  setContextMenu(null);
                }}
              >
                {emoji}
              </button>
            ))}
            <button className="text-xl hover:scale-125 transition-transform text-[#AEBAC1]">+</button>
          </div>
          
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { setContextMenu(null); }}>
             <Info size={18} className="text-[#8696A0]" /> <span>Message info</span>
          </button>
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { setReplyingTo(contextMenu.msg); setContextMenu(null); }}>
             <Reply size={18} className="text-[#8696A0]" /> <span>Reply</span>
          </button>
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { navigator.clipboard.writeText(contextMenu.msg.content || ''); setContextMenu(null); }}>
             <Copy size={18} className="text-[#8696A0]" /> <span>Copy</span>
          </button>
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { setContextMenu(null); }}>
             <SmilePlus size={18} className="text-[#8696A0]" /> <span>React</span>
          </button>
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { setForwardingMessage(contextMenu.msg); setContextMenu(null); }}>
             <Forward size={18} className="text-[#8696A0]" /> <span>Forward</span>
          </button>
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { setContextMenu(null); }}>
             <Pin size={18} className="text-[#8696A0]" /> <span>Pin</span>
          </button>
          <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px]" onClick={() => { setContextMenu(null); }}>
             <Star size={18} className="text-[#8696A0]" /> <span>Star</span>
          </button>
          {contextMenu.msg.senderId === user?.id && (
            <button className="w-full text-left px-5 py-2.5 hover:bg-[#182229] flex items-center gap-4 transition-colors text-[14px] text-red-500" onClick={() => { 
                socket?.emit('delete_message', { messageId: contextMenu.msg.id, chatId: activeChat.chatId });
                setContextMenu(null); 
            }}>
               <Trash2 size={18} className="text-red-500" /> <span>Delete</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
