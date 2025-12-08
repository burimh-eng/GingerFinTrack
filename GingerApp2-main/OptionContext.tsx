import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ACCOUNTS, CATEGORIES, NAMES, SUB_CATEGORIES } from './types';

export type OptionKey = 'accounts' | 'categories' | 'subCategories' | 'names';

export interface OptionState {
  accounts: string[];
  categories: string[];
  subCategories: string[];
  names: string[];
}

interface OptionContextType {
  options: OptionState;
  baseOptions: OptionState;
  addOption: (key: OptionKey, value: string) => void;
  removeOption: (key: OptionKey, value: string) => void;
}

const STORAGE_KEY = 'ginger-option-lists';

const defaultOptions: OptionState = {
  accounts: [...ACCOUNTS],
  categories: [...CATEGORIES],
  subCategories: [...SUB_CATEGORIES],
  names: [...NAMES],
};

const OptionContext = createContext<OptionContextType | undefined>(undefined);

const sanitize = (value: string) => value.trim();

const normalizeList = (list: unknown, fallback: string[]) => {
  if (Array.isArray(list)) {
    return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
  }
  return [...fallback];
};

const loadOptions = (): OptionState => {
  if (typeof window === 'undefined') {
    return defaultOptions;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        accounts: normalizeList(parsed.accounts, defaultOptions.accounts),
        categories: normalizeList(parsed.categories, defaultOptions.categories),
        subCategories: normalizeList(parsed.subCategories, defaultOptions.subCategories),
        names: normalizeList(parsed.names, defaultOptions.names),
      };
    }
  } catch (error) {
    console.warn('Failed to parse option lists from storage', error);
  }
  return defaultOptions;
};

const persistOptions = (options: OptionState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
};

export const OptionProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<OptionState>(loadOptions);

  const updateOptions = useCallback((updater: (prev: OptionState) => OptionState) => {
    setOptions(prev => {
      const next = updater(prev);
      persistOptions(next);
      return next;
    });
  }, []);

  const addOption = useCallback((key: OptionKey, value: string) => {
    const cleaned = sanitize(value);
    if (!cleaned) return;
    updateOptions(prev => {
      if (prev[key].some(item => item.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        [key]: [...prev[key], cleaned],
      };
    });
  }, [updateOptions]);

  const removeOption = useCallback((key: OptionKey, value: string) => {
    updateOptions(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value),
    }));
  }, [updateOptions]);

  return (
    <OptionContext.Provider value={{ options, baseOptions: defaultOptions, addOption, removeOption }}>
      {children}
    </OptionContext.Provider>
  );
};

export const useOptionLists = () => {
  const context = useContext(OptionContext);
  if (!context) {
    throw new Error('useOptionLists must be used within OptionProvider');
  }
  return context;
};
