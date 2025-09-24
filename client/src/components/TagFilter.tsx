import React from 'react';
import { ChevronDown } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTag,
  onTagChange
}) => {
  return (
    <div className="relative">
      <select
        value={selectedTag}
        onChange={(e) => onTagChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">All Tags</option>
        {availableTags.map((tag) => (
          <option key={tag} value={tag}>
            #{tag}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

export default TagFilter;

