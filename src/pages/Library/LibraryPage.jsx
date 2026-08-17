import React from 'react';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function LibraryPage() {
  return (
    <div className="text-center py-20 font-bold text-gray-400 bg-white rounded-3xl border shadow-sm" style={kalpurushStyle}>
      <h2 className="text-2xl mb-2">লাইব্রেরি আসছে!</h2>
      <p className="text-sm">শীঘ্রই আপনার পছন্দের ই-বুক এখানে দেখতে পাবেন।</p>
    </div>
  );
}