'use client';

import { useState, useEffect } from 'react';
import { getSuggestions } from '@/lib/utils/suggestions';

interface ValidatedInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}

export default function ValidatedInput({
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  placeholder,
  type = 'text',
  className = ''
}: ValidatedInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    if (value) {
      const matches = getSuggestions(value, suggestions);
      setFilteredSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions]);
  
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        placeholder={placeholder}
      />
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onSuggestionSelect(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 