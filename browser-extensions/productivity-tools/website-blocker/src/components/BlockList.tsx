import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Globe } from 'lucide-react';
import { BlockList as BlockListType } from '../types/blocker';

interface Props {
  list: BlockListType;
  onToggle: (id: string) => void;
  onRemoveSite: (listId: string, site: string) => void;
  onAddSite: (listId: string, site: string) => void;
}

export const BlockListComponent: React.FC<Props> = ({ list, onToggle, onRemoveSite, onAddSite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSite, setNewSite] = useState('');

  const handleAddSite = () => {
    if (newSite.trim()) {
      onAddSite(list.id, newSite.trim());
      setNewSite('');
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: list.color }}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {list.name}
            </h3>
            {list.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {list.description}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            {isExpanded ? 'Hide' : 'Show'} ({list.sites.length})
          </button>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={list.enabled}
            onChange={() => onToggle(list.id)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-2">
          {list.sites.map((site) => (
            <div
              key={site}
              className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {site}
                </span>
              </div>
              <button
                onClick={() => onRemoveSite(list.id, site)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="Add website (e.g., example.com)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSite()}
            />
            <button
              onClick={handleAddSite}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
