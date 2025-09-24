import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Zap, ChevronDown, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface SortFilterProps {
  sortMode: 'date' | 'attraction' | 'controversy';
  timeWindow: '24h' | '7d' | '30d' | 'all';
  onSortModeChange: (mode: 'date' | 'attraction' | 'controversy') => void;
  onTimeWindowChange: (window: '24h' | '7d' | '30d' | 'all') => void;
}

const SortFilter: React.FC<SortFilterProps> = ({
  sortMode,
  timeWindow,
  onSortModeChange,
  onTimeWindowChange
}) => {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  const sortOptions = [
    { value: 'date', label: 'New', icon: Calendar },
    { value: 'attraction', label: 'Hot', icon: TrendingUp },
    { value: 'controversy', label: 'Controversial', icon: Zap }
  ] as const;

  const timeOptions = [
    { value: '24h', label: 'Today' },
    { value: '7d', label: 'Week' },
    { value: '30d', label: 'Month' },
    { value: 'all', label: 'All Time' }
  ] as const;

  const currentSort = sortOptions.find(opt => opt.value === sortMode);
  const currentTime = timeOptions.find(opt => opt.value === timeWindow);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setSortDropdownOpen(false);
        setTimeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="inline-flex items-center space-x-3 post-surface px-3 py-2 rounded-xl relative z-40">
      {/* Sort Mode Dropdown */}
      <div className="relative">
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className="flex items-center space-x-1 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {currentSort && <currentSort.icon className="w-4 h-4" />}
          <span>{currentSort?.label}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        
        {sortDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 post-surface py-1 z-[60] min-w-[140px]">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortModeChange(option.value);
                    setSortDropdownOpen(false);
                  }}
                  className={clsx(
                    'flex items-center space-x-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                    sortMode === option.value ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Window Dropdown (only show for attraction and controversy) */}
      {(sortMode === 'attraction' || sortMode === 'controversy' || sortMode === 'date') && (
        <div className="relative">
          <button
            onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
            className="flex items-center space-x-1 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>{currentTime?.label}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {timeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 post-surface py-1 z-[60] min-w-[120px]">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onTimeWindowChange(option.value);
                    setTimeDropdownOpen(false);
                  }}
                  className={clsx(
                    'block w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                    timeWindow === option.value ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SortFilter;
