import {
  Portfolio,
  Asset,
  Loan,
  Security,
  AllocationTarget
} from '../types/portfolio';
import {
  PortfolioAnalysis,
  Recommendation,
  ActionItem,
  RecommendationType,
  Impact
} from '../types/analysis';

export class RebalancingEngine {
  constructor() {}

  generateRecommendations(analysis: PortfolioAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    recommendations.push(...this.generateAllocationRecommendations(analysis));
    recommendations.push(...this.generateRiskMitigationRecommendations(analysis));
    recommendations.push(...this.generateConcentrationRecommendations(analysis));
    recommendations.push(...this.generateYieldOptimizationRecommendations(analysis));
    
    return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
  }

  private generateAllocationRecommendations(analysis: PortfolioAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { allocationAnalysis, portfolio } = analysis;
    
    const criticalDeviations = allocationAnalysis.deviations.filter(d => d.severity === 'CRITICAL');
    const highDeviations = allocationAnalysis.deviations.filter(d => d.severity === 'HIGH');
    
    if (criticalDeviations.length > 0) {
      recommendations.push({
        id: `rebalance-critical-${Date.now()}`,
        type: 'REBALANCE',
        priority: 'CRITICAL',
        title: 'Critical Asset Allocation Rebalancing Required',
        description: `Portfolio has significant deviations from target allocation in ${criticalDeviations.length} categories`,
        reasoning: 'Critical deviations (>20%) from target allocation can significantly impact portfolio performance and risk profile',
        actionItems: this.createRebalancingActions(criticalDeviations, portfolio),
        impact: {
          riskReduction: 0.25,
          diversificationImprovement: 0.30,
          timeframe: '1-2 weeks'
        }
      });
    }
    
    if (highDeviations.length > 0) {
      recommendations.push({
        id: `rebalance-high-${Date.now()}`,
        type: 'REBALANCE',
        priority: 'HIGH',
        title: 'Significant Allocation Adjustments Needed',
        description: `Portfolio deviations detected in ${highDeviations.length} categories`,
        reasoning: 'High deviations (10-20%) from target allocation should be addressed to maintain optimal risk-return profile',
        actionItems: this.createRebalancingActions(highDeviations, portfolio),
        impact: {
          riskReduction: 0.15,
          diversificationImprovement: 0.20,
          timeframe: '2-4 weeks'
        }
      });
    }
    
    return recommendations;
  }

  private generateRiskMitigationRecommendations(analysis: PortfolioAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { riskMetrics, portfolio } = analysis;
    
    if (riskMetrics.creditRisk > 0.15) {
      recommendations.push({
        id: `credit-risk-${Date.now()}`,
        type: 'CREDIT_RISK_MITIGATION',
        priority: 'HIGH',
        title: 'High Credit Risk Detected',
        description: 'Portfolio has elevated credit risk exposure',
        reasoning: `Credit risk of ${(riskMetrics.creditRisk * 100).toFixed(1)}% exceeds recommended threshold of 15%`,
        actionItems: this.createCreditRiskMitigationActions(portfolio),
        impact: {
          riskReduction: 0.30,
          timeframe: '2-3 weeks'
        }
      });
    }
    
    if (riskMetrics.interestRateRisk > 0.10) {
      recommendations.push({
        id: `interest-rate-risk-${Date.now()}`,
        type: 'DURATION_ADJUSTMENT',
        priority: 'MEDIUM',
        title: 'Interest Rate Risk Management',
        description: 'Portfolio duration may be too high for current rate environment',
        reasoning: `Interest rate risk of ${(riskMetrics.interestRateRisk * 100).toFixed(1)}% suggests duration adjustment needed`,
        actionItems: this.createDurationAdjustmentActions(portfolio),
        impact: {
          riskReduction: 0.20,
          timeframe: '3-4 weeks'
        }
      });
    }
    
    return recommendations;
  }

  private generateConcentrationRecommendations(analysis: PortfolioAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { concentrationRisk, portfolio } = analysis;
    
    if (concentrationRisk.singleAssetMax > 0.20) {
      recommendations.push({
        id: `single-asset-concentration-${Date.now()}`,
        type: 'REDUCE_CONCENTRATION',
        priority: 'HIGH',
        title: 'Single Asset Concentration Risk',
        description: `Largest single asset represents ${(concentrationRisk.singleAssetMax * 100).toFixed(1)}% of portfolio`,
        reasoning: 'Single asset positions >20% create concentration risk and reduce diversification benefits',
        actionItems: this.createConcentrationReductionActions(portfolio),
        impact: {
          riskReduction: 0.25,
          diversificationImprovement: 0.35,
          timeframe: '1-2 weeks'
        }
      });
    }
    
    const highRiskSectors = concentrationRisk.sectorConcentration.filter(s => s.riskLevel === 'HIGH');
    if (highRiskSectors.length > 0) {
      recommendations.push({
        id: `sector-concentration-${Date.now()}`,
        type: 'IMPROVE_DIVERSIFICATION',
        priority: 'MEDIUM',
        title: 'Sector Concentration Risk',
        description: `High concentration in ${highRiskSectors.length} sectors`,
        reasoning: 'Sector concentrations >25% increase portfolio vulnerability to sector-specific risks',
        actionItems: this.createSectorDiversificationActions(highRiskSectors, portfolio),
        impact: {
          riskReduction: 0.20,
          diversificationImprovement: 0.30,
          timeframe: '2-3 weeks'
        }
      });
    }
    
    return recommendations;
  }

