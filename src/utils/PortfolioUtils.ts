import { Portfolio, Asset, Loan, Security } from '../types/portfolio';

export class PortfolioUtils {
  
  /**
   * Converts string dates back to Date objects after JSON parsing
   */
  static parsePortfolioDates(portfolio: any): Portfolio {
    // Parse portfolio-level dates
    if (portfolio.createdAt && typeof portfolio.createdAt === 'string') {
      portfolio.createdAt = new Date(portfolio.createdAt);
    }
    if (portfolio.lastUpdated && typeof portfolio.lastUpdated === 'string') {
      portfolio.lastUpdated = new Date(portfolio.lastUpdated);
    }

    // Parse asset dates
    if (portfolio.assets && Array.isArray(portfolio.assets)) {
      portfolio.assets = portfolio.assets.map((asset: any) => {
        // Parse common asset dates
        if (asset.lastUpdated && typeof asset.lastUpdated === 'string') {
          asset.lastUpdated = new Date(asset.lastUpdated);
        }

        // Parse loan-specific dates
        if (asset.type === 'LOAN') {
          if (asset.maturityDate && typeof asset.maturityDate === 'string') {
            asset.maturityDate = new Date(asset.maturityDate);
          }
        }

        // Parse security-specific dates
        if (asset.type === 'SECURITY') {
          if (asset.maturityDate && typeof asset.maturityDate === 'string') {
            asset.maturityDate = new Date(asset.maturityDate);
          }
        }

        return asset;
      });
    }

    return portfolio as Portfolio;
  }

  /**
   * Validates portfolio data structure
   */
  static validatePortfolio(portfolio: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!portfolio.id) errors.push('Portfolio ID is required');
    if (!portfolio.name) errors.push('Portfolio name is required');
    if (!portfolio.totalValue || portfolio.totalValue <= 0) {
      errors.push('Portfolio total value must be greater than 0');
    }
    if (!portfolio.assets || !Array.isArray(portfolio.assets) || portfolio.assets.length === 0) {
      errors.push('Portfolio must contain at least one asset');
    }

    // Validate assets
    if (portfolio.assets) {
      portfolio.assets.forEach((asset: any, index: number) => {
        if (!asset.id) errors.push(`Asset ${index + 1}: ID is required`);
        if (!asset.name) errors.push(`Asset ${index + 1}: Name is required`);
        if (!asset.type || !['LOAN', 'SECURITY'].includes(asset.type)) {
          errors.push(`Asset ${index + 1}: Type must be LOAN or SECURITY`);
        }
        if (!asset.marketValue || asset.marketValue <= 0) {
          errors.push(`Asset ${index + 1}: Market value must be greater than 0`);
        }
        if (asset.weight === undefined || asset.weight < 0 || asset.weight > 1) {
          errors.push(`Asset ${index + 1}: Weight must be between 0 and 1`);
        }

        // Validate loan-specific fields
        if (asset.type === 'LOAN') {
          if (!asset.loanType) errors.push(`Loan ${index + 1}: Loan type is required`);
          if (!asset.interestRate || asset.interestRate <= 0) {
            errors.push(`Loan ${index + 1}: Interest rate must be greater than 0`);
          }
          if (!asset.creditRating) errors.push(`Loan ${index + 1}: Credit rating is required`);
        }

        // Validate security-specific fields
        if (asset.type === 'SECURITY') {
          if (!asset.securityType) errors.push(`Security ${index + 1}: Security type is required`);
          if (asset.yield === undefined || asset.yield < 0) {
            errors.push(`Security ${index + 1}: Yield must be greater than or equal to 0`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Safely gets a date value, handling both string and Date inputs
   */
  static safeGetDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return new Date(dateValue);
    return new Date();
  }

  /**
   * Calculates years to maturity from a date
   */
  static getYearsToMaturity(maturityDate: any): number {
    const date = this.safeGetDate(maturityDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, diffYears);
  }
}