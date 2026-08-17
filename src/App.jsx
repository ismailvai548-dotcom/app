import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import FeedPage from './pages/Home/FeedPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ChatList from './pages/Boithok/ChatList';
import ChatArea from './pages/Boithok/ChatArea';
import SearchPage from './pages/Search/SearchPage';
import LibraryPage from './pages/Library/LibraryPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { supabase } from './services/supabaseClient';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [currentUser, setCurrentUser] = useState({
    id: 'guest_user_123',
    user_metadata: {
      full_name: 'গেস্ট ইউজার',
      avatar_url: '',
      username: 'guest',
      bio: 'Book Fair এ আপনাকে স্বাগতম'
    }
  });

  const [posts, setPosts] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, sender_name: 'সায়মা ইসলাম', type: 'like', is_read: false, created_at: new Date().toISOString() },
    { id: 2, sender_name: 'রাকিব হাসান', type: 'comment', is_read: false, created_at: new Date().toISOString() }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const fetchData = async () => {
    const { data: p } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (p && p.length > 0) setPosts(p);
    const { data: prof } = await supabase.from('profiles').select('*');
    if (prof && prof.length > 0) setAllProfiles(prof);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handlePublish = async (cat = 'কথামালা') => {
    if (!newPostText.trim()) return;
    const newPostObj = {
      author_id: currentUser.id,
      author_name: currentUser.user_metadata.full_name,
      author_avatar: currentUser.user_metadata.avatar_url,
      content: newPostText,
      category: cat,
      likes_count: 0,
    };
    await supabase.from('posts').insert([newPostObj]);
    setPosts(prev => [newPostObj, ...prev]);
    setNewPostText('');
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900" style={kalpurushStyle}>
      
      {/* গ্লোবাল লোডিং বার */}
      {isPageLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-[100] animate-pulse"></div>
      )}

      {/* অ্যাডমিন পেজে থাকলে মূল অ্যাপের হেডার ও ফুটার লুকানো থাকবে */}
      {!isAdminRoute && (
        <Navbar
          currentUser={currentUser}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          markAllNotificationsRead={markAllNotificationsRead}
        />
      )}

      <main className={isAdminRoute ? "w-full" : "max-w-[700px] mx-auto p-4 md:p-6"}>
        <Routes>
          <Route
            path="/"
            element={
              <FeedPage
                currentUser={currentUser}
                posts={posts}
                newPostText={newPostText}
                setNewPostText={setNewPostText}
                handlePublish={handlePublish}
                refreshPosts={fetchData}
                isLoading={isPageLoading}
              />
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/boithok" element={<ChatList currentUser={currentUser} allProfiles={allProfiles} />} />
          <Route path="/chat/:userId" element={<ChatArea currentUser={currentUser} allProfiles={allProfiles} />} />
          <Route path="/search" element={<SearchPage allProfiles={allProfiles} currentUser={currentUser} />} />
          <Route path="/books" element={<LibraryPage />} />
          <Route
            path="/profile"
            element={<ProfilePage currentUser={currentUser} posts={posts} refreshPosts={fetchData} />}
          />
        </Routes>
      </main>

      {!isAdminRoute && <BottomNav />}
    </div>
  );
}