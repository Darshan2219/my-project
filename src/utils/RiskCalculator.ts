import { Portfolio, Asset, Loan, Security, CreditRating } from '../types/portfolio';

export class RiskCalculator {
  
  static calculateVaR(portfolio: Portfolio, confidenceLevel: number = 0.05, timeHorizon: number = 1): number {
    const portfolioVolatility = this.calculatePortfolioVolatility(portfolio);
    const zScore = this.getZScore(confidenceLevel);
    
    return portfolio.totalValue * portfolioVolatility * Math.sqrt(timeHorizon / 252) * zScore;
  }

  static calculateExpectedShortfall(portfolio: Portfolio, confidenceLevel: number = 0.05): number {
    const var95 = this.calculateVaR(portfolio, confidenceLevel);
    return var95 * 1.28;
  }

  static calculatePortfolioVolatility(portfolio: Portfolio): number {
    let weightedVolatility = 0;
    
    portfolio.assets.forEach(asset => {
      const assetVolatility = this.getAssetVolatility(asset);
      weightedVolatility += Math.pow(asset.weight * assetVolatility, 2);
    });
    
    return Math.sqrt(weightedVolatility);
  }

  static calculateBeta(asset: Asset, marketReturn: number = 0.08): number {
    if (asset.type === 'SECURITY') {
      const security = asset as Security;
      if (security.beta) return security.beta;
      
      switch (security.securityType) {
        case 'STOCK': return 1.0;
        case 'BOND': return 0.2;
        case 'TREASURY': return 0.0;
        case 'MBS': return 0.3;
        case 'ABS': return 0.4;
        case 'ETF': return 0.8;
        default: return 0.5;
      }
    }
    
    return 0.1;
  }

  static calculateCreditSpread(creditRating: CreditRating): number {
    const spreads: { [key in CreditRating]: number } = {
      'AAA': 0.0020, 'AA+': 0.0025, 'AA': 0.0030, 'AA-': 0.0035,
      'A+': 0.0045, 'A': 0.0055, 'A-': 0.0070,
      'BBB+': 0.0090, 'BBB': 0.0115, 'BBB-': 0.0150,
      'BB+': 0.0200, 'BB': 0.0280, 'BB-': 0.0380,
      'B+': 0.0520, 'B': 0.0720, 'B-': 0.0980,
      'CCC+': 0.1300, 'CCC': 0.1800, 'CCC-': 0.2500,
      'CC': 0.3500, 'C': 0.5000, 'D': 1.0000
    };
    
    return spreads[creditRating] || 0.1000;
  }

  static calculateProbabilityOfDefault(creditRating: CreditRating, timeHorizon: number = 1): number {
    const basePD: { [key in CreditRating]: number } = {
      'AAA': 0.0001, 'AA+': 0.0002, 'AA': 0.0003, 'AA-': 0.0004,
      'A+': 0.0008, 'A': 0.0012, 'A-': 0.0020,
      'BBB+': 0.0035, 'BBB': 0.0055, 'BBB-': 0.0085,
      'BB+': 0.0150, 'BB': 0.0250, 'BB-': 0.0400,
      'B+': 0.0650, 'B': 0.1000, 'B-': 0.1500,
      'CCC+': 0.2200, 'CCC': 0.3200, 'CCC-': 0.4500,
      'CC': 0.6500, 'C': 0.8500, 'D': 1.0000
    };
    
    const annualPD = basePD[creditRating] || 0.05;
    return 1 - Math.pow(1 - annualPD, timeHorizon);
  }

  static calculateExpectedLoss(asset: Asset): number {
    let pd = 0;
    let lgd = 0.45;
    let ead = asset.marketValue;
    
    if (asset.type === 'LOAN') {
      const loan = asset as Loan;
      pd = this.calculateProbabilityOfDefault(loan.creditRating);
      lgd = Math.max(0, loan.loanToValue - 0.2);
      ead = loan.remainingBalance;
    } else if (asset.type === 'SECURITY') {
      const security = asset as Security;
      if (security.creditRating) {
        pd = this.calculateProbabilityOfDefault(security.creditRating);
        lgd = security.securityType === 'TREASURY' ? 0 : 0.45;
      }
    }
    
    return pd * lgd * ead;
  }

