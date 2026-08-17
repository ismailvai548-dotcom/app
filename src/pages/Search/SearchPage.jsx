import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function SearchPage({ allProfiles, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filtered = allProfiles.filter(
    (p) => p.id !== currentUser?.id && p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[700px] mx-auto bg-white p-8 rounded-3xl border shadow-sm min-h-[80vh]" style={kalpurushStyle}>
      <h2 className="text-2xl font-black mb-6 text-center">লেখক অনুসন্ধান</h2>
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          autoFocus
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="নাম লিখে লেখক খুঁজুন..."
          className="w-full bg-gray-50 border p-4 pl-14 rounded-full font-bold outline-none shadow-inner text-gray-900"
        />
      </div>
      <div className="space-y-4">
        {searchTerm.trim() === '' ? (
          <p className="text-center text-gray-400 font-bold">কাকে খুঁজছেন? বক্সে নাম লিখুন...</p>
        ) : filtered.length > 0 ? (
          filtered.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/chat/${u.id}`)}
              className="flex items-center gap-4 p-4 border rounded-2xl hover:bg-blue-50 cursor-pointer transition-all shadow-sm"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-full border overflow-hidden flex items-center justify-center font-black text-blue-600 flex-shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : u.full_name?.[0]}
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-900">{u.full_name}</h4>
                <p className="text-xs text-gray-400 font-black uppercase">কলম সৈনিক</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 font-bold">কোনো লেখক পাওয়া যায়নি!</p>
        )}
      </div>
    </div>
  );
}