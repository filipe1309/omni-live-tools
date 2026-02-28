import { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage, interpolate } from '@/i18n';
import {
  POLL_TIMER,
  POLL_OPTIONS,
  POLL_FONT_SIZE,
  QUESTION_HISTORY,
  OPTION_HISTORY,
  POLL_PROFILES,
  DEFAULT_OPTIONS,
  DEFAULT_SELECTED_OPTIONS,
  DEFAULT_QUESTION
} from '@/constants';

// Load question history from localStorage
const loadQuestionHistory = (): string[] => {
  const saved = localStorage.getItem(QUESTION_HISTORY.STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Save question to history
const saveQuestionToHistory = (question: string) => {
  if (!question.trim()) return;
  const history = loadQuestionHistory();
  // Remove if already exists (to move to top)
  const filtered = history.filter(q => q !== question.trim());
  // Add to beginning
  filtered.unshift(question.trim());
  // Keep only last MAX_ITEMS
  const trimmed = filtered.slice(0, QUESTION_HISTORY.MAX_ITEMS);
  localStorage.setItem(QUESTION_HISTORY.STORAGE_KEY, JSON.stringify(trimmed));
};

// Load option history from localStorage - per-option storage
const loadOptionHistory = (optionIndex: number): string[] => {
  // Use 1-based option ID for storage key (matching option.id)
  const optionId = optionIndex + 1;
  const storageKey = `${OPTION_HISTORY.STORAGE_KEY}-${optionId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Save option to history - per-option storage
const saveOptionToHistory = (option: string, optionIndex: number) => {
  if (!option.trim()) return;
  // Use 1-based option ID for storage key (matching option.id)
  const optionId = optionIndex + 1;
  const storageKey = `${OPTION_HISTORY.STORAGE_KEY}-${optionId}`;
  const history = loadOptionHistory(optionIndex);
  // Remove if already exists (to move to top)
  const filtered = history.filter(o => o !== option.trim());
  // Add to beginning
  filtered.unshift(option.trim());
  // Keep only last MAX_ITEMS
  const trimmed = filtered.slice(0, OPTION_HISTORY.MAX_ITEMS);
  localStorage.setItem(storageKey, JSON.stringify(trimmed));
};

// Poll profile interface
interface PollProfile {
  id: string;
  name: string;
  question: string;
  options: string[];
  selectedOptions: boolean[];
  timer: number;
  showBorder?: boolean;
}

// Load profiles from localStorage
const loadProfiles = (): PollProfile[] => {
  const saved = localStorage.getItem(POLL_PROFILES.STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Save profiles to localStorage
const saveProfiles = (profiles: PollProfile[]) => {
  localStorage.setItem(POLL_PROFILES.STORAGE_KEY, JSON.stringify(profiles));
  // Dispatch custom event for same-tab sync (storage event doesn't fire in same tab)
  window.dispatchEvent(new CustomEvent('poll-profiles-updated', { detail: profiles }));
};

// Load selected profile ID from localStorage
const loadSelectedProfileId = (): string | null => {
  return localStorage.getItem(POLL_PROFILES.SELECTED_KEY);
};

// Save selected profile ID to localStorage
const saveSelectedProfileId = (id: string | null) => {
  if (id) {
    localStorage.setItem(POLL_PROFILES.SELECTED_KEY, id);
  } else {
    localStorage.removeItem(POLL_PROFILES.SELECTED_KEY);
  }
};

// Option with preserved original ID
interface OptionWithId {
  id: number;
  text: string;
}

interface PollSetupProps {
  onStart: (question: string, options: OptionWithId[], timer: number) => void;
  onChange?: (question: string, options: OptionWithId[], timer: number, allOptions?: string[], selectedOptions?: boolean[], showStatusBar?: boolean, showBorder?: boolean, resultsFontSize?: number) => void;
  disabled?: boolean;
  initialQuestion?: string;
  initialOptions?: string[];
  initialSelectedOptions?: boolean[];
  initialTimer?: number;
  initialShowStatusBar?: boolean;
  initialShowBorder?: boolean;
  initialResultsFontSize?: number;
  showStartButton?: boolean;
  hideStatusBarToggle?: boolean;
  hideBorderToggle?: boolean;
  hideFontSizeControls?: boolean;
  externalConfig?: { question: string; options: OptionWithId[]; timer: number; showStatusBar?: boolean; showBorder?: boolean; resultsFontSize?: number } | null;
  externalFullOptions?: { allOptions: string[]; selectedOptions: boolean[] } | null;
}

export function PollSetup ({
  onStart,
  onChange,
  disabled = false,
  initialQuestion = DEFAULT_QUESTION,
  initialOptions = [...DEFAULT_OPTIONS],
  initialSelectedOptions = [...DEFAULT_SELECTED_OPTIONS],
  initialTimer = POLL_TIMER.DEFAULT,
  initialShowStatusBar = true,
  initialShowBorder = false,
  initialResultsFontSize = POLL_FONT_SIZE.DEFAULT,
  showStartButton = true,
  hideStatusBarToggle = false,
  hideBorderToggle = false,
  hideFontSizeControls = false,
  externalConfig = null,
  externalFullOptions = null
}: PollSetupProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [selectedOptions, setSelectedOptions] = useState<boolean[]>(initialSelectedOptions);
  const [timer, setTimer] = useState(initialTimer);
  const [showStatusBar, setShowStatusBar] = useState(initialShowStatusBar);
  const [showBorder, setShowBorder] = useState(initialShowBorder);
  const [resultsFontSize, setResultsFontSize] = useState(initialResultsFontSize);
  const hasSentInitialChange = useRef(false);
  const { t } = useLanguage();

  // Question history state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const questionInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);

  // Option history state
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(null);
  const [optionSuggestions, setOptionSuggestions] = useState<string[]>([]);
  const optionSuggestionsRef = useRef<HTMLDivElement>(null);
  const activeOptionIndexRef = useRef<number | null>(null);
  // Keep ref in sync with state
  activeOptionIndexRef.current = activeOptionIndex;

  // Profile state
  const [profiles, setProfiles] = useState<PollProfile[]>(() => loadProfiles());
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => loadSelectedProfileId());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const isLoadingProfileRef = useRef(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Sync profiles across tabs/windows and same-tab components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === POLL_PROFILES.STORAGE_KEY) {
        setProfiles(loadProfiles());
      }
      if (e.key === POLL_PROFILES.SELECTED_KEY) {
        setSelectedProfileId(loadSelectedProfileId());
      }
    };

    const handleProfilesUpdated = (e: CustomEvent<PollProfile[]>) => {
      setProfiles(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('poll-profiles-updated', handleProfilesUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('poll-profiles-updated', handleProfilesUpdated as EventListener);
    };
  }, []);

  // Auto-save profile when question, options, selectedOptions, timer, or showBorder change
  useEffect(() => {
    // Skip if no profile selected or if we're loading a profile
    if (!selectedProfileId || isLoadingProfileRef.current) return;

    // Debounce auto-save to avoid too many writes
    const timeoutId = setTimeout(() => {
      const updatedProfiles = profiles.map(p =>
        p.id === selectedProfileId
          ? { ...p, question, options: [...options], selectedOptions: [...selectedOptions], timer, showBorder }
          : p
      );
      setProfiles(updatedProfiles);
      saveProfiles(updatedProfiles);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [question, options, selectedOptions, selectedProfileId, timer, showBorder]);

  // Click outside handler for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showProfileDropdown &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
        setShowNewProfileInput(false);
        setNewProfileName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Click outside handler for question dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSuggestions &&
        questionContainerRef.current &&
        !questionContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Click outside handler for option dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeOptionIndex !== null &&
        optionSuggestionsRef.current &&
        !optionSuggestionsRef.current.contains(event.target as Node)
      ) {
        // Check if click is inside any option input container
        const target = event.target as HTMLElement;
        const isInsideOptionContainer = target.closest('[data-option-container]');
        if (!isInsideOptionContainer) {
          setActiveOptionIndex(null);
          setOptionSuggestions([]);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeOptionIndex]);

  // Update state when externalFullOptions changes (preferred - has complete state)
  const lastExternalFullOptionsRef = useRef<string | null>(null);

  useEffect(() => {
    if (externalFullOptions) {
      const configKey = JSON.stringify(externalFullOptions);

      // Skip if this is the same config we just sent
      if (lastExternalFullOptionsRef.current === configKey) {
        return;
      }
      lastExternalFullOptionsRef.current = configKey;

      console.log('[PollSetup] Received external full options update:', externalFullOptions);
      setOptions([...externalFullOptions.allOptions]);
      setSelectedOptions([...externalFullOptions.selectedOptions]);
    }
  }, [externalFullOptions]);

  // Update state when externalConfig changes (from popup edit)
  // Only update if this is the initial load (not from our own changes)
  const lastExternalConfigRef = useRef<string | null>(null);

  useEffect(() => {
    if (externalConfig) {
      const configKey = JSON.stringify(externalConfig);

      // Skip if this is the same config we just sent (prevents overwriting our own changes)
      if (lastExternalConfigRef.current === configKey) {
        return;
      }
      lastExternalConfigRef.current = configKey;

      console.log('[PollSetup] Received external config update:', externalConfig);
      setQuestion(externalConfig.question);
      setTimer(externalConfig.timer);
      if (externalConfig.showStatusBar !== undefined) {
        setShowStatusBar(externalConfig.showStatusBar);
      }
      if (externalConfig.showBorder !== undefined) {
        setShowBorder(externalConfig.showBorder);
      }
      if (externalConfig.resultsFontSize !== undefined) {
        setResultsFontSize(externalConfig.resultsFontSize);
      }

      // Only rebuild options from externalConfig if we don't have externalFullOptions
      // (externalFullOptions is more complete and should take precedence for options)
      if (!externalFullOptions) {
        // Rebuild options and selected arrays from externalConfig.options
        // Preserve existing option text for unselected options
        setOptions(prevOptions => {
          const newOptions = [...prevOptions];
          // Reset selected status first
          const newSelected = new Array(POLL_OPTIONS.TOTAL).fill(false);

          externalConfig.options.forEach(opt => {
            if (opt.id >= 1 && opt.id <= POLL_OPTIONS.TOTAL) {
              newOptions[opt.id - 1] = opt.text;
              newSelected[opt.id - 1] = true;
            }
          });

          setSelectedOptions(newSelected);
          return newOptions;
        });
      }
    }
  }, [externalConfig, externalFullOptions]);

  // Get the selected options for the poll - returns objects with id (1-based) and text
  const getSelectedPollOptions = (currentOptions?: string[], currentSelected?: boolean[]) => {
    const opts = currentOptions ?? options;
    const selected = currentSelected ?? selectedOptions;
    const result = opts
      .map((opt, idx) => ({
        text: opt.trim(), // Don't use index as fallback - keep empty if not filled
        id: idx + 1, // 1-based id to preserve original position
        selected: selected[idx]
      }))
      .filter(opt => opt.selected && opt.text); // Only include selected AND non-empty options

    return result;
  };

  // Get options with their original IDs for onChange (to preserve indices)
  const getSelectedPollOptionsWithIds = (currentOptions?: string[], currentSelected?: boolean[]) => {
    return getSelectedPollOptions(currentOptions, currentSelected).map(opt => ({ id: opt.id, text: opt.text }));
  };

  // Send initial onChange immediately on mount
  useEffect(() => {
    console.log('[PollSetup] Mount useEffect - hasSentInitialChange:', hasSentInitialChange.current);
    if (!hasSentInitialChange.current && onChange) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      const questionText = question.trim() || DEFAULT_QUESTION;
      console.log('[PollSetup] Sending initial onChange with options:', selectedPollOptionsWithIds);
      onChange(questionText, selectedPollOptionsWithIds, timer, options, selectedOptions, showStatusBar, showBorder, resultsFontSize);
      hasSentInitialChange.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle subsequent changes (user interaction) - REMOVED to prevent continuous calls
  // Only manual user actions (updateOption, toggleOption) will trigger updates now

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // Update option suggestions based on input - using per-option history
    const history = loadOptionHistory(index);
    if (value.trim()) {
      const filtered = history.filter(o =>
        o.toLowerCase().includes(value.toLowerCase()) && o !== value
      ).slice(0, OPTION_HISTORY.MAX_ITEMS);
      setOptionSuggestions(filtered);
    } else {
      // Show all history when input is empty
      setOptionSuggestions(history.slice(0, OPTION_HISTORY.MAX_ITEMS));
    }

    // Notify parent of change with new state
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds(newOptions, selectedOptions);
      const questionText = question.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, timer, newOptions, selectedOptions, showStatusBar, showBorder, resultsFontSize);
    }
  };

  const handleOptionFocus = (index: number) => {
    setActiveOptionIndex(index);
    const history = loadOptionHistory(index);
    const currentValue = options[index];
    if (currentValue.trim()) {
      const filtered = history.filter(o =>
        o.toLowerCase().includes(currentValue.toLowerCase()) && o !== currentValue
      ).slice(0, OPTION_HISTORY.MAX_ITEMS);
      setOptionSuggestions(filtered.length > 0 ? filtered : history.slice(0, OPTION_HISTORY.MAX_ITEMS));
    } else {
      setOptionSuggestions(history.slice(0, OPTION_HISTORY.MAX_ITEMS));
    }
  };

  const handleOptionArrowClick = (index: number) => {
    // Toggle dropdown: if already showing this index, close it; otherwise open it
    if (activeOptionIndex === index) {
      setActiveOptionIndex(null);
      setOptionSuggestions([]);
    } else {
      const history = loadOptionHistory(index);
      setActiveOptionIndex(index);
      setOptionSuggestions(history.slice(0, OPTION_HISTORY.MAX_ITEMS));
    }
  };

  const handleOptionBlur = (index: number) => {
    // Delay to allow click on suggestion
    // Only close if we're still on the same option (prevents closing when clicking another option)
    setTimeout(() => {
      if (activeOptionIndexRef.current === index) {
        setActiveOptionIndex(null);
        setOptionSuggestions([]);
      }
    }, 200);
    // Save to history if non-empty - using per-option storage
    if (options[index].trim()) {
      saveOptionToHistory(options[index].trim(), index);
    }
  };

  const handleSelectOptionSuggestion = (index: number, suggestion: string) => {
    updateOption(index, suggestion);
    setActiveOptionIndex(null);
    setOptionSuggestions([]);
  };

  const toggleOption = (index: number) => {
    const newSelected = [...selectedOptions];
    newSelected[index] = !newSelected[index];
    setSelectedOptions(newSelected);

    // Notify parent of change with new state
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds(options, newSelected);
      const questionText = question.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, timer, options, newSelected, showStatusBar, showBorder, resultsFontSize);
    }
  };

  // Handle showStatusBar toggle
  const handleShowStatusBarChange = (value: boolean) => {
    setShowStatusBar(value);

    // Notify parent of change
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      const questionText = question.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, timer, options, selectedOptions, value, showBorder, resultsFontSize);
    }
  };

  // Handle showBorder toggle
  const handleShowBorderChange = (value: boolean) => {
    setShowBorder(value);

    // Notify parent of change
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      const questionText = question.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, timer, options, selectedOptions, showStatusBar, value, resultsFontSize);
    }
  };

  // Handle resultsFontSize change
  const handleResultsFontSizeChange = (delta: number) => {
    const newSize = Math.min(POLL_FONT_SIZE.MAX, Math.max(POLL_FONT_SIZE.MIN, Number((resultsFontSize + delta).toFixed(1))));
    setResultsFontSize(newSize);

    // Notify parent of change
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      const questionText = question.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, timer, options, selectedOptions, showStatusBar, showBorder, newSize);
    }
  };

  // Handle question change and notify parent
  const handleQuestionChange = (value: string) => {
    setQuestion(value);

    // Load fresh history and filter suggestions based on input
    const history = loadQuestionHistory();
    if (value.trim()) {
      const filtered = history.filter(q =>
        q.toLowerCase().includes(value.toLowerCase()) && q !== value
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      // Show all history when input is empty
      setFilteredSuggestions(history);
      setShowSuggestions(history.length > 0);
    }

    // Notify parent of change
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      const questionText = value.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, timer, options, selectedOptions, showStatusBar, showBorder, resultsFontSize);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
    setShowSuggestions(false);

    // Notify parent of change
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      onChange(suggestion, selectedPollOptionsWithIds, timer, options, selectedOptions, showStatusBar, showBorder, resultsFontSize);
    }
  };

  // Save question to history when input loses focus
  const handleQuestionBlur = () => {
    // Delay hiding to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);

    // Save to history if it's a meaningful question
    if (question.trim() && question.trim() !== DEFAULT_QUESTION) {
      saveQuestionToHistory(question.trim());
    }
  };

  // Show suggestions on focus
  const handleQuestionFocus = () => {
    // Load fresh history
    const history = loadQuestionHistory();
    // Always show history on focus (regardless of current value)
    setFilteredSuggestions(history);
    setShowSuggestions(history.length > 0);
  };

  // Handle timer change and notify parent
  const handleTimerChange = (value: number) => {
    const clampedValue = Math.min(POLL_TIMER.MAX, Math.max(POLL_TIMER.MIN, value));
    setTimer(clampedValue);

    // Notify parent of change
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
      const questionText = question.trim() || DEFAULT_QUESTION;
      onChange(questionText, selectedPollOptionsWithIds, clampedValue, options, selectedOptions, showStatusBar, showBorder, resultsFontSize);
    }
  };

  // Profile handlers
  const handleSelectProfile = (profileId: string | null) => {
    setSelectedProfileId(profileId);
    saveSelectedProfileId(profileId);
    setShowProfileDropdown(false);
    setShowNewProfileInput(false);
    setNewProfileName('');

    // Set flag to prevent auto-save while loading profile data
    isLoadingProfileRef.current = true;

    let newQuestion: string;
    let newOptions: string[];
    let newSelectedOptions: boolean[];
    let newTimer: number;
    let newShowBorder: boolean;

    if (profileId === null) {
      // Load defaults
      newQuestion = DEFAULT_QUESTION;
      newOptions = [...DEFAULT_OPTIONS];
      newSelectedOptions = [...DEFAULT_SELECTED_OPTIONS];
      newTimer = POLL_TIMER.DEFAULT;
      newShowBorder = false;
    } else {
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        newQuestion = profile.question;
        newOptions = [...profile.options];
        newSelectedOptions = [...profile.selectedOptions];
        newTimer = profile.timer ?? POLL_TIMER.DEFAULT;
        newShowBorder = profile.showBorder ?? false;
      } else {
        return;
      }
    }

    setQuestion(newQuestion);
    setOptions(newOptions);
    setSelectedOptions(newSelectedOptions);
    setTimer(newTimer);
    setShowBorder(newShowBorder);

    // Clear the loading flag after state updates are applied
    setTimeout(() => {
      isLoadingProfileRef.current = false;
    }, 100);

    // Notify parent of change so it can broadcast to other pages
    if (onChange && hasSentInitialChange.current) {
      const selectedPollOptionsWithIds = newOptions
        .map((opt, idx) => ({
          text: opt.trim(),
          id: idx + 1,
          selected: newSelectedOptions[idx]
        }))
        .filter(opt => opt.selected && opt.text)
        .map(opt => ({ id: opt.id, text: opt.text }));

      onChange(newQuestion, selectedPollOptionsWithIds, newTimer, newOptions, newSelectedOptions, showStatusBar, newShowBorder, resultsFontSize);
    }
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;

    const newProfile: PollProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      question,
      options: [...options],
      selectedOptions: [...selectedOptions],
      timer,
      showBorder,
    };

    const updatedProfiles = [...profiles, newProfile].slice(-POLL_PROFILES.MAX_PROFILES);
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    setSelectedProfileId(newProfile.id);
    saveSelectedProfileId(newProfile.id);
    setShowNewProfileInput(false);
    setNewProfileName('');
    setShowProfileDropdown(false);
  };

  const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (confirm(interpolate(t.poll.confirmDeleteProfile, { name: profile.name }))) {
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      setProfiles(updatedProfiles);
      saveProfiles(updatedProfiles);

      if (selectedProfileId === profileId) {
        setSelectedProfileId(null);
        saveSelectedProfileId(null);
        setQuestion(DEFAULT_QUESTION);
        setOptions([...DEFAULT_OPTIONS]);
        setSelectedOptions([...DEFAULT_SELECTED_OPTIONS]);
      }
    }
  };

  const getSelectedProfileName = () => {
    if (!selectedProfileId) return t.poll.defaultProfile;
    const profile = profiles.find(p => p.id === selectedProfileId);
    return profile?.name || t.poll.defaultProfile;
  };

  const handleStart = () => {
    const selectedPollOptionsWithIds = getSelectedPollOptionsWithIds();
    const questionText = question.trim() || DEFAULT_QUESTION;
    onStart(questionText, selectedPollOptionsWithIds, timer);
  };

  // At least MIN_SELECTED options must be selected
  const selectedCount = selectedOptions.filter(Boolean).length;
  
  // Check for duplicate options among selected options
  const duplicateOptions = useMemo(() => {
    const selectedTexts = options
      .map((opt, idx) => ({ text: opt.trim().toLowerCase(), index: idx, original: opt.trim() }))
      .filter(item => selectedOptions[item.index] && item.text); // Only selected and non-empty
    
    const seen = new Map<string, string[]>();
    selectedTexts.forEach(item => {
      if (!seen.has(item.text)) {
        seen.set(item.text, []);
      }
      seen.get(item.text)!.push(item.original);
    });
    
    // Return duplicates (texts that appear more than once)
    const duplicates: string[] = [];
    seen.forEach((originals) => {
      if (originals.length > 1) {
        duplicates.push(originals[0]); // Use original casing
      }
    });
    return duplicates;
  }, [options, selectedOptions]);
  
  const hasDuplicates = duplicateOptions.length > 0;
  const isValid = selectedCount >= POLL_OPTIONS.MIN_SELECTED && !hasDuplicates;

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="flex items-center gap-3">
        <div ref={profileDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm text-slate-300">{t.poll.profile}:</span>
            <span className="text-sm font-medium text-white max-w-[150px] truncate">{getSelectedProfileName()}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
              {/* Default option */}
              <button
                type="button"
                onClick={() => handleSelectProfile(null)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                  !selectedProfileId ? 'bg-purple-900/30 text-purple-300' : 'text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>{t.poll.defaultProfile}</span>
                {!selectedProfileId && <span className="text-purple-400">✓</span>}
              </button>

              {/* Saved profiles */}
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between group ${
                    selectedProfileId === profile.id ? 'bg-purple-900/30 text-purple-300' : 'text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate flex-1">{profile.name}</span>
                  <div className="flex items-center gap-2">
                    {selectedProfileId === profile.id && <span className="text-purple-400">✓</span>}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProfile(profile.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                      title={t.poll.deleteProfile}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </button>
              ))}

              {/* Divider */}
              <div className="border-t border-slate-600 my-1"></div>

              {/* New profile input */}
              {showNewProfileInput ? (
                <div className="p-2 flex gap-2">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveProfile();
                      if (e.key === 'Escape') {
                        setShowNewProfileInput(false);
                        setNewProfileName('');
                      }
                    }}
                    placeholder={t.poll.profileNamePlaceholder}
                    className="flex-1 px-2 py-1 text-sm bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!newProfileName.trim()}
                    className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.poll.saveProfile}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewProfileInput(true)}
                  className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {t.poll.newProfile}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Border Toggle - Show next to profile dropdown when hideStatusBarToggle is true */}
        {hideStatusBarToggle && !hideBorderToggle && (
          <div
            onClick={() => !disabled && handleShowBorderChange(!showBorder)}
            className={`flex items-center gap-2 p-2 rounded-lg border transition-all h-[42px] cursor-pointer ${showBorder
              ? 'bg-tiktok-cyan/20 border-tiktok-cyan/50'
              : 'bg-slate-900/50 border-slate-700/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${showBorder
                ? 'bg-tiktok-cyan border-tiktok-cyan text-slate-900'
                : 'bg-slate-800 border-slate-600 text-transparent'
                }`}
            >
              {showBorder && '✓'}
            </div>
            <span className="text-sm text-slate-300 whitespace-nowrap">
              🔲 {t.poll.showBorder}
            </span>
          </div>
        )}

        {/* Results Font Size Controls */}
        {!hideFontSizeControls && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300 whitespace-nowrap">
              🔤 {t.poll.resultsFontSize}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleResultsFontSizeChange(-POLL_FONT_SIZE.STEP)}
                disabled={disabled || resultsFontSize <= POLL_FONT_SIZE.MIN}
                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                −
              </button>
              <span className="w-12 text-center text-sm text-slate-200 font-medium">
                {resultsFontSize.toFixed(1)}
              </span>
              <button
                type="button"
                onClick={() => handleResultsFontSizeChange(POLL_FONT_SIZE.STEP)}
                disabled={disabled || resultsFontSize >= POLL_FONT_SIZE.MAX}
                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question and Timer Row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Question Input */}
        <div ref={questionContainerRef} className="flex-1 min-w-[300px] relative">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {t.poll.question} {loadQuestionHistory().length > 0 && <span className="text-slate-500 text-xs">({t.poll.historyAvailable})</span>}
          </label>
          <div className="relative">
            <input
              ref={questionInputRef}
              type="text"
              value={question}
              onChange={(e) => handleQuestionChange(e.target.value)}
              onFocus={handleQuestionFocus}
              onBlur={handleQuestionBlur}
              placeholder={t.poll.questionPlaceholder}
              className="input-field w-full pr-8"
              disabled={disabled}
              autoComplete="off"
            />
            {loadQuestionHistory().length > 0 && (
              <button
                type="button"
                onClick={handleQuestionFocus}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                disabled={disabled}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg truncate"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {t.poll.timer}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTimerChange(timer - POLL_TIMER.STEP)}
              disabled={disabled || timer <= POLL_TIMER.MIN}
              className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -{POLL_TIMER.STEP}
            </button>
            <input
              type="number"
              value={timer}
              onChange={(e) => handleTimerChange(Number(e.target.value))}
              min={POLL_TIMER.MIN}
              max={POLL_TIMER.MAX}
              className="input-field flex-1 text-center"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => handleTimerChange(timer + POLL_TIMER.STEP)}
              disabled={disabled || timer >= POLL_TIMER.MAX}
              className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +{POLL_TIMER.STEP}
            </button>
          </div>
        </div>

        {/* Show Status Bar Toggle */}
        {!hideStatusBarToggle && (
          <div className="flex items-end">
            <div
              onClick={() => !disabled && handleShowStatusBarChange(!showStatusBar)}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all h-[42px] cursor-pointer ${showStatusBar
                ? 'bg-purple-900/30 border-purple-500/50'
                : 'bg-slate-900/50 border-slate-700/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${showStatusBar
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-transparent'
                  }`}
              >
                {showStatusBar && '✓'}
              </div>
              <span className="text-sm text-slate-300 whitespace-nowrap">
                📊 {t.poll.showStatusBar}
              </span>
            </div>
          </div>
        )}

        {/* Show Border Toggle - Show in timer row when hideStatusBarToggle is false */}
        {!hideStatusBarToggle && !hideBorderToggle && (
          <div className="flex items-end">
            <div
              onClick={() => !disabled && handleShowBorderChange(!showBorder)}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all h-[42px] cursor-pointer ${showBorder
                ? 'bg-tiktok-cyan/20 border-tiktok-cyan/50'
                : 'bg-slate-900/50 border-slate-700/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${showBorder
                  ? 'bg-tiktok-cyan border-tiktok-cyan text-slate-900'
                  : 'bg-slate-800 border-slate-600 text-transparent'
                  }`}
              >
                {showBorder && '✓'}
              </div>
              <span className="text-sm text-slate-300 whitespace-nowrap">
                🔲 {t.poll.showBorder}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Options Grid with Checkboxes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {t.poll.options} ({t.poll.optionsHint})
        </label>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option, index) => (
            <div
              key={index}
              data-option-container
              className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all overflow-visible ${selectedOptions[index]
                ? 'bg-purple-900/30 border-purple-500/50'
                : 'bg-slate-900/50 border-slate-700/50'
                }`}
            >
              <button
                type="button"
                onClick={() => toggleOption(index)}
                disabled={disabled}
                className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${selectedOptions[index]
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedOptions[index] && '✓'}
              </button>
              <span className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${selectedOptions[index]
                ? 'bg-gradient-to-br from-purple-600 to-purple-400 text-white'
                : 'bg-slate-700 text-slate-400'
                }`}>
                {index + 1}
              </span>
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  onFocus={() => handleOptionFocus(index)}
                  onBlur={() => handleOptionBlur(index)}
                  placeholder={`${t.poll.optionPlaceholder} ${index + 1}`}
                  className="input-field w-full py-1 pr-7 text-sm"
                  disabled={disabled}
                  autoComplete="off"
                />
                {loadOptionHistory(index).length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOptionArrowClick(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    disabled={disabled}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {/* Option Suggestions Dropdown */}
                {activeOptionIndex === index && optionSuggestions.length > 0 && (
                  <div
                    ref={optionSuggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-100 overflow-y-auto"
                  >
                    {optionSuggestions.map((suggestion, suggestionIndex) => (
                      <button
                        key={suggestionIndex}
                        type="button"
                        onClick={() => handleSelectOptionSuggestion(index, suggestion)}
                        className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg truncate text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {selectedCount < POLL_OPTIONS.MIN_SELECTED && (
          <p className="text-red-400 text-sm mt-2">
            ⚠️ {interpolate(t.poll.minOptionsWarning, { count: POLL_OPTIONS.MIN_SELECTED })}
          </p>
        )}
        {hasDuplicates && (
          <p className="text-yellow-400 text-sm mt-2">
            ⚠️ {interpolate(t.poll.duplicateOptionsWarning, { options: duplicateOptions.join(', ') })}
          </p>
        )}
      </div>

      {showStartButton && (
        <button
          onClick={handleStart}
          disabled={!isValid || disabled}
          className="w-full text-lg py-4 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-xl hover:from-green-500 hover:to-blue-600 hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          ▶️ {t.poll.startPoll}
        </button>
      )}
    </div>
  );
}
