import { Portfolio, Asset } from '../types/portfolio';
import { Recommendation } from '../types/analysis';
import { 
  AgentConfig, 
  AgentDecision, 
  AgentState, 
  MarketData, 
  ExecutionDetails,
  TradeExecution,
  Alert,
  DecisionType
} from '../types/agent';
import { PortfolioAnalyzer } from '../services/PortfolioAnalyzer';
import { RebalancingEngine } from '../services/RebalancingEngine';
import { AIReasoningEngine } from './AIReasoningEngine';
import { MarketDataProvider } from '../services/MarketDataProvider';
import { TradeExecutor } from '../services/TradeExecutor';

export class PortfolioAgent {
  private config: AgentConfig;
  private state: AgentState;
  private analyzer: PortfolioAnalyzer;
  private rebalancingEngine: RebalancingEngine;
  private reasoningEngine: AIReasoningEngine;
  private marketDataProvider: MarketDataProvider;
  private tradeExecutor: TradeExecutor;
  private decisionHistory: AgentDecision[] = [];
  private intervalId?: NodeJS.Timeout;

  constructor(config: AgentConfig, portfolio: Portfolio) {
    this.config = config;
    this.analyzer = new PortfolioAnalyzer();
    this.rebalancingEngine = new RebalancingEngine();
    this.reasoningEngine = new AIReasoningEngine();
    this.marketDataProvider = new MarketDataProvider();
    this.tradeExecutor = new TradeExecutor();
    
    this.state = {
      id: config.id,
      status: 'STOPPED',
      lastDecision: new Date(),
      totalDecisions: 0,
      successRate: 0,
      currentPortfolio: portfolio,
      watchlist: [],
      alerts: [],
      performance: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        avgDecisionTime: 0,
        riskAdjustedReturn: 0,
        benchmarkOutperformance: 0
      }
    };
  }

  public start(): void {
    if (!this.config.enabled) {
      this.addAlert('HIGH', 'SYSTEM_ERROR', 'Cannot start agent: configuration disabled');
      return;
    }

    this.state.status = 'ACTIVE';
    this.addAlert('LOW', 'SYSTEM_ERROR', 'Portfolio Agent started');
    
    this.intervalId = setInterval(async () => {
      await this.executionCycle();
    }, 60000);
  }

  public stop(): void {
    this.state.status = 'STOPPED';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.addAlert('LOW', 'SYSTEM_ERROR', 'Portfolio Agent stopped');
  }

  public pause(): void {
    this.state.status = 'PAUSED';
    this.addAlert('LOW', 'SYSTEM_ERROR', 'Portfolio Agent paused');
  }

  public async executeDecision(recommendation: Recommendation): Promise<AgentDecision> {
    const decision: AgentDecision = {
      id: `decision-${Date.now()}`,
      timestamp: new Date(),
      decisionType: this.mapRecommendationToDecisionType(recommendation.type),
      recommendation,
      reasoning: await this.reasoningEngine.generateReasoning(recommendation, this.state.currentPortfolio),
      confidence: this.calculateConfidence(recommendation),
      riskAssessment: await this.assessDecisionRisk(recommendation),
      expectedOutcome: this.calculateExpectedOutcome(recommendation),
      status: 'PENDING'
    };

    if (await this.shouldAutoExecute(decision)) {
      decision.status = 'APPROVED';
      decision.executionDetails = await this.executeRecommendation(recommendation);
      decision.status = decision.executionDetails.success ? 'COMPLETED' : 'FAILED';
    }

    this.decisionHistory.push(decision);
    this.state.totalDecisions++;
    this.state.lastDecision = new Date();

    return decision;
  }

  private async executionCycle(): Promise<void> {
    if (this.state.status !== 'ACTIVE') return;

    try {
      const marketData = await this.marketDataProvider.getCurrentData();
      await this.updatePortfolioValues(marketData);
      
      const analysis = this.analyzer.analyzePortfolio(this.state.currentPortfolio);
      const recommendations = this.rebalancingEngine.generateRecommendations(analysis);
      
      const criticalRecommendations = recommendations.filter(r => 
        r.priority === 'CRITICAL' || r.priority === 'HIGH'
      );

      for (const recommendation of criticalRecommendations) {
        if (await this.meetsExecutionCriteria(recommendation, marketData)) {
          await this.executeDecision(recommendation);
        }
      }

      await this.checkRiskLimits();
      await this.monitorPerformance();
      
    } catch (error) {
      this.state.status = 'ERROR';
      this.addAlert('CRITICAL', 'SYSTEM_ERROR', `Execution cycle failed: ${(error as Error).message}`);
    }
  }

  private async shouldAutoExecute(decision: AgentDecision): Promise<boolean> {
    if (this.config.autonomyLevel === 'ADVISORY_ONLY') return false;
    if (this.config.executionSettings.simulationMode) return false;
    
    if (decision.confidence < 0.7) return false;
    
    if (decision.decisionType === 'EMERGENCY_HEDGE' || 
        (decision.recommendation.priority === 'CRITICAL' && decision.confidence > 0.8)) {
      return this.config.autonomyLevel === 'FULL_AUTO';
    }
    
    if (decision.recommendation.priority === 'HIGH' && decision.confidence > 0.85) {
      return this.config.autonomyLevel === 'FULL_AUTO';
    }
    
    return this.config.autonomyLevel === 'FULL_AUTO' && 
           decision.recommendation.priority !== 'LOW' && 
           decision.confidence > 0.9;
  }

  private async executeRecommendation(recommendation: Recommendation): Promise<ExecutionDetails> {
    const startTime = Date.now();
    const trades: TradeExecution[] = [];
    let totalCost = 0;
    let totalSlippage = 0;
    const errors: string[] = [];

    try {
      for (const actionItem of recommendation.actionItems) {
        if (actionItem.asset) {
          const trade = await this.tradeExecutor.executeTrade({
            asset: actionItem.asset,
            action: actionItem.action === 'BUY' || actionItem.action === 'INCREASE' ? 'BUY' : 'SELL',
            quantity: this.calculateTradeQuantity(actionItem),
            orderType: this.config.executionSettings.orderType,
            slippageTolerance: this.config.executionSettings.slippageTolerance
          });

          trades.push(trade);
          totalCost += trade.price * trade.quantity;
          
          if (trade.status === 'FAILED') {
            errors.push(`Failed to execute trade for ${actionItem.asset.name}`);
          }
        }
      }

      await this.updatePortfolioAfterTrades(trades);

      return {
        trades,
        totalCost,
        executionTime: Date.now() - startTime,
        slippage: totalSlippage / trades.length,
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        trades,
        totalCost: 0,
        executionTime: Date.now() - startTime,
        slippage: 0,
        success: false,
        errors: [`Execution failed: ${(error as Error).message}`]
      };
    }
  }

  private async meetsExecutionCriteria(recommendation: Recommendation, marketData: MarketData): Promise<boolean> {
    if (!this.isWithinTradingHours()) return false;
    if (!this.isWithinTradingLimits()) return false;
    if (!await this.passesRiskChecks(recommendation)) return false;
    if (!this.passesMarketConditionChecks(marketData)) return false;
    
    return true;
  }

  private async checkRiskLimits(): Promise<void> {
    const analysis = this.analyzer.analyzePortfolio(this.state.currentPortfolio);
    
    if (analysis.riskMetrics.valueAtRisk > this.config.riskLimits.maxDailyVaR) {
      this.addAlert('CRITICAL', 'RISK_LIMIT_BREACH', 
        `Daily VaR exceeded: ${analysis.riskMetrics.valueAtRisk.toFixed(0)} > ${this.config.riskLimits.maxDailyVaR}`);
      
      if (this.config.autonomyLevel === 'FULL_AUTO') {
        await this.initiateEmergencyHedging();
      }
    }

    if (analysis.concentrationRisk.singleAssetMax > this.config.riskLimits.maxSingleAssetWeight) {
      this.addAlert('HIGH', 'RISK_LIMIT_BREACH', 
        `Single asset concentration exceeded: ${(analysis.concentrationRisk.singleAssetMax * 100).toFixed(1)}%`);
    }
  }

  private async initiateEmergencyHedging(): Promise<void> {
    this.addAlert('CRITICAL', 'RISK_LIMIT_BREACH', 'Initiating emergency hedging');
    
    const emergencyRecommendation: Recommendation = {
      id: `emergency-${Date.now()}`,
      type: 'HEDGE',
      priority: 'CRITICAL',
      title: 'Emergency Risk Hedging',
      description: 'Automated emergency response to risk limit breach',
      reasoning: 'VaR exceeded maximum threshold, implementing immediate hedging strategy',
      actionItems: await this.generateEmergencyHedgeActions(),
      impact: {
        riskReduction: 0.50,
        timeframe: 'immediate'
      }
    };

    await this.executeDecision(emergencyRecommendation);
  }

  private async generateEmergencyHedgeActions() {
    return [{
      action: 'HEDGE' as const,
      percentage: 0.30,
      rationale: 'Emergency hedge to reduce portfolio risk exposure'
    }];
  }

  private calculateConfidence(recommendation: Recommendation): number {
    let baseConfidence = 0.7;
    
    if (recommendation.priority === 'CRITICAL') baseConfidence = 0.9;
    else if (recommendation.priority === 'HIGH') baseConfidence = 0.8;
    else if (recommendation.priority === 'MEDIUM') baseConfidence = 0.7;
    else baseConfidence = 0.6;
    
    if (recommendation.impact?.riskReduction && recommendation.impact.riskReduction > 0.2) {
      baseConfidence += 0.1;
    }
    
    return Math.min(baseConfidence, 1.0);
  }

  private async assessDecisionRisk(recommendation: Recommendation): Promise<string> {
    const riskFactors: string[] = [];
    
    if (recommendation.impact?.estimatedCost && recommendation.impact.estimatedCost > this.state.currentPortfolio.totalValue * 0.02) {
      riskFactors.push('High transaction costs');
    }
    
    if (recommendation.type === 'SELL' || recommendation.type === 'REDUCE_CONCENTRATION') {
      riskFactors.push('Liquidity risk');
    }
    
    if (recommendation.priority === 'LOW') {
      riskFactors.push('Low priority action');
    }
    
    return riskFactors.length > 0 ? riskFactors.join(', ') : 'Low risk';
  }

  private calculateExpectedOutcome(recommendation: Recommendation) {
    return {
      riskReduction: recommendation.impact?.riskReduction,
      yieldImprovement: recommendation.impact?.yieldImprovement,
      liquidityImprovement: recommendation.impact?.diversificationImprovement,
      costEstimate: recommendation.impact?.estimatedCost || this.state.currentPortfolio.totalValue * 0.001,
      timeframe: recommendation.impact?.timeframe || '1-2 days'
    };
  }

  private mapRecommendationToDecisionType(type: string): DecisionType {
    switch (type) {
      case 'REBALANCE': return 'AUTO_REBALANCE';
      case 'CREDIT_RISK_MITIGATION': return 'RISK_MITIGATION';
      case 'YIELD_ENHANCEMENT': return 'YIELD_OPTIMIZATION';
      case 'HEDGE': return 'EMERGENCY_HEDGE';
      default: return 'OPPORTUNISTIC_TRADE';
    }
  }

  private calculateTradeQuantity(actionItem: any): number {
    if (actionItem.quantity) return actionItem.quantity;
    if (actionItem.percentage && actionItem.asset) {
      return actionItem.asset.quantity * actionItem.percentage;
    }
    return 0;
  }

  private isWithinTradingHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(this.config.tradingLimits.tradingHours.start.split(':')[0]);
    const endHour = parseInt(this.config.tradingLimits.tradingHours.end.split(':')[0]);
    
    if (this.config.tradingLimits.tradingHours.excludeWeekends) {
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    }
    
    return currentHour >= startHour && currentHour < endHour;
  }

  private isWithinTradingLimits(): boolean {
    const todayTrades = this.getTodayTrades();
    const hourlyTrades = this.getHourlyTrades();
    
    return todayTrades.length < this.config.tradingLimits.maxTradesPerHour * 24 &&
           hourlyTrades.length < this.config.tradingLimits.maxTradesPerHour;
  }

  private async passesRiskChecks(recommendation: Recommendation): Promise<boolean> {
    return true;
  }

  private passesMarketConditionChecks(marketData: MarketData): boolean {
    if (marketData.marketSentiment.volatility === 'HIGH') {
      return false;
    }
    return true;
  }

  private getTodayTrades(): TradeExecution[] {
    const today = new Date().toDateString();
    return this.decisionHistory
      .filter(d => d.timestamp.toDateString() === today)
      .flatMap(d => d.executionDetails?.trades || []);
  }

  private getHourlyTrades(): TradeExecution[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.decisionHistory
      .filter(d => d.timestamp > oneHourAgo)
      .flatMap(d => d.executionDetails?.trades || []);
  }

  private async updatePortfolioValues(marketData: MarketData): Promise<void> {
    this.state.currentPortfolio.assets.forEach(asset => {
      if (marketData.prices[asset.id]) {
        asset.currentPrice = marketData.prices[asset.id];
        asset.marketValue = asset.quantity * asset.currentPrice;
      }
    });
    
    this.state.currentPortfolio.totalValue = this.state.currentPortfolio.assets
      .reduce((sum, asset) => sum + asset.marketValue, 0);
      
    this.state.currentPortfolio.assets.forEach(asset => {
      asset.weight = asset.marketValue / this.state.currentPortfolio.totalValue;
    });
  }

  private async updatePortfolioAfterTrades(trades: TradeExecution[]): Promise<void> {
  }

  private async monitorPerformance(): Promise<void> {
  }

  private addAlert(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', type: any, message: string): void {
    this.state.alerts.push({
      id: `alert-${Date.now()}`,
      severity,
      type,
      message,
      timestamp: new Date(),
      acknowledged: false
    });
    
    if (this.state.alerts.length > 100) {
      this.state.alerts = this.state.alerts.slice(-50);
    }
  }

  public getState(): AgentState {
    return { ...this.state };
  }

  public getDecisionHistory(): AgentDecision[] {
    return [...this.decisionHistory];
  }

  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}