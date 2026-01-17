
export interface DrawResult {
  issue: string;
  date: string;
  numbers: number[];
}

export interface NumberFeature {
  num: number;
  freq: number;        
  currentGap: number;  
  maxGap: number;      
  ma30: number;        
  hotLevel: '热' | '温' | '冷';
  trend: '升' | '降' | '平'; 
  condProb: number;    
  markovProb: number;  
  bayesianPost: number; 
}

export interface PalaceMarkovState {
  palaceId: number;
  currentCount: number;
  nextStateProbs: Record<number, number>; 
  trendType: '坐号' | '斜连' | '波动' | '真空'; 
  predictedNextCount: number;
  confidence: number;
}

export interface TailFeature {
  tail: number;
  count: number;
  properties: {
    size: '小' | '中' | '大';
    isOdd: boolean;
    isPrime: boolean;
    isYang: boolean; // 奇为阳，偶为阴
    fiveElements: '金' | '木' | '水' | '火' | '土';
    color: '红' | '蓝' | '绿'; 
  };
  trendScore: number;
}

export interface PredictionResult {
  pick2: number[][];
  pick4Dan: number[];
  covering7: number[][];
  confidence: '高' | '中' | '低';
  moduloStats: Record<number, { 
    remainder: number; 
    count: number; 
    cycleScore: number;
    predictedNumbers: number[]; // Ch 10.2 新增：基于余数预测的候选号
  }[]>;
  spatialMatrix: number[][]; 
  palaceMarkov: PalaceMarkovState[];
  tailFeatures: TailFeature[];
  rRatio: number; 
  psoFitness: number; 
  backtestScore: number; 
  riskLevel: 'SAFE' | 'WARN' | 'DANGER';
  entropy: number;
  lyapunov: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';
  message: string;
}
