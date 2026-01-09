
import React, { useState } from 'react';
import { useComparison } from './ComparisonContext';
import { X, ArrowLeftRight, Trash2, Info } from 'lucide-react';
import { apiService } from '../services/apiService';
import { ComparisonResult } from '../types';

const ComparisonDrawer: React.FC = () => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [isOpen, setIsOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  if (comparisonList.length === 0) return null;

  const handleCompare = async () => {
    if (comparisonList.length < 2) return;
    setIsComparing(true);
    try {
      const res = await apiService.compareArticles(comparisonList[0].headline, comparisonList[1].headline);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <div className="fixed bottom-8 left-8 z-40">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-full shadow-2xl shadow-blue-500/40 transition-all transform hover:scale-105"
        >
          <ArrowLeftRight className="w-6 h-6" />
          <span className="font-bold">مقارنة ({comparisonList.length}/2)</span>
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-r border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-blue-500" />
                أداة المقارنة الذكية
              </h2>
              <button onClick={() => {setIsOpen(false); setResult(null);}} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonList.map((article, idx) => (
                  <div key={article.url} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 relative">
                    <button 
                      onClick={() => removeFromComparison(article.url)}
                      className="absolute top-2 left-2 p-1 text-slate-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-blue-400 font-bold block mb-2">النص {idx + 1}</span>
                    <h3 className="font-bold text-sm line-clamp-2">{article.headline}</h3>
                    <p className="text-xs text-slate-400 mt-2">{article.source}</p>
                  </div>
                ))}
                
                {comparisonList.length < 2 && (
                  <div className="bg-slate-800/20 p-4 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 py-12">
                    <p className="text-sm">أضف نصاً ثانياً للمقارنة</p>
                  </div>
                )}
              </div>

              {comparisonList.length === 2 && !result && (
                <button 
                  onClick={handleCompare}
                  disabled={isComparing}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isComparing ? 'جاري التحليل...' : 'بدء المقارنة الذكية'}
                </button>
              )}

              {result && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="p-6 bg-slate-800 rounded-2xl border border-blue-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold">نسبة التشابه الموضوعي</span>
                      <span className="text-3xl font-black text-blue-500">{Math.round(result.similarity * 100)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-1000" 
                        style={{ width: `${result.similarity * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                    <h4 className="flex items-center gap-2 font-bold mb-4 text-slate-300">
                      <Info className="w-5 h-5 text-blue-400" />
                      رؤية المحلل الذكي
                    </h4>
                    <p className="text-slate-200 leading-relaxed italic">"{result.insights}"</p>
                  </div>

                  <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                    <h4 className="font-bold mb-4 text-slate-300">أبرز الاختلافات الجوهرية</h4>
                    <ul className="space-y-3">
                      {result.differences.map((diff, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-400">
                          <span className="text-blue-500 font-bold">•</span>
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => {setResult(null); clearComparison();}}
                    className="w-full py-3 border border-slate-700 hover:bg-slate-800 rounded-xl font-medium text-slate-400"
                  >
                    تفريغ سلة المقارنة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparisonDrawer;
