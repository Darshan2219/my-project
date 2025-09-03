class PortfolioAdvisorySystem {
    constructor() {
        this.currentPortfolio = null;
        this.currentAnalysis = null;
        this.init();
    }

    init() {
        console.log('Portfolio Advisory System initialized');
        this.checkSystemHealth();
    }

    async checkSystemHealth() {
        try {
            const response = await fetch('/health');
            const health = await response.json();
            console.log('System Status:', health);
        } catch (error) {
            console.error('System health check failed:', error);
        }
    }

    async loadSamplePortfolio() {
        try {
            const response = await fetch('/sample-portfolio');
            this.currentPortfolio = await response.json();
            
            this.displayPortfolioInfo();
            this.updatePortfolioMetrics();
            document.getElementById('analyzeBtn').disabled = false;
            
        } catch (error) {
            console.error('Failed to load sample portfolio:', error);
            alert('Failed to load sample portfolio');
        }
    }

    displayPortfolioInfo() {
        const portfolio = this.currentPortfolio;
        const portfolioInfo = document.getElementById('portfolioInfo');
        const portfolioSummary = document.getElementById('portfolioSummary');
        
        portfolioSummary.innerHTML = `
            <div><strong>Name:</strong> ${portfolio.name}</div>
            <div><strong>Total Value:</strong> $${portfolio.totalValue.toLocaleString()}</div>
            <div><strong>Assets:</strong> ${portfolio.assets.length} positions</div>
            <div><strong>Risk Profile:</strong> ${portfolio.riskProfile.riskTolerance}</div>
        `;
        
        portfolioInfo.style.display = 'block';
    }

    updatePortfolioMetrics() {
        const portfolio = this.currentPortfolio;
        const metrics = document.getElementById('portfolioMetrics');
        
        // Calculate mortgage allocation
        const mortgageAllocation = portfolio.assets
            .filter(asset => asset.type === 'LOAN')
            .reduce((sum, asset) => sum + asset.weight, 0);
        
        // Calculate average yield
        let totalYield = 0;
        portfolio.assets.forEach(asset => {
            if (asset.type === 'SECURITY') {
                totalYield += asset.weight * asset.yield;
            } else if (asset.type === 'LOAN') {
                totalYield += asset.weight * asset.interestRate;
            }
        });

        metrics.innerHTML = `
            <div class="metric">
                <div class="metric-value">$${(portfolio.totalValue / 1000000).toFixed(0)}M</div>
                <div class="metric-label">Total Portfolio Value</div>
            </div>
            <div class="metric">
                <div class="metric-value">${portfolio.assets.length}</div>
                <div class="metric-label">Asset Count</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(mortgageAllocation * 100).toFixed(1)}%</div>
                <div class="metric-label">Mortgage Allocation</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(totalYield * 100).toFixed(2)}%</div>
                <div class="metric-label">Average Yield</div>
            </div>
        `;
    }

    async analyzePortfolio() {
        if (!this.currentPortfolio) {
            alert('Please load a portfolio first');
            return;
        }

        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

        try {
            // Get comprehensive analysis
            const [analysisRes, riskRes, optimizationRes] = await Promise.all([
                fetch('/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.currentPortfolio)
                }),
                fetch('/risk-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.currentPortfolio)
                }),
                fetch('/optimization', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.currentPortfolio)
                })
            ]);

            // Check for HTTP errors
            if (!analysisRes.ok) {
                const errorText = await analysisRes.text();
                throw new Error(`Analysis failed: ${errorText}`);
            }
            if (!riskRes.ok) {
                const errorText = await riskRes.text();
                throw new Error(`Risk assessment failed: ${errorText}`);
            }
            if (!optimizationRes.ok) {
                const errorText = await optimizationRes.text();
                throw new Error(`Optimization failed: ${errorText}`);
            }

            const analysis = await analysisRes.json();
            const riskAssessment = await riskRes.json();
            const optimization = await optimizationRes.json();

            console.log('Analysis result:', analysis);
            console.log('Risk assessment result:', riskAssessment);
            console.log('Optimization result:', optimization);

            this.currentAnalysis = { analysis, riskAssessment, optimization };
            
            this.displayRecommendations(analysis);
            this.displayRiskAssessment(riskAssessment);
            this.displayImplementationGuidance(optimization);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Portfolio analysis failed: ' + error.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-analytics"></i> Analyze & Get Recommendations';
        }
    }

    displayRecommendations(analysis) {
        const recommendationsCard = document.getElementById('recommendationsCard');
        const recommendationsContent = document.getElementById('recommendationsContent');
        
        const recommendations = analysis.recommendations || [];
        
        recommendationsContent.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item priority-${rec.priority.toLowerCase()}">
                <div class="recommendation-header">
                    <div class="recommendation-title">${rec.title}</div>
                    <div class="priority-badge ${rec.priority.toLowerCase()}">${rec.priority}</div>
                </div>
                <div class="recommendation-content">
                    <p><strong>Description:</strong> ${rec.description}</p>
                    <p><strong>Reasoning:</strong> ${rec.reasoning}</p>
                    <div class="human-execution-note">
                        <i class="fas fa-user"></i> <strong>Human Review Required:</strong> 
                        ${rec.executionNote || 'Portfolio manager must validate and execute this recommendation.'}
                    </div>
                </div>
                <div class="recommendation-actions">
                    <button class="btn-small btn-primary" onclick="advisory.showRecommendationDetails('${rec.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn-small btn-secondary" onclick="advisory.exportRecommendation('${rec.id}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
        `).join('');
        
        recommendationsCard.style.display = 'block';
    }

    displayRiskAssessment(riskAssessment) {
        const riskCard = document.getElementById('riskCard');
        const riskContent = document.getElementById('riskContent');
        
        // Safe access with defaults
        const overallRiskScore = riskAssessment.overallRiskScore || 0;
        const riskFactors = riskAssessment.riskFactors || [];
        const managerGuidance = riskAssessment.managerGuidance || {};
        const immediateActions = managerGuidance.immediateActions || [];
        const escalationTriggers = managerGuidance.escalationTriggers || [];
        
        riskContent.innerHTML = `
            <div class="risk-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Overall Risk Score</h4>
                <div class="risk-score ${this.getRiskScoreClass(overallRiskScore)}">
                    ${(overallRiskScore * 100).toFixed(1)}/100
                </div>
            </div>
            
            <div class="risk-section">
                <h4><i class="fas fa-list"></i> Identified Risk Factors</h4>
                <div class="risk-factors">
                    ${riskFactors.length > 0 ? riskFactors.map(factor => `
                        <div class="risk-factor medium-risk">
                            <i class="fas fa-shield-alt"></i> ${factor}
                        </div>
                    `).join('') : '<p>No significant risk factors identified.</p>'}
                </div>
            </div>
            
            <div class="risk-section">
                <h4><i class="fas fa-tasks"></i> Manager Guidance</h4>
                <div class="manager-guidance">
                    <div class="guidance-section">
                        <h5>Immediate Actions Required</h5>
                        <ul>
                            ${immediateActions.length > 0 ? immediateActions.map(action => 
                                `<li>${typeof action === 'string' ? action : (action.title + ' - ' + action.description)}</li>`
                            ).join('') : '<li>No immediate actions required.</li>'}
                        </ul>
                    </div>
                    
                    <div class="guidance-section">
                        <h5>Escalation Triggers</h5>
                        <ul>
                            ${escalationTriggers.length > 0 ? escalationTriggers.map(trigger => 
                                `<li>${trigger}</li>`
                            ).join('') : '<li>No escalation triggers configured.</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        riskCard.style.display = 'block';
    }

    displayImplementationGuidance(optimization) {
        const guidanceSection = document.getElementById('guidanceSection');
        const implementationPlan = document.getElementById('implementationPlan');
        const businessImpact = document.getElementById('businessImpact');
        
        // Safe access with defaults
        const implPlan = optimization.implementationPlan || {};
        const bizImpact = optimization.businessImpact || {};
        
        implementationPlan.innerHTML = `
            <div class="implementation-step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <strong>${implPlan.phase1 || 'Review and validate optimization suggestions'}</strong>
                </div>
            </div>
            <div class="implementation-step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <strong>${implPlan.phase2 || 'Obtain market quotes and assess execution costs'}</strong>
                </div>
            </div>
            <div class="implementation-step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <strong>${implPlan.phase3 || 'Execute trades in optimal sequence'}</strong>
                </div>
            </div>
            <div class="implementation-step">
                <div class="step-number">4</div>
                <div class="step-content">
                    <strong>${implPlan.phase4 || 'Monitor performance and adjust as needed'}</strong>
                </div>
            </div>
        `;
        
        businessImpact.innerHTML = `
            <div class="business-metrics">
                <div class="business-metric">
                    <div class="business-metric-value">${bizImpact.expectedYieldImprovement || '0.5-1.5% annually'}</div>
                    <div class="business-metric-label">Expected Yield Improvement</div>
                </div>
                <div class="business-metric">
                    <div class="business-metric-value">${bizImpact.riskReduction || '10-25% portfolio volatility'}</div>
                    <div class="business-metric-label">Risk Reduction</div>
                </div>
                <div class="business-metric">
                    <div class="business-metric-value">${bizImpact.timeToImplement || '2-4 weeks'}</div>
                    <div class="business-metric-label">Implementation Time</div>
                </div>
            </div>
            <div class="implementation-note">
                <p><strong>Resources Required:</strong> ${bizImpact.resourcesRequired || 'Portfolio manager review, trading desk execution'}</p>
            </div>
        `;
        
        guidanceSection.style.display = 'flex';
    }

    async loadBusinessImpact() {
        try {
            const response = await fetch('/business-impact');
            const businessCase = await response.json();
            
            const content = document.getElementById('businessCaseContent');
            content.innerHTML = `
                <div class="business-section">
                    <h4><i class="fas fa-bullseye"></i> Primary Benefits</h4>
                    <ul class="business-list">
                        ${businessCase.businessValue.primaryBenefits.map(benefit => 
                            `<li>${benefit}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="business-section">
                    <h4><i class="fas fa-chart-line"></i> Quantifiable Impacts</h4>
                    <div class="business-metrics">
                        <div class="business-metric">
                            <div class="business-metric-value">${businessCase.businessValue.quantifiableImpacts.yieldImprovement}</div>
                            <div class="business-metric-label">Yield Improvement</div>
                        </div>
                        <div class="business-metric">
                            <div class="business-metric-value">${businessCase.businessValue.quantifiableImpacts.riskReduction}</div>
                            <div class="business-metric-label">Risk Reduction</div>
                        </div>
                        <div class="business-metric">
                            <div class="business-metric-value">${businessCase.businessValue.quantifiableImpacts.timesSavings}</div>
                            <div class="business-metric-label">Time Savings</div>
                        </div>
                        <div class="business-metric">
                            <div class="business-metric-value">${businessCase.businessValue.quantifiableImpacts.decisionSpeed}</div>
                            <div class="business-metric-label">Decision Speed</div>
                        </div>
                    </div>
                </div>
                
                <div class="business-section">
                    <h4><i class="fas fa-calendar-alt"></i> Implementation</h4>
                    <p><strong>Timeline:</strong> ${businessCase.implementation.timeline}</p>
                    <p><strong>Maturity:</strong> ${businessCase.implementation.maturityLevel}</p>
                    <ul class="business-list">
                        ${businessCase.implementation.resources.map(resource => 
                            `<li>${resource}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
            content.style.display = 'block';
        } catch (error) {
            console.error('Failed to load business impact:', error);
        }
    }

    async loadTechnicalFeasibility() {
        try {
            const response = await fetch('/technical-feasibility');
            const technical = await response.json();
            
            const content = document.getElementById('technicalContent');
            content.innerHTML = `
                <div class="technical-section">
                    <h4><i class="fas fa-cogs"></i> System Architecture</h4>
                    <p><strong>Approach:</strong> ${technical.systemArchitecture.approach}</p>
                    <ul class="technical-list">
                        ${technical.systemArchitecture.components.map(component => 
                            `<li>${component}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="technical-section">
                    <h4><i class="fas fa-server"></i> Infrastructure Requirements</h4>
                    <ul class="technical-list">
                        ${technical.technicalRequirements.infrastructure.map(req => 
                            `<li>${req}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="technical-section">
                    <h4><i class="fas fa-plug"></i> Integration Points</h4>
                    <ul class="technical-list">
                        ${technical.technicalRequirements.integrations.map(integration => 
                            `<li>${integration}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="technical-section">
                    <h4><i class="fas fa-check-circle"></i> Assessment Summary</h4>
                    <p><strong>Implementation Risk:</strong> <span class="risk-low">${technical.implementationRisk}</span></p>
                    <p><strong>Scalability:</strong> <span class="scalability-high">${technical.scalability}</span></p>
                    <p><strong>Compliance:</strong> <span class="compliance-suitable">${technical.compliance}</span></p>
                </div>
            `;
            content.style.display = 'block';
        } catch (error) {
            console.error('Failed to load technical feasibility:', error);
        }
    }

    showRecommendationDetails(recommendationId) {
        const rec = this.findRecommendation(recommendationId);
        if (!rec) return;
        
        const modal = document.getElementById('recommendationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = rec.title;
        modalContent.innerHTML = `
            <div class="recommendation-detail">
                <div class="detail-section">
                    <h4>Description</h4>
                    <p>${rec.description}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Reasoning</h4>
                    <p>${rec.reasoning}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Action Items</h4>
                    <ul>
                        ${rec.actionItems.map(item => 
                            `<li><strong>${item.action}:</strong> ${item.rationale}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="detail-section">
                    <h4>Expected Impact</h4>
                    <p><strong>Risk Reduction:</strong> ${rec.impact?.riskReduction ? (rec.impact.riskReduction * 100).toFixed(1) + '%' : 'Not specified'}</p>
                    <p><strong>Timeframe:</strong> ${rec.impact?.timeframe || 'Not specified'}</p>
                </div>
                
                <div class="human-execution-reminder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>IMPORTANT:</strong> This recommendation requires human review and execution. 
                    Please validate market conditions, regulatory requirements, and obtain necessary approvals before implementation.
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    findRecommendation(id) {
        if (!this.currentAnalysis) return null;
        return this.currentAnalysis.analysis.recommendations.find(r => r.id === id);
    }

    exportRecommendation(recommendationId) {
        const rec = this.findRecommendation(recommendationId);
        if (!rec) return;
        
        const exportData = {
            recommendation: rec,
            portfolio: this.currentPortfolio.name,
            generatedAt: new Date().toISOString(),
            systemType: 'Portfolio Advisory System - Non-Agentic',
            disclaimer: 'This recommendation is advisory only and requires human validation and execution.'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recommendation-${rec.id}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getRiskScoreClass(score) {
        if (score > 0.7) return 'high-risk';
        if (score > 0.4) return 'medium-risk';
        return 'low-risk';
    }

    closeModal() {
        document.getElementById('recommendationModal').style.display = 'none';
    }
}

// Initialize the advisory system
const advisory = new PortfolioAdvisorySystem();

// Global functions for HTML onclick handlers
function loadSamplePortfolio() {
    advisory.loadSamplePortfolio();
}

function analyzePortfolio() {
    advisory.analyzePortfolio();
}

function loadBusinessImpact() {
    advisory.loadBusinessImpact();
}

function loadTechnicalFeasibility() {
    advisory.loadTechnicalFeasibility();
}

function closeModal() {
    advisory.closeModal();
}

function exportRecommendation() {
    // Export current recommendation from modal context
    console.log('Export functionality would be implemented here');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('recommendationModal');
    if (event.target === modal) {
        advisory.closeModal();
    }
}