export type SourceChannel = 'Web' | 'WhatsApp' | 'OpenClaw';
export type StrategyStage = 'Draft Created' | 'Validation Needed' | 'Backtest Running' | 'Deployed' | 'Rank Updated';

export interface Strategy {
  id: string;
  rank: number;
  name: string;
  type: 'crowdsourced' | 'vanilla-llm' | 'my-strategy';
  assetClass: 'crypto' | 'equity' | 'currency' | 'cross-asset';
  accountValue: number;
  returnPct: number;
  totalPnL: number;
  fees: number;
  winRate: number;
  hwm: number;
  maxDrawdown: number;
  sharpe: number;
  trades: number;
  creator: string;
  sourceUrl: string;
  validationStatus: 'validated' | 'pending' | 'invalid';
  deployStatus: 'deployed' | 'backtesting' | 'draft';
  createdAt: string;
  description: string;
  skillProfile?: SkillProfile;
  sourceChannel: SourceChannel;
  stage?: StrategyStage;
  ownerKey?: string;
  ownerIp?: string;
  browserFingerprint?: string;
  deviceUuid?: string;
}

export interface SkillProfile {
  indicators: string[];
  entryConditions: string[];
  exitConditions: string[];
  riskManagement: string;
  positionSizing: string;
  timeframe: string;
  source: string;
  version: string;
}

export interface Trade {
  tradeId: string;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  returnPct: number;
  fees: number;
  exitReason: string;
}

export interface StrategySummary {
  startNAV: number;
  endNAV: number;
  returnPct: number;
  winRate: number;
  hwmPct: number;
  maxDrawdown: number;
  trades: number;
  lookbackPeriod: string;
}

export const mockTrades: Trade[] = [
  { tradeId: "T001", entryTime: "2026-01-15 09:30", exitTime: "2026-01-15 15:45", entryPrice: 185.20, exitPrice: 189.50, quantity: 50, pnl: 215.0, returnPct: 2.32, fees: 4.50, exitReason: "Take Profit" },
  { tradeId: "T002", entryTime: "2026-01-18 10:15", exitTime: "2026-01-19 11:00", entryPrice: 192.10, exitPrice: 188.30, quantity: 40, pnl: -152.0, returnPct: -1.98, fees: 3.80, exitReason: "Stop Loss" },
  { tradeId: "T003", entryTime: "2026-01-22 14:00", exitTime: "2026-01-23 09:45", entryPrice: 187.60, exitPrice: 193.20, quantity: 60, pnl: 336.0, returnPct: 2.99, fees: 5.20, exitReason: "Take Profit" },
  { tradeId: "T004", entryTime: "2026-02-01 09:30", exitTime: "2026-02-02 14:30", entryPrice: 195.00, exitPrice: 198.80, quantity: 45, pnl: 171.0, returnPct: 1.95, fees: 4.10, exitReason: "Trailing Stop" },
  { tradeId: "T005", entryTime: "2026-02-10 11:00", exitTime: "2026-02-10 15:30", entryPrice: 200.50, exitPrice: 197.20, quantity: 35, pnl: -115.5, returnPct: -1.65, fees: 3.50, exitReason: "Stop Loss" },
];

export const myStrategySummary: StrategySummary = {
  startNAV: 1000,
  endNAV: 1200,
  returnPct: 120.0,
  winRate: 50,
  hwmPct: 150,
  maxDrawdown: -50,
  trades: 20,
  lookbackPeriod: "2026/01/01-2026/02/27",
};
