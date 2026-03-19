import { useState, useCallback, useEffect } from "react";
import type { CodingResult, CodingRequest } from "@/types/coding";

export interface HistoryEntry {
  id: string;
  timestamp: number; // Unix ms
  request: CodingRequest;
  result: CodingResult;
}

const STORAGE_KEY = "claimvex_session_history";
const MAX_ENTRIES = 10;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useSessionHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback((request: CodingRequest, result: CodingResult) => {
    setHistory(prev => {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        request,
        result,
      };
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}
