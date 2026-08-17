import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, MessageSquare, User, Pen } from 'lucide-react';

const kalpurushStyle = { fontFamily: "'Kalpurush', sans-serif" };

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // হোম বাটনে ক্লিক করলে স্ক্রল করে মসৃণভাবে একদম উপরে চলে যাবে
  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const navItems = [
    { id: 'home', label: 'হোম', icon: Home, onClick: handleHomeClick, path: '/' },
    { id: 'books', label: 'বই', icon: BookOpen, onClick: () => navigate('/books'), path: '/books' },
    { id: 'write', label: 'লিখুন', icon: Pen, onClick: handleHomeClick, path: '/', isSpecial: true },
    { id: 'boithok', label: 'বৈঠকখানা', icon: MessageSquare, onClick: () => navigate('/boithok'), path: '/boithok', badge: 5 },
    { id: 'profile', label: 'প্রোফাইল', icon: User, onClick: () => navigate('/profile'), path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 py-2 px-3 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.03)]" style={kalpurushStyle}>
      <div className="flex items-center justify-around max-w-[500px] mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path && !item.isSpecial;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center -mt-5 transition-transform active:scale-95 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#1e1b4b] text-white flex items-center justify-center shadow-lg shadow-indigo-950/30 border-4 border-white">
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-gray-700 mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer active:scale-95 ${
                isActive ? 'text-gray-950 font-black' : 'text-gray-400 font-bold'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}