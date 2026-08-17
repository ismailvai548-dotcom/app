import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  BookOpen, Quote, PenTool, MessageSquare, Grid, Plus, Bookmark, 
  ChevronRight, X, Loader2, ArrowDown, Sparkles 
} from 'lucide-react';
import PostCard from '../../components/PostCard';
import { 
  getRecommendedPosts, 
  recordInteraction, 
  syncUserPreferencesFromCloud 
} from '../../services/recommendationEngine';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function FeedPage({ currentUser, posts, newPostText, setNewPostText, handlePublish, refreshPosts, isLoading }) {
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('সব');
  const [postCategory, setPostCategory] = useState('কথামালা');

  // পেজ লোড হলে ইউজারের ক্লাউড পয়েন্ট সিঙ্ক করা
  useEffect(() => {
    if (currentUser) {
      syncUserPreferencesFromCloud(currentUser);
    }
  }, [currentUser]);

  // পুল-টু-রিফ্রেশ স্টেট
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartRef.current;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.45, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(55);
      if (refreshPosts) await refreshPosts();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 600);
    } else {
      setPullDistance(0);
    }
  };

  const categories = [
    { id: 'বই', label: 'বই', icon: BookOpen, bg: 'bg-[#f3e8ff]', text: 'text-[#7e22ce]' },
    { id: 'কথামালা', label: 'কথামালা', icon: Quote, bg: 'bg-[#ccfbf1]', text: 'text-[#0f766e]' },
    { id: 'দাস্তান', label: 'দাস্তান', icon: PenTool, bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]' },
    { id: 'বৈঠকখানা', label: 'বৈঠকখানা', icon: MessageSquare, bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' },
    { id: 'আরও', label: 'আরও', icon: Grid, bg: 'bg-[#f1f5f9]', text: 'text-[#475569]' },
  ];

  const recommendedBooks = [
    { title: 'মেঘের পরে রোদ', author: 'তাসলিমা নাসরিন', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80' },
    { title: 'দুঃখের দিন শেষ', author: 'হুমায়ূন আহমেদ', cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80' },
    { title: 'কাকাবাবু', author: 'সুনীল গঙ্গোপাধ্যায়', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80' },
    { title: 'পথের পাঁচালী', author: 'বিভূতিভূষণ বন্দ্যোপাধ্যায়', cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80' },
    { title: 'অপুর সংসার', author: 'বিভূতিভূষণ', cover: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80' },
  ];

  const defaultPosts = [
    {
      id: 'mock-1',
      author_name: 'সায়মা ইসলাম',
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      category: 'কথামালা',
      content: 'কিছু মানুষ চলে যায়, কিন্তু তাদের রেখে যাওয়া কথাগুলো থেকে যায় সারাজীবন। #কথামালা #অভিজ্ঞতা',
      likes_count: 245,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'mock-2',
      author_name: 'রাকিব হাসান',
      author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      category: 'কথামালা',
      content: 'বই পড়া মানে অন্য কারো জীবনের ভেতর দিয়ে নিজের জীবনকে খুঁজে পাওয়া। #বই #পড়ালেখা',
      likes_count: 198,
      created_at: new Date(Date.now() - 10800000).toISOString()
    },
    {
      id: 'mock-3',
      author_name: 'আরিফা জাহান',
      author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      category: 'দাস্তান',
      content: 'সেদিন বিকেলটা অন্যরকম ছিল। আকাশে মেঘ ছিল না, তবু মনে হচ্ছিল বৃষ্টি হবে। বারান্দায় দাঁড়িয়ে চায়ের কাপে চুমুক দিতেই পুরনো স্মৃতিগুলো ভিড় করে এলো...',
      likes_count: 312,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const allDisplayPosts = posts && posts.length > 0 ? posts : defaultPosts;

  // অ্যালগরিদম দিয়ে পোস্টগুলোকে সাজানো
  const algorithmicPosts = useMemo(() => {
    return getRecommendedPosts(allDisplayPosts);
  }, [allDisplayPosts]);

  // ফিল্টার করা পোস্ট
  const filteredPosts = algorithmicPosts.filter((p) => {
    if (activeTab === 'সব') return true;
    return p.category === activeTab;
  });

  // ক্যাটাগরিতে ক্লিক করলে পয়েন্ট ট্র্যাকিং
  const handleCategoryClick = (catId) => {
    recordInteraction(catId, 'view', currentUser);
    setActiveTab(catId === 'বই' || catId === 'বৈঠকখানা' || catId === 'আরও' ? 'সব' : catId);
  };

  return (
    <div 
      className="space-y-6 pb-28 pt-1" 
      style={kalpurushStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* পুল-টু-রিফ্রেশ ইন্ডিকেটর */}
      <div 
        className="flex justify-center items-center overflow-hidden transition-all duration-200 -mb-3"
        style={{ 
          height: `${pullDistance}px`, 
          opacity: pullDistance > 10 ? 1 : 0 
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-[#1e1b4b]">
          {isRefreshing ? (
            <Loader2 size={20} className="animate-spin text-blue-600" />
          ) : (
            <ArrowDown 
              size={18} 
              className="transition-transform duration-200 text-gray-600"
              style={{ transform: `rotate(${Math.min(pullDistance * 4, 180)}deg)` }} 
            />
          )}
        </div>
      </div>

      {/* ১. আজ কী পড়বেন বা লিখবেন? ইনপুট বার */}
      <div 
        onClick={() => setIsWriteModalOpen(true)}
        className="bg-white rounded-[24px] p-3.5 pl-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-gray-200 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e1b4b] text-white flex items-center justify-center shadow-sm">
            <PenTool size={16} />
          </div>
          <span className="text-gray-400 font-medium text-[15px]">আজ কী পড়বেন বা লিখবেন?</span>
        </div>
        <button className="w-9 h-9 rounded-full bg-[#1e1b4b] text-white flex items-center justify-center shadow-md active:scale-95 cursor-pointer">
          <Plus size={20} />
        </button>
      </div>

      {/* ২. ক্যাটাগরি বাটনসমূহ */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-sm whitespace-nowrap transition-all shadow-xs active:scale-95 cursor-pointer ${cat.bg} ${cat.text}`}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ৩. চালিয়ে যান */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-lg font-black text-[#1e1b4b]">চালিয়ে যান</h2>
          <button className="text-xs font-black text-gray-400 hover:text-gray-600 cursor-pointer">সব দেখুন</button>
        </div>

        <div className="bg-white rounded-[28px] p-4 border border-gray-100 shadow-sm flex gap-4 items-center relative overflow-hidden">
          <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0 relative">
            <img 
              src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80" 
              className="w-full h-full object-cover" 
              alt="নদীর ওপারে" 
            />
            <div className="absolute inset-0 bg-black/35 flex flex-col justify-end p-2 text-white">
              <p className="text-[11px] font-black leading-tight">নদীর ওপারে</p>
              <p className="text-[9px] opacity-80">হুমায়ূন আহমেদ</p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">নদীর ওপারে</h3>
                <p className="text-xs font-bold text-gray-400 mt-0.5">হুমায়ূন আহমেদ</p>
              </div>
              <Bookmark size={18} className="text-gray-400 cursor-pointer hover:text-blue-600" />
            </div>

            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#1e1b4b] h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
              <p className="text-[11px] font-bold text-gray-400 mt-1.5">৪২% পড়া হয়েছে</p>
            </div>

            <button 
              onClick={() => recordInteraction('বই', 'view', currentUser)}
              className="mt-3 bg-[#1e1b4b] text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>পড়া চালিয়ে যান</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ৪. আপনার জন্য */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-black text-[#1e1b4b]">আপনার জন্য</h2>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <button className="text-xs font-black text-gray-400 hover:text-gray-600 cursor-pointer">সব দেখুন</button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {recommendedBooks.map((book, i) => (
            <div 
              key={i} 
              onClick={() => recordInteraction('বই', 'view', currentUser)}
              className="min-w-[120px] max-w-[120px] cursor-pointer group"
            >
              <div className="h-40 rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                <img src={book.cover} className="w-full h-full object-cover" alt={book.title} />
              </div>
              <h4 className="font-black text-sm text-gray-900 mt-2 truncate">{book.title}</h4>
              <p className="text-[11px] font-bold text-gray-400 truncate">{book.author}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ৫. সব | কথামালা | দাস্তান ফিল্টার ট্যাবস */}
      <div>
        <div className="flex gap-6 border-b border-gray-100 pb-2 mb-4 font-black text-base px-1">
          <button 
            onClick={() => setActiveTab('সব')}
            className={`cursor-pointer transition-all ${activeTab === 'সব' ? 'text-[#1e1b4b] border-b-2 border-[#1e1b4b] pb-2' : 'text-gray-400 hover:text-gray-600'}`}
          >
            সব
          </button>
          <button 
            onClick={() => { setActiveTab('কথামালা'); recordInteraction('কথামালা', 'view', currentUser); }}
            className={`cursor-pointer transition-all ${activeTab === 'কথামালা' ? 'text-[#1e1b4b] border-b-2 border-[#1e1b4b] pb-2' : 'text-gray-400 hover:text-gray-600'}`}
          >
            কথামালা
          </button>
          <button 
            onClick={() => { setActiveTab('দাস্তান'); recordInteraction('দাস্তান', 'view', currentUser); }}
            className={`cursor-pointer transition-all ${activeTab === 'দাস্তান' ? 'text-[#1e1b4b] border-b-2 border-[#1e1b4b] pb-2' : 'text-gray-400 hover:text-gray-600'}`}
          >
            দাস্তান
          </button>
        </div>

        {/* পোস্ট তালিকা */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser} 
              refreshPosts={refreshPosts} 
            />
          ))}
        </div>
      </div>

      {/* নতুন পোস্ট মডাল ডায়ালগ */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-[500px] shadow-2xl border border-gray-100 relative">
            <button 
              onClick={() => setIsWriteModalOpen(false)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-black text-gray-900 mb-4">আজ কী লিখবেন?</h3>
            
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="আপনার সাহিত্যিক ভাবনা, উক্তি বা গল্পের অংশ লিখুন..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-medium text-[16px] outline-none min-h-[140px]"
            />

            <div className="flex justify-between items-center mt-4">
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="bg-gray-100 px-4 py-2 rounded-full font-bold text-sm outline-none text-gray-700 cursor-pointer border border-gray-200"
              >
                <option value="কথামালা">কথামালা ✍️</option>
                <option value="দাস্তান">দাস্তান 📜</option>
              </select>

              <button 
                onClick={() => { 
                  handlePublish && handlePublish(postCategory); 
                  setIsWriteModalOpen(false); 
                }}
                className="bg-[#1e1b4b] text-white px-7 py-2.5 rounded-full font-black text-sm shadow-md active:scale-95 cursor-pointer"
              >
                পোস্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}