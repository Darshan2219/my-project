import {
  Portfolio,
  Asset,
  Loan,
  Security,
  AllocationTarget
} from '../types/portfolio';
import { PortfolioUtils } from '../utils/PortfolioUtils';
import {
  PortfolioAnalysis,
  RiskMetrics,
  PerformanceMetrics,
  AllocationAnalysis,
  AllocationBreakdown,
  AllocationDeviation,
  ConcentrationRisk,
  SectorConcentration,
  CreditRatingConcentration,
  MaturityConcentration
} from '../types/analysis';

export class PortfolioAnalyzer {
  constructor() {}

  analyzePortfolio(portfolio: Portfolio): PortfolioAnalysis {
    const riskMetrics = this.calculateRiskMetrics(portfolio);
    const performanceMetrics = this.calculatePerformanceMetrics(portfolio);
    const allocationAnalysis = this.analyzeAllocation(portfolio);
    const concentrationRisk = this.assessConcentrationRisk(portfolio);

    return {
      portfolio,
      riskMetrics,
      performanceMetrics,
      allocationAnalysis,
      concentrationRisk,
      recommendations: [], // Will be populated by RebalancingEngine
      generatedAt: new Date()
    };
  }

  private calculateRiskMetrics(portfolio: Portfolio): RiskMetrics {
    const assets = portfolio.assets;
    const totalValue = portfolio.totalValue;

    let weightedVolatility = 0;
    let creditRisk = 0;
    let interestRateRisk = 0;
    let liquidityRisk = 0;

    assets.forEach(asset => {
      const weight = asset.weight;
      
      if (asset.type === 'SECURITY') {
        const security = asset as Security;
        weightedVolatility += weight * this.estimateVolatility(security);
        interestRateRisk += weight * (security.duration || 0) * 0.01;
      }
      
      if (asset.type === 'LOAN') {
        const loan = asset as Loan;
        creditRisk += weight * this.getCreditRiskScore(loan.creditRating);
        liquidityRisk += weight * 0.05;
      }
    });

    const valueAtRisk = totalValue * 0.05;
    const expectedShortfall = totalValue * 0.08;

    return {
      totalRisk: Math.sqrt(weightedVolatility + creditRisk + interestRateRisk),
      volatility: weightedVolatility,
      valueAtRisk,
      expectedShortfall,
      creditRisk,
      interestRateRisk,
      liquidityRisk
    };
  }

  private calculatePerformanceMetrics(portfolio: Portfolio): PerformanceMetrics {
    const assets = portfolio.assets;
    let weightedYield = 0;
    let weightedDuration = 0;

    assets.forEach(asset => {
      const weight = asset.weight;
      
      if (asset.type === 'SECURITY') {
        const security = asset as Security;
        weightedYield += weight * security.yield;
        weightedDuration += weight * (security.duration || 0);
      }
      
      if (asset.type === 'LOAN') {
        const loan = asset as Loan;
        weightedYield += weight * loan.interestRate;
        weightedDuration += weight * this.calculateLoanDuration(loan);
      }
    });

    return {
      totalReturn: 0,
      annualizedReturn: 0,
      yieldToMaturity: weightedYield,
      weightedAverageYield: weightedYield,
      duration: weightedDuration,
      modifiedDuration: weightedDuration / (1 + weightedYield / 100)
    };
  }

  private analyzeAllocation(portfolio: Portfolio): AllocationAnalysis {
    const currentAllocation = this.getCurrentAllocation(portfolio);
    const targetAllocation = this.getTargetAllocation(portfolio);
    const deviations = this.calculateDeviations(currentAllocation, targetAllocation);

    return {
      currentAllocation,
      targetAllocation,
      deviations,
      rebalancingNeeds: deviations.some(d => d.severity === 'HIGH' || d.severity === 'CRITICAL')
    };
  }

  private getCurrentAllocation(portfolio: Portfolio): AllocationBreakdown[] {
    const allocationMap = new Map<string, AllocationBreakdown>();

    portfolio.assets.forEach(asset => {
      const category = this.getAssetCategory(asset);
      
      if (allocationMap.has(category)) {
        const existing = allocationMap.get(category)!;
        existing.value += asset.marketValue;
        existing.currentWeight += asset.weight;
      } else {
        allocationMap.set(category, {
          category,
          assetType: asset.type,
          securityType: asset.type === 'SECURITY' ? (asset as Security).securityType : undefined,
          loanType: asset.type === 'LOAN' ? (asset as Loan).loanType : undefined,
          currentWeight: asset.weight,
          targetWeight: 0,
          value: asset.marketValue
        });
      }
    });

    return Array.from(allocationMap.values());
  }

  private getTargetAllocation(portfolio: Portfolio): AllocationBreakdown[] {
    return portfolio.targetAllocation.map(target => ({
      category: this.getTargetCategory(target),
      assetType: target.assetType,
      securityType: target.securityType,
      loanType: target.loanType,
      currentWeight: 0,
      targetWeight: target.targetWeight,
      value: portfolio.totalValue * target.targetWeight
    }));
  }

  private calculateDeviations(
    current: AllocationBreakdown[],
    target: AllocationBreakdown[]
  ): AllocationDeviation[] {
    const deviations: AllocationDeviation[] = [];

    target.forEach(targetItem => {
      const currentItem = current.find(c => c.category === targetItem.category);
      const currentWeight = currentItem ? currentItem.currentWeight : 0;
      const deviation = currentWeight - targetItem.targetWeight;
      
      // Avoid division by zero
      const deviationPercent = targetItem.targetWeight === 0 
        ? (currentWeight > 0 ? 100 : 0)
        : Math.abs(deviation / targetItem.targetWeight) * 100;

      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (deviationPercent > 20) severity = 'CRITICAL';
      else if (deviationPercent > 10) severity = 'HIGH';
      else if (deviationPercent > 5) severity = 'MEDIUM';

      deviations.push({
        category: targetItem.category,
        deviation,
        deviationPercent,
        severity
      });
    });

    return deviations;
  }

