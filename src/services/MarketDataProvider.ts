import { MarketData, MarketSentiment } from '../types/agent';

export class MarketDataProvider {
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheDuration = 60000; // 1 minute

  constructor(apiKey: string = 'demo') {
    this.apiKey = apiKey;
  }

  public async getCurrentData(): Promise<MarketData> {
    const cacheKey = 'current-market-data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheDuration) {
      return cached.data;
    }

    try {
      const [prices, yields, spreads, volatilities, sentiment] = await Promise.all([
        this.fetchPrices(),
        this.fetchYields(),
        this.fetchCreditSpreads(),
        this.fetchVolatilities(),
        this.fetchMarketSentiment()
      ]);

      const marketData: MarketData = {
        timestamp: new Date(),
        prices,
        yields,
        creditSpreads: spreads,
        volatilities,
        liquidityScores: await this.calculateLiquidityScores(prices),
        marketSentiment: sentiment
      };

      this.cache.set(cacheKey, { data: marketData, timestamp: new Date() });
      return marketData;
      
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      return this.getFallbackData();
    }
  }

  public async getHistoricalData(symbol: string, days: number = 30): Promise<any[]> {
    if (this.apiKey === 'demo') {
      return this.generateMockHistoricalData(symbol, days);
    }

    // In a real implementation, this would call external APIs like:
    // - Bloomberg API
    // - Reuters Eikon
    // - Alpha Vantage
    // - Yahoo Finance API
    // - Federal Reserve Economic Data (FRED)
    
    return this.generateMockHistoricalData(symbol, days);
  }

  public async subscribeToRealTimeData(symbols: string[], callback: (data: MarketData) => void): Promise<void> {
    if (this.apiKey === 'demo') {
      // Simulate real-time updates every 30 seconds
      setInterval(async () => {
        const data = await this.getCurrentData();
        callback(data);
      }, 30000);
      return;
    }

    // In a real implementation, this would establish WebSocket connections
    // to real-time data feeds like Bloomberg B-PIPE, Reuters, or exchanges
  }

  private async fetchPrices(): Promise<{ [assetId: string]: number }> {
    if (this.apiKey === 'demo') {
      return this.generateMockPrices();
    }

    // Real implementation would call external APIs
    // Example: Alpha Vantage, Yahoo Finance, Bloomberg, etc.
    return this.generateMockPrices();
  }

  private async fetchYields(): Promise<{ [assetId: string]: number }> {
    if (this.apiKey === 'demo') {
      return this.generateMockYields();
    }

    // Real implementation would fetch bond yields from:
    // - Treasury.gov
    // - FRED (Federal Reserve Economic Data)
    // - Bloomberg Bond Indices
    return this.generateMockYields();
  }

  private async fetchCreditSpreads(): Promise<{ [rating: string]: number }> {
    if (this.apiKey === 'demo') {
      return {
        'AAA': 0.0020,
        'AA': 0.0035,
        'A': 0.0055,
        'BBB': 0.0115,
        'BB': 0.0280,
        'B': 0.0720,
        'CCC': 0.1800
      };
    }

    // Real implementation would fetch from credit data providers
    // - ICE BofA indices
    // - Bloomberg Corporate Bond indices
    // - S&P/Moody's credit research
    return {};
  }

  private async fetchVolatilities(): Promise<{ [assetId: string]: number }> {
    if (this.apiKey === 'demo') {
      return this.generateMockVolatilities();
    }

    // Real implementation would calculate from:
    // - VIX for equity volatility
    // - MOVE index for bond volatility
    // - Historical price data
    return this.generateMockVolatilities();
  }

  private async fetchMarketSentiment(): Promise<MarketSentiment> {
    if (this.apiKey === 'demo') {
      const sentiments = ['BULLISH', 'BEARISH', 'NEUTRAL'] as const;
      const conditions = ['TIGHTENING', 'WIDENING', 'STABLE'] as const;
      const rates = ['RISING', 'FALLING', 'STABLE'] as const;
      const vols = ['HIGH', 'MEDIUM', 'LOW'] as const;

      return {
        overall: sentiments[Math.floor(Math.random() * 3)],
        creditMarkets: conditions[Math.floor(Math.random() * 3)],
        interestRates: rates[Math.floor(Math.random() * 3)],
        volatility: vols[Math.floor(Math.random() * 3)]
      };
    }

    // Real implementation would analyze:
    // - News sentiment analysis
    // - Social media sentiment
    // - Economic indicators
    // - Technical analysis signals
    return {
      overall: 'NEUTRAL',
      creditMarkets: 'STABLE',
      interestRates: 'STABLE',
      volatility: 'MEDIUM'
    };
  }

  private async calculateLiquidityScores(prices: { [assetId: string]: number }): Promise<{ [assetId: string]: number }> {
    const liquidityScores: { [assetId: string]: number } = {};
    
    Object.keys(prices).forEach(assetId => {
      // Mock liquidity calculation based on asset type
      if (assetId.includes('UST') || assetId.includes('TREASURY')) {
        liquidityScores[assetId] = 0.95; // High liquidity for Treasuries
      } else if (assetId.includes('MBS') || assetId.includes('ABS')) {
        liquidityScores[assetId] = 0.60; // Medium liquidity for structured products
      } else if (assetId.includes('loan') || assetId.includes('LOAN')) {
        liquidityScores[assetId] = 0.30; // Low liquidity for loans
      } else {
        liquidityScores[assetId] = 0.75; // Default medium-high liquidity
      }
    });
    
    return liquidityScores;
  }

  private generateMockPrices(): { [assetId: string]: number } {
    return {
      'loan-001': 100 + (Math.random() - 0.5) * 2,
      'loan-002': 98 + (Math.random() - 0.5) * 3,
      'sec-001': 98.5 + (Math.random() - 0.5) * 1,
      'sec-002': 102 + (Math.random() - 0.5) * 1.5,
      'UST-10Y': 97 + (Math.random() - 0.5) * 2,
      'SPY': 450 + (Math.random() - 0.5) * 10,
      'TLT': 95 + (Math.random() - 0.5) * 3
    };
  }

  private generateMockYields(): { [assetId: string]: number } {
    return {
      'loan-001': 0.065 + (Math.random() - 0.5) * 0.002,
      'loan-002': 0.072 + (Math.random() - 0.5) * 0.003,
      'sec-001': 0.045 + (Math.random() - 0.5) * 0.001,
      'sec-002': 0.055 + (Math.random() - 0.5) * 0.002,
      'UST-10Y': 0.042 + (Math.random() - 0.5) * 0.001,
      'UST-2Y': 0.035 + (Math.random() - 0.5) * 0.001,
      'UST-30Y': 0.048 + (Math.random() - 0.5) * 0.001
    };
  }

  private generateMockVolatilities(): { [assetId: string]: number } {
    return {
      'loan-001': 0.06 + Math.random() * 0.02,
      'loan-002': 0.10 + Math.random() * 0.03,
      'sec-001': 0.03 + Math.random() * 0.01,
      'sec-002': 0.08 + Math.random() * 0.02,
      'UST-10Y': 0.03 + Math.random() * 0.01,
      'SPY': 0.20 + Math.random() * 0.05,
      'TLT': 0.12 + Math.random() * 0.03
    };
  }

  private generateMockHistoricalData(symbol: string, days: number): any[] {
    const data = [];
    const basePrice = 100;
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.5) * 0.02; // ±1% daily change
      currentPrice = currentPrice * (1 + change);
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: currentPrice * 0.999,
        high: currentPrice * 1.005,
        low: currentPrice * 0.995,
        close: currentPrice,
        volume: Math.floor(Math.random() * 1000000),
        yield: 0.05 + (Math.random() - 0.5) * 0.01
      });
    }
    
    return data;
  }

  private getFallbackData(): MarketData {
    return {
      timestamp: new Date(),
      prices: this.generateMockPrices(),
      yields: this.generateMockYields(),
      creditSpreads: {
        'AAA': 0.0020,
        'AA': 0.0035,
        'A': 0.0055,
        'BBB': 0.0115,
        'BB': 0.0280,
        'B': 0.0720
      },
      volatilities: this.generateMockVolatilities(),
      liquidityScores: {
        'loan-001': 0.30,
        'loan-002': 0.30,
        'sec-001': 0.95,
        'sec-002': 0.60
      },
      marketSentiment: {
        overall: 'NEUTRAL',
        creditMarkets: 'STABLE',
        interestRates: 'STABLE',
        volatility: 'MEDIUM'
      }
    };
  }

  public async getEconomicIndicators(): Promise<any> {
    // Real implementation would fetch from:
    // - Federal Reserve Economic Data (FRED)
    // - Bureau of Labor Statistics
    // - Treasury.gov
    // - International economic data sources
    
    return {
      federalFundsRate: 0.05,
      unemploymentRate: 0.037,
      inflation: 0.025,
      gdpGrowth: 0.023,
      consumerConfidence: 105.2,
      vix: 18.5
    };
  }

  public async getNewsAndEvents(): Promise<any[]> {
    // Real implementation would integrate with:
    // - Reuters News API
    // - Bloomberg News
    // - Economic calendars
    // - Central bank communications
    
    return [
      {
        timestamp: new Date(),
        headline: 'Fed signals potential rate adjustment',
        source: 'Federal Reserve',
        impact: 'HIGH',
        sentiment: 'NEUTRAL'
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        headline: 'Corporate earnings exceed expectations',
        source: 'Market News',
        impact: 'MEDIUM',
        sentiment: 'POSITIVE'
      }
    ];
  }
}