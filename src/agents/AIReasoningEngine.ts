import { Portfolio, Asset } from '../types/portfolio';
import { Recommendation } from '../types/analysis';
import { MarketData } from '../types/agent';

export class AIReasoningEngine {
  private knowledgeBase: Map<string, any> = new Map();
  
  constructor() {
    this.initializeKnowledgeBase();
  }

  public async generateReasoning(recommendation: Recommendation, portfolio: Portfolio, marketData?: MarketData): Promise<string> {
    const context = await this.buildContext(recommendation, portfolio, marketData);
    const reasoning = await this.analyzeDecision(recommendation, context);
    return this.formatReasoning(reasoning);
  }

  public async explainRiskAssessment(portfolio: Portfolio, riskMetrics: any): Promise<string> {
    const explanations: string[] = [];

    if (riskMetrics.creditRisk > 0.15) {
      explanations.push(
        `High credit risk detected (${(riskMetrics.creditRisk * 100).toFixed(1)}%) due to ` +
        `concentration in lower-rated assets. This increases default probability and potential losses.`
      );
    }

    if (riskMetrics.volatility > 0.20) {
      explanations.push(
        `Portfolio volatility of ${(riskMetrics.volatility * 100).toFixed(1)}% exceeds target. ` +
        `This indicates high price sensitivity to market movements.`
      );
    }

    if (riskMetrics.valueAtRisk > portfolio.totalValue * 0.05) {
      explanations.push(
        `Daily Value at Risk of $${riskMetrics.valueAtRisk.toLocaleString()} represents ` +
        `${((riskMetrics.valueAtRisk / portfolio.totalValue) * 100).toFixed(1)}% of portfolio value, ` +
        `indicating potential for significant daily losses.`
      );
    }

    return explanations.join(' ') || 'Risk metrics within acceptable ranges.';
  }

  public async generateTradeRationale(asset: Asset, action: 'BUY' | 'SELL', portfolio: Portfolio): Promise<string> {
    const rationales: string[] = [];

    if (action === 'SELL') {
      if (asset.weight > 0.20) {
        rationales.push(`Reducing oversized position (${(asset.weight * 100).toFixed(1)}% of portfolio)`);
      }
      
      if (asset.type === 'LOAN') {
        const loan = asset as any;
        if (['BB', 'B', 'CCC'].some(rating => loan.creditRating.startsWith(rating))) {
          rationales.push(`Reducing exposure to below-investment-grade credit (${loan.creditRating})`);
        }
      }
      
      if (asset.sector && this.getSectorConcentration(portfolio, asset.sector) > 0.25) {
        rationales.push(`Reducing sector concentration risk in ${asset.sector}`);
      }
    } else { // BUY
      if (asset.type === 'SECURITY') {
        const security = asset as any;
        if (security.securityType === 'TREASURY') {
          rationales.push('Adding safe-haven assets to reduce portfolio risk');
        }
        if (security.yield > this.getPortfolioYield(portfolio) * 1.1) {
          rationales.push(`Attractive yield of ${(security.yield * 100).toFixed(2)}% above portfolio average`);
        }
      }
    }

    return rationales.join('; ') || `${action} ${asset.name} to optimize portfolio allocation`;
  }

  public async assessMarketConditions(marketData: MarketData): Promise<string> {
    const assessments: string[] = [];

    if (marketData.marketSentiment.volatility === 'HIGH') {
      assessments.push('High market volatility suggests increased caution in trading decisions');
    }

    if (marketData.marketSentiment.interestRates === 'RISING') {
      assessments.push('Rising interest rate environment may negatively impact bond prices and loan values');
    }

    if (marketData.marketSentiment.creditMarkets === 'WIDENING') {
      assessments.push('Credit spreads widening indicates increased risk aversion and potential credit stress');
    }

    if (marketData.marketSentiment.overall === 'BEARISH') {
      assessments.push('Overall bearish sentiment suggests defensive positioning may be appropriate');
    }

    return assessments.join('. ') + '.' || 'Market conditions appear stable for normal operations.';
  }

