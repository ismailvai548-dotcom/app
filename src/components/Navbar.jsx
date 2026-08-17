import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, X, CheckCheck } from 'lucide-react';

const LOGO_URL = "https://scontent.fdac187-1.fna.fbcdn.net/v/t39.30808-6/692755251_122100948116427781_1170834940136221199_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=110&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeGceUB9_pdehCXLr7mK_tY5_O022SYVJPv87TbZJhUk-1O1RvKQHMGSjHEu3d62MlHk7icjP8WLIcpxNF_4wV7M&_nc_ohc=mQDUKKlKEj8Q7kNvwEGXwK_&_nc_oc=AdqTaZqWvvVy4BRGjxhvz0mkcgqYSTLHbrANFIDYQm6cBXb9Be0mZDpoDEIRpv-zOh4&_nc_zt=23&_nc_ht=scontent.fdac187-1.fna&_nc_gid=HI85E_vJBrnBw589SnHESg&_nc_ss=7b2a8&oh=00_Af6Y7W26FQLxq6ix0ugZ4TgMVYuMhPxR6wEvdhZC8BMxuQ&oe=6A078473";
const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function Navbar({ currentUser, notifications = [], showNotifications, setShowNotifications, markAllNotificationsRead }) {
  const navigate = useNavigate();
  const notifRef = useRef(null);

  // বাইরে ক্লিক করলে নোটিফিকেশন মডাল বন্ধ হবে
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, setShowNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 py-3 border-b border-gray-100/90 shadow-xs" style={kalpurushStyle}>
      <div className="max-w-[700px] mx-auto flex items-center justify-between">
        
        {/* লোগো ও বুক ফেয়ার */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src={LOGO_URL} 
            alt="Book Fair Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100" 
          />
          <div>
            <h1 className="text-xl font-black text-[#1e1b4b] leading-tight tracking-tight font-sans">Book Fair</h1>
            <p className="text-[11px] text-gray-400 font-bold -mt-0.5">পড়ি, শিখি, কথা বলি</p>
          </div>
        </div>

        {/* সার্চ, নোটিফিকেশন ও প্রোফাইল */}
        <div className="flex items-center gap-2 relative" ref={notifRef}>
          <button 
            onClick={() => navigate('/search')}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
          >
            <Search size={20} strokeWidth={2.2} />
          </button>
          
          {/* নোটিফিকেশন বাটন */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 relative transition-colors cursor-pointer"
          >
            <Bell size={20} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* কার্যকরী নোটিফিকেশন ড্রপডাউন */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-[24px] shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b font-black flex justify-between items-center bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black">নোটিফিকেশন</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} নতুন
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsRead}
                      className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={14} /> পড়া হয়েছে
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/60 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div 
                      key={n.id || i} 
                      className={`p-3.5 hover:bg-gray-50/80 cursor-pointer flex gap-3 items-center transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-xs">
                        {n.sender_name?.[0] || 'U'}
                      </div>
                      <div className="text-xs flex-1">
                        <p className="font-medium text-gray-800 leading-snug">
                          <span className="font-black text-gray-900">{n.sender_name || 'ইউজার'}</span> {n.type === 'like' ? 'আপনার পোস্টে পছন্দ জানিয়েছেন।' : 'আপনার পোস্টে একটি মন্তব্য করেছেন।'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">এইমাত্র</p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs space-y-1">
                    <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                    <p>কোনো নোটিফিকেশন নেই</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* প্রোফাইল বাটন */}
          <button 
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-700 font-black text-xs ml-1 shadow-xs cursor-pointer"
          >
            {currentUser?.user_metadata?.avatar_url ? (
              <img src={currentUser.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <span>{currentUser?.user_metadata?.full_name?.[0] || 'U'}</span>
            )}
          </button>
        </div>

      </div>
    </nav>
  );
}