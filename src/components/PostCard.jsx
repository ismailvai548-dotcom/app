import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Share2, Bookmark, Send, MoreVertical } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

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

export default function PostCard({ post, currentUser, refreshPosts }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const textLimit = 300;

  useEffect(() => {
    if (currentUser) {
      checkActions();
      fetchComments();
    }
  }, [post.id, currentUser]);

  const checkActions = async () => {
    const { data: like } = await supabase.from('likes').select('id').eq('post_id', String(post.id)).eq('user_id', currentUser.id).maybeSingle();
    if (like) setIsLiked(true);
    const { data: save } = await supabase.from('saved_posts').select('id').eq('post_id', String(post.id)).eq('user_id', currentUser.id).maybeSingle();
    if (save) setIsSaved(true);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', String(post.id)).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const sendNotification = async (type) => {
    if (post.author_id === currentUser.id) return;
    await supabase.from('notifications').insert([{
      receiver_id: post.author_id,
      sender_id: currentUser.id,
      sender_name: currentUser.user_metadata?.full_name || 'ইউজার',
      type: type,
      post_id: post.id,
      is_read: false
    }]);
  };

  const handleLike = async () => {
    if (isLiked) {
      setIsLiked(false); setLikeCount(prev => prev - 1);
      await supabase.from('likes').delete().eq('post_id', String(post.id)).eq('user_id', currentUser.id);
    } else {
      setIsLiked(true); setLikeCount(prev => prev + 1);
      await supabase.from('likes').insert([{ post_id: String(post.id), user_id: currentUser.id }]);
      sendNotification('like');
    }
  };

  const handleSave = async () => {
    if (isSaved) {
      setIsSaved(false); await supabase.from('saved_posts').delete().eq('post_id', String(post.id)).eq('user_id', currentUser.id);
    } else {
      setIsSaved(true); await supabase.from('saved_posts').insert([{ post_id: String(post.id), user_id: currentUser.id }]);
    }
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { 
      post_id: String(post.id), 
      user_id: currentUser.id, 
      author_name: currentUser.user_metadata?.full_name || 'ইউজার', 
      author_avatar: currentUser.user_metadata?.avatar_url || '', 
      content: commentText 
    };
    setCommentText('');
    setComments(prev => [...prev, newComment]);
    await supabase.from('comments').insert([newComment]);
    sendNotification('comment');
    fetchComments();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}`);
    alert("লিঙ্ক কপি হয়েছে! এখন আপনি এটি পেস্ট করে অন্যদের পাঠাতে পারবেন।");
  };

  return (
    /* মাল্টি-কালার গ্র্যাডিয়েন্ট বর্ডার র‍্যাপার */
    <div className="p-[1.5px] bg-gradient-to-tr from-amber-400 via-teal-400 to-purple-500 rounded-[28px] shadow-sm mb-6 overflow-hidden">
      {/* কার্ডের ইনার ক্রিম ব্যাকগ্রাউন্ড */}
      <div className="bg-[#fdfcfb] rounded-[26.5px] overflow-hidden" style={kalpurushStyle}>
        
        {/* হেডার সেকশন */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100/60">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/user/${post.author_id}`)}>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-sm">
              {post.author_avatar ? (
                <img src={post.author_avatar} className="w-full h-full object-cover" alt={post.author_name} />
              ) : (
                <span>{post.author_name?.[0] || 'M'}</span>
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-[17px] leading-tight">{post.author_name}</h4>
              <p className="text-[12px] text-gray-400 font-medium mt-0.5">{formatTimeAgo(post.created_at)}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* পোস্ট টেক্সট */}
        <div className="p-5">
          <p className="text-gray-900 leading-relaxed text-[18px] font-medium whitespace-pre-wrap">
            {isExpanded ? post.content : post.content.slice(0, textLimit)}
            {!isExpanded && post.content.length > textLimit && "..."}
          </p>
          {post.content.length > textLimit && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="mt-3 text-blue-600 font-bold text-sm">
              {isExpanded ? "সংক্ষেপে দেখুন" : "বিস্তারিত পড়ুন"}
            </button>
          )}
        </div>

        {/* অ্যাকশন বার */}
        <div className="px-5 py-3.5 flex justify-between items-center border-t border-gray-100/60 bg-[#faf8f5]/50">
          <div className="flex items-center gap-5 text-sm font-bold text-gray-600">
            <button onClick={handleLike} className={`flex items-center gap-1.5 transition-all ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} /> {likeCount > 0 ? likeCount : ''}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 hover:text-blue-600 transition-all">
              <MessageSquare size={18} /> মন্তব্য
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-blue-600 transition-all">
              <Share2 size={18} /> শেয়ার
            </button>
          </div>
          <button onClick={handleSave} className={`hover:text-blue-600 transition-all ${isSaved ? 'text-blue-600' : 'text-gray-400'}`}>
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        {/* কমেন্ট বক্স */}
        {showComments && (
          <div className="p-4 bg-[#f7f5f0] border-t border-gray-100">
            <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden border">
                    {c.author_avatar ? <img src={c.author_avatar} className="w-full h-full object-cover" alt={c.author_name} /> : <span className="font-bold text-blue-600 flex justify-center items-center h-full w-full">{c.author_name?.[0]}</span>}
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm flex-1 border border-gray-100">
                    <p className="font-bold text-[13px] text-blue-600">{c.author_name}</p>
                    <p className="text-[14px] text-gray-800 font-medium">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={commentText} onChange={(e)=>setCommentText(e.target.value)} placeholder="মন্তব্য লিখুন..." className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 outline-none font-medium text-sm" />
              <button onClick={postComment} className="bg-blue-600 text-white p-2.5 rounded-full shadow-md active:scale-95"><Send size={16} /></button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}