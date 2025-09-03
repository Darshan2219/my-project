# Portfolio Strategy Advisor

An AI-powered portfolio management system for loan and securities optimization, designed to analyze portfolios and provide intelligent rebalancing recommendations for portfolio managers.

## Features

- **Portfolio Analysis**: Comprehensive risk metrics, performance analysis, and allocation assessment
- **Rebalancing Recommendations**: AI-driven suggestions for portfolio optimization
- **Risk Assessment**: Credit risk, interest rate risk, concentration risk, and liquidity risk analysis
- **Optimization Suggestions**: Yield enhancement and diversification improvements
- **RESTful API**: Easy integration with existing systems

## Architecture

### Core Components

- **Portfolio Data Models** (`src/types/`): TypeScript interfaces for loans, securities, and portfolios
- **Portfolio Analyzer** (`src/services/PortfolioAnalyzer.ts`): Risk metrics and performance calculations
- **Rebalancing Engine** (`src/services/RebalancingEngine.ts`): AI-powered recommendation generation
- **Risk Calculator** (`src/utils/RiskCalculator.ts`): Advanced risk measurement utilities
- **Strategy Advisor** (`src/services/PortfolioStrategyAdvisor.ts`): Main orchestration service

## API Endpoints

### Health Check
```
GET /health
```

### Portfolio Analysis
```
POST /analyze
Content-Type: application/json

{
  "id": "portfolio-001",
  "name": "Sample Portfolio",
  "assets": [...],
  "totalValue": 10000000,
  ...
}
```

### Rebalancing Recommendations
```
POST /recommendations
Content-Type: application/json

{...portfolio data}
```

### Risk Assessment
```
POST /risk-assessment
Content-Type: application/json

{...portfolio data}
```

### Optimization Suggestions
```
POST /optimization
Content-Type: application/json

{...portfolio data}
```

### Sample Portfolio
```
GET /sample-portfolio
```

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Test with sample data**:
   ```bash
   curl http://localhost:3000/sample-portfolio
   ```

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint TypeScript code
- `npm run typecheck` - Type checking without compilation

## Portfolio Structure

### Supported Asset Types

**Loans**:
- Residential Mortgages
- Commercial Mortgages
- Personal Loans
- Auto Loans
- Student Loans

**Securities**:
- Bonds
- Stocks
- ETFs
- Mortgage-Backed Securities (MBS)
- Asset-Backed Securities (ABS)
- Treasury Securities

### Risk Metrics

- Value at Risk (VaR)
- Expected Shortfall
- Credit Risk Assessment
- Interest Rate Risk (Duration)
- Concentration Risk
- Liquidity Risk

### Recommendation Types

- **Rebalancing**: Allocation adjustments to meet targets
- **Risk Mitigation**: Credit and interest rate risk reduction
- **Diversification**: Concentration risk reduction
- **Yield Enhancement**: Income optimization
- **Duration Adjustment**: Interest rate sensitivity management

## Use Case

This system supports portfolio managers in the mortgage lifecycle within Capital Markets operations by:

1. **Analyzing** current loan and securities portfolios
2. **Identifying** risk concentrations and allocation deviations
3. **Suggesting** specific rebalancing actions with reasoning
4. **Supporting** human decision-making with data-driven insights

**Note**: This is a non-agentic AI system - all decisions remain with human portfolio managers.

## License

ISC
