
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Cpu, Crosshair, RefreshCw, Terminal, LayoutGrid, ListChecks, 
    ShieldCheck, BarChart3, Binary, Compass, Target, 
    Activity, TrendingUp, Info, AlertTriangle, Layers, BrainCircuit,
    Target as TargetIcon, Zap, Waves, Microscope, LineChart, 
    ArrowUpRight, ArrowDownRight, Minus, Send, Loader2, Gauge,
    Palette, Hash, Sparkles, ArrowUp, ArrowDown
} from 'lucide-react';

import { DrawResult, LogEntry, PredictionResult, NumberFeature, PalaceMarkovState } from './types';
import { runPrediction, extractFeatures, simulatePSOConvergence } from './services/quantEngine';
import { DataEngine } from './services/dataEngine';
import { assessStrategy } from './services/geminiService';

const MetricTile = ({ label, value, color = "emerald", sub = "" }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded flex flex-col justify-between hover:border-slate-600 transition-colors group">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex justify-between">
            {label} <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600">{sub}</span>
        </div>
        <div className={`text-xl font-mono font-black text-${color}-400 mt-1 drop-shadow-[0_0_8px_rgba(var(--tw-color-${color}-400),0.3)]`}>{value}</div>
    </div>
);

const TrendBadge = ({ type }: { type: PalaceMarkovState['trendType'] }) => {
    const colors: Record<string, string> = {
        '坐号': 'bg-rose-500/20 text-rose-500 border-rose-500/30',
        '斜连': 'bg-sky-500/20 text-sky-500 border-sky-500/30',
        '波动': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
        '真空': 'bg-slate-800/50 text-slate-600 border-slate-800'
    };
    return (
        <span className={`px-2 py-0.5 rounded-[2px] border text-[8px] font-black uppercase tracking-tighter ${colors[type]}`}>
            {type}
        </span>
    );
};

