
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Cpu, Crosshair, RefreshCw, Terminal, LayoutGrid, ListChecks, 
    ShieldCheck, BarChart3, Binary, Compass, Target, 
    Activity, TrendingUp, Info, AlertTriangle, Layers, BrainCircuit,
    Target as TargetIcon, Zap, Waves, Microscope, LineChart, 
    ArrowUpRight, ArrowDownRight, Minus, Send, Loader2, Gauge,
    Palette, Hash, Sparkles, ArrowUp, ArrowDown, ChevronDown, CheckCircle2
} from 'lucide-react';

import { DrawResult, LogEntry, PredictionResult, NumberFeature, PalaceMarkovState } from './types';
import { runPrediction, extractFeatures, simulatePSOConvergence } from './services/quantEngine';
import { DataEngine } from './services/dataEngine';
import { assessStrategy } from './services/geminiService';

// 增强型指标卡片 - 提升字号与易读性
const MetricCard = ({ label, value, subValue, color = "emerald" }: any) => (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-lg flex flex-col justify-center items-center text-center hover:border-slate-600 transition-all shadow-lg group">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-3xl font-mono font-black text-${color}-400 group-hover:scale-105 transition-transform`}>{value}</div>
        {subValue && <div className="text-[10px] text-slate-600 font-mono mt-1 font-bold">{subValue}</div>}
    </div>
);

// 趋势标签组件
const TrendIndicator = ({ trend }: { trend: '升' | '降' | '平' }) => {
    if (trend === '升') return <div className="flex items-center text-emerald-500 font-black"><ArrowUp size={14} className="mr-0.5" />升</div>;
    if (trend === '降') return <div className="flex items-center text-rose-500 font-black"><ArrowDown size={14} className="mr-0.5" />降</div>;
    return <div className="flex items-center text-slate-500 font-black"><Minus size={14} className="mr-0.5" />平</div>;
};