  static calculateDurationRisk(portfolio: Portfolio, yieldShift: number = 0.01): number {
    let durationRisk = 0;
    
    portfolio.assets.forEach(asset => {
      let duration = 0;
      
      if (asset.type === 'SECURITY') {
        duration = (asset as Security).duration || 0;
      } else if (asset.type === 'LOAN') {
        duration = this.calculateLoanDuration(asset as Loan);
      }
      
      const priceChange = -duration * yieldShift * asset.marketValue;
      durationRisk += Math.pow(priceChange, 2);
    });
    
    return Math.sqrt(durationRisk);
  }

  static calculateLiquidityRisk(portfolio: Portfolio): number {
    let liquidityRisk = 0;
    
    portfolio.assets.forEach(asset => {
      let liquidityScore = 0;
      
      if (asset.type === 'SECURITY') {
        const security = asset as Security;
        switch (security.securityType) {
          case 'TREASURY': liquidityScore = 0.01; break;
          case 'STOCK': liquidityScore = 0.02; break;
          case 'ETF': liquidityScore = 0.02; break;
          case 'BOND': liquidityScore = 0.04; break;
          case 'MBS': liquidityScore = 0.06; break;
          case 'ABS': liquidityScore = 0.08; break;
          default: liquidityScore = 0.05;
        }
      } else if (asset.type === 'LOAN') {
        liquidityScore = 0.10;
      }
      
      liquidityRisk += asset.weight * liquidityScore;
    });
    
    return liquidityRisk;
  }

  private static getAssetVolatility(asset: Asset): number {
    if (asset.type === 'SECURITY') {
      const security = asset as Security;
      switch (security.securityType) {
        case 'STOCK': return 0.25;
        case 'BOND': return 0.05;
        case 'TREASURY': return 0.03;
        case 'MBS': return 0.08;
        case 'ABS': return 0.12;
        case 'ETF': return 0.18;
        default: return 0.10;
      }
    } else if (asset.type === 'LOAN') {
      const loan = asset as Loan;
      const baseVol = loan.loanType === 'RESIDENTIAL_MORTGAGE' ? 0.06 : 0.10;
      const ratingMultiplier = this.getCreditRatingVolatilityMultiplier(loan.creditRating);
      return baseVol * ratingMultiplier;
    }
    
    return 0.10;
  }

  private static getCreditRatingVolatilityMultiplier(rating: CreditRating): number {
    if (['AAA', 'AA+', 'AA', 'AA-'].includes(rating)) return 1.0;
    if (['A+', 'A', 'A-'].includes(rating)) return 1.2;
    if (['BBB+', 'BBB', 'BBB-'].includes(rating)) return 1.5;
    if (['BB+', 'BB', 'BB-'].includes(rating)) return 2.0;
    if (['B+', 'B', 'B-'].includes(rating)) return 2.5;
    return 3.0;
  }

  private static getZScore(confidenceLevel: number): number {
    const zScores: { [key: number]: number } = {
      0.01: 2.326,
      0.025: 1.96,
      0.05: 1.645,
      0.10: 1.282
    };
    
    return zScores[confidenceLevel] || 1.645;
  }

  private static calculateLoanDuration(loan: Loan): number {
    const yearsToMaturity = (loan.maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);
    const paymentFrequency = 12;
    const couponRate = loan.interestRate;
    
    if (couponRate === 0) return yearsToMaturity;
    
    const periodsRemaining = yearsToMaturity * paymentFrequency;
    const periodRate = couponRate / paymentFrequency;
    
    let duration = 0;
    for (let t = 1; t <= periodsRemaining; t++) {
      const pv = (loan.monthlyPayment / Math.pow(1 + periodRate, t));
      const weightedTime = (t / paymentFrequency) * pv;
      duration += weightedTime;
    }
    
    const finalPayment = loan.remainingBalance / Math.pow(1 + periodRate, periodsRemaining);
    duration += yearsToMaturity * finalPayment;
    
    return duration / loan.marketValue;
  }
}