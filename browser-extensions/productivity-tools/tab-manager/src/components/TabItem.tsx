import React from 'react';
import { X, Pin } from 'lucide-react';
import { TabInfo } from '../types/tabs';
import { getFaviconUrl, extractDomain } from '../utils/tabUtils';

interface Props {
  tab: TabInfo;
  onClick: () => void;
  onClose: () => void;
}

export const TabItem: React.FC<Props> = ({ tab, onClick, onClose }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const favicon = tab.favIconUrl || getFaviconUrl(tab.url || '');
  const domain = extractDomain(tab.url || '');

  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer group transition-colors"
      onClick={onClick}
    >
      <img
        src={favicon}
        alt=""
        className="w-5 h-5 flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="12" font-size="12">📄</text></svg>';
        }}
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
          {tab.title || 'Untitled'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {domain}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tab.pinned && (
          <Pin size={14} className="text-blue-500" />
        )}

        <button
          onClick={handleClose}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
        >
          <X size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
};
