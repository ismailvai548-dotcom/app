import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { trackAdClick } from '../services/adEngine';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function SponsoredAdCard({ ad }) {
  if (!ad) return null;

  const handleClick = () => {
    trackAdClick(ad.id);
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/50 via-white to-amber-50/50 rounded-[26px] p-4 border border-blue-100 shadow-xs mb-4 overflow-hidden relative" style={kalpurushStyle}>
      
      {/* স্পন্সরড ট্যাগ */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5 bg-blue-100/70 text-blue-700 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase">
          <Sparkles size={12} />
          <span>স্পন্সরড / Sponsored</span>
        </div>
        <span className="text-[11px] text-gray-400 font-bold">{ad.sponsor_name || 'Book Fair পার্টনার'}</span>
      </div>

      {/* ব্যানার ইমেজ (যদি থাকে) */}
      {ad.banner_url && (
        <div className="w-full h-44 rounded-2xl overflow-hidden mb-3 shadow-xs border border-gray-100">
          <img src={ad.banner_url} alt={ad.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* বিজ্ঞাপনের শিরোনাম ও বিবরণ */}
      <h3 className="font-black text-lg text-gray-900 leading-tight mb-1">{ad.title}</h3>
      <p className="text-gray-600 text-sm font-medium leading-relaxed mb-4">{ad.description}</p>

      {/* কল-টু-অ্যাকশন বাটন */}
      <div className="flex justify-end pt-2 border-t border-gray-100/60">
        <button
          onClick={handleClick}
          className="bg-[#1e1b4b] text-white px-5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <span>{ad.button_text || 'বিস্তারিত দেখুন'}</span>
          <ExternalLink size={14} />
        </button>
      </div>

    </div>
  );
}