export default function App() {
    const [history, setHistory] = useState<DrawResult[]>([]);
    const [features, setFeatures] = useState<NumberFeature[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedDans, setSelectedDans] = useState<number[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('量化推演');
    
    // PSO 模拟数据
    const psoTrajectory = useMemo(() => simulatePSOConvergence(), []);

    // AI 审计状态
    const [userStrategy, setUserStrategy] = useState("");
    const [isAssessing, setIsAssessing] = useState(false);
    const [aiAssessment, setAiAssessment] = useState<any>(null);

    const addLog = useCallback((message: string, level: LogEntry['level'] = 'INFO') => {
        setLogs(prev => [{
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            level, message
        }, ...prev.slice(0, 50)]);
    }, []);

    const sync = async () => {
        setIsSyncing(true);
        try {
            const result = await DataEngine.runETLPipeline(selectedDans, (msg) => addLog(msg));
            setHistory(result.history);
            setFeatures(extractFeatures(result.history, result.history.length > 0 ? selectedDans : []));
            addLog(`系统对齐成功，样本总数 N=${result.history.length}`, "SYSTEM");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => { sync(); }, [selectedDans]);

    const prediction = useMemo(() => history.length ? runPrediction(history, selectedDans) : null, [history, selectedDans]);

    const handleAIAudit = async () => {
        if (!userStrategy || isAssessing) return;
        setIsAssessing(true);
        addLog("发起 AI 策略多维审计...", "SYSTEM");
        const result = await assessStrategy(userStrategy, history, features);
        setAiAssessment(result);
        setIsAssessing(false);
        addLog("AI 审计完成，推演结果已同步。", "SUCCESS" as any);
    };

    return (
        <div className="h-screen flex flex-col bg-[#020617] text-slate-200 overflow-hidden font-sans">
            {/* 顶栏优化：增强品牌感与全局状态 */}
            <header className="h-20 border-b border-slate-800 bg-slate-950/90 flex items-center px-8 gap-10 shrink-0 z-30 backdrop-blur-2xl">
                <div className="flex items-center gap-4 pr-10 border-r border-slate-800/50">
                    <div className="p-3 bg-emerald-500 rounded-lg shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                        <Cpu size={28} className="text-slate-950" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight italic uppercase leading-tight">
                            KL8 <span className="text-emerald-500">SUPREME</span> QUANT
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Professional Workstation V5.3</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-5 gap-4">
                    <MetricCard label="信息熵(Entropy)" value={prediction?.entropy.toFixed(4) || "0.0000"} color="emerald" subValue="STABILITY_INDEX" />
                    <MetricCard label="适应度(Fitness)" value={prediction?.psoFitness.toFixed(4) || "0.0000"} color="sky" subValue="PSO_CONVERGENCE" />
                    <MetricCard label="混沌度(Lyapunov)" value={prediction?.lyapunov.toFixed(4) || "0.0000"} color="amber" subValue="CHOS_LAMBDA" />
                    <MetricCard label="R-Ratio" value={prediction?.rRatio.toFixed(2) || "0.00"} color="rose" subValue="EFFICIENCY" />
                    <MetricCard label="置信度" value={prediction?.confidence === '高' ? '94.2%' : 'SYNCING'} color="emerald" subValue="BACKTEST_SCORE" />
                </div>

                <div className="flex items-center gap-6 pl-10 border-l border-slate-800/50">
                    <button onClick={sync} className="flex flex-col items-center justify-center p-3 hover:bg-slate-800 rounded-xl transition-all group active:scale-95">
                        <RefreshCw size={24} className={`${isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                        <span className="text-[10px] font-black mt-2 text-slate-500 uppercase group-hover:text-emerald-500">Sync Data</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* 左侧控制面板：合并号码选择与AI输入 */}
                <aside className="w-[380px] border-r border-slate-800 bg-slate-950/40 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto scroll-v">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="text-sm font-black text-slate-300 uppercase flex items-center gap-2">
                                <Crosshair size={18} className="text-emerald-500" /> 号码注入中心
                            </span>
                            <span className="font-mono text-emerald-400 text-sm font-black px-2 py-0.5 bg-emerald-500/10 rounded">{selectedDans.length}/2</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({length: 80}, (_, i) => i + 1).map(n => {
                                const active = selectedDans.includes(n);
                                return (
                                    <button 
                                        key={n} 
                                        onClick={() => {
                                            if(active) setSelectedDans(p => p.filter(x => x !== n));
                                            else if(selectedDans.length < 2) setSelectedDans(p => [...p, n]);
                                        }}
                                        className={`h-11 rounded-md font-mono text-sm border transition-all flex items-center justify-center ${active ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                                    >
                                        {String(n).padStart(2, '0')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <BrainCircuit size={18} className="text-sky-500" />
                            <span className="text-sm font-black text-slate-300 uppercase">AI 策略审计终端</span>
                        </div>
                        <div className="relative group">
                            <textarea 
                                value={userStrategy}
                                onChange={(e) => setUserStrategy(e.target.value)}
                                placeholder="输入您的量化策略灵感..."
                                className="w-full h-40 bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700 resize-none shadow-inner"
                            />
                            <button 
                                onClick={handleAIAudit}
                                disabled={isAssessing || !userStrategy}
                                className={`absolute bottom-3 right-3 flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${isAssessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] active:scale-95'}`}
                            >
                                {isAssessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Audit
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Terminal size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Pipeline Events</span>
                        </div>
                        <div className="h-48 overflow-y-auto font-mono text-[11px] space-y-2 scroll-v text-slate-500">
                            {logs.map((l, i) => (
                                <div key={i} className={`flex gap-3 items-start border-l-2 pl-3 ${l.level === 'SYSTEM' ? 'border-emerald-500 text-emerald-500/80' : 'border-slate-800'}`}>
                                    <span className="opacity-40 shrink-0">{l.timestamp}</span>
                                    <span>{l.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* 右侧主分析区：长图流式看板布局 */}
                <section className="flex-1 flex flex-col overflow-hidden bg-slate-950/20">
                    {/* 导航切换：平铺式页签 */}
                    <div className="p-2 bg-slate-950/40 border-b border-slate-800 flex gap-2">
                        {['量化推演', '多维矩阵', '数理拓扑'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setActiveTab(t)}
                                className={`px-10 py-3 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${activeTab === t ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* 内容展示区：大字号、高间距 */}
                    <div className="flex-1 overflow-y-auto p-8 scroll-v">
                        {activeTab === '量化推演' && (
                            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
                                {/* 推演结果区块 */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Target size={120} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-800/50 pb-4">
                                            <TargetIcon className="text-emerald-500" size={24} />
                                            <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400">选 2 追 6 (中5+ 概率最优集)</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-5 justify-center">
                                            {selectedDans.map(n => (
                                                <div key={n} className="w-20 h-20 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-2xl animate-pulse">
                                                    <span className="text-5xl font-mono">{n}</span>
                                                </div>
                                            ))}
                                            {prediction?.pick2[0].map(n => (
                                                <div key={n} className="w-16 h-16 border-2 border-emerald-500/40 rounded-xl flex items-center justify-center text-emerald-400 font-black bg-emerald-500/5 hover:bg-emerald-500/20 transition-all cursor-pointer">
                                                    <span className="text-4xl font-mono">{n}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <ShieldCheck size={120} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-800/50 pb-4">
                                            <ShieldCheck className="text-sky-500" size={24} />
                                            <h2 className="text-lg font-black uppercase tracking-widest text-sky-400">贝叶斯最优 4 胆 (趋势核心)</h2>
                                        </div>
                                        <div className="flex justify-center gap-8">
                                            {prediction?.pick4Dan.map(n => (
                                                <div key={n} className="w-20 h-20 border-2 border-sky-500/50 rounded-xl flex items-center justify-center text-sky-300 font-black bg-sky-500/5 shadow-inner">
                                                    <span className="text-5xl font-mono">{n}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* PSO 图表区块 */}
                                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                                        <div className="flex items-center gap-3">
                                            <Activity className="text-emerald-500" size={24} />
                                            <h2 className="text-lg font-black uppercase tracking-widest">PSO 粒子群动态收敛演化系统</h2>
                                        </div>
                                        <div className="text-sm font-mono text-emerald-500 font-black bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20">
                                            TARGET: 0.8534
                                        </div>
                                    </div>
                                    <div className="h-64 flex items-end gap-2.5 px-4 pb-4">
                                        {psoTrajectory.map((val, i) => (
                                            <div 
                                                key={i} 
                                                className="flex-1 bg-emerald-500/20 border-t-2 border-emerald-500/60 rounded-t-lg transition-all duration-1000 hover:bg-emerald-500/50" 
                                                style={{ height: `${val * 100}%`, opacity: 0.4 + (i / 40) }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* AI 审计结果区块 */}
                                {aiAssessment && (
                                    <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 animate-in slide-in-from-bottom duration-700 shadow-[0_20px_50px_rgba(16,185,129,0.1)]">
                                        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
                                            <CheckCircle2 className="text-emerald-500" size={28} />
                                            <h2 className="text-xl font-black uppercase tracking-widest text-white">AI 神经网络诊断报告</h2>
                                        </div>
                                        <div className="grid grid-cols-3 gap-8 mb-8">
                                            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                                                <div className="text-xs text-slate-500 font-black uppercase mb-2">综合评分</div>
                                                <div className="text-5xl font-mono font-black text-emerald-400">{aiAssessment.score}</div>
                                            </div>
                                            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                                                <div className="text-xs text-slate-500 font-black uppercase mb-2">信号强度</div>
                                                <div className="text-4xl font-mono font-black text-sky-400 uppercase tracking-tighter">{aiAssessment.trend}</div>
                                            </div>
                                            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                                                <div className="text-xs text-slate-500 font-black uppercase mb-2">置信等级</div>
                                                <div className="text-4xl font-mono font-black text-amber-400">{aiAssessment.confidence}</div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-6 rounded-r-xl">
                                            <div className="text-sm font-black text-emerald-500 uppercase mb-3 flex items-center gap-2">
                                                <Sparkles size={16} /> 专家诊断逻辑:
                                            </div>
                                            <p className="text-base leading-relaxed text-slate-300 font-medium italic">
                                                "{aiAssessment.reasoning}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === '多维矩阵' && (
                            <div className="max-w-7xl mx-auto animate-in zoom-in-95 duration-500">
                                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <Microscope size={28} className="text-emerald-500" />
                                            <h2 className="text-xl font-black uppercase tracking-widest">全量号码特征映射矩阵 (N={history.length})</h2>
                                        </div>
                                        <div className="flex items-center gap-6 px-6 py-2 bg-slate-950 rounded-full border border-slate-800">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div><span className="text-xs font-bold">热</span></div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div><span className="text-xs font-bold">温</span></div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-700"></div><span className="text-xs font-bold">冷</span></div>
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <table className="w-full text-left border-collapse font-mono text-sm">
                                            <thead>
                                                <tr className="text-slate-500 border-b border-slate-800 uppercase tracking-widest text-xs">
                                                    <th className="p-4 w-20 text-center">号码 #</th>
                                                    <th className="p-4">频率(Hits)</th>
                                                    <th className="p-4 w-48">MA30 强度</th>
                                                    <th className="p-4">当前遗漏</th>
                                                    <th className="p-4">最大遗漏</th>
                                                    <th className="p-4 text-center">走势</th>
                                                    <th className="p-4 text-emerald-500">Markov</th>
                                                    <th className="p-4 text-amber-500">Bayesian</th>
                                                    <th className="p-4 text-center">状态层级</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {features.map(f => (
                                                    <tr key={f.num} className="border-b border-slate-900/50 hover:bg-slate-800/20 transition-all group">
                                                        <td className="p-4 font-black text-xl text-white text-center bg-slate-900/20 group-hover:text-emerald-400 group-hover:bg-emerald-500/10">
                                                            {String(f.num).padStart(2, '0')}
                                                        </td>
                                                        <td className="p-4 text-slate-400 font-bold">{f.freq}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                                    <div className={`h-full transition-all duration-1000 ${f.ma30 >= 0.3 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, f.ma30*250)}%` }}></div>
                                                                </div>
                                                                <span className="font-black">{(f.ma30*100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className={`p-4 font-black text-lg ${f.currentGap > 12 ? 'text-rose-500' : 'text-slate-300'}`}>{f.currentGap}</td>
                                                        <td className="p-4 text-slate-500 font-bold">{f.maxGap}</td>
                                                        <td className="p-4 text-center">
                                                            <TrendIndicator trend={f.trend} />
                                                        </td>
                                                        <td className="p-4 text-emerald-500 font-black text-lg">{(f.markovProb*100).toFixed(1)}%</td>
                                                        <td className="p-4 text-amber-500 font-black text-lg">{(f.bayesianPost*100).toFixed(1)}%</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase border-2 shadow-sm ${
                                                                f.hotLevel === '热' ? 'bg-rose-500/20 text-rose-500 border-rose-500/40' : 
                                                                f.hotLevel === '温' ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' : 
                                                                'bg-slate-800/50 text-slate-500 border-slate-700 opacity-60'
                                                            }`}>
                                                                {f.hotLevel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === '数理拓扑' && (
                            <div className="max-w-7xl mx-auto space-y-10 animate-in slide-in-from-top duration-500">
                                {/* 尾数分析增强 */}
                                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                        <Palette className="text-emerald-500" size={24} />
                                        <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">尾数多维增强属性流 (Ch 10.3)</h2>
                                    </div>
                                    <div className="grid grid-cols-5 gap-6">
                                        {prediction?.tailFeatures.map(tf => (
                                            <div key={tf.tail} className="bg-slate-950 p-6 border border-slate-800 rounded-xl hover:border-emerald-500/40 transition-all shadow-inner relative group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-3xl font-mono shadow-2xl">
                                                        {tf.tail}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-slate-500 uppercase font-black">Heat Score</div>
                                                        <div className="text-2xl font-mono font-black text-emerald-500">{tf.count}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white uppercase ${tf.properties.color === '红' ? 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)]' : tf.properties.color === '绿' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.4)]' : 'bg-sky-600 shadow-[0_0_10px_rgba(2,132,199,0.4)]'}`}>
                                                            {tf.properties.color}波
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-indigo-600/30 text-indigo-300 border border-indigo-600/40 rounded text-[10px] font-black uppercase">
                                                            {tf.properties.fiveElements}性
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-black uppercase">
                                                            {tf.properties.size}数
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        <div className="bg-slate-900 py-1 text-center rounded text-[10px] font-black text-slate-500 uppercase">
                                                            {tf.properties.isYang ? '阳' : '阴'}
                                                        </div>
                                                        <div className="bg-slate-900 py-1 text-center rounded text-[10px] font-black text-slate-500 uppercase">
                                                            {tf.properties.isOdd ? '奇' : '偶'}
                                                        </div>
                                                        <div className="bg-slate-900 py-1 text-center rounded text-[10px] font-black text-slate-500 uppercase">
                                                            {tf.properties.isPrime ? '质' : '合'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* 装饰进度条 */}
                                                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 rounded-b-xl overflow-hidden w-full">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, tf.count*5)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 空间矩阵区块 */}
                                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                        <Layers className="text-sky-500" size={24} />
                                        <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">号码空间拓扑映射矩阵 (8×10)</h2>
                                    </div>
                                    <div className="grid grid-cols-10 gap-3">
                                        {prediction?.spatialMatrix.flat().map((v, i) => (
                                            <div key={i} className="aspect-square flex flex-col items-center justify-center border border-slate-800/40 relative group overflow-hidden bg-slate-950/20 rounded-xl hover:border-sky-500/50 transition-all cursor-crosshair shadow-inner">
                                                <div className="absolute inset-0 bg-sky-500 pointer-events-none transition-all duration-1000" style={{ opacity: Math.min(v/22, 0.45) }} />
                                                <span className="text-xs font-mono font-black text-slate-600 z-10 group-hover:text-white transition-colors">{i+1}</span>
                                                <span className="text-2xl font-mono font-black text-white z-10 drop-shadow-lg">{v.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* 页脚增强：实时状态 */}
            <footer className="h-10 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between px-8 text-xs font-black uppercase tracking-widest text-slate-500 shrink-0 z-30">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        <span>Kernel <span className="text-emerald-500">STABLE_V5.3.7</span></span>
                    </div>
                    <div className="flex items-center gap-3 border-l border-slate-800 pl-10">
                        <Activity size={14} className="text-sky-500" />
                        <span>Stream <span className="text-sky-400">SYNC_OK</span></span>
                    </div>
                    <div className="flex items-center gap-3 border-l border-slate-800 pl-10">
                        <ListChecks size={14} className="text-amber-500" />
                        <span>Samples <span className="text-amber-400">{history.length} 期载入</span></span>
                    </div>
                </div>
                <div className="italic flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    <AlertTriangle size={14} className="text-amber-500" /> 
                    <span>量子分析结果仅供科研参考，风险自负</span>
                </div>
            </footer>
        </div>
    );
}
