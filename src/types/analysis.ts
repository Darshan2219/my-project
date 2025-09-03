import { Asset, Portfolio, AssetType, SecurityType, LoanType } from './portfolio';

export interface PortfolioAnalysis {
  portfolio: Portfolio;
  riskMetrics: RiskMetrics;
  performanceMetrics: PerformanceMetrics;
  allocationAnalysis: AllocationAnalysis;
  concentrationRisk: ConcentrationRisk;
  recommendations: Recommendation[];
  generatedAt: Date;
}

export interface RiskMetrics {
  totalRisk: number;
  volatility: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  valueAtRisk: number;
  expectedShortfall: number;
  creditRisk: number;
  interestRateRisk: number;
  liquidityRisk: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  yieldToMaturity: number;
  weightedAverageYield: number;
  duration: number;
  modifiedDuration: number;
}

export interface AllocationAnalysis {
  currentAllocation: AllocationBreakdown[];
  targetAllocation: AllocationBreakdown[];
  deviations: AllocationDeviation[];
  rebalancingNeeds: boolean;
}

export interface AllocationBreakdown {
  category: string;
  assetType?: AssetType;
  securityType?: SecurityType;
  loanType?: LoanType;
  currentWeight: number;
  targetWeight: number;
  value: number;
}

export interface AllocationDeviation {
  category: string;
  deviation: number;
  deviationPercent: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ConcentrationRisk {
  singleAssetMax: number;
  sectorConcentration: SectorConcentration[];
  creditRatingConcentration: CreditRatingConcentration[];
  maturityConcentration: MaturityConcentration[];
}

export interface SectorConcentration {
  sector: string;
  weight: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CreditRatingConcentration {
  rating: string;
  weight: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MaturityConcentration {
  maturityBucket: string;
  weight: number;
  averageMaturity: number;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  reasoning: string;
  actionItems: ActionItem[];
  impact: Impact;
}

export type RecommendationType =
  | 'REBALANCE'
  | 'SELL'
  | 'BUY'
  | 'HEDGE'
  | 'REDUCE_CONCENTRATION'
  | 'IMPROVE_DIVERSIFICATION'
  | 'CREDIT_RISK_MITIGATION'
  | 'DURATION_ADJUSTMENT'
  | 'YIELD_ENHANCEMENT';

export interface ActionItem {
  asset?: Asset;
  assetType?: AssetType;
  action: 'SELL' | 'BUY' | 'REDUCE' | 'INCREASE' | 'HEDGE';
  quantity?: number;
  percentage?: number;
  targetWeight?: number;
  rationale: string;
}

export interface Impact {
  riskReduction?: number;
  yieldImprovement?: number;
  diversificationImprovement?: number;
  estimatedCost?: number;
  timeframe: string;
}