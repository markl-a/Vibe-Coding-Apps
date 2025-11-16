'use client';

import { Home, Search, Bell, MessageCircle, User, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <nav className="space-y-2">
        <SidebarLink icon={<Home className="w-5 h-5" />} label="首頁" active />
        <SidebarLink icon={<Search className="w-5 h-5" />} label="探索" />
        <SidebarLink icon={<Bell className="w-5 h-5" />} label="通知" badge={5} />
        <SidebarLink icon={<MessageCircle className="w-5 h-5" />} label="訊息" badge={2} />
        <SidebarLink icon={<User className="w-5 h-5" />} label="個人資料" />
        <SidebarLink icon={<Settings className="w-5 h-5" />} label="設定" />
      </nav>
    </div>
  );
}

function SidebarLink({
  icon,
  label,
  active,
  badge
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
        ${active
          ? 'bg-blue-50 text-blue-600 font-semibold'
          : 'text-gray-700 hover:bg-gray-50'
        }
      `}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
          {badge}
        </span>
      )}
    </button>
  );
}
