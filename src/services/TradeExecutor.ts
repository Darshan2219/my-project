import { Asset } from '../types/portfolio';
import { TradeExecution } from '../types/agent';

export interface TradeOrder {
  asset: Asset;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'SMART';
  limitPrice?: number;
  slippageTolerance: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
}

export class TradeExecutor {
  private mockMode: boolean = true;
  private executionDelay: number = 1000; // Simulated execution delay

  constructor(mockMode: boolean = true) {
    this.mockMode = mockMode;
  }

  public async executeTrade(order: TradeOrder): Promise<TradeExecution> {
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (this.mockMode) {
        return await this.simulateTradeExecution(order, tradeId);
      } else {
        return await this.executeRealTrade(order, tradeId);
      }
    } catch (error) {
      return {
        id: tradeId,
        asset: order.asset,
        action: order.action,
        quantity: order.quantity,
        price: 0,
        timestamp: new Date(),
        status: 'FAILED'
      };
    }
  }

  public async executeBatchTrades(orders: TradeOrder[]): Promise<TradeExecution[]> {
    const executions = await Promise.all(
      orders.map(order => this.executeTrade(order))
    );
    
    return executions;
  }

  private async simulateTradeExecution(order: TradeOrder, tradeId: string): Promise<TradeExecution> {
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    
    // Simulate market conditions affecting execution
    const marketImpact = this.calculateMarketImpact(order);
    const slippage = this.calculateSlippage(order);
    const executionPrice = this.calculateExecutionPrice(order, marketImpact, slippage);
    
    // Simulate execution success rate (95% success in normal conditions)
    const executionSuccess = Math.random() > 0.05;
    
    if (!executionSuccess) {
      return {
        id: tradeId,
        asset: order.asset,
        action: order.action,
        quantity: order.quantity,
        price: 0,
        timestamp: new Date(),
        status: 'FAILED'
      };
    }
    
    // Simulate partial fills for large orders
    const executedQuantity = this.calculateExecutedQuantity(order);
    const status = executedQuantity === order.quantity ? 'FILLED' : 'PARTIAL';
    
    return {
      id: tradeId,
      asset: order.asset,
      action: order.action,
      quantity: executedQuantity,
      price: executionPrice,
      timestamp: new Date(),
      status
    };
  }

  private async executeRealTrade(order: TradeOrder, tradeId: string): Promise<TradeExecution> {
    // In a real implementation, this would integrate with:
    // - Prime brokerage APIs (Goldman Sachs, Morgan Stanley, etc.)
    // - Electronic trading networks (ECNs)
    // - Fixed Income Electronic Trading platforms
    // - FIX protocol connections to exchanges
    // - Institutional trading platforms (Bloomberg Terminal, Reuters Eikon)
    
    // Example integrations:
    // - Interactive Brokers API
    // - TD Ameritrade API
    // - Charles Schwab API
    // - Fidelity Institutional
    // - Bloomberg EMSX (Electronic Multi-asset Solutions)
    
    throw new Error('Real trading integration not implemented in demo mode');
  }

  private calculateMarketImpact(order: TradeOrder): number {
    // Market impact increases with trade size relative to average daily volume
    const estimatedDailyVolume = this.getEstimatedDailyVolume(order.asset);
    const tradeSizeRatio = (order.quantity * order.asset.currentPrice) / estimatedDailyVolume;
    
    // Linear market impact model (simplified)
    let impact = tradeSizeRatio * 0.001; // 0.1% impact per 1% of daily volume
    
    // Adjust for asset liquidity
    if (order.asset.type === 'LOAN') {
      impact *= 3; // Loans are less liquid
    } else if (order.asset.type === 'SECURITY') {
      const security = order.asset as any;
      if (security.securityType === 'TREASURY') {
        impact *= 0.3; // Treasuries are highly liquid
      } else if (security.securityType === 'MBS' || security.securityType === 'ABS') {
        impact *= 2; // Structured products are less liquid
      }
    }
    
    return Math.min(impact, 0.05); // Cap at 5%
  }

  private calculateSlippage(order: TradeOrder): number {
    let baseSlippage = 0.001; // 10 basis points base slippage
    
    // Adjust for order type
    if (order.orderType === 'MARKET') {
      baseSlippage *= 1.5; // Market orders have higher slippage
    } else if (order.orderType === 'SMART') {
      baseSlippage *= 0.7; // Smart orders reduce slippage
    }
    
    // Adjust for market volatility (simulated)
    const volatilityMultiplier = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
    baseSlippage *= volatilityMultiplier;
    
    return Math.min(baseSlippage, order.slippageTolerance);
  }

  private calculateExecutionPrice(order: TradeOrder, marketImpact: number, slippage: number): number {
    let executionPrice = order.asset.currentPrice;
    
    // Apply market impact and slippage
    const totalImpact = marketImpact + slippage;
    
    if (order.action === 'BUY') {
      executionPrice *= (1 + totalImpact);
    } else {
      executionPrice *= (1 - totalImpact);
    }
    
    // For limit orders, ensure we don't exceed the limit
    if (order.orderType === 'LIMIT' && order.limitPrice) {
      if (order.action === 'BUY') {
        executionPrice = Math.min(executionPrice, order.limitPrice);
      } else {
        executionPrice = Math.max(executionPrice, order.limitPrice);
      }
    }
    
    return Math.round(executionPrice * 10000) / 10000; // Round to 4 decimal places
  }

  private calculateExecutedQuantity(order: TradeOrder): number {
    // Simulate partial fills for large orders
    const orderValue = order.quantity * order.asset.currentPrice;
    const estimatedDailyVolume = this.getEstimatedDailyVolume(order.asset);
    
    if (orderValue > estimatedDailyVolume * 0.1) {
      // Large orders (>10% of daily volume) may get partial fills
      const fillRate = 0.6 + Math.random() * 0.4; // 60-100% fill
      return Math.floor(order.quantity * fillRate);
    }
    
    return order.quantity;
  }

  private getEstimatedDailyVolume(asset: Asset): number {
    // Simulate daily trading volume based on asset characteristics
    let baseVolume = asset.marketValue * 0.1; // 10% of market value as base
    
    if (asset.type === 'SECURITY') {
      const security = asset as any;
      switch (security.securityType) {
        case 'TREASURY':
          baseVolume *= 10; // High volume
          break;
        case 'STOCK':
          baseVolume *= 5; // High volume
          break;
        case 'BOND':
          baseVolume *= 2; // Medium volume
          break;
        case 'MBS':
        case 'ABS':
          baseVolume *= 0.5; // Lower volume
          break;
      }
    } else if (asset.type === 'LOAN') {
      baseVolume *= 0.1; // Very low volume for loans
    }
    
    return baseVolume;
  }

  public async validateOrder(order: TradeOrder): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic validation
    if (order.quantity <= 0) {
      errors.push('Quantity must be positive');
    }
    
    if (order.orderType === 'LIMIT' && !order.limitPrice) {
      errors.push('Limit price required for limit orders');
    }
    
    if (order.slippageTolerance < 0 || order.slippageTolerance > 0.1) {
      errors.push('Slippage tolerance must be between 0% and 10%');
    }
    
    // Asset-specific validation
    if (order.asset.type === 'LOAN') {
      // Loans may have minimum trade sizes
      const minTradeSize = 100000; // $100k minimum
      if (order.quantity * order.asset.currentPrice < minTradeSize) {
        errors.push(`Minimum trade size for loans is $${minTradeSize.toLocaleString()}`);
      }
    }
    
    // Market hours validation (simplified)
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour > 16) {
      if (order.asset.type === 'SECURITY') {
        const security = order.asset as any;
        if (security.securityType === 'STOCK') {
          errors.push('Stock trading outside market hours');
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  public async getOrderStatus(tradeId: string): Promise<TradeExecution | null> {
    // In a real implementation, this would query the execution system
    // for the current status of the order
    return null;
  }

  public async cancelOrder(tradeId: string): Promise<boolean> {
    // In a real implementation, this would attempt to cancel the order
    // if it hasn't been filled yet
    return true;
  }

  public getExecutionStatistics(): any {
    return {
      totalTrades: 0,
      successRate: 0.95,
      averageSlippage: 0.0008,
      averageExecutionTime: this.executionDelay,
      totalVolume: 0
    };
  }
}