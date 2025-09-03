export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  sector?: string;
  currentPrice: number;
  quantity: number;
  marketValue: number;
  weight: number;
  lastUpdated: Date;
}

export interface Loan extends Asset {
  type: 'LOAN';
  loanType: LoanType;
  interestRate: number;
  maturityDate: Date;
  creditRating: CreditRating;
  loanToValue: number;
  monthlyPayment: number;
  remainingBalance: number;
}

export interface Security extends Asset {
  type: 'SECURITY';
  securityType: SecurityType;
  yield: number;
  duration?: number;
  beta?: number;
  creditRating?: CreditRating;
  maturityDate?: Date;
}

export type AssetType = 'LOAN' | 'SECURITY';

export type LoanType = 
  | 'RESIDENTIAL_MORTGAGE'
  | 'COMMERCIAL_MORTGAGE' 
  | 'PERSONAL_LOAN'
  | 'AUTO_LOAN'
  | 'STUDENT_LOAN';

export type SecurityType =
  | 'BOND'
  | 'STOCK'
  | 'ETF'
  | 'MBS'
  | 'ABS'
  | 'TREASURY';

export type CreditRating = 
  | 'AAA' | 'AA+' | 'AA' | 'AA-'
  | 'A+' | 'A' | 'A-'
  | 'BBB+' | 'BBB' | 'BBB-'
  | 'BB+' | 'BB' | 'BB-'
  | 'B+' | 'B' | 'B-'
  | 'CCC+' | 'CCC' | 'CCC-'
  | 'CC' | 'C' | 'D';

export interface Portfolio {
  id: string;
  name: string;
  assets: (Loan | Security)[];
  totalValue: number;
  createdAt: Date;
  lastUpdated: Date;
  riskProfile: RiskProfile;
  targetAllocation: AllocationTarget[];
}

export interface RiskProfile {
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  timeHorizon: number;
  liquidityNeeds: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AllocationTarget {
  assetType: AssetType;
  securityType?: SecurityType;
  loanType?: LoanType;
  targetWeight: number;
  minWeight?: number;
  maxWeight?: number;
}