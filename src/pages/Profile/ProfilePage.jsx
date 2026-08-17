import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Edit2, LogOut, Bookmark, X, Share2, MoreVertical, 
  ArrowLeft, MapPin, Calendar, Globe, Heart, MessageSquare, 
  Eye, Trash2, PenTool, Users, ChevronRight
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import PostCard from '../../components/PostCard';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

const formatTimeAgo = (d) => {
  if (!d) return "এইমাত্র";
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)}মি. আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)}দিন আগে`;
};

export default function ProfilePage({ currentUser, posts = [], refreshUser, refreshPosts }) {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState('written'); // 'written', 'saved', 'favorites', 'relations'

  // ডাটা স্টেটস
  const [savedPosts, setSavedPosts] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [mutualRelations, setMutualRelations] = useState([]);
  const [stats, setStats] = useState({ kothamala: 0, dastan: 0, followers: 0, following: 0 });
  
  // মেনু ও মডাল স্টেটস
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // এডিট ফর্ম স্টেটস
  const [editName, setEditName] = useState(currentUser?.user_metadata?.full_name || '');
  const [editTagline, setEditTagline] = useState(currentUser?.user_metadata?.tagline || '');
  const [editBio, setEditBio] = useState(currentUser?.user_metadata?.bio || '');
  const [editLocation, setEditLocation] = useState(currentUser?.user_metadata?.location || '');
  const [editWebsite, setEditWebsite] = useState(currentUser?.user_metadata?.website || '');

  const avatarInput = useRef(null);
  const coverInput = useRef(null);

  // ইউজারের নিজের তৈরি পোস্টসমূহ
  const myPosts = posts.filter((p) => p.author_id === currentUser?.id);
  const myKothamala = myPosts.filter((p) => p.category === 'কথামালা');
  const myDastan = myPosts.filter((p) => p.category === 'দাস্তান');

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.user_metadata?.full_name || '');
      setEditTagline(currentUser.user_metadata?.tagline || '');
      setEditBio(currentUser.user_metadata?.bio || '');
      setEditLocation(currentUser.user_metadata?.location || '');
      setEditWebsite(currentUser.user_metadata?.website || '');
      fetchProfileData();
    }
  }, [currentUser, posts]);

  // প্রোফাইলের ডাটা ও কাউন্টার ফেচ করা
  const fetchProfileData = async () => {
    if (!currentUser?.id) return;

    try {
      // ১. কথামালা ও দাস্তান কাউন্ট
      const kothamalaCount = myKothamala.length;
      const dastanCount = myDastan.length;

      // ২. অনুসারী (Followers)
      const { count: fers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);

      // ৩. অনুসরণ (Following)
      const { count: fing } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id);

      setStats({
        kothamala: kothamalaCount,
        dastan: dastanCount,
        followers: fers || 0,
        following: fing || 0
      });

      // ৪. সেভ করা পোস্ট ফেচ
      const { data: savedData } = await supabase.from('saved_posts').select('post_id').eq('user_id', currentUser.id);
      if (savedData && savedData.length > 0) {
        const ids = savedData.map(s => s.post_id);
        const { data: pSaved } = await supabase.from('posts').select('*').in('id', ids).order('created_at', { ascending: false });
        setSavedPosts(pSaved || []);
      } else {
        setSavedPosts([]);
      }

      // ৫. প্রিয় (লাইক দেওয়া) পোস্ট ফেচ
      const { data: likedData } = await supabase.from('likes').select('post_id').eq('user_id', currentUser.id);
      if (likedData && likedData.length > 0) {
        const ids = likedData.map(l => l.post_id);
        const { data: pLiked } = await supabase.from('posts').select('*').in('id', ids).order('created_at', { ascending: false });
        setFavoritePosts(pLiked || []);
      } else {
        setFavoritePosts([]);
      }

      // ৬. সম্পর্ক (Mutual Follows)
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

  // ছবি আপলোড হ্যান্ডলার (কভার ও অ্যাভাটার)
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileName = `${currentUser.id}-${type}-${Date.now()}`;
      await supabase.storage.from('avatars').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase.auth.updateUser({ data: { [`${type}_url`]: publicUrl } });

      if (type === 'avatar') {
        await supabase.from('posts').update({ author_avatar: publicUrl }).eq('author_id', currentUser.id);
        await supabase.from('comments').update({ author_avatar: publicUrl }).eq('user_id', currentUser.id);
      }

      if (refreshUser) refreshUser();
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  // প্রোফাইল লিংক শেয়ার করা
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile`;
    navigator.clipboard.writeText(profileUrl);
    alert("প্রোফাইলের লিঙ্ক কপি হয়েছে!");
  };

  // নিজের পোস্ট মুছে ফেলা
  const handleDeleteMyPost = async (postId) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই পোস্টটি মুছে ফেলতে চান?")) {
      await supabase.from('posts').delete().eq('id', postId);
      if (refreshPosts) refreshPosts();
    }
  };

  // ফলোয়ার সংখ্যা ফরম্যাট (যেমন: 12.4K)
  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="max-w-[700px] mx-auto pb-28 pt-2 px-2 sm:px-4 text-[#2a2421]" style={kalpurushStyle}>
      
      {/* মূল প্রোফাইল কার্ড */}
      <div className="bg-[#fffdf9] rounded-[32px] border border-[#f0eae1] shadow-xs overflow-hidden relative">
        
        {/* ১. কভার ফটো সেকশন */}
        <div className="h-44 sm:h-52 relative group overflow-hidden bg-[#3d2a1d]">
          {currentUser?.user_metadata?.cover_url ? (
            <img src={currentUser.user_metadata.cover_url} className="w-full h-full object-cover" alt="cover" />
          ) : (
            <div className="w-full h-full bg-[#3d2a1d] bg-gradient-to-r from-[#2a1d15] via-[#3d2a1d] to-[#543d2c] flex items-center justify-center p-6 text-center text-[#f7e6d5] relative">
              <p className="font-bold text-base sm:text-xl tracking-wide leading-relaxed italic">
                "কলমই আমার সাথী, কাগজ আমার ঠিকানা।"
              </p>
              <div className="w-20 h-0.5 bg-amber-400/40 mt-2 rounded-full"></div>
            </div>
          )}

          {/* নেভিগেশন ও হেডার কন্ট্রোল বাটনসমূহ */}
          <div className="absolute top-4 left-4">
            <button 
              onClick={() => navigate(-1)} 
              className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button 
              onClick={() => coverInput.current.click()}
              className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="কভার ছবি পরিবর্তন"
            >
              <Camera size={16} />
            </button>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="প্রোফাইল এডিট করুন"
            >
              <Edit2 size={16} />
            </button>

            <button 
              onClick={handleShareProfile}
              className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="প্রোফাইল লিঙ্ক শেয়ার"
            >
              <Share2 size={16} />
            </button>

            {/* থ্রি-ডট ড্রপডাউন মেনু */}
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              >
                <MoreVertical size={16} />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-[#f0eae1] py-2 z-50 text-[#2a2421] text-xs font-bold animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => { setIsEditModalOpen(true); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-stone-100 flex items-center gap-2 cursor-pointer"
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

        {/* ২. পজিশন ঠিক করা প্রোফাইল ছবি + ডানপাশে স্পষ্ট ইউজার নাম ও ট্যাগলাইন */}
        <div className="px-5 pt-0 pb-6 relative">
          
          <div className="flex flex-row items-end gap-4 -mt-12 sm:-mt-14 mb-4">
            {/* প্রোফাইল ছবি (বামপাশে, কভারের ওপর সামান্য অভারল্যাপ) */}
            <div className="relative group flex-shrink-0">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 rounded-full border-4 border-[#fffdf9] shadow-lg overflow-hidden cursor-pointer relative"
                onClick={() => avatarInput.current.click()}
              >
                {currentUser?.user_metadata?.avatar_url ? (
                  <img src={currentUser.user_metadata.avatar_url} className="w-full h-full object-cover rounded-full" alt="avatar" />
                ) : (
                  <div className="w-full h-full bg-[#f5efe6] flex items-center justify-center text-3xl font-black text-[#5b4a3f] rounded-full">
                    {currentUser?.user_metadata?.full_name?.[0] || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-full">
                  <Camera className="text-white" size={18} />
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#3d2a1d] text-white flex items-center justify-center border-2 border-white absolute bottom-1 right-1 shadow-xs">
                <PenTool size={12} />
              </div>

              <input type="file" ref={avatarInput} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
            </div>

            {/* ইউজার নাম ও ট্যাগলাইন (পুরোপুরি কভারের নিচে সাদা সেকশনে স্পষ্ট থাকবে) */}
            <div className="pb-1 min-w-0 flex-1 pt-12 sm:pt-14">
              <h2 className="text-xl sm:text-2xl font-black text-[#2a2421] leading-tight truncate">
                {currentUser?.user_metadata?.full_name || 'গেস্ট ইউজার'}
              </h2>
              <p className="text-xs font-bold text-[#786c65] mt-0.5 truncate">
                {currentUser?.user_metadata?.tagline || 'পাঠক • লেখক'}
              </p>
            </div>
          </div>

          {/* ৩. ৪টি স্ট্যাট কাউন্টার (স্মুথ রাউন্ডেড পিল/বক্স শেপ) */}
          <div className="grid grid-cols-4 gap-2 my-4 font-black text-center">
            <div className="bg-[#f7f4ed] border border-[#eee8dd] p-2.5 rounded-2xl shadow-2xs">
              <p className="text-lg sm:text-xl text-[#2a2421] leading-none">{formatNumber(stats.kothamala)}</p>
              <p className="text-[11px] text-[#8c8077] font-bold mt-1">কথামালা</p>
            </div>
            
            <div className="bg-[#f7f4ed] border border-[#eee8dd] p-2.5 rounded-2xl shadow-2xs">
              <p className="text-lg sm:text-xl text-[#2a2421] leading-none">{formatNumber(stats.dastan)}</p>
              <p className="text-[11px] text-[#8c8077] font-bold mt-1">দাস্তান</p>
            </div>
            
            <div className="bg-[#f7f4ed] border border-[#eee8dd] p-2.5 rounded-2xl shadow-2xs">
              <p className="text-lg sm:text-xl text-[#2a2421] leading-none">{formatNumber(stats.followers)}</p>
              <p className="text-[11px] text-[#8c8077] font-bold mt-1">অনুসারী</p>
            </div>
            
            <div className="bg-[#f7f4ed] border border-[#eee8dd] p-2.5 rounded-2xl shadow-2xs">
              <p className="text-lg sm:text-xl text-[#2a2421] leading-none">{formatNumber(stats.following)}</p>
              <p className="text-[11px] text-[#8c8077] font-bold mt-1">অনুসরণ</p>
            </div>
          </div>

          {/* ৪. বায়ো (স্ট্যাটস এর নিচে) */}
          {currentUser?.user_metadata?.bio && (
            <div className="bg-[#f7f4ed] border border-[#eee8dd] p-3.5 rounded-2xl text-left mb-3">
              <p className="text-xs sm:text-sm font-medium text-[#4a4039] leading-relaxed">
                {currentUser.user_metadata.bio}
              </p>
            </div>
          )}

          {/* ৫. অবস্থান, যোগদানের সময় ও ওয়েবসাইট */}
          <div className="flex flex-wrap items-center justify-start gap-4 text-xs font-bold text-[#8c8077] pt-1 px-1">
            {currentUser?.user_metadata?.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-[#a3978f]" />
                <span>{currentUser.user_metadata.location}</span>
              </span>
            )}
            
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-[#a3978f]" />
              <span>যোগ দিয়েছেন জানুয়ারি ২০২৩</span>
            </span>

            {currentUser?.user_metadata?.website && (
              <a 
                href={currentUser.user_metadata.website.startsWith('http') ? currentUser.user_metadata.website : `https://${currentUser.user_metadata.website}`}
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-[#5b4a3f] hover:underline"
              >
                <Globe size={13} />
                <span>{currentUser.user_metadata.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

        </div>

      </div>

      {/* ৪টি মূল ট্যাব (লেখা, সংগ্রহ, প্রিয়, সম্পর্ক) - সুবিন্যস্ত নেভিগেশন */}
      <div className="flex items-center justify-around border border-[#f0eae1] bg-white rounded-2xl p-1.5 shadow-2xs my-6 font-black text-sm text-[#8c8077]">
        <button
          onClick={() => setActiveMainTab('written')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeMainTab === 'written' ? 'bg-[#3d2a1d] text-white shadow-xs' : 'hover:text-[#2a2421]'}`}
        >
          <PenTool size={15} />
          <span>লেখা</span>
        </button>

        <button
          onClick={() => setActiveMainTab('saved')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeMainTab === 'saved' ? 'bg-[#3d2a1d] text-white shadow-xs' : 'hover:text-[#2a2421]'}`}
        >
          <Bookmark size={15} />
          <span>সংগ্রহ</span>
        </button>

        <button
          onClick={() => setActiveMainTab('favorites')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeMainTab === 'favorites' ? 'bg-[#3d2a1d] text-white shadow-xs' : 'hover:text-[#2a2421]'}`}
        >
          <Heart size={15} />
          <span>প্রিয়</span>
        </button>

        <button
          onClick={() => setActiveMainTab('relations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeMainTab === 'relations' ? 'bg-[#3d2a1d] text-white shadow-xs' : 'hover:text-[#2a2421]'}`}
        >
          <Users size={15} />
          <span>সম্পর্ক</span>
        </button>
      </div>

      {/* ট্যাব কনটেন্ট প্রদর্শনী */}
      <div className="space-y-6">
        
        {/* ১. 'লেখা' ট্যাব */}
        {activeMainTab === 'written' && (
          <div className="space-y-6">
            
            {/* সেকশন ১: সাম্প্রতিক কথামালা */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-base font-black text-[#2a2421]">সাম্প্রতিক কথামালা</h3>
                <button className="text-xs font-black text-[#8c8077] hover:text-[#2a2421] cursor-pointer flex items-center gap-0.5">
                  <span>সব দেখুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {myKothamala.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {myKothamala.map((p) => (
                    <div 
                      key={p.id} 
                      className="bg-[#fffefb] border border-[#f0eae1] p-4 rounded-2xl min-w-[250px] max-w-[250px] shadow-2xs flex flex-col justify-between h-40 relative group"
                    >
                      <button 
                        onClick={() => handleDeleteMyPost(p.id)}
                        className="absolute top-3 right-3 text-[#a3978f] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>

                      <p className="text-[#2a2421] text-xs font-bold leading-relaxed line-clamp-4">
                        "{p.content}"
                      </p>

                      <div className="flex justify-between items-center text-[11px] font-bold text-[#8c8077] pt-2 border-t border-[#f0eae1]/60 mt-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Heart size={12} className="text-red-500" /> {p.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-500" /> {p.comments_count || 0}</span>
                        </div>
                        <span>{formatTimeAgo(p.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#fffefb] border border-[#f0eae1] p-6 rounded-2xl text-center text-xs font-bold text-[#8c8077]">
                  কোনো কথামালা পোস্ট করা হয়নি।
                </div>
              )}
            </div>

            {/* সেকশন ২: সাম্প্রতিক দাস্তান */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-base font-black text-[#2a2421]">সাম্প্রতিক দাস্তান</h3>
                <button className="text-xs font-black text-[#8c8077] hover:text-[#2a2421] cursor-pointer flex items-center gap-0.5">
                  <span>সব দেখুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {myDastan.length > 0 ? (
                <div className="space-y-3">
                  {myDastan.map((p) => (
                    <div 
                      key={p.id} 
                      className="bg-[#fffefb] border border-[#f0eae1] p-3.5 rounded-2xl shadow-2xs flex gap-3.5 items-center relative group"
                    >
                      <img 
                        src={p.cover_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80"} 
                        alt="dastan thumbnail" 
                        className="w-20 h-20 rounded-xl object-cover shadow-2xs flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-[#2a2421] text-sm truncate">{p.title || 'শিরোনামহীন গল্প'}</h4>
                          <span className="bg-[#f0eae1] text-[#5b4a3f] text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0">
                            দাস্তান
                          </span>
                        </div>

                        <p className="text-xs font-medium text-[#786c65] line-clamp-2 leading-snug mb-2">
                          {p.content}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] font-bold text-[#8c8077]">
                          <span className="flex items-center gap-1"><Eye size={13} /> {p.views_count || '12.4K'}</span>
                          <span className="flex items-center gap-1"><Heart size={13} className="text-red-500" /> {p.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={13} className="text-blue-500" /> {p.comments_count || 0}</span>
                          <span>{formatTimeAgo(p.created_at)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteMyPost(p.id)}
                        className="absolute top-3.5 right-3.5 text-[#a3978f] hover:text-red-600 cursor-pointer"
                        title="পোস্ট মুছুন"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#fffefb] border border-[#f0eae1] p-6 rounded-2xl text-center text-xs font-bold text-[#8c8077]">
                  কোনো দাস্তান গল্প পোস্ট করা হয়নি।
                </div>
              )}
            </div>

          </div>
        )}

        {/* ২. 'সংগ্রহ' (Saved) ট্যাব */}
        {activeMainTab === 'saved' && (
          <div>
            {savedPosts.length > 0 ? (
              savedPosts.map((p) => (
                <PostCard key={p.id} post={p} currentUser={currentUser} refreshPosts={refreshPosts} />
              ))
            ) : (
              <div className="text-center py-12 text-[#8c8077] font-bold bg-[#fffefb] rounded-3xl border border-[#f0eae1] p-6">
                <Bookmark size={32} className="mx-auto mb-2 text-[#d1c7be]" />
                <p>কোনো সেভ করা পোস্ট নেই।</p>
              </div>
            )}
          </div>
        )}

        {/* ৩. 'প্রিয়' (Favorites) ট্যাব */}
        {activeMainTab === 'favorites' && (
          <div>
            {favoritePosts.length > 0 ? (
              favoritePosts.map((p) => (
                <PostCard key={p.id} post={p} currentUser={currentUser} refreshPosts={refreshPosts} />
              ))
            ) : (
              <div className="text-center py-12 text-[#8c8077] font-bold bg-[#fffefb] rounded-3xl border border-[#f0eae1] p-6">
                <Heart size={32} className="mx-auto mb-2 text-[#d1c7be]" />
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
                  className="bg-[#fffefb] p-4 rounded-2xl border border-[#f0eae1] flex items-center justify-between hover:border-[#3d2a1d] cursor-pointer transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#f5efe6] text-[#5b4a3f] flex items-center justify-center font-black overflow-hidden border border-[#f0eae1]">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : user.full_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2a2421] text-base">{user.full_name}</h4>
                      <p className="text-xs text-[#8c8077] font-medium">পারস্পরিক সম্পর্ক (উভয়ে অনুসারী)</p>
                    </div>
                  </div>
                  <button className="bg-[#3d2a1d] text-white text-xs font-black px-4 py-2 rounded-xl">
                    বার্তা দিন
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[#8c8077] font-bold bg-[#fffefb] rounded-3xl border border-[#f0eae1] p-6">
                <Users size={32} className="mx-auto mb-2 text-[#d1c7be]" />
                <p>এখনো কোনো পারস্পরিক অনুসারী নেই।</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* প্রোফাইল এডিট মডাল পপআপ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fffdf9] rounded-[32px] p-6 sm:p-8 w-full max-w-[480px] shadow-2xl relative text-left border border-[#f0eae1]">
            
            <div className="flex justify-between items-center mb-6 border-b border-[#f0eae1] pb-3">
              <h3 className="text-xl font-black text-[#2a2421]">প্রোফাইল সাজান</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#8c8077] hover:text-[#2a2421] p-1 rounded-full cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-black text-[#8c8077] uppercase">পূর্ণ নাম</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="আপনার নাম লিখুন..."
                  className="w-full bg-[#f8f5ee] border border-[#f0eae1] rounded-2xl p-3.5 mt-1 font-bold text-[#2a2421] outline-none focus:border-[#3d2a1d]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#8c8077] uppercase">ট্যাগলাইন (যেমন: পাঠক • গল্পবিলাসী)</label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  placeholder="যেমন: পাঠক • লেখক"
                  className="w-full bg-[#f8f5ee] border border-[#f0eae1] rounded-2xl p-3.5 mt-1 font-bold text-[#2a2421] outline-none focus:border-[#3d2a1d]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#8c8077] uppercase">বায়ো (সংক্ষিপ্ত পরিচয়)</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="নিজের অনুভূতি বা পছন্দের বিষয় নিয়ে সংক্ষেপে লিখুন..."
                  className="w-full bg-[#f8f5ee] border border-[#f0eae1] rounded-2xl p-3.5 mt-1 font-medium text-[#2a2421] outline-none focus:border-[#3d2a1d] min-h-[90px]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#8c8077] uppercase">অবস্থান (যেমন: ঢাকা, বাংলাদেশ)</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="যেমন: ঢাকা, বাংলাদেশ"
                  className="w-full bg-[#f8f5ee] border border-[#f0eae1] rounded-2xl p-3.5 mt-1 font-bold text-[#2a2421] outline-none focus:border-[#3d2a1d]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#8c8077] uppercase">ওয়েবসাইট লিঙ্ক</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="যেমন: rifathwrites.com"
                  className="w-full bg-[#f8f5ee] border border-[#f0eae1] rounded-2xl p-3.5 mt-1 font-bold text-[#2a2421] outline-none focus:border-[#3d2a1d]"
                />
              </div>

              <button
                onClick={async () => {
                  const updatedMetadata = {
                    full_name: editName,
                    tagline: editTagline,
                    bio: editBio,
                    location: editLocation,
                    website: editWebsite
                  };

                  await supabase.auth.updateUser({ data: updatedMetadata });
                  await supabase.from('posts').update({ author_name: editName }).eq('author_id', currentUser.id);
                  await supabase.from('comments').update({ author_name: editName }).eq('user_id', currentUser.id);

                  setIsEditModalOpen(false);
                  if (refreshUser) refreshUser();
                  if (refreshPosts) refreshPosts();
                }}
                className="w-full bg-[#3d2a1d] text-white py-4 rounded-2xl font-black shadow-lg hover:bg-[#2d1f15] cursor-pointer active:scale-95 transition-all mt-2"
              >
                তথ্য সংরক্ষণ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}