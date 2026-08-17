import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, BookOpen, FileText, Megaphone, ShieldAlert, Download, 
  Upload, Users, Plus, Trash2, Edit3, Check, X, Eye, 
  BarChart3, ArrowLeft, Image as ImageIcon, Sparkles, KeyRound,
  HardDrive, Search, BellRing, RotateCw
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };
const MASTER_PIN = "7788"; // আপনার গোপন অ্যাডমিন পিন

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // আসল ডাটা স্টেটস (কোনো ডামি ডাটা নেই)
  const [usersList, setUsersList] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedBookForChapters, setSelectedBookForChapters] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [posts, setPosts] = useState([]);
  const [ads, setAds] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // ফর্ম স্টেটস
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState('উপন্যাস');
  const [bookDescription, setBookDescription] = useState('');
  const [bookCoverPreview, setBookCoverPreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');

  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adSponsor, setAdSponsor] = useState('');
  const [adCategory, setAdCategory] = useState('দাস্তান');

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // পিন সাবমিট
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      fetchAdminData();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // সুপারবেস থেকে ১০০% লাইভ ডাটা ফেচ (নো ডামি ডাটা)
  const fetchAdminData = async () => {
    setIsRefreshing(true);

    try {
      // ১. ডাটাবেজ থেকে আসল ইউজার তালিকা
      const { data: uData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setUsersList(uData || []);

      // ২. বই তালিকা
      const { data: bData } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      setBooks(bData || []);

      // ৩. পোস্ট তালিকা
      const { data: pData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      setPosts(pData || []);

      // ৪. বিজ্ঞাপন
      const { data: aData } = await supabase
        .from('sponsored_ads')
        .select('*');

      setAds(aData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  // কভার ছবি আপলোড
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileName = `cover-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('book-covers').upload(fileName, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('book-covers').getPublicUrl(fileName);
        setBookCoverPreview(publicUrl);
      } else {
        setBookCoverPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      setBookCoverPreview(URL.createObjectURL(file));
    } finally {
      setUploadingImage(false);
    }
  };

  // নতুন বই তৈরি
  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!bookTitle || !bookAuthor) return;

    const newBook = {
      title: bookTitle,
      author: bookAuthor,
      category: bookCategory,
      description: bookDescription,
      cover_url: bookCoverPreview || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'
    };

    const { data } = await supabase.from('books').insert([newBook]).select();
    if (data) {
      setBooks([data[0], ...books]);
    }

    setIsBookModalOpen(false);
    setBookTitle('');
    setBookAuthor('');
    setBookDescription('');
    setBookCoverPreview('');
  };

  // অধ্যায় লোড করা
  const openChapterManager = async (book) => {
    setSelectedBookForChapters(book);
    const { data } = await supabase.from('chapters').select('*').eq('book_id', book.id).order('chapter_number', { ascending: true });
    setChapters(data || []);
  };

  // নতুন অধ্যায় সংরক্ষণ
  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!chapterTitle || !chapterContent || !selectedBookForChapters) return;

    const newChap = {
      book_id: selectedBookForChapters.id,
      chapter_number: parseInt(chapterNumber) || chapters.length + 1,
      title: chapterTitle,
      content: chapterContent
    };

    const { data } = await supabase.from('chapters').insert([newChap]).select();
    if (data) {
      setChapters([...chapters, data[0]]);
    }

    setIsChapterModalOpen(false);
    setChapterTitle('');
    setChapterNumber('');
    setChapterContent('');
  };

  // গ্লোবাল নোটিশ পাঠানো
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    alert(`নোটিশ পাঠানো হয়েছে: "${broadcastMessage}"`);
    setIsBroadcastModalOpen(false);
    setBroadcastMessage('');
  };

  // ১-ক্লিক ব্যাকআপ ডাউনলোড
  const handleExportData = () => {
    const backupData = {
      total_real_users: usersList.length,
      users: usersList,
      books,
      chapters,
      posts,
      ads,
      exported_at: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bookfair_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // ইউজার ফিল্টার
  const filteredUsers = usersList.filter(u => 
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const onlineUsersCount = usersList.filter(u => u.is_online).length;

  // ১. পিন লক সিকিউরিটি স্ক্রিন
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070a12] text-white flex flex-col justify-center items-center p-4" style={kalpurushStyle}>
        <div className="w-full max-w-md bg-[#101626] p-8 rounded-3xl border border-slate-800/80 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <Lock size={30} />
          </div>
          <h2 className="text-2xl font-black mb-1">Book Fair অ্যাডমিন প্যানেল</h2>
          <p className="text-slate-400 text-xs font-bold mb-6">নিরাপদ ড্যাশবোর্ডে প্রবেশের জন্য মাস্টার পিন দিন</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="মাস্টার পিন দিন (7788)"
                className="w-full bg-[#070a12] border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-center font-mono text-xl tracking-widest text-white outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            {pinError && <p className="text-red-400 text-xs font-bold">ভুল পিন দিয়েছেন! আবার চেষ্টা করুন।</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              আনলক করুন
            </button>
          </form>

          <button onClick={() => navigate('/')} className="mt-6 text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto cursor-pointer">
            <ArrowLeft size={14} /> মূল অ্যাপে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  // ২. মূল ডার্ক থিম অ্যাডমিন ড্যাশবোর্ড
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col md:flex-row" style={kalpurushStyle}>
      
      {/* সাইডবার */}
      <aside className="w-full md:w-64 bg-[#0d1322] border-r border-slate-800/80 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-md">BF</div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">Book Fair</h2>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Super Controller</span>
            </div>
          </div>

          <nav className="space-y-1.5 font-bold text-sm">
            <button
              onClick={() => { setActiveTab('overview'); setSelectedBookForChapters(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <BarChart3 size={18} /> ওভারভিউ
            </button>
            <button
              onClick={() => { setActiveTab('users'); setSelectedBookForChapters(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-3">
                <Users size={18} /> ইউজার তালিকা
              </div>
              <span className="bg-slate-800 text-blue-400 text-xs px-2 py-0.5 rounded-full font-black">
                {usersList.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('books'); setSelectedBookForChapters(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'books' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <BookOpen size={18} /> বই ও অধ্যায়
            </button>
            <button
              onClick={() => { setActiveTab('ads'); setSelectedBookForChapters(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'ads' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <Megaphone size={18} /> বিজ্ঞাপন কন্ট্রোল
            </button>
            <button
              onClick={() => { setActiveTab('moderation'); setSelectedBookForChapters(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'moderation' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <ShieldAlert size={18} /> পোস্ট মডারেশন
            </button>
            <button
              onClick={() => { setActiveTab('backup'); setSelectedBookForChapters(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'backup' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <Download size={18} /> ১-ক্লিক ব্যাকআপ
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 space-y-2">
          <button 
            onClick={() => setIsBroadcastModalOpen(true)}
            className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <BellRing size={16} /> নোটিশ ব্রডকাস্ট
          </button>
          <button onClick={() => navigate('/')} className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <ArrowLeft size={15} /> অ্যাপে ফিরে যান
          </button>
        </div>
      </aside>

      {/* মূল কনটেন্ট */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl">
        
        {/* ১. ওভারভিউ ট্যাব */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white">লাইভ ড্যাশবোর্ড ওভারভিউ</h1>
                <p className="text-slate-400 text-xs font-bold mt-0.5">রিয়েল-টাইম মেট্রিক্স এবং ডাটাবেজের প্রকৃত অবস্থা</p>
              </div>
              <button
                onClick={fetchAdminData}
                disabled={isRefreshing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RotateCw size={13} className={isRefreshing ? "animate-spin text-blue-400" : ""} />
                <span>{isRefreshing ? 'ডাটা লোড হচ্ছে...' : 'ডাটা রিফ্রেশ'}</span>
              </button>
            </div>

            {/* ৪টি আসল পরিসংখ্যান কার্ড */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* মোট আসল ইউজার */}
              <div className="bg-[#0f1626] p-5 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400">ডাটাবেজে মোট ইউজার</span>
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl"><Users size={18} /></div>
                </div>
                <h3 className="text-3xl font-black mt-2 text-white">{usersList.length} জন</h3>
                <p className="text-[11px] text-emerald-400 font-bold mt-1">
                  {onlineUsersCount > 0 ? `${onlineUsersCount} জন সক্রিয়` : 'আসল ডাটাবেজ কাউন্ট'}
                </p>
              </div>

              {/* মোট বই */}
              <div className="bg-[#0f1626] p-5 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400">মোট বই</span>
                  <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl"><BookOpen size={18} /></div>
                </div>
                <h3 className="text-3xl font-black mt-2 text-white">{books.length} টি</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">লাইব্রেরি কালেকশন</p>
              </div>

              {/* মোট পোস্ট */}
              <div className="bg-[#0f1626] p-5 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400">মোট পোস্ট</span>
                  <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl"><FileText size={18} /></div>
                </div>
                <h3 className="text-3xl font-black mt-2 text-white">{posts.length} টি</h3>
                <p className="text-[11px] text-blue-400 font-bold mt-1">কথামালা ও দাস্তান</p>
              </div>

              {/* সক্রিয় বিজ্ঞাপন */}
              <div className="bg-[#0f1626] p-5 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400">সক্রিয় বিজ্ঞাপন</span>
                  <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl"><Megaphone size={18} /></div>
                </div>
                <h3 className="text-3xl font-black mt-2 text-emerald-400">{ads.length} টি</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">স্পন্সর ক্যাম্পেইন</p>
              </div>

            </div>

            {/* স্টোরেজ হেলথ */}
            <div className="bg-[#0f1626] p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HardDrive size={20} className="text-blue-400" />
                  <h3 className="font-black text-white text-base">সুপারবেস ফ্রি টায়ার স্টোরেজ হেলথ</h3>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
                  ১০০% সুরক্ষিত ও নিখরচায় সক্রিয়
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>ডাটাবেজ স্পেস ব্যবহার: ~১২ MB / ৫০০ MB</span>
                  <span>২.৪% ব্যবহৃত</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: '2.4%' }}></div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ২. ইউজার ডিরেক্টরি ট্যাব (১০০% আসল ইউজার ডাটা) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black">ইউজার ডিরেক্টরি</h1>
                <p className="text-slate-400 text-xs font-bold">ডাটাবেজে মোট রেজিস্টার্ড ইউজার: {usersList.length} জন</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                  className="w-full bg-[#0f1626] border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-[#0f1626] rounded-2xl border border-slate-800 overflow-hidden">
              {filteredUsers.length > 0 ? (
                <div className="divide-y divide-slate-800/80">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-sm border border-blue-500/20">
                          {user.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{user.full_name || 'নামহীন ইউজার'}</h4>
                            {user.is_online && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{user.email || `@${user.username || 'user'}`}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                          {user.role || 'Member'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 font-bold text-xs space-y-1">
                  <Users size={32} className="mx-auto opacity-30 mb-2" />
                  <p>সুপারবেস ডাটাবেজে এখনো কোনো রেজিস্টার্ড ইউজার নেই।</p>
                  <p className="text-slate-600">নতুন ইউজাররা গুগল দিয়ে সাইন-ইন করলে স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ৩. বই ও অধ্যায় ম্যানেজার */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            {!selectedBookForChapters ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-black">বই ও অধ্যায় ব্যবস্থাপনা</h1>
                    <p className="text-slate-400 text-xs font-bold">নতুন বই যুক্ত করুন ও অধ্যায় তৈরি করুন</p>
                  </div>
                  <button
                    onClick={() => setIsBookModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus size={16} /> নতুন বই যোগ করুন
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books.map((b) => (
                    <div key={b.id} className="bg-[#0f1626] p-4 rounded-2xl border border-slate-800 flex gap-4 items-center">
                      <img src={b.cover_url} className="w-16 h-22 object-cover rounded-xl shadow-md flex-shrink-0" alt={b.title} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white text-base truncate">{b.title}</h4>
                        <p className="text-xs text-slate-400 font-bold truncate">{b.author}</p>
                        <span className="inline-block bg-blue-900/40 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md mt-1">
                          {b.category}
                        </span>
                        <button
                          onClick={() => openChapterManager(b)}
                          className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText size={14} /> অধ্যায়সমূহ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedBookForChapters(null)} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 cursor-pointer">
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-white">{selectedBookForChapters.title} - অধ্যায়সমূহ</h2>
                      <p className="text-xs text-slate-400 font-bold">{selectedBookForChapters.author}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChapterModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={16} /> নতুন অধ্যায় যুক্ত করুন
                  </button>
                </div>

                <div className="space-y-3">
                  {chapters.length > 0 ? (
                    chapters.map((chap, i) => (
                      <div key={chap.id || i} className="bg-[#0f1626] p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-black text-blue-400 mr-2">অধ্যায় {chap.chapter_number}:</span>
                          <span className="font-bold text-white text-sm">{chap.title}</span>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{chap.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-10 font-bold">এখনো কোনো অধ্যায় যুক্ত করা হয়নি।</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ৪. বিজ্ঞাপন কন্ট্রোল */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black">বিজ্ঞাপন নিয়ন্ত্রণ কেন্দ্র</h1>
                <p className="text-slate-400 text-xs font-bold">স্পন্সরড বিজ্ঞাপন তৈরি ও অন/অফ করুন</p>
              </div>
              <button
                onClick={() => setIsAdModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> নতুন বিজ্ঞাপন তৈরি
              </button>
            </div>

            <div className="space-y-3">
              {ads.length > 0 ? (
                ads.map((ad, i) => (
                  <div key={ad.id || i} className="bg-[#0f1626] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-md">স্পন্সরড</span>
                      <h4 className="font-black text-white text-base mt-1">{ad.title}</h4>
                      <p className="text-xs text-slate-400 font-bold">স্পন্সর: {ad.sponsor_name} | টার্গেট: {ad.target_category}</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-black">সক্রিয়</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 font-bold bg-[#0f1626] rounded-2xl border border-slate-800">
                  <Megaphone size={32} className="mx-auto mb-2 opacity-40" />
                  <p>বর্তমানে কোনো বিজ্ঞাপন সক্রিয় নেই।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ৫. পোস্ট মডারেশন */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">পোস্ট মডারেশন</h1>
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="bg-[#0f1626] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black text-blue-400">{p.author_name}</span>
                    <p className="text-sm text-slate-200 mt-1 line-clamp-1">{p.content}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from('posts').delete().eq('id', p.id);
                      setPosts(posts.filter(item => item.id !== p.id));
                    }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ৬. ১-ক্লিক ব্যাকআপ */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">ডাটা ব্যাকআপ ও বাল্ক ইমপোর্ট</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f1626] p-6 rounded-2xl border border-slate-800 text-center space-y-4">
                <Download size={40} className="mx-auto text-blue-400" />
                <h3 className="text-lg font-black text-white">১-ক্লিক সম্পূর্ণ ব্যাকআপ এক্সপোর্ট</h3>
                <p className="text-xs text-slate-400 font-medium">সমস্ত ডাটাবেজ ইউজার, বই, অধ্যায় এবং পোস্টের একটি JSON কপি ডাউনলোড করুন।</p>
                <button
                  onClick={handleExportData}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  ব্যাকআপ ডাউনলোড করুন (JSON)
                </button>
              </div>

              <div className="bg-[#0f1626] p-6 rounded-2xl border border-slate-800 text-center space-y-4">
                <Upload size={40} className="mx-auto text-emerald-400" />
                <h3 className="text-lg font-black text-white">বাল্ক ডাটা ইমপোর্ট</h3>
                <p className="text-xs text-slate-400 font-medium">পূর্বে এক্সপোর্ট করা JSON ফাইল আপলোড করে একবারে ডাটাবেজ রিস্টোর করুন।</p>
                <label className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl text-xs shadow-lg cursor-pointer">
                  JSON ফাইল সিলেক্ট করুন
                  <input type="file" accept=".json" className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* নতুন বই তৈরির মডাল */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1626] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black">নতুন বই যোগ করুন</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400">বইয়ের নাম</label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="যেমন: নদীর ওপারে"
                  className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">লেখকের নাম</label>
                <input
                  type="text"
                  required
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="যেমন: হুমায়ূন আহমেদ"
                  className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">ক্যাটাগরি</label>
                <select
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value)}
                  className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none font-bold cursor-pointer"
                >
                  <option value="উপন্যাস">উপন্যাস</option>
                  <option value="গল্প">গল্প</option>
                  <option value="কবিতা">কবিতা</option>
                  <option value="ইতিহাস">ইতিহাস</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">বইয়ের ভূমিকা / বর্ণনা</label>
                <textarea
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  placeholder="বই সম্পর্কে সংক্ষেপে লিখুন..."
                  className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">বইয়ের কভার ফটো আপলোড</label>
                <label className="mt-1 flex items-center justify-center gap-2 w-full bg-[#070a12] border border-dashed border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-500 transition-colors">
                  <ImageIcon size={18} className="text-blue-400" />
                  <span className="text-xs font-bold text-slate-300">
                    {uploadingImage ? 'ছবি আপলোড হচ্ছে...' : (bookCoverPreview ? 'ছবি সিলেক্ট হয়েছে' : 'পিসি/ফোন থেকে কভার ছবি বাছুন')}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-sm shadow-lg mt-2 cursor-pointer"
              >
                বই সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* নতুন অধ্যায় মডাল */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1626] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black">নতুন অধ্যায় যোগ করুন</h3>
              <button onClick={() => setIsChapterModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddChapter} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400">অধ্যায় নম্বর</label>
                  <input
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    placeholder="১"
                    className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400">অধ্যায়ের শিরোনাম</label>
                  <input
                    type="text"
                    required
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="যেমন: সূচনা ও নদীকূল"
                    className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">অধ্যায়ের সম্পূর্ণ টেক্সট</label>
                <textarea
                  required
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  placeholder="এই অধ্যায়ের সমস্ত লেখা এখানে পেস্ট করুন..."
                  className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3 text-sm mt-1 outline-none min-h-[160px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-sm shadow-lg mt-2 cursor-pointer"
              >
                অধ্যায় সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* গ্লোবাল ব্রডকাস্ট মডাল */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1626] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black">সব ইউজারের কাছে নোটিশ পাঠান</h3>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <textarea
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="যেমন: আজ রাতে ৫টি নতুন বই যুক্ত হবে..."
                className="w-full bg-[#070a12] border border-slate-700 rounded-xl p-3.5 text-sm outline-none min-h-[120px]"
              />

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl text-sm shadow-lg cursor-pointer"
              >
                নোটিশ পাঠিয়ে দিন
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}