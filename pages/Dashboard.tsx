
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Shield, Radar as RadarIcon, 
  PieChart as PieIcon, Activity, 
  Zap, Database, BrainCircuit, Landmark
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Article } from '../types';
import { 
  Tooltip as ReTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, 
  Radar as ReRadar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [strategicData, setStrategicData] = useState<{summary: string, metrics: any[], key_takeaways: string[]}>({
    summary: '',
    metrics: [],
    key_takeaways: []
  });
  const [biasData, setBiasData] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  const fetchFullIntelligence = async () => {
    setLoading(true);
    try {
      const results = await apiService.searchText({ top_k: 100 });
      setArticles(results);

      setIsAnalyzing(true);
      const [strat, bias] = await Promise.all([
        apiService.getStrategicSummary(results.slice(0, 40)),
        apiService.detectEditorialBias(results.slice(0, 15))
      ]);

      setStrategicData(strat);
      setBiasData(bias);
    } catch (err) {
      console.error("Dashboard Service Error:", err);
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullIntelligence();
  }, []);

  const analytics = useMemo(() => {
    const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
    articles.forEach(art => {
      let sentiment = art.sentiment_label || 'neutral';
      sentimentDistribution[sentiment as keyof typeof sentimentDistribution]++;
    });

    const sentimentData = [
      { name: 'إيجابي', value: sentimentDistribution.positive || 1, color: '#C5A059' },
      { name: 'محايد', value: sentimentDistribution.neutral || 1, color: '#475569' },
      { name: 'سلبي', value: sentimentDistribution.negative || 1, color: '#b91c1c' }
    ];

    const averageBias = biasData.length > 0 
      ? Math.round(biasData.reduce((acc, curr) => acc + curr.bias_score, 0) / biasData.length)
      : 50;

    return { sentimentData, averageBias };
  }, [articles, biasData]);

  if (loading) return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-b-2 border-saudi-gold rounded-full animate-spin"></div>
        <Landmark className="w-10 h-10 text-saudi-gold absolute inset-0 m-auto animate-pulse" />
      </div>
      <p className="text-[11px] font-black text-saudi-gold tracking-[0.4em] uppercase">MetaView AI Initializing...</p>
    </div>
  );

  return (
    <div className="max-w-[1536px] mx-auto space-y-12 pb-40 px-6 pt-8 font-['Cairo']">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 border-b border-white/5 pb-12">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-saudi-gold/10 rounded-[1.5rem] flex items-center justify-center border border-saudi-gold/20 shadow-2xl">
             <BrainCircuit className="w-12 h-12 text-saudi-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">تحليلات MetaView</h1>
            <div className="flex items-center gap-5">
               <span className="text-[10px] font-black text-emerald-500 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  AI Core Active
               </span>
               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <Database className="w-4 h-4 opacity-40" /> {articles.length.toLocaleString()} سجل
               </span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchFullIntelligence} 
          disabled={isAnalyzing}
          className="flex items-center gap-3 px-10 py-5 bg-saudi-gold text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
           <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} /> تحديث التحليلات
        </button>
      </div>

      <section className="official-card rounded-[3.5rem] overflow-hidden border-none shadow-2xl">
         <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[450px]">
            <div className="lg:col-span-8 p-14 bg-[#050505] space-y-10 border-l border-white/5">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-saudi-gold/10 rounded-2xl">
                    <Shield className="w-8 h-8 text-saudi-gold" />
                  </div>
                  <h2 className="text-3xl font-black text-saudi-gold uppercase tracking-tighter">الموجز الاستراتيجي الذكي</h2>
               </div>
               <div className="p-10 bg-black rounded-[2.5rem] border border-white/5">
                  <p className="text-2xl font-medium text-slate-200 leading-relaxed italic">
                    "{strategicData.summary || 'جاري استخراج الرؤية الاستراتيجية...'}"
                  </p>
               </div>
               <div className="flex flex-wrap gap-5">
                  {strategicData.key_takeaways.map((take, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                       <Zap className="w-5 h-5 text-saudi-gold" />
                       <span className="text-[13px] font-bold text-slate-400">{take}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-4 p-14 bg-black flex flex-col items-center justify-center text-center">
               <div className="relative mb-10 w-56 h-56">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="20" fill="transparent" className="text-zinc-900" />
                    <circle cx="100" cy="100" r={radius} stroke="#C5A059" strokeWidth="20" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * analytics.averageBias) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-6xl font-black text-saudi-gold tracking-tighter">{analytics.averageBias}%</span>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">مؤشر التحيز</span>
                  </div>
               </div>
               <h4 className="font-black text-slate-200 text-2xl">رادار النزاهة التحريرية</h4>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 official-card p-14 rounded-[3.5rem] flex flex-col min-h-[550px] bg-black">
           <div className="flex items-center gap-6 mb-16">
              <RadarIcon className="w-8 h-8 text-saudi-gold" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">أركان التأثير الاستراتيجي</h3>
           </div>
           <div className="flex-1 w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={strategicData.metrics.length > 0 ? strategicData.metrics : [
                   {category: 'الاستقرار', value: 50}, {category: 'الاقتصاد', value: 50}, {category: 'الأمن', value: 50}, {category: 'التقنية', value: 50}
                 ]}>
                    <PolarGrid stroke="#ffffff11" />
                    <PolarAngleAxis dataKey="category" tick={{fill: '#94a3b8', fontSize: 14, fontWeight: 'bold'}} />
                    <ReRadar name="المستوى" dataKey="value" stroke="#C5A059" fill="#C5A059" fillOpacity={0.6} />
                    <ReTooltip contentStyle={{backgroundColor: '#000', borderRadius: '12px', border: '1px solid #C5A05922'}} />
                 </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 official-card p-14 rounded-[3.5rem] flex flex-col min-h-[550px] bg-black">
           <div className="flex flex-col items-center text-center space-y-4 mb-14">
              <PieIcon className="w-8 h-8 text-emerald-500" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">توزع المشاعر العامة</h3>
           </div>
           <div className="flex-1 relative flex items-center justify-center min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={analytics.sentimentData}
                       cx="50%" cy="50%"
                       innerRadius={80} outerRadius={110}
                       paddingAngle={10}
                       dataKey="value"
                       stroke="none"
                    >
                       {analytics.sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <ReTooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                 <Activity className="w-8 h-8 text-saudi-gold mb-2" />
                 <span className="text-2xl font-black text-white">مستقر</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
