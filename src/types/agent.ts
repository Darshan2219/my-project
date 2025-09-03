import { Portfolio, Asset } from './portfolio';
import { Recommendation } from './analysis';

export interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
  riskLimits: RiskLimits;
  tradingLimits: TradingLimits;
  decisionThresholds: DecisionThresholds;
  autonomyLevel: AutonomyLevel;
  marketDataSources: string[];
  executionSettings: ExecutionSettings;
}

export interface RiskLimits {
  maxSingleAssetWeight: number;
  maxSectorConcentration: number;
  maxCreditRiskExposure: number;
  maxDailyVaR: number;
  maxDrawdown: number;
  minLiquidityRatio: number;
}

export interface TradingLimits {
  maxDailyTradeVolume: number;
  maxSingleTradeSize: number;
  maxTradesPerHour: number;
  allowedAssetTypes: string[];
  restrictedAssets: string[];
  tradingHours: TradingHours;
}

export interface TradingHours {
  start: string;
  end: string;
  timezone: string;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
}

export interface DecisionThresholds {
  criticalRebalanceThreshold: number;
  highRebalanceThreshold: number;
  riskToleranceDeviation: number;
  yieldOptimizationThreshold: number;
  liquidityStressThreshold: number;
}

export type AutonomyLevel = 'FULL_AUTO' | 'SEMI_AUTO' | 'ADVISORY_ONLY';

export interface ExecutionSettings {
  slippageTolerance: number;
  executionTimeframe: number;
  orderType: 'MARKET' | 'LIMIT' | 'SMART';
  confirmationRequired: boolean;
  simulationMode: boolean;
}

export interface AgentDecision {
  id: string;
  timestamp: Date;
  decisionType: DecisionType;
  recommendation: Recommendation;
  reasoning: string;
  confidence: number;
  riskAssessment: string;
  expectedOutcome: ExpectedOutcome;
  status: DecisionStatus;
  executionDetails?: ExecutionDetails;
}

export type DecisionType = 
  | 'AUTO_REBALANCE'
  | 'RISK_MITIGATION'
  | 'YIELD_OPTIMIZATION'
  | 'EMERGENCY_HEDGE'
  | 'LIQUIDITY_MANAGEMENT'
  | 'OPPORTUNISTIC_TRADE';

export interface ExpectedOutcome {
  riskReduction?: number;
  yieldImprovement?: number;
  liquidityImprovement?: number;
  costEstimate: number;
  timeframe: string;
}

export type DecisionStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

export interface ExecutionDetails {
  trades: TradeExecution[];
  totalCost: number;
  executionTime: number;
  slippage: number;
  success: boolean;
  errors?: string[];
}

export interface TradeExecution {
  id: string;
  asset: Asset;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  status: 'PENDING' | 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'FAILED';
}

export interface MarketData {
  timestamp: Date;
  prices: { [assetId: string]: number };
  yields: { [assetId: string]: number };
  creditSpreads: { [rating: string]: number };
  volatilities: { [assetId: string]: number };
  liquidityScores: { [assetId: string]: number };
  marketSentiment: MarketSentiment;
}

export interface MarketSentiment {
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  creditMarkets: 'TIGHTENING' | 'WIDENING' | 'STABLE';
  interestRates: 'RISING' | 'FALLING' | 'STABLE';
  volatility: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AgentState {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  lastDecision: Date;
  totalDecisions: number;
  successRate: number;
  currentPortfolio: Portfolio;
  watchlist: Asset[];
  alerts: Alert[];
  performance: AgentPerformance;
}

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: AlertType;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export type AlertType =
  | 'RISK_LIMIT_BREACH'
  | 'TRADING_LIMIT_EXCEEDED'
  | 'MARKET_ANOMALY'
  | 'EXECUTION_FAILURE'
  | 'DATA_QUALITY_ISSUE'
  | 'SYSTEM_ERROR';

export interface AgentPerformance {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgDecisionTime: number;
  riskAdjustedReturn: number;
  benchmarkOutperformance: number;
}