  private assessConcentrationRisk(portfolio: Portfolio): ConcentrationRisk {
    const singleAssetMax = Math.max(...portfolio.assets.map(a => a.weight));
    
    return {
      singleAssetMax,
      sectorConcentration: this.calculateSectorConcentration(portfolio),
      creditRatingConcentration: this.calculateCreditRatingConcentration(portfolio),
      maturityConcentration: this.calculateMaturityConcentration(portfolio)
    };
  }

  private calculateSectorConcentration(portfolio: Portfolio): SectorConcentration[] {
    const sectorMap = new Map<string, number>();
    
    portfolio.assets.forEach(asset => {
      const sector = asset.sector || 'Unknown';
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + asset.weight);
    });

    return Array.from(sectorMap.entries()).map(([sector, weight]) => ({
      sector,
      weight,
      riskLevel: weight > 0.25 ? 'HIGH' : weight > 0.15 ? 'MEDIUM' : 'LOW'
    }));
  }

  private calculateCreditRatingConcentration(portfolio: Portfolio): CreditRatingConcentration[] {
    const ratingMap = new Map<string, number>();
    
    portfolio.assets.forEach(asset => {
      let rating = 'Unrated';
      if (asset.type === 'SECURITY' && (asset as Security).creditRating) {
        rating = (asset as Security).creditRating!;
      } else if (asset.type === 'LOAN') {
        rating = (asset as Loan).creditRating;
      }
      
      ratingMap.set(rating, (ratingMap.get(rating) || 0) + asset.weight);
    });

    return Array.from(ratingMap.entries()).map(([rating, weight]) => ({
      rating,
      weight,
      riskLevel: this.getCreditRiskLevel(rating, weight)
    }));
  }

  private calculateMaturityConcentration(portfolio: Portfolio): MaturityConcentration[] {
    const maturityBuckets = new Map<string, { weight: number; totalMaturity: number; count: number }>();
    
    portfolio.assets.forEach(asset => {
      let maturityDate: any;
      
      if (asset.type === 'SECURITY') {
        maturityDate = (asset as Security).maturityDate;
      } else if (asset.type === 'LOAN') {
        maturityDate = (asset as Loan).maturityDate;
      }
      
      if (maturityDate) {
        const yearsToMaturity = PortfolioUtils.getYearsToMaturity(maturityDate);
        const bucket = this.getMaturityBucket(yearsToMaturity);
        
        const current = maturityBuckets.get(bucket) || { weight: 0, totalMaturity: 0, count: 0 };
        current.weight += asset.weight;
        current.totalMaturity += yearsToMaturity;
        current.count += 1;
        
        maturityBuckets.set(bucket, current);
      }
    });

    return Array.from(maturityBuckets.entries()).map(([bucket, data]) => ({
      maturityBucket: bucket,
      weight: data.weight,
      averageMaturity: data.count > 0 ? data.totalMaturity / data.count : 0
    }));
  }

  private estimateVolatility(security: Security): number {
    switch (security.securityType) {
      case 'STOCK': return 0.20;
      case 'BOND': return 0.05;
      case 'ETF': return 0.15;
      case 'MBS': return 0.08;
      case 'ABS': return 0.10;
      case 'TREASURY': return 0.03;
      default: return 0.10;
    }
  }

  private getCreditRiskScore(rating: string): number {
    const riskScores: { [key: string]: number } = {
      'AAA': 0.001, 'AA+': 0.002, 'AA': 0.003, 'AA-': 0.004,
      'A+': 0.005, 'A': 0.007, 'A-': 0.009,
      'BBB+': 0.012, 'BBB': 0.015, 'BBB-': 0.020,
      'BB+': 0.030, 'BB': 0.040, 'BB-': 0.055,
      'B+': 0.075, 'B': 0.100, 'B-': 0.130,
      'CCC+': 0.170, 'CCC': 0.220, 'CCC-': 0.280,
      'CC': 0.350, 'C': 0.450, 'D': 0.600
    };
    return riskScores[rating] || 0.100;
  }

  private calculateLoanDuration(loan: Loan): number {
    const yearsToMaturity = PortfolioUtils.getYearsToMaturity(loan.maturityDate);
    return Math.min(yearsToMaturity, 10);
  }

  private getAssetCategory(asset: Asset): string {
    if (asset.type === 'SECURITY') {
      return `${asset.type}_${(asset as Security).securityType}`;
    } else {
      return `${asset.type}_${(asset as Loan).loanType}`;
    }
  }

  private getTargetCategory(target: AllocationTarget): string {
    if (target.securityType) {
      return `${target.assetType}_${target.securityType}`;
    } else if (target.loanType) {
      return `${target.assetType}_${target.loanType}`;
    }
    return target.assetType;
  }

  private getCreditRiskLevel(rating: string, weight: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    const highRiskRatings = ['BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'];
    
    if (highRiskRatings.includes(rating) && weight > 0.10) return 'HIGH';
    if (weight > 0.30) return 'HIGH';
    if (weight > 0.15) return 'MEDIUM';
    return 'LOW';
  }

  private getMaturityBucket(years: number): string {
    if (years <= 1) return 'Short-term (0-1 years)';
    if (years <= 3) return 'Medium-term (1-3 years)';
    if (years <= 7) return 'Intermediate (3-7 years)';
    if (years <= 15) return 'Long-term (7-15 years)';
    return 'Very Long-term (15+ years)';
  }
}