import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Edit2, LogOut, Bookmark, X, Share2, MoreVertical, 
  ArrowLeft, MapPin, Calendar, Globe, Heart, MessageSquare, 
  Eye, Trash2, PenTool, Users, Loader2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import PostCard from '../../components/PostCard';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

// আপেক্ষিক সময় বাংলায় ফরম্যাট
const formatTimeAgo = (d) => {
  if (!d) return "এইমাত্র";
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মি. আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return `${Math.floor(diff / 604800)} সপ্তাহ আগে`;
};

// সুপাবেস থেকে প্রাপ্ত ইউজারের আসল রেজিস্ট্রেশন/জয়েনিং তারিখ বাংলায় রিয়েল-টাইম ফরম্যাটিং
const formatRealtimeJoinDate = (dateStr) => {
  if (!dateStr) return "১৩ জানুয়ারি ২০২৩";
  try {
    const d = new Date(dateStr);
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const toBnNum = (n) => String(n).replace(/\d/g, (num) => "০১২৩৪৫৬৭৮৯"[num]);
    const day = toBnNum(d.getDate());
    const month = monthsBn[d.getMonth()];
    const year = toBnNum(d.getFullYear());
    return `${day} ${month} ${year}`;
  } catch (e) {
    return "১৩ জানুয়ারি ২০২৩";
  }
};

