import { useState, useRef, useEffect, useCallback } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  suggestions: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Input component with autocomplete dropdown functionality.
 * Shows all suggestions on focus, filters as the user types.
 */
export function AutocompleteInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  suggestions,
  onSelectSuggestion,
  className = '',
  placeholder,
}: AutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current value
  const filteredSuggestions = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.trim().toLowerCase())
      )
    : suggestions;

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Reset highlighted index when filtered suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredSuggestions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleFocus = useCallback(() => {
    setShowDropdown(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if the new focus target is within our container (including dropdown)
    const relatedTarget = e.relatedTarget as Node | null;
    if (containerRef.current?.contains(relatedTarget)) {
      return; // Don't close dropdown if clicking within container
    }
    setShowDropdown(false);
    onBlur();
  }, [onBlur]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    onChange(suggestion);
    onSelectSuggestion?.(suggestion);
    setShowDropdown(false);
    // Focus back to input after selection
    inputRef.current?.focus();
  }, [onChange, onSelectSuggestion]);

  const handleKeyDownInternal = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || filteredSuggestions.length === 0) {
      onKeyDown(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
        } else {
          onKeyDown(e);
        }
        break;
      case 'Escape':
        if (showDropdown) {
          e.preventDefault();
          e.stopPropagation();
          setShowDropdown(false);
        } else {
          onKeyDown(e);
        }
        break;
      case 'Tab':
        setShowDropdown(false);
        onKeyDown(e);
        break;
      default:
        onKeyDown(e);
    }
  }, [showDropdown, filteredSuggestions, highlightedIndex, handleSelectSuggestion, onKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownInternal}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {/* Dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors ${
                index === highlightedIndex ? 'bg-slate-700' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === filteredSuggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleSelectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
