import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
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

export default function ChatList({ currentUser, allProfiles }) {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  const fetchCons = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const unique = {};
      data.forEach((m) => {
        const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
        if (!unique[otherId]) {
          const prof = allProfiles.find((p) => p.id === otherId);
          unique[otherId] = {
            id: otherId,
            name: prof?.full_name || (m.sender_id === currentUser.id ? m.receiver_name : m.sender_name),
            avatar: prof?.avatar_url,
            text: m.message_text,
            time: m.created_at,
            is_online: prof?.is_online,
            last_seen: prof?.last_seen,
            is_unread: m.receiver_id === currentUser.id && !m.is_read,
          };
        }
      });
      const sortedConversations = Object.values(unique).sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );
      setConversations(sortedConversations);
    }
  };

  useEffect(() => {
    fetchCons();
    if (currentUser) {
      const channel = supabase
        .channel('chat_list_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchCons();
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [currentUser, allProfiles]);

  return (
    <div className="max-w-[700px] mx-auto bg-white rounded-3xl border shadow-sm overflow-hidden min-h-[80vh]" style={kalpurushStyle}>
      <h2 className="text-2xl font-black p-6 border-b">বৈঠকখানা</h2>
      {conversations.length > 0 ? (
        conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/chat/${c.id}`)}
            className="flex gap-4 p-5 border-b hover:bg-gray-50 cursor-pointer transition-all relative"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600 text-xl border overflow-hidden flex-shrink-0">
              {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" alt="avatar" /> : c.name?.[0]}
            </div>
            {c.is_online && (
              <div className="absolute left-[60px] bottom-5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}

            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <h4 className={`text-[17px] ${c.is_unread ? 'font-black text-blue-600' : 'font-bold text-gray-900'}`}>
                  {c.name}
                </h4>
                <span className={`text-[11px] ${c.is_unread ? 'font-black text-blue-600' : 'font-bold text-gray-400'}`}>
                  {formatTimeAgo(c.time)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className={`truncate text-sm ${c.is_unread ? 'font-black text-gray-900' : 'font-medium text-gray-500'}`}>
                  {c.text}
                </p>
                {c.is_unread && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full ml-2 flex-shrink-0"></span>}
              </div>
              <p className="text-[10px] font-bold mt-1.5">
                {c.is_online ? (
                  <span className="text-green-500">অনলাইন</span>
                ) : (
                  <span className="text-gray-400">শেষ দেখা: {formatTimeAgo(c.last_seen)}</span>
                )}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="font-bold text-lg">এখনো কোনো আলাপ শুরু হয়নি!</p>
          <p className="text-sm font-medium mt-2">
            নতুন কারও সাথে কথা বলতে <br /> অনুসন্ধান অপশনে গিয়ে নাম লিখে খুঁজুন।
          </p>
        </div>
      )}
    </div>
  );
}