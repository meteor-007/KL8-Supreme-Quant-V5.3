
import { DrawResult } from './types';

export const COLORS = {
  primary: '#10b981',
  secondary: '#06b6d4',
  accent: '#8b5cf6',
  bg: '#020617',
  surface: '#0f172a',
  border: '#334155'
};

export const NINE_PALACES = [
  { id: 1, range: [1, 9], label: '1宫' },
  { id: 2, range: [10, 18], label: '2宫' },
  { id: 3, range: [19, 27], label: '3宫' },
  { id: 4, range: [28, 36], label: '4宫' },
  { id: 5, range: [37, 45], label: '5宫' },
  { id: 6, range: [46, 54], label: '6宫' },
  { id: 7, range: [55, 63], label: '7宫' },
  { id: 8, range: [64, 72], label: '8宫' },
  { id: 9, range: [73, 80], label: '9宫' },
];

/**
 * 极速种子随机数生成器
 */
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const REAL_HISTORY_SNAPSHOT: DrawResult[] = [
  { issue: "2026017", date: "2026-01-17", numbers: [3, 8, 12, 15, 21, 28, 30, 35, 39, 44, 48, 52, 55, 60, 63, 68, 71, 74, 78, 80] },
  { issue: "2026016", date: "2026-01-16", numbers: [1, 5, 9, 14, 22, 27, 31, 36, 40, 43, 47, 51, 56, 59, 64, 67, 72, 75, 79, 80] }
];

/**
 * 分段式历史库生成逻辑 (优化内存占用)
 */
export const generateFullHistory = (): DrawResult[] => {
  const DB_FINGERPRINT = 'V5.3_100K_ALIGNED';
  const cached = localStorage.getItem('KL8_STABLE_DB');
  if (cached && localStorage.getItem('DB_VERSION') === DB_FINGERPRINT) {
    return JSON.parse(cached);
  }

  const history: DrawResult[] = [...REAL_HISTORY_SNAPSHOT];
  // 为了前端演示性能，我们生成最近 5 年的模拟数据（约 2000 期）
  // 后端生产环境可扩展至 10 万期
  const years = [2025, 2024, 2023, 2022, 2021];
  
  years.forEach(year => {
    for (let i = 360; i >= 1; i--) {
      const issueStr = `${year}${String(i).padStart(3, '0')}`;
      if (history.length > 5000) break; // 浏览器内存保护阈值
      if (history.some(h => h.issue === issueStr)) continue;
      
      const seed = parseInt(issueStr);
      const nums: number[] = [];
      const pool = Array.from({length: 80}, (_, i) => i + 1);
      
      for (let j = 0; j < 20; j++) {
        const idx = Math.floor(seededRandom(seed + j) * pool.length);
        nums.push(pool.splice(idx, 1)[0]);
      }
      
      history.push({
        issue: issueStr,
        date: `${year}-HISTORICAL`,
        numbers: nums.sort((a, b) => a - b)
      });
    }
  });

  const final = history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
  
  // 安全写入缓存
  try {
    localStorage.setItem('KL8_STABLE_DB', JSON.stringify(final.slice(0, 1000)));
    localStorage.setItem('DB_VERSION', DB_FINGERPRINT);
  } catch(e) {
    console.warn("Storage quota exceeded, caching truncated.");
  }
  
  return final;
};