  private async buildContext(recommendation: Recommendation, portfolio: Portfolio, marketData?: MarketData): Promise<any> {
    return {
      portfolioSize: portfolio.totalValue,
      assetCount: portfolio.assets.length,
      riskProfile: portfolio.riskProfile,
      currentAllocation: this.getCurrentAllocation(portfolio),
      marketConditions: marketData ? await this.assessMarketConditions(marketData) : 'Market data not available',
      recommendationType: recommendation.type,
      priority: recommendation.priority,
      affectedAssets: this.getAffectedAssets(recommendation),
      impactMetrics: recommendation.impact
    };
  }

  private async analyzeDecision(recommendation: Recommendation, context: any): Promise<any> {
    const analysis = {
      strategicRationale: this.getStrategicRationale(recommendation, context),
      riskConsiderations: this.getRiskConsiderations(recommendation, context),
      marketAlignment: this.getMarketAlignment(recommendation, context),
      expectedOutcome: this.getExpectedOutcome(recommendation, context),
      alternativeActions: this.getAlternativeActions(recommendation, context),
      timing: this.getTimingAnalysis(recommendation, context)
    };

    return analysis;
  }

  private getStrategicRationale(recommendation: Recommendation, context: any): string {
    const rationales: string[] = [];

    switch (recommendation.type) {
      case 'REBALANCE':
        rationales.push('Portfolio has deviated from target allocation, requiring rebalancing to maintain risk-return profile');
        break;
      case 'CREDIT_RISK_MITIGATION':
        rationales.push('Elevated credit risk exposure threatens portfolio stability and requires immediate attention');
        break;
      case 'YIELD_ENHANCEMENT':
        rationales.push('Current yield below optimal levels presents opportunity to improve income generation');
        break;
      case 'REDUCE_CONCENTRATION':
        rationales.push('Concentration risk in single assets or sectors creates vulnerability to idiosyncratic shocks');
        break;
    }

    if (context.portfolioSize > 50000000) {
      rationales.push('Large portfolio size allows for more sophisticated optimization strategies');
    }

    return rationales.join('. ') + '.';
  }

  private getRiskConsiderations(recommendation: Recommendation, context: any): string {
    const considerations: string[] = [];

    if (recommendation.priority === 'CRITICAL') {
      considerations.push('Critical priority indicates immediate action required to prevent significant losses');
    }

    if (recommendation.impact?.riskReduction && recommendation.impact.riskReduction > 0.2) {
      considerations.push(`Significant risk reduction of ${(recommendation.impact.riskReduction * 100).toFixed(0)}% expected`);
    }

    if (recommendation.impact?.estimatedCost && recommendation.impact.estimatedCost > context.portfolioSize * 0.01) {
      considerations.push('Transaction costs represent material expense requiring careful execution');
    }

    if (context.marketConditions.includes('volatility')) {
      considerations.push('Current market volatility may impact execution quality');
    }

    return considerations.join('. ') + '.' || 'Risk considerations are minimal for this action.';
  }

  private getMarketAlignment(recommendation: Recommendation, context: any): string {
    if (!context.marketConditions || context.marketConditions === 'Market data not available') {
      return 'Market alignment assessment unavailable due to missing market data.';
    }

    const alignments: string[] = [];

    if (recommendation.type === 'CREDIT_RISK_MITIGATION' && context.marketConditions.includes('credit')) {
      alignments.push('Action aligns with current credit market stress signals');
    }

    if (recommendation.type === 'HEDGE' && context.marketConditions.includes('volatility')) {
      alignments.push('Hedging strategy appropriate given elevated market volatility');
    }

    return alignments.join('. ') + '.' || 'Action timing appears neutral relative to current market conditions.';
  }

  private getExpectedOutcome(recommendation: Recommendation, context: any): string {
    const outcomes: string[] = [];

    if (recommendation.impact?.riskReduction) {
      outcomes.push(`Risk reduction of ${(recommendation.impact.riskReduction * 100).toFixed(0)}%`);
    }

    if (recommendation.impact?.yieldImprovement) {
      outcomes.push(`Yield improvement of ${(recommendation.impact.yieldImprovement * 100).toFixed(0)} basis points`);
    }

    if (recommendation.impact?.diversificationImprovement) {
      outcomes.push(`Diversification improvement of ${(recommendation.impact.diversificationImprovement * 100).toFixed(0)}%`);
    }

    const timeframe = recommendation.impact?.timeframe || '2-3 weeks';
    outcomes.push(`Expected implementation timeframe: ${timeframe}`);

    return outcomes.join(', ') + '.';
  }