  private generateYieldOptimizationRecommendations(analysis: PortfolioAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { performanceMetrics, portfolio } = analysis;
    
    if (performanceMetrics.weightedAverageYield < 0.04) {
      recommendations.push({
        id: `yield-enhancement-${Date.now()}`,
        type: 'YIELD_ENHANCEMENT',
        priority: 'MEDIUM',
        title: 'Yield Enhancement Opportunity',
        description: `Current portfolio yield of ${(performanceMetrics.weightedAverageYield * 100).toFixed(2)}% may be optimized`,
        reasoning: 'Low yield environments require active management to maintain income generation',
        actionItems: this.createYieldEnhancementActions(portfolio),
        impact: {
          yieldImprovement: 0.015,
          timeframe: '3-4 weeks'
        }
      });
    }
    
    return recommendations;
  }

  private createRebalancingActions(deviations: any[], portfolio: Portfolio): ActionItem[] {
    const actions: ActionItem[] = [];
    
    deviations.forEach(deviation => {
      if (deviation.deviation > 0) {
        actions.push({
          action: 'REDUCE',
          percentage: Math.abs(deviation.deviationPercent) / 100,
          rationale: `Reduce ${deviation.category} allocation by ${deviation.deviationPercent.toFixed(1)}% to align with target`
        });
      } else {
        actions.push({
          action: 'INCREASE',
          percentage: Math.abs(deviation.deviationPercent) / 100,
          rationale: `Increase ${deviation.category} allocation by ${Math.abs(deviation.deviationPercent).toFixed(1)}% to reach target`
        });
      }
    });
    
    return actions;
  }

  private createCreditRiskMitigationActions(portfolio: Portfolio): ActionItem[] {
    const actions: ActionItem[] = [];
    const highRiskAssets = portfolio.assets.filter(asset => {
      if (asset.type === 'LOAN') {
        const loan = asset as Loan;
        return ['BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'].includes(loan.creditRating);
      }
      return false;
    });

    highRiskAssets.forEach(asset => {
      if (asset.weight > 0.05) {
        actions.push({
          asset,
          action: 'REDUCE',
          percentage: 0.5,
          rationale: `Reduce exposure to ${asset.name} due to low credit rating`
        });
      }
    });

    actions.push({
      action: 'BUY',
      assetType: 'SECURITY',
      percentage: 0.10,
      rationale: 'Increase allocation to investment-grade securities to reduce overall credit risk'
    });

    return actions;
  }

  private createDurationAdjustmentActions(portfolio: Portfolio): ActionItem[] {
    const actions: ActionItem[] = [];
    const longDurationAssets = portfolio.assets.filter(asset => {
      if (asset.type === 'SECURITY') {
        const security = asset as Security;
        return (security.duration || 0) > 7;
      }
      return false;
    });

    longDurationAssets.forEach(asset => {
      actions.push({
        asset,
        action: 'REDUCE',
        percentage: 0.3,
        rationale: `Reduce ${asset.name} to lower portfolio duration risk`
      });
    });

    actions.push({
      action: 'BUY',
      assetType: 'SECURITY',
      percentage: 0.15,
      rationale: 'Add shorter-duration securities to reduce interest rate sensitivity'
    });

    return actions;
  }

  private createConcentrationReductionActions(portfolio: Portfolio): ActionItem[] {
    const actions: ActionItem[] = [];
    const largestAsset = portfolio.assets.reduce((prev, current) => 
      prev.weight > current.weight ? prev : current
    );

    if (largestAsset.weight > 0.20) {
      actions.push({
        asset: largestAsset,
        action: 'REDUCE',
        targetWeight: 0.15,
        rationale: `Reduce ${largestAsset.name} position from ${(largestAsset.weight * 100).toFixed(1)}% to 15% to reduce concentration risk`
      });
    }

    return actions;
  }

  private createSectorDiversificationActions(highRiskSectors: any[], portfolio: Portfolio): ActionItem[] {
    const actions: ActionItem[] = [];
    
    highRiskSectors.forEach(sector => {
      actions.push({
        action: 'REDUCE',
        percentage: 0.3,
        rationale: `Reduce ${sector.sector} sector exposure from ${(sector.weight * 100).toFixed(1)}% to improve diversification`
      });
    });

    return actions;
  }

  private createYieldEnhancementActions(portfolio: Portfolio): ActionItem[] {
    const actions: ActionItem[] = [];
    const lowYieldAssets = portfolio.assets.filter(asset => {
      if (asset.type === 'SECURITY') {
        return (asset as Security).yield < 0.03;
      }
      if (asset.type === 'LOAN') {
        return (asset as Loan).interestRate < 0.04;
      }
      return false;
    });

    lowYieldAssets.slice(0, 3).forEach(asset => {
      actions.push({
        asset,
        action: 'SELL',
        percentage: 0.5,
        rationale: `Consider replacing ${asset.name} with higher-yielding alternatives`
      });
    });

    actions.push({
      action: 'BUY',
      assetType: 'SECURITY',
      percentage: 0.10,
      rationale: 'Add higher-yielding securities to improve portfolio income generation'
    });

    return actions;
  }

  private getPriorityScore(priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): number {
    switch (priority) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }
}