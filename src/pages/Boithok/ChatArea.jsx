import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCheck } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

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

export default function ChatArea({ currentUser, allProfiles }) {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null);
  const scrollRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    setRecipient(allProfiles.find((p) => p.id === userId));
  }, [userId, allProfiles]);

  useEffect(() => {
    if (!currentUser || !userId) return;
    const fetchChat = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    };
    fetchChat();

    const channel = supabase
      .channel(`chat_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === userId) ||
            (newMsg.sender_id === userId && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.sender_id === userId) {
              supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then();
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const txt = newMessage;
    setNewMessage('');
    await supabase.from('messages').insert([
      {
        sender_id: currentUser.id,
        receiver_id: userId,
        sender_name: currentUser.user_metadata.full_name,
        receiver_name: recipient?.full_name || 'সাহিত্যিক',
        message_text: txt,
        is_read: false,
      },
    ]);
  };

  return (
    <div
      className="h-[calc(100vh-140px)] md:h-[calc(100vh-110px)] flex flex-col bg-white rounded-[25px] border overflow-hidden shadow-sm"
      style={kalpurushStyle}
    >
      <div className="p-4 border-b flex items-center gap-4 bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/boithok')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-blue-50 rounded-full overflow-hidden border">
          {recipient?.avatar_url ? (
            <img src={recipient.avatar_url} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <span className="flex items-center justify-center h-full text-blue-600 font-black">
              {recipient?.full_name?.[0]}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-black text-gray-900">{recipient?.full_name || 'সাহিত্যিক'}</h3>
          {recipient?.is_online ? (
            <p className="text-[10px] text-green-500 font-bold">সক্রিয়</p>
          ) : (
            <p className="text-[10px] text-gray-400 font-bold">
              শেষ দেখা: {formatTimeAgo(recipient?.last_seen)}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl font-bold shadow-sm ${
                m.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'
              }`}
            >
              {m.message_text}
            </div>
            {m.sender_id === currentUser.id && (
              <span className={`text-[10px] font-black mt-1 flex items-center gap-1 ${m.is_read ? 'text-blue-500' : 'text-gray-400'}`}>
                <CheckCheck size={14} /> {m.is_read ? 'Seen' : 'Sent'}
              </span>
            )}
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>
      <form onSubmit={send} className="p-4 border-t flex gap-3 bg-white">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="বার্তা লিখুন..."
          className="flex-1 bg-gray-50 rounded-full px-5 py-3 outline-none border font-bold shadow-inner"
        />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-95 transition-all">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}