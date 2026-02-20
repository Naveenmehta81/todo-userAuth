import { useState, useEffect } from 'react';

export function useFormDraft(key, initialValue) {
  // Initialize state by checking sessionStorage first
  const [value, setValue] = useState(() => {
    try {
      const storedItem = window.sessionStorage.getItem(key);
      return storedItem ? JSON.parse(storedItem) : initialValue;
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
      return initialValue;
    }
  });

  // Sync state changes to sessionStorage automatically
  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error writing to sessionStorage:", error);
    }
  }, [key, value]);

  // Provide a way to clear the draft after successful submission
  const clearDraft = () => {
    window.sessionStorage.removeItem(key);
    setValue(initialValue);
  };

  return [value, setValue, clearDraft];
}