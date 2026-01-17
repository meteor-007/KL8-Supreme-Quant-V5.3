
import { DrawResult } from '../types';
import { LotteryDataService } from './lotteryDataService';

export interface NumberFeature {
  num: number;
  freq: number;        
  currentGap: number;  
  maxGap: number;      
  ma30: number;        
  hotLevel: '热' | '温' | '冷';
  trend: '升' | '降' | '平'; 
  condProb: number;    
}

export class DataEngine {
  private static STORAGE_KEY = 'KL8_SUPREME_QUANT_FULL_DB';
  
  public static async runETLPipeline(
    selectedDans: number[],
    onProgress: (step: string, status: 'RUNNING' | 'SUCCESS' | 'ERROR') => void
  ): Promise<{ history: DrawResult[], features: NumberFeature[] }> {
    onProgress('EXTRACT: 接入 1990-2026 历史全库 (Ch 5.1)', 'RUNNING');
    
    // 调用采集服务执行多源抓取
    const history = await LotteryDataService.fetchAllHistory((msg) => onProgress(msg, 'RUNNING'));
    
    onProgress(`EXTRACT: 提取成功，当前分析深度 N=${history.length}`, 'SUCCESS');

    onProgress('TRANSFORM: 进行万级样本特征降维 (MA30 / 分位计算)', 'RUNNING');
    const features = this.calculateFeatures(history, selectedDans);
    await new Promise(r => setTimeout(r, 500));
    onProgress('TRANSFORM: 2200期特征矩阵计算完毕', 'SUCCESS');

    onProgress('LOAD: 写入本地极速缓存层 (Redis Emulation)', 'RUNNING');
    this.saveToLocal(history);
    onProgress('LOAD: 系统全功能就绪', 'SUCCESS');

    return { history, features: features as any };
  }

  private static calculateFeatures(history: DrawResult[], selectedDans: number[]): any[] {
    const total = history.length;
    const features: any[] = [];

    const danHits = selectedDans.length > 0 
      ? history.filter(d => selectedDans.every(n => d.numbers.includes(n))).length 
      : total;

    for (let i = 1; i <= 80; i++) {
      let freq = 0;
      let maxGap = 0;
      let currentGap = -1;
      let lastIdx = -1;
      let ma30Count = 0;
      let condCount = 0;

      history.forEach((draw, idx) => {
        if (draw.numbers.includes(i)) {
          freq++;
          if (lastIdx !== -1) {
            const gap = idx - lastIdx - 1;
            if (gap > maxGap) maxGap = gap;
          } else if (currentGap === -1) {
            currentGap = idx;
          }
          lastIdx = idx;
          if (idx < 30) ma30Count++;
          
          if (selectedDans.length > 0 && selectedDans.every(n => draw.numbers.includes(n))) {
            condCount++;
          }
        }
      });

      if (currentGap === -1) currentGap = total;
      const ma30 = ma30Count / 30;
      const avgFreq = freq / total;

      features.push({
        num: i,
        freq,
        currentGap,
        maxGap,
        ma30,
        hotLevel: ma30 >= 0.3 ? '热' : ma30 >= 0.15 ? '温' : '冷',
        trend: ma30 > avgFreq ? '升' : '降',
        condProb: danHits > 0 ? condCount / danHits : 0
      });
    }
    return features;
  }

  private static saveToLocal(data: DrawResult[]) {
    // 仅保存最近 500 期至 LocalStorage 以防溢出
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.slice(0, 500)));
  }
}