  private getAlternativeActions(recommendation: Recommendation, context: any): string {
    const alternatives: string[] = [];

    switch (recommendation.type) {
      case 'REBALANCE':
        alternatives.push('Gradual rebalancing over longer timeframe');
        alternatives.push('Tactical asset allocation adjustments');
        break;
      case 'CREDIT_RISK_MITIGATION':
        alternatives.push('Credit hedging through derivatives');
        alternatives.push('Increased cash reserves');
        break;
      case 'YIELD_ENHANCEMENT':
        alternatives.push('Duration extension in current holdings');
        alternatives.push('Credit curve positioning');
        break;
    }

    return alternatives.length > 0 
      ? `Alternative approaches: ${alternatives.join(', ')}.`
      : 'Limited alternative actions available.';
  }

  private getTimingAnalysis(recommendation: Recommendation, context: any): string {
    const timing: string[] = [];

    if (recommendation.priority === 'CRITICAL') {
      timing.push('Immediate execution recommended');
    } else if (recommendation.priority === 'HIGH') {
      timing.push('Execute within 1-2 trading days');
    } else {
      timing.push('Execute within 1-2 weeks when market conditions are favorable');
    }

    if (context.marketConditions.includes('high volatility')) {
      timing.push('Consider breaking large orders into smaller sizes');
    }

    return timing.join('. ') + '.';
  }

  private formatReasoning(analysis: any): string {
    return [
      `Strategic Rationale: ${analysis.strategicRationale}`,
      `Risk Considerations: ${analysis.riskConsiderations}`,
      `Market Alignment: ${analysis.marketAlignment}`,
      `Expected Outcome: ${analysis.expectedOutcome}`,
      `Timing: ${analysis.timing}`,
      `Alternatives: ${analysis.alternativeActions}`
    ].join('\n\n');
  }

  private getCurrentAllocation(portfolio: Portfolio): any {
    const allocation: any = {};
    
    portfolio.assets.forEach(asset => {
      const category = asset.type;
      allocation[category] = (allocation[category] || 0) + asset.weight;
    });

    return allocation;
  }

  private getAffectedAssets(recommendation: Recommendation): Asset[] {
    return recommendation.actionItems
      .map(item => item.asset)
      .filter((asset): asset is Asset => asset !== undefined);
  }

  private getSectorConcentration(portfolio: Portfolio, sector: string): number {
    return portfolio.assets
      .filter(asset => asset.sector === sector)
      .reduce((sum, asset) => sum + asset.weight, 0);
  }

  private getPortfolioYield(portfolio: Portfolio): number {
    let weightedYield = 0;
    
    portfolio.assets.forEach(asset => {
      if (asset.type === 'SECURITY') {
        const security = asset as any;
        weightedYield += asset.weight * security.yield;
      } else if (asset.type === 'LOAN') {
        const loan = asset as any;
        weightedYield += asset.weight * loan.interestRate;
      }
    });
    
    return weightedYield;
  }

  private initializeKnowledgeBase(): void {
    this.knowledgeBase.set('creditRatingRisk', {
      'AAA': 0.01,
      'AA': 0.02,
      'A': 0.05,
      'BBB': 0.10,
      'BB': 0.20,
      'B': 0.35,
      'CCC': 0.50
    });

    this.knowledgeBase.set('sectorRiskFactors', {
      'Real Estate': 1.2,
      'Financial': 1.5,
      'Technology': 1.8,
      'Energy': 2.0,
      'Healthcare': 0.8,
      'Utilities': 0.6
    });

    this.knowledgeBase.set('liquidityScores', {
      'TREASURY': 0.95,
      'STOCK': 0.85,
      'BOND': 0.70,
      'MBS': 0.60,
      'ABS': 0.50,
      'LOAN': 0.30
    });
  }
}