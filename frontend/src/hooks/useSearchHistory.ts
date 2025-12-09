import { useEffect, useRef } from 'react';
import { saveSearchHistory } from '../services/api';

/**
 * 自定義 Hook：記錄用戶搜索歷史
 * @param searchTerm 搜索關鍵字
 * @param pageType 頁面類型（用於識別搜索發生的頁面）
 * @param debounceMs 防抖延遲時間（毫秒），預設 1000ms
 */
export const useSearchHistory = (
  searchTerm: string,
  pageType: string,
  debounceMs: number = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 清除之前的計時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果搜索關鍵字為空，不記錄
    if (!searchTerm.trim()) {
      return;
    }

    // 設置新的計時器，在用戶停止輸入後記錄
    timeoutRef.current = setTimeout(() => {
      saveSearchHistory(searchTerm.trim(), pageType);
    }, debounceMs);

    // 清理函數
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, pageType, debounceMs]);
};