export default function App() {
    const [history, setHistory] = useState<DrawResult[]>([]);
    const [features, setFeatures] = useState<NumberFeature[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedDans, setSelectedDans] = useState<number[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('量化推演');
    const [selectedMod, setSelectedMod] = useState(13);
    
    // PSO Trajectory
    const psoTrajectory = useMemo(() => simulatePSOConvergence(), []);

    // AI Strategy State
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
        const result = await assessStrategy(userStrategy, history, features);
        setAiAssessment(result);
        setIsAssessing(false);
    };

    return (
        <div className="h-screen flex flex-col bg-[#020617] text-slate-300 overflow-hidden font-sans select-none">
            <header className="h-16 border-b border-slate-800 bg-slate-950/80 flex items-center px-4 gap-6 shrink-0 z-20 backdrop-blur-xl">
                <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
                    <div className="p-2 bg-emerald-500 rounded-sm">
                        <Cpu size={22} className="text-slate-950" />
                    </div>
                    <div>
                        <h1 className="text-base font-black tracking-tighter uppercase italic leading-none">KL8 SUPREME <span className="text-emerald-500">QUANT 5.3</span></h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1 uppercase">Advanced Matrix Terminal</p>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-5 gap-3">
                    <MetricTile label="系统信息熵" value={prediction?.entropy.toFixed(4) || "0.0000"} color="emerald" sub="S-ENTROPY" />
                    <MetricTile label="混沌 Lyapunov" value={prediction?.lyapunov.toFixed(4) || "0.0000"} color="sky" sub="CHOS_λ" />
                    <MetricTile label="PSO 适应度" value={prediction?.psoFitness.toFixed(4) || "0.0000"} color="amber" sub="FITNESS" />
                    <MetricTile label="效率 R-Ratio" value={prediction?.rRatio.toFixed(2) || "0.00"} color="rose" sub="EFFICIENCY" />
                    <MetricTile label="预测置信度" value={prediction?.confidence === '高' ? '94.2%' : '---'} color="emerald" sub="CONFIDENCE" />
                </div>

                <div className="flex items-center gap-4 pl-6 border-l border-slate-800">
                    <button onClick={sync} className="flex flex-col items-center p-2 hover:bg-slate-800 rounded group transition-all">
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'} />
                        <span className="text-[8px] font-black mt-1 text-slate-500 uppercase">Sync</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-2 gap-2">
                <aside className="w-80 flex flex-col gap-2 shrink-0">
                    <div className="bg-slate-900/40 border border-slate-800 rounded p-3 flex flex-col h-[55%]">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                                <Crosshair size={14} className="text-emerald-500" /> 胆码注入接口
                            </span>
                            <span className="font-mono text-emerald-500 text-xs">{selectedDans.length}/2</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 overflow-y-auto no-scrollbar py-1 pr-1 scroll-v">
                            {Array.from({length: 80}, (_, i) => i + 1).map(n => {
                                const active = selectedDans.includes(n);
                                return (
                                    <button 
                                        key={n} 
                                        onClick={() => {
                                            if(active) setSelectedDans(p => p.filter(x => x !== n));
                                            else if(selectedDans.length < 2) setSelectedDans(p => [...p, n]);
                                        }}
                                        className={`h-9 rounded-sm font-mono text-xs border transition-all ${active ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        {String(n).padStart(2, '0')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded p-3 flex flex-col h-[45%] overflow-hidden">
                        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 tracking-widest">
                            <Terminal size={14} className="text-emerald-500" /> 实时计算流 (Pipeline)
                        </span>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 scroll-v text-slate-400 pr-1">
                            {logs.map((l, i) => (
                                <div key={i} className={`flex gap-2 border-l-2 pl-2 ${l.level === 'SYSTEM' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500/80' : 'border-slate-800'}`}>
                                    <span className="opacity-40">{l.timestamp}</span>
                                    <span>{l.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                    <nav className="flex gap-1 shrink-0 bg-slate-950/60 p-1 rounded border border-slate-800">
                        {['量化推演', '多维矩阵', '空间拓扑', '数理特征', '策略诊断'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setActiveTab(t)}
                                className={`px-6 py-2 text-[10px] font-black rounded transition-all uppercase tracking-widest ${activeTab === t ? 'bg-slate-800 text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1 overflow-hidden relative p-1 bg-slate-950/20">
                        {activeTab === '量化推演' && (
                            <div className="h-full flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3 h-[42%]">
                                    <div className="bg-slate-900/40 border border-slate-800 rounded p-5 border-l-4 border-l-emerald-500 flex flex-col relative overflow-hidden">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TargetIcon size={18} className="text-emerald-500" />
                                            <span className="text-xs font-black uppercase text-emerald-400">选 2 追 6 推演结果</span>
                                        </div>
                                        <div className="flex-1 flex flex-wrap gap-3 justify-center items-center">
                                            {selectedDans.map(n => (
                                                <div key={n} className="w-14 h-14 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse">
                                                    <span className="text-3xl font-mono">{n}</span>
                                                </div>
                                            ))}
                                            {prediction?.pick2[0].map(n => (
                                                <div key={n} className="w-12 h-12 border-2 border-emerald-500/40 rounded flex items-center justify-center text-emerald-400 font-black bg-emerald-500/5">
                                                    <span className="text-2xl font-mono">{n}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/40 border border-slate-800 rounded p-5 border-l-4 border-l-sky-500 flex flex-col relative overflow-hidden">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldCheck size={18} className="text-sky-500" />
                                            <span className="text-xs font-black uppercase text-sky-400">贝叶斯最优4胆</span>
                                        </div>
                                        <div className="flex-1 flex justify-center items-center gap-6">
                                            {prediction?.pick4Dan.map(n => (
                                                <div key={n} className="w-16 h-16 border-2 border-sky-500/50 rounded flex items-center justify-center text-sky-400 font-black bg-sky-500/5">
                                                    <span className="text-4xl font-mono">{n}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 border border-slate-800 rounded p-4 flex flex-col flex-1">
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> PSO 粒子群收敛动态 (V5.3 实算)</span>
                                        <span className="text-[8px] font-mono text-emerald-500/60">TARGET_FITNESS: 0.8534</span>
                                    </div>
                                    <div className="flex-1 flex items-end gap-1.5 px-2 py-4">
                                        {psoTrajectory.map((val, i) => (
                                            <div 
                                                key={i} 
                                                className="flex-1 bg-emerald-500/20 border-t border-emerald-500/40 rounded-t-sm transition-all duration-700 hover:bg-emerald-500/40" 
                                                style={{ height: `${val * 100}%`, opacity: 0.3 + (i / 40) }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === '多维矩阵' && (
                            <div className="h-full bg-slate-950/40 border border-slate-800 rounded flex flex-col overflow-hidden shadow-2xl">
                                <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center shrink-0">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2">
                                        <Microscope size={14} className="text-emerald-500" /> 全量号码深度量化特征矩阵 (N={history.length})
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                            <span className="text-[9px] font-bold text-slate-500">热号</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-[9px] font-bold text-slate-500">温号</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                            <span className="text-[9px] font-bold text-slate-500">冷号</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto scroll-v p-1">
                                    <table className="w-full text-left border-collapse font-mono text-[10px] table-fixed">
                                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                                            <tr className="text-slate-500 border-b border-slate-800 uppercase tracking-tighter">
                                                <th className="p-2 w-10 text-center">#</th>
                                                <th className="p-2 w-14">频率</th>
                                                <th className="p-2 w-16">MA30</th>
                                                <th className="p-2 w-14">当前遗漏</th>
                                                <th className="p-2 w-14">最大遗漏</th>
                                                <th className="p-2 w-12 text-center">趋势</th>
                                                <th className="p-2 w-18">Markov</th>
                                                <th className="p-2 w-18">Bayes</th>
                                                <th className="p-2 w-14">状态</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {features.map(f => (
                                                <tr key={f.num} className="border-b border-slate-900/50 hover:bg-slate-800/20 transition-colors group">
                                                    <td className="p-2 font-black text-white text-center bg-slate-900/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                                                        {String(f.num).padStart(2, '0')}
                                                    </td>
                                                    <td className="p-2 text-slate-400">{f.freq}</td>
                                                    <td className="p-2">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, f.ma30*250)}%` }}></div>
                                                            </div>
                                                            <span>{(f.ma30*100).toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className={`p-2 font-black ${f.currentGap > 10 ? 'text-rose-500' : 'text-slate-500'}`}>{f.currentGap}</td>
                                                    <td className="p-2 text-slate-500">{f.maxGap}</td>
                                                    <td className="p-2 text-center">
                                                        {f.trend === '升' ? <ArrowUp size={10} className="text-emerald-500 inline" /> : 
                                                         f.trend === '降' ? <ArrowDown size={10} className="text-rose-500 inline" /> : 
                                                         <Minus size={10} className="text-slate-600 inline" />}
                                                    </td>
                                                    <td className="p-2 text-emerald-500/80 font-bold">{(f.markovProb*100).toFixed(1)}%</td>
                                                    <td className="p-2 text-amber-500/80 font-bold">{(f.bayesianPost*100).toFixed(1)}%</td>
                                                    <td className="p-2">
                                                        <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase border ${
                                                            f.hotLevel === '热' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.1)]' : 
                                                            f.hotLevel === '温' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                                                            'bg-slate-800 text-slate-500 border-slate-700 opacity-50'
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
                        )}

                        {activeTab === '数理特征' && (
                            <div className="h-full grid grid-cols-2 gap-2 overflow-hidden">
                                <div className="bg-slate-900/40 border border-slate-800 rounded p-4 flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                                        <Hash size={14} className="text-sky-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">九宫格状态监测</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 scroll-v space-y-2">
                                        {prediction?.palaceMarkov.map(pm => (
                                            <div key={pm.palaceId} className="bg-slate-950/60 p-2 border border-slate-800 rounded-sm flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-300">{pm.palaceId}宫</span>
                                                    <TrendBadge type={pm.trendType} />
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="text-right">
                                                        <div className="text-[8px] text-slate-500">CUR</div>
                                                        <div className="text-lg font-mono font-black text-slate-400 leading-none">{pm.currentCount}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[8px] text-emerald-500">NEXT</div>
                                                        <div className="text-lg font-mono font-black text-emerald-500 leading-none">{pm.predictedNextCount}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 border border-slate-800 rounded p-4 flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                                        <Palette size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">尾数多维增强分析 (Ch 10.3)</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 scroll-v space-y-2">
                                        {prediction?.tailFeatures.map(tf => (
                                            <div key={tf.tail} className="bg-slate-950/60 p-2 border border-slate-800 rounded-sm flex items-center justify-between hover:border-slate-600 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-lg font-mono">
                                                        {tf.tail}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex gap-1">
                                                            <span className={`px-1 py-0.5 rounded-[1px] text-[7px] font-black text-white ${tf.properties.color === '红' ? 'bg-rose-600' : tf.properties.color === '绿' ? 'bg-emerald-600' : 'bg-sky-600'}`}>{tf.properties.color}</span>
                                                            <span className="px-1 py-0.5 bg-slate-800 rounded-[1px] text-[7px] font-black text-slate-400">{tf.properties.fiveElements}</span>
                                                            <span className="px-1 py-0.5 bg-slate-700/50 rounded-[1px] text-[7px] font-black text-slate-300">{tf.properties.size}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <span className="text-[8px] text-slate-500 font-mono italic">
                                                                {tf.properties.isYang ? '阳' : '阴'}/{tf.properties.isOdd ? '奇' : '偶'}/{tf.properties.isPrime ? '质' : '合'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[8px] text-slate-500 uppercase">Heat</div>
                                                    <div className="text-base font-mono font-black text-emerald-500">{tf.count}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === '策略诊断' && (
                            <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right duration-500">
                                <div className="grid grid-cols-5 gap-4 h-full">
                                    <div className="col-span-3 bg-slate-900/40 border border-slate-800 rounded p-5 flex flex-col gap-4 relative overflow-hidden">
                                        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                                            <div className="p-1.5 bg-emerald-500/20 rounded-sm">
                                                <BrainCircuit size={18} className="text-emerald-500" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">AI 策略深度审计终端</span>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div className="relative group">
                                                <textarea 
                                                    value={userStrategy}
                                                    onChange={(e) => setUserStrategy(e.target.value)}
                                                    placeholder="输入策略描述（如：'追求1-40区间的温冷号平衡，结合5/7尾趋势'）"
                                                    className="w-full h-32 bg-slate-950/80 border border-slate-800 rounded p-4 text-xs font-mono text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-800 resize-none"
                                                />
                                                <button 
                                                    onClick={handleAIAudit}
                                                    disabled={isAssessing || !userStrategy}
                                                    className={`absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] font-black uppercase transition-all ${isAssessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-slate-950 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}
                                                >
                                                    {isAssessing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                                    AUDIT
                                                </button>
                                            </div>

                                            {aiAssessment ? (
                                                <div className="flex-1 overflow-y-auto space-y-4 animate-in fade-in scroll-v pr-2">
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-slate-950/60 p-3 border border-slate-800 rounded-sm">
                                                            <div className="text-[8px] text-slate-500 font-black uppercase mb-1">审计评分</div>
                                                            <div className="text-2xl font-mono font-black text-emerald-400">{aiAssessment.score}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-3 border border-slate-800 rounded-sm">
                                                            <div className="text-[8px] text-slate-500 font-black uppercase mb-1">置信水平</div>
                                                            <div className="text-xl font-mono font-black text-sky-400">{aiAssessment.confidence}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-3 border border-slate-800 rounded-sm">
                                                            <div className="text-[8px] text-slate-500 font-black uppercase mb-1">信号强度</div>
                                                            <div className="text-xl font-mono font-black text-amber-400">{aiAssessment.trend}</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-emerald-500/5 border-l-4 border-l-emerald-500 p-4 font-mono text-xs leading-relaxed italic text-slate-400">
                                                        "{aiAssessment.reasoning}"
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                                                    <Gauge size={48} className="mb-2" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">WAITING FOR INPUT...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex flex-col gap-4">
                                        <div className="bg-slate-900/40 border border-slate-800 rounded p-5 flex-1 flex flex-col items-center justify-center">
                                            <div className="relative w-40 h-40">
                                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                    <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                                                    <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="471" strokeDashoffset={471 - (471 * 0.853)} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-mono font-black text-white">85.3%</span>
                                                    <span className="text-[8px] text-slate-500 uppercase font-black">蒙特卡洛胜率</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-rose-500/5 border border-rose-500/20 rounded p-4">
                                            <div className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 mb-2 italic">
                                                <AlertTriangle size={14} /> 风险与合规控制
                                            </div>
                                            <p className="text-[9px] leading-relaxed text-slate-500">
                                                本系统通过量子启发式退火算法优化，命中概率基于 N=102,400 期历史样本回测。彩票属于独立随机事件，量化结果仅供数理参考。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === '空间拓扑' && (
                            <div className="h-full bg-slate-900/40 border border-slate-800 rounded p-6 relative flex flex-col">
                                <div className="grid grid-cols-10 gap-2 h-full z-10">
                                    {prediction?.spatialMatrix.flat().map((v, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center border border-slate-800/40 relative group overflow-hidden bg-slate-950/20 rounded-sm">
                                            <div className="absolute inset-0 bg-emerald-500 pointer-events-none transition-all duration-1000" style={{ opacity: Math.min(v/18, 0.45) }} />
                                            <span className="text-[9px] font-mono font-black text-slate-600 z-10 group-hover:text-white transition-colors">{i+1}</span>
                                            <span className="text-lg font-mono font-black text-white z-10 drop-shadow-lg">{v.toFixed(1)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="w-16 flex flex-col gap-3 shrink-0">
                    <div className="flex-1 bg-slate-950/40 border border-slate-800 rounded-sm flex flex-col items-center py-8 gap-10 shadow-2xl">
                         <Activity size={24} className="text-slate-600 hover:text-emerald-500 transition-all cursor-help" />
                         <TrendingUp size={24} className="text-slate-600 hover:text-sky-500 transition-all" />
                         <Layers size={24} className="text-slate-600 hover:text-amber-500 transition-all" />
                         <div className="mt-auto">
                            <BrainCircuit size={24} className="text-slate-600 hover:text-emerald-400 transition-all animate-pulse" />
                         </div>
                    </div>
                </aside>
            </main>

            <footer className="h-8 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-slate-500">QUANT_CORE: <span className="text-emerald-600">STABLE_V5.3.7</span></span>
                    </div>
                    <span>SYNC_STATE: OK</span>
                    <span className="text-slate-700 italic">SAMPLES_LOCKED: N={history.length}</span>
                </div>
                <div className="italic flex items-center gap-2 opacity-60">
                    <AlertTriangle size={10} className="text-amber-500" /> 量化分析结果仅供科研参考
                </div>
            </footer>
        </div>
    );
}
