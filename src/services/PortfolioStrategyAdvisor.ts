import { Portfolio } from '../types/portfolio';
import { PortfolioAnalysis, Recommendation } from '../types/analysis';
import { PortfolioAnalyzer } from './PortfolioAnalyzer';
import { RebalancingEngine } from './RebalancingEngine';

export class PortfolioStrategyAdvisor {
  private analyzer: PortfolioAnalyzer;
  private rebalancingEngine: RebalancingEngine;

  constructor() {
    this.analyzer = new PortfolioAnalyzer();
    this.rebalancingEngine = new RebalancingEngine();
  }

  public async analyzePortfolio(portfolio: Portfolio): Promise<PortfolioAnalysis> {
    const analysis = this.analyzer.analyzePortfolio(portfolio);
    const recommendations = this.rebalancingEngine.generateRecommendations(analysis);
    
    return {
      ...analysis,
      recommendations
    };
  }

  public async getRebalancingRecommendations(portfolio: Portfolio): Promise<Recommendation[]> {
    const analysis = await this.analyzePortfolio(portfolio);
    return analysis.recommendations;
  }

  public async getRiskAssessment(portfolio: Portfolio) {
    const analysis = await this.analyzePortfolio(portfolio);
    
    return {
      overallRiskScore: this.calculateOverallRiskScore(analysis),
      riskFactors: this.identifyRiskFactors(analysis),
      riskMitigationSuggestions: analysis.recommendations.filter(
        r => r.type === 'CREDIT_RISK_MITIGATION' || 
            r.type === 'DURATION_ADJUSTMENT' || 
            r.type === 'REDUCE_CONCENTRATION'
      )
    };
  }

  public async getOptimizationSuggestions(portfolio: Portfolio) {
    const analysis = await this.analyzePortfolio(portfolio);
    
    return {
      yieldOptimization: analysis.recommendations.filter(r => r.type === 'YIELD_ENHANCEMENT'),
      diversificationImprovements: analysis.recommendations.filter(r => r.type === 'IMPROVE_DIVERSIFICATION'),
      rebalancingNeeds: analysis.recommendations.filter(r => r.type === 'REBALANCE'),
      overallScore: this.calculateOptimizationScore(analysis)
    };
  }

  private calculateOverallRiskScore(analysis: PortfolioAnalysis): number {
    const { riskMetrics } = analysis;
    
    const creditRiskScore = Math.min(riskMetrics.creditRisk * 10, 1);
    const volatilityScore = Math.min(riskMetrics.volatility * 5, 1);
    const concentrationScore = Math.min(analysis.concentrationRisk.singleAssetMax * 5, 1);
    const liquidityScore = Math.min(riskMetrics.liquidityRisk * 10, 1);
    
    return (creditRiskScore + volatilityScore + concentrationScore + liquidityScore) / 4;
  }

  private identifyRiskFactors(analysis: PortfolioAnalysis): string[] {
    const factors: string[] = [];
    const { riskMetrics, concentrationRisk } = analysis;
    
    if (riskMetrics.creditRisk > 0.15) {
      factors.push('High credit risk exposure');
    }
    
    if (riskMetrics.interestRateRisk > 0.10) {
      factors.push('Significant interest rate risk');
    }
    
    if (concentrationRisk.singleAssetMax > 0.20) {
      factors.push('Single asset concentration risk');
    }
    
    if (riskMetrics.liquidityRisk > 0.15) {
      factors.push('Liquidity constraints');
    }
    
    const highRiskSectors = concentrationRisk.sectorConcentration.filter(s => s.riskLevel === 'HIGH');
    if (highRiskSectors.length > 0) {
      factors.push(`Sector concentration in ${highRiskSectors.length} sectors`);
    }
    
    return factors;
  }

  private calculateOptimizationScore(analysis: PortfolioAnalysis): number {
    let score = 100;
    
    const criticalRecommendations = analysis.recommendations.filter(r => r.priority === 'CRITICAL').length;
    const highRecommendations = analysis.recommendations.filter(r => r.priority === 'HIGH').length;
    const mediumRecommendations = analysis.recommendations.filter(r => r.priority === 'MEDIUM').length;
    
    score -= criticalRecommendations * 25;
    score -= highRecommendations * 15;
    score -= mediumRecommendations * 5;
    
    return Math.max(score, 0);
  }
}