
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Article } from '../types';

interface ComparisonContextType {
  comparisonList: Article[];
  addToComparison: (article: Article) => void;
  removeFromComparison: (url: string) => void;
  clearComparison: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<Article[]>([]);

  const addToComparison = (article: Article) => {
    if (comparisonList.length >= 2) return;
    if (comparisonList.find(a => a.url === article.url)) return;
    setComparisonList([...comparisonList, article]);
  };

  const removeFromComparison = (url: string) => {
    setComparisonList(comparisonList.filter(a => a.url !== url));
  };

  const clearComparison = () => setComparisonList([]);

  return (
    <ComparisonContext.Provider value={{ comparisonList, addToComparison, removeFromComparison, clearComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within ComparisonProvider');
  return context;
};