export default function ProfilePage({ currentUser, posts = [], refreshUser, refreshPosts }) {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState('written'); // 'written', 'saved', 'favorites', 'relations'
  const [writtenFilter, setWrittenFilter] = useState('all'); // 'all', 'kothamala', 'dastan'

  // ডাটা স্টেটস
  const [profileData, setProfileData] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [mutualRelations, setMutualRelations] = useState([]);
  const [stats, setStats] = useState({ kothamala: 0, dastan: 0, followers: 0, following: 0 });
  
  // লোডিং স্টেটস
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // মেনু ও মডাল স্টেটস
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // এডিট ফর্ম স্টেটস
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  const avatarInput = useRef(null);
  const coverInput = useRef(null);

  // ইউজারের আসল তথ্য Supabase Profile ও Auth Metadata থেকে রিড করা
  const displayName = profileData?.full_name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'গেস্ট ইউজার';
  const displayTagline = profileData?.tagline || currentUser?.user_metadata?.tagline || 'পাঠক • লেখক';
  const displayBio = profileData?.bio || currentUser?.user_metadata?.bio || '';
  const displayLocation = profileData?.location || currentUser?.user_metadata?.location || 'ঢাকা, বাংলাদেশ';
  const displayWebsite = profileData?.website || currentUser?.user_metadata?.website || 'rifathwrites.com';
  const displayAvatar = profileData?.avatar_url || currentUser?.user_metadata?.avatar_url || '';
  const displayCover = profileData?.cover_url || currentUser?.user_metadata?.cover_url || '';
  const realJoinDate = profileData?.created_at || currentUser?.created_at;

  // ইউজারের নিজস্ব পোস্টসমূহ
  const myPosts = useMemo(() => {
    return posts.filter((p) => p.author_id === currentUser?.id);
  }, [posts, currentUser?.id]);

  const myKothamala = useMemo(() => {
    return myPosts.filter((p) => p.category === 'কথামালা');
  }, [myPosts]);

  const myDastan = useMemo(() => {
    return myPosts.filter((p) => p.category === 'দাস্তান');
  }, [myPosts]);

  // ফিল্টার ও ক্রমানুসারে সাজানো পোস্ট তালিকা (সর্বশেষ পোস্টটি উপরে)
  const sortedAndFilteredMyPosts = useMemo(() => {
    const sorted = [...myPosts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (writtenFilter === 'kothamala') {
      return sorted.filter((p) => p.category === 'কথামালা');
    }
    if (writtenFilter === 'dastan') {
      return sorted.filter((p) => p.category === 'দাস্তান');
    }
    return sorted;
  }, [myPosts, writtenFilter]);

  useEffect(() => {
    if (currentUser) {
      setEditName(displayName);
      setEditTagline(displayTagline);
      setEditBio(displayBio);
      setEditLocation(displayLocation);
      setEditWebsite(displayWebsite);
      fetchProfileData();
    }
  }, [currentUser, posts]);

  // Supabase থেকে রিয়েল-টাইম প্রোফাইল ডাটা ও পরিসংখ্যান ফেচ করা
  const fetchProfileData = async () => {
    if (!currentUser?.id) return;

    try {
      // ১. profiles টেবিল থেকে তথ্য
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (prof) {
        setProfileData(prof);
        setEditName(prof.full_name || currentUser.user_metadata?.full_name || '');
        setEditTagline(prof.tagline || currentUser.user_metadata?.tagline || '');
        setEditBio(prof.bio || currentUser.user_metadata?.bio || '');
        setEditLocation(prof.location || currentUser.user_metadata?.location || '');
        setEditWebsite(prof.website || currentUser.user_metadata?.website || '');
      }

      // ২. অনুসারী (Followers) কাউন্ট
      const { count: fers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);

      // ৩. অনুসরণ (Following) কাউন্ট
      const { count: fing } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id);

      // ৪. প্রকৃত সংখ্যা আপডেট
      setStats({
        kothamala: myKothamala.length,
        dastan: myDastan.length,
        followers: fers || 0,
        following: fing || 0
      });

      // ৫. সেভ করা পোস্ট
      const { data: savedData } = await supabase.from('saved_posts').select('post_id').eq('user_id', currentUser.id);
      if (savedData && savedData.length > 0) {
        const ids = savedData.map(s => s.post_id);
        const { data: pSaved } = await supabase.from('posts').select('*').in('id', ids).order('created_at', { ascending: false });
        setSavedPosts(pSaved || []);
      } else {
        setSavedPosts([]);
      }

      // ৬. প্রিয় পোস্ট
      const { data: likedData } = await supabase.from('likes').select('post_id').eq('user_id', currentUser.id);
      if (likedData && likedData.length > 0) {
        const ids = likedData.map(l => l.post_id);
        const { data: pLiked } = await supabase.from('posts').select('*').in('id', ids).order('created_at', { ascending: false });
        setFavoritePosts(pLiked || []);
      } else {
        setFavoritePosts([]);
      }

      // ৭. পারস্পরিক সম্পর্ক (Mutuals)
      const { data: myFollowings } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
      const { data: myFollowers } = await supabase.from('follows').select('follower_id').eq('following_id', currentUser.id);

      if (myFollowings && myFollowers) {
        const followingIds = myFollowings.map(f => f.following_id);
        const followerIds = myFollowers.map(f => f.follower_id);
        const mutualIds = followingIds.filter(id => followerIds.includes(id));

        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await supabase.from('profiles').select('*').in('id', mutualIds);
          setMutualRelations(mutualProfiles || []);
        } else {
          setMutualRelations([]);
        }
      }

    } catch (err) {
      console.error("Profile data fetch error:", err);
    }
  };

  // রিয়েল-টাইম ছবি আপলোড হ্যান্ডলার (কভার ও প্রোফাইল ছবি)
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !currentUser?.id) return;

    if (type === 'avatar') setIsUploadingAvatar(true);
    if (type === 'cover') setIsUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${type}-${Date.now()}.${fileExt}`;

      // সুপাবেস স্টোরেজের 'avatars' বাকেটে আপলোড
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`ছবি আপলোড ব্যর্থ হয়েছে: ${uploadError.message}। দয়া করে সুপাবেসের 'avatars' বাকেটটি Public করা আছে কিনা নিশ্চিত করুন।`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // ১. Auth Metadata আপডেট
      await supabase.auth.updateUser({ data: { [`${type}_url`]: publicUrl } });

      // ২. profiles টেবিল আপডেট
      await supabase.from('profiles').upsert({ id: currentUser.id, [`${type}_url`]: publicUrl });

      // ৩. পোস্ট ও কমেন্টসের ছবির ইউআরএল আপডেট
      if (type === 'avatar') {
        await supabase.from('posts').update({ author_avatar: publicUrl }).eq('author_id', currentUser.id);
        await supabase.from('comments').update({ author_avatar: publicUrl }).eq('user_id', currentUser.id);
      }

      // ৪. স্টেট আপডেট
      setProfileData(prev => ({ ...(prev || {}), [`${type}_url`]: publicUrl }));
      fetchProfileData();
      if (refreshUser) refreshUser();
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error("Upload exception:", err);
      alert("ছবি আপলোড করার সময় একটি ত্রুটি ঘটেছে।");
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      if (type === 'cover') setIsUploadingCover(false);
    }
  };

  // প্রোফাইল এডিট ও রিয়েল-টাইম সংরক্ষণ হ্যান্ডলার
  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);

    try {
      const updatedMetadata = {
        full_name: editName.trim(),
        tagline: editTagline.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim()
      };

      // ১. Supabase Auth ইউজার মেটাডাটা আপডেট
      await supabase.auth.updateUser({ data: updatedMetadata });

      // ২. Supabase profiles ডাটাবেজ টেবিল আপডেট
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        ...updatedMetadata
      });

      // ৩. আগের সব পোস্ট ও কমেন্টে নতুন নাম সিঙ্ক
      await supabase.from('posts').update({ author_name: editName.trim() }).eq('author_id', currentUser.id);
      await supabase.from('comments').update({ author_name: editName.trim() }).eq('user_id', currentUser.id);

      // ৪. লোকাল স্টেটে তাৎক্ষণিক প্রতিফলন
      setProfileData(prev => ({ ...(prev || {}), ...updatedMetadata }));

      setIsEditModalOpen(false);
      fetchProfileData();
      if (refreshUser) refreshUser();
      if (refreshPosts) refreshPosts();
    } catch (error) {
      console.error("Save profile error:", error);
      alert("তথ্য সংরক্ষণে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  // প্রোফাইল লিঙ্ক শেয়ার
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile`;
    navigator.clipboard.writeText(profileUrl);
    alert("প্রোফাইলের লিঙ্ক কপি হয়েছে!");
  };

  // পোস্ট ডিলিট
  const handleDeleteMyPost = async (postId) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই পোস্টটি মুছে ফেলতে চান?")) {
      await supabase.from('posts').delete().eq('id', postId);
      fetchProfileData();
      if (refreshPosts) refreshPosts();
    }
  };

  // সংখ্যা সুন্দর ফরম্যাট
  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num || 0;
  };

  return (
    <div className="max-w-[500px] sm:max-w-[600px] mx-auto pb-28 pt-2 px-3 text-slate-900 bg-[#FAF9F6] min-h-screen" style={kalpurushStyle}>
      
      {/* মূল প্রোফাইল কন্টেইনার (ফিড স্টাইলের ক্রিস্প হোয়াইট কার্ড) */}
      <div className="bg-white rounded-3xl overflow-hidden relative shadow-sm border border-slate-100">
        
        {/* ১. কভার ফটো সেকশন */}
        <div className="h-48 sm:h-54 relative overflow-hidden bg-gradient-to-r from-slate-100 via-[#f3ede4] to-slate-100 group">
          {displayCover ? (
            <img src={displayCover} className="w-full h-full object-cover" alt="cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#f6f2ec] via-[#ede5d8] to-[#f8f5ee] flex flex-col items-center justify-center p-6 text-center text-slate-800 relative pb-10">
              <div className="space-y-1">
                <p className="font-black text-base sm:text-lg tracking-wide italic leading-snug text-slate-900">
                  কলমই আমার সাথি,
                </p>
                <p className="font-black text-base sm:text-lg tracking-wide italic leading-snug text-slate-900">
                  কাগজ আমার ঠিকানা।
                </p>
              </div>

              {/* ক্যালিগ্রাফি অর্নামেন্টাল ডিভাইডার */}
              <div className="flex items-center justify-center gap-2 mt-2.5 opacity-60">
                <span className="w-8 sm:w-10 h-[1px] bg-slate-700"></span>
                <span className="text-xs text-slate-700">❦</span>
                <span className="w-8 sm:w-10 h-[1px] bg-slate-700"></span>
              </div>
            </div>
          )}

          {/* কভার আপলোডিং স্পিনার */}
          {isUploadingCover && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2 z-30">
              <Loader2 className="animate-spin" size={20} />
              <span>কভার আপলোড হচ্ছে...</span>
            </div>
          )}

          {/* টপ বার নেভিগেশন ও অ্যাকশন বাটনসমূহ */}
          <div className="absolute top-3.5 left-3.5 z-20">
            <button 
              onClick={() => navigate(-1)} 
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-20">
            <button 
              onClick={() => coverInput.current.click()}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
              title="কভার ছবি আপলোড"
            >
              <Camera size={15} />
            </button>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
              title="প্রোফাইল এডিট"
            >
              <PenTool size={15} />
            </button>

            <button 
              onClick={handleShareProfile}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
              title="শেয়ার করুন"
            >
              <Share2 size={15} />
            </button>

            {/* থ্রি-ডট ড্রপডাউন মেনু */}
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
              >
                <MoreVertical size={16} />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-slate-800 text-xs font-bold animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => { coverInput.current.click(); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Camera size={15} /> কভার পরিবর্তন
                  </button>
                  <button 
                    onClick={() => { setIsEditModalOpen(true); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 size={15} /> প্রোফাইল এডিট
                  </button>
                  <button 
                    onClick={() => { supabase.auth.signOut(); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={15} /> লগআউট করুন
                  </button>
                </div>
              )}
            </div>
          </div>

          <input type="file" ref={coverInput} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>

        {/* ২. প্রোফাইল বডি সেকশন (বড় মাপের প্রোফাইল পিকচার, ডিপ শ্যাডো ও বোল্ড নাম) */}
        <div className="px-5 pt-0 pb-4 bg-white relative">
          
          {/* প্রোফাইল ছবি ও নাম সেকশন (উপরে নিখুঁত পজিশনিং ও সুন্দর শ্যাডো) */}
          <div className="flex flex-row items-center gap-4 -mt-12 sm:-mt-14 mb-4">
            
            {/* অ্যাভাটার (বড় মাপ, প্রিমিয়াম শ্যাডো ও ফটো আপলোড সুবিধা) */}
            <div className="relative group flex-shrink-0">
              <div
                className="w-22 h-22 sm:w-26 sm:h-26 bg-[#181a30] p-1 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer relative flex items-center justify-center"
                onClick={() => avatarInput.current.click()}
                title="প্রোফাইল ছবি পরিবর্তন করুন"
              >
                {displayAvatar ? (
                  <img src={displayAvatar} className="w-full h-full object-cover rounded-full" alt="avatar" />
                ) : (
                  <div className="w-full h-full bg-[#181a30] flex items-center justify-center text-3xl sm:text-4xl font-black text-white rounded-full">
                    {displayName?.[0] || 'গ'}
                  </div>
                )}
                
                {/* আপলোড হোভার / লোডার */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-full">
                  {isUploadingAvatar ? (
                    <Loader2 className="animate-spin text-white" size={20} />
                  ) : (
                    <Camera className="text-white" size={20} />
                  )}
                </div>
              </div>

              {/* কলম আইকন ব্যাজ */}
              <div 
                className="w-7 h-7 rounded-full bg-[#181a30] text-white flex items-center justify-center border-2 border-white absolute bottom-0.5 right-0.5 shadow-md cursor-pointer hover:scale-105 transition-all"
                onClick={() => avatarInput.current.click()}
              >
                <Camera size={12} />
              </div>

              <input type="file" ref={avatarInput} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
            </div>

            {/* ইউজার নাম (বোল্ড, গাঢ় ও সুস্পষ্ট) ও ট্যাগলাইন */}
            <div className="min-w-0 flex-1 pt-8 sm:pt-9">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight truncate">
                {displayName}
              </h2>
              
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-slate-600 bg-slate-100/90 px-3 py-0.5 rounded-full border border-slate-200/60">
                  {displayTagline}
                </span>
              </div>
            </div>
          </div>

          {/* ৩. ৪টি স্ট্যাটস কাউন্টার (ফিড কালার পিলস, হাই-কনট্রাস্ট ও বোল্ড ডাটা) */}
          <div className="grid grid-cols-4 gap-2 my-4 font-black text-center">
            
            {/* কথামালা */}
            <div className="bg-[#f0fdfa] border border-[#bbf7d0] p-2.5 rounded-2xl shadow-2xs text-center flex flex-col items-center justify-center">
              <p className="text-lg sm:text-xl font-black text-[#0f766e] leading-none">
                {formatNumber(stats.kothamala)}
              </p>
              <span className="text-[11px] sm:text-xs text-[#0f766e] font-extrabold mt-1">কথামালা</span>
            </div>
            
            {/* দাস্তান */}
            <div className="bg-[#fff7ed] border border-[#fed7aa] p-2.5 rounded-2xl shadow-2xs text-center flex flex-col items-center justify-center">
              <p className="text-lg sm:text-xl font-black text-[#c2410c] leading-none">
                {formatNumber(stats.dastan)}
              </p>
              <span className="text-[11px] sm:text-xs text-[#c2410c] font-extrabold mt-1">দাস্তান</span>
            </div>
            
            {/* অনুসারী */}
            <div className="bg-[#f0f9ff] border border-[#bae6fd] p-2.5 rounded-2xl shadow-2xs text-center flex flex-col items-center justify-center">
              <p className="text-lg sm:text-xl font-black text-[#0369a1] leading-none">
                {formatNumber(stats.followers)}
              </p>
              <span className="text-[11px] sm:text-xs text-[#0369a1] font-extrabold mt-1">অনুসারী</span>
            </div>
            
            {/* অনুসরণ */}
            <div className="bg-[#faf5ff] border border-[#e9d5ff] p-2.5 rounded-2xl shadow-2xs text-center flex flex-col items-center justify-center">
              <p className="text-lg sm:text-xl font-black text-[#7e22ce] leading-none">
                {formatNumber(stats.following)}
              </p>
              <span className="text-[11px] sm:text-xs text-[#7e22ce] font-extrabold mt-1">অনুসরণ</span>
            </div>

          </div>

          {/* ৪. বায়ো (সুস্পষ্ট ও গাঢ় ফন্ট) */}
          {displayBio && (
            <div className="pt-2 pb-1 text-left">
              <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
                {displayBio}
              </p>
            </div>
          )}

          {/* ৫. অবস্থান, যোগদানের তারিখ ও ওয়েবসাইট (স্পষ্ট ও হাইলাইটেড) */}
          <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1.5 text-xs font-extrabold text-slate-600 pt-2.5 border-t border-slate-100 mt-2">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-slate-500" />
              <span>{displayLocation}</span>
            </span>
            
            <span className="flex items-center gap-1">
              <Calendar size={14} className="text-slate-500" />
              <span>যোগ দিয়েছেন {formatRealtimeJoinDate(realJoinDate)}</span>
            </span>

            <a 
              href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 text-[#0369a1] hover:underline"
            >
              <Globe size={14} className="text-[#0369a1]" />
              <span>{displayWebsite.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>

        </div>

      </div>

      {/* ৪টি মূল ট্যাব (লেখা, সংগ্রহ, প্রিয়, সম্পর্ক) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs my-3.5 p-1 flex items-center justify-around font-black text-sm text-slate-600">
        
        <button
          onClick={() => setActiveMainTab('written')}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMainTab === 'written' 
              ? 'bg-[#181a30] text-white shadow-xs' 
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PenTool size={15} />
          <span>লেখা</span>
        </button>

        <button
          onClick={() => setActiveMainTab('saved')}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMainTab === 'saved' 
              ? 'bg-[#181a30] text-white shadow-xs' 
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bookmark size={15} />
          <span>সংগ্রহ</span>
        </button>

        <button
          onClick={() => setActiveMainTab('favorites')}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMainTab === 'favorites' 
              ? 'bg-[#181a30] text-white shadow-xs' 
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Heart size={15} />
          <span>প্রিয়</span>
        </button>

        <button
          onClick={() => setActiveMainTab('relations')}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMainTab === 'relations' 
              ? 'bg-[#181a30] text-white shadow-xs' 
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users size={15} />
          <span>সম্পর্ক</span>
        </button>
      </div>

      {/* ট্যাব কনটেন্ট প্রদর্শনী */}
      <div className="space-y-3.5">
        
        {/* ১. 'লেখা' ট্যাব */}
        {activeMainTab === 'written' && (
          <div className="space-y-3.5">
            
            {/* লেখার ৩টি সাব-অপশন ফিল্টার: সব, কথামালা, দাস্তান */}
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => setWrittenFilter('all')}
                className={`px-4.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  writtenFilter === 'all'
                    ? 'bg-[#181a30] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                সব
              </button>

              <button
                onClick={() => setWrittenFilter('kothamala')}
                className={`px-4.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  writtenFilter === 'kothamala'
                    ? 'bg-[#0f766e] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                কথামালা
              </button>

              <button
                onClick={() => setWrittenFilter('dastan')}
                className={`px-4.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  writtenFilter === 'dastan'
                    ? 'bg-[#c2410c] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                দাস্তান
              </button>
            </div>

            {/* ফিল্টার অনুযায়ী পোস্ট তালিকা (সর্বশেষ পোস্টটি উপরে) */}
            {sortedAndFilteredMyPosts.length > 0 ? (
              <div className="space-y-3">
                {sortedAndFilteredMyPosts.map((p) => {
                  const isDastan = p.category === 'দাস্তান';

                  return (
                    <div 
                      key={p.id} 
                      className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs hover:border-slate-200 transition-all relative group"
                    >
                      {/* কার্ড হেডার ও ডিলিট অপশন */}
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            isDastan 
                              ? 'bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]' 
                              : 'bg-[#f0fdfa] text-[#0f766e] border border-[#99f6e4]'
                          }`}>
                            {isDastan ? 'দাস্তান' : 'কথামালা'}
                          </span>

                          {isDastan && p.title && (
                            <h4 className="font-black text-slate-900 text-sm sm:text-base line-clamp-1">
                              {p.title}
                            </h4>
                          )}
                        </div>

                        <button 
                          onClick={() => handleDeleteMyPost(p.id)}
                          className="text-slate-300 hover:text-red-600 p-1 transition-all cursor-pointer"
                          title="পোস্ট মুছুন"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* দাস্তান পোস্টের কভার ফটো ও বিবরণ */}
                      {isDastan ? (
                        <div className="flex gap-3.5 items-start mt-2">
                          {p.cover_url && (
                            <img 
                              src={p.cover_url} 
                              alt={p.title || "dastan thumbnail"} 
                              className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover shadow-2xs flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-slate-700 line-clamp-3 leading-relaxed">
                              {p.content}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* কথামালা পোস্টের বিবরণ */
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed my-2">
                          "{p.content}"
                        </p>
                      )}

                      {/* পোস্টের নিচের পরিসংখ্যান ও সময় */}
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 pt-3 border-t border-slate-100 mt-3">
                        <div className="flex items-center gap-4">
                          {isDastan && (
                            <span className="flex items-center gap-1">
                              <Eye size={13} className="text-slate-500" /> {formatNumber(p.views_count)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Heart size={13} className="text-red-500" /> {p.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={13} className="text-blue-500" /> {p.comments_count || 0}
                          </span>
                        </div>
                        <span>{formatTimeAgo(p.created_at)}</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-100 p-10 rounded-3xl text-center shadow-xs">
                <PenTool size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-extrabold text-slate-800">
                  {writtenFilter === 'kothamala' 
                    ? 'কোনো কথামালা পোস্ট পাওয়া যায়নি।' 
                    : writtenFilter === 'dastan' 
                    ? 'কোনো দাস্তান গল্প পাওয়া যায়নি।' 
                    : 'এখনো কোনো লেখা পোস্ট করা হয়নি।'}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  আপনার মনের ভাব বা গল্প শেয়ার করতে নতুন পোস্ট লিখুন।
                </p>
              </div>
            )}

          </div>
        )}

        {/* ২. 'সংগ্রহ' (Saved) ট্যাব */}
        {activeMainTab === 'saved' && (
          <div>
            {savedPosts.length > 0 ? (
              <div className="space-y-3">
                {savedPosts.map((p) => (
                  <PostCard key={p.id} post={p} currentUser={currentUser} refreshPosts={refreshPosts} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600 font-bold bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
                <Bookmark size={32} className="mx-auto mb-2 text-slate-300" />
                <p>কোনো সেভ করা পোস্ট নেই।</p>
              </div>
            )}
          </div>
        )}

        {/* ৩. 'প্রিয়' (Favorites) ট্যাব */}
        {activeMainTab === 'favorites' && (
          <div>
            {favoritePosts.length > 0 ? (
              <div className="space-y-3">
                {favoritePosts.map((p) => (
                  <PostCard key={p.id} post={p} currentUser={currentUser} refreshPosts={refreshPosts} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600 font-bold bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
                <Heart size={32} className="mx-auto mb-2 text-slate-300" />
                <p>কোনো প্রিয় পোস্ট যুক্ত করা হয়নি।</p>
              </div>
            )}
          </div>
        )}

        {/* ৪. 'সম্পর্ক' (Mutual Follows) ট্যাব */}
        {activeMainTab === 'relations' && (
          <div className="space-y-3">
            {mutualRelations.length > 0 ? (
              mutualRelations.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => navigate(`/chat/${user.id}`)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-slate-300 cursor-pointer transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-black overflow-hidden border border-slate-200">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : user.full_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{user.full_name}</h4>
                      <p className="text-xs text-slate-500 font-bold">পারস্পরিক সম্পর্ক (উভয়ে অনুসারী)</p>
                    </div>
                  </div>
                  <button className="bg-[#181a30] text-white text-xs font-black px-4 py-2 rounded-xl">
                    বার্তা দিন
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-600 font-bold bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
                <Users size={32} className="mx-auto mb-2 text-slate-300" />
                <p>এখনো কোনো পারস্পরিক অনুসারী নেই।</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* প্রোফাইল এডিট মডাল পপআপ (রিয়েল-টাইম লোডিং ও প্রফেশনাল সেভ ফ্লো) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-[480px] shadow-2xl relative text-left border border-slate-100 animate-in fade-in zoom-in-95">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-slate-900">প্রোফাইল সাজান</h3>
              <button 
                onClick={() => !isSaving && setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">পূর্ণ নাম</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="আপনার নাম লিখুন..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-1 font-bold text-slate-900 outline-none focus:border-[#181a30] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">ট্যাগলাইন / ভূমিকা (যেমন: লেখক • গল্পবিলাসী • পাঠক)</label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  placeholder="যেমন: লেখক • স্বপ্নদ্রষ্টা • গল্পবিলাসী"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-1 font-bold text-slate-900 outline-none focus:border-[#181a30] focus:bg-white transition-all"
                />
                
                {/* কুইক ট্যাগ সিলেকশন সাজেশন বাটন */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['লেখক', 'পাঠক', 'গল্পবিলাসী', 'কবি', 'স্বপ্নদ্রষ্টা', 'সাহিত্যপ্রেমী'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!editTagline) setEditTagline(tag);
                        else if (!editTagline.includes(tag)) setEditTagline(`${editTagline} • ${tag}`);
                      }}
                      className="text-[11px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">বায়ো (সংক্ষিপ্ত পরিচয়)</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="নিজের অনুভূতি বা পছন্দের বিষয় নিয়ে সংক্ষেপে লিখুন..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-1 font-medium text-slate-900 outline-none focus:border-[#181a30] focus:bg-white transition-all min-h-[90px]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">অবস্থান (যেমন: ঢাকা, বাংলাদেশ)</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="যেমন: ঢাকা, বাংলাদেশ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-1 font-bold text-slate-900 outline-none focus:border-[#181a30] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">ওয়েবসাইট লিঙ্ক</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="যেমন: rifathwrites.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-1 font-bold text-slate-900 outline-none focus:border-[#181a30] focus:bg-white transition-all"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-[#181a30] hover:bg-[#0f1120] text-white py-4 rounded-2xl font-black shadow-lg cursor-pointer active:scale-95 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <span>তথ্য সংরক্ষণ করুন</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}