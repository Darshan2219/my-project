class AgenticDashboard {
    constructor() {
        this.agents = new Map();
        this.systemData = {};
        this.activityLog = [];
        this.performanceChart = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeChart();
        await this.loadSystemStatus();
        this.startRealTimeUpdates();
        this.addActivityLog('Dashboard initialized');
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('createAgentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAgent();
        });

        // Auto-refresh every 5 seconds
        setInterval(() => {
            this.loadSystemStatus();
            this.loadAgents();
        }, 5000);
    }

    async loadSystemStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            this.updateSystemMetrics(data);
            this.updateSystemStatus(data.agentSystem?.systemHealth || 'HEALTHY');
            
        } catch (error) {
            console.error('Failed to load system status:', error);
            this.updateSystemStatus('CRITICAL');
        }
    }

    updateSystemMetrics(data) {
        const agentSystem = data.agentSystem || {};
        
        document.getElementById('activeAgents').textContent = agentSystem.agentCount || 0;
        
        let totalDecisions = 0;
        let totalSuccessRate = 0;
        let totalPortfolioValue = 0;
        let agentCount = 0;

        if (agentSystem.agents) {
            agentSystem.agents.forEach(agent => {
                totalDecisions += agent.totalDecisions || 0;
                totalSuccessRate += agent.successRate || 0;
                totalPortfolioValue += agent.performance?.totalReturn || 0;
                agentCount++;
            });
        }

        document.getElementById('totalDecisions').textContent = totalDecisions;
        document.getElementById('successRate').textContent = 
            agentCount > 0 ? Math.round((totalSuccessRate / agentCount) * 100) + '%' : '0%';
        document.getElementById('totalPortfolioValue').textContent = 
            '$' + (totalPortfolioValue * 1000000).toLocaleString(); // Mock portfolio values
    }

    updateSystemStatus(health) {
        const statusElement = document.getElementById('systemStatus');
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('span:last-child');
        
        indicator.className = 'status-indicator';
        
        switch (health) {
            case 'HEALTHY':
                indicator.classList.add('healthy');
                text.textContent = 'System Healthy';
                break;
            case 'WARNING':
                indicator.classList.add('warning');
                text.textContent = 'System Warning';
                break;
            case 'CRITICAL':
                indicator.classList.add('critical');
                text.textContent = 'System Critical';
                break;
        }
    }

    async loadAgents() {
        try {
            const response = await fetch('/agents');
            const data = await response.json();
            
            this.renderAgents(data.agents || []);
            
        } catch (error) {
            console.error('Failed to load agents:', error);
        }
    }

    renderAgents(agents) {
        const container = document.getElementById('agentsContainer');
        
        if (agents.length === 0) {
            container.innerHTML = `
                <div class="no-agents">
                    <i class="fas fa-robot"></i>
                    <p>No agents currently running</p>
                    <p class="small">Create your first autonomous trading agent above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = agents.map(agent => `
            <div class="agent-card ${agent.status.toLowerCase()}">
                <div class="agent-header">
                    <div class="agent-title">
                        <i class="fas fa-robot"></i> ${agent.id}
                    </div>
                    <div class="agent-status ${agent.status.toLowerCase()}">
                        ${agent.status}
                    </div>
                </div>
                
                <div class="agent-metrics">
                    <div class="agent-metric">
                        <div class="agent-metric-value">${agent.totalDecisions || 0}</div>
                        <div class="agent-metric-label">Decisions</div>
                    </div>
                    <div class="agent-metric">
                        <div class="agent-metric-value">${Math.round((agent.successRate || 0) * 100)}%</div>
                        <div class="agent-metric-label">Success Rate</div>
                    </div>
                    <div class="agent-metric">
                        <div class="agent-metric-value">${agent.alertCount || 0}</div>
                        <div class="agent-metric-label">Alerts</div>
                    </div>
                </div>
                
                <div class="agent-controls">
                    <button class="btn-control btn-start" onclick="dashboard.controlAgent('${agent.id}', 'start')">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="btn-control btn-pause" onclick="dashboard.controlAgent('${agent.id}', 'pause')">
                        <i class="fas fa-pause"></i> Pause  
                    </button>
                    <button class="btn-control btn-stop" onclick="dashboard.controlAgent('${agent.id}', 'stop')">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                    <button class="btn-control btn-details" onclick="dashboard.showAgentDetails('${agent.id}')">
                        <i class="fas fa-info"></i> Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    async createAgent() {
        const formData = {
            agentId: document.getElementById('agentId').value,
            agentName: document.getElementById('agentName').value,
            autonomyLevel: document.getElementById('autonomyLevel').value,
            maxDailyVaR: parseInt(document.getElementById('maxDailyVaR').value)
        };

        try {
            // Get sample configuration and portfolio
            const [configRes, portfolioRes] = await Promise.all([
                fetch('/sample-config'),
                fetch('/sample-portfolio')
            ]);
            
            const config = await configRes.json();
            const portfolio = await portfolioRes.json();
            
            // Update config with form values
            config.id = formData.agentId;
            config.name = formData.agentName;
            config.autonomyLevel = formData.autonomyLevel;
            config.riskLimits.maxDailyVaR = formData.maxDailyVaR;
            
            // Create agent
            const response = await fetch('/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config, portfolio })
            });

            if (response.ok) {
                const result = await response.json();
                this.addActivityLog(`Agent ${formData.agentId} created successfully`);
                
                // Clear form
                document.getElementById('createAgentForm').reset();
                
                // Reload agents
                await this.loadAgents();
                
                alert('Agent created successfully!');
            } else {
                const error = await response.json();
                throw new Error(error.message);
            }
            
        } catch (error) {
            console.error('Failed to create agent:', error);
            alert('Failed to create agent: ' + error.message);
        }
    }

    async controlAgent(agentId, action) {
        try {
            const response = await fetch(`/agents/${agentId}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action })
            });

            if (response.ok) {
                const result = await response.json();
                this.addActivityLog(`Agent ${agentId} ${action} successful`);
                await this.loadAgents();
            } else {
                const error = await response.json();
                throw new Error(error.message);
            }
            
        } catch (error) {
            console.error(`Failed to ${action} agent:`, error);
            alert(`Failed to ${action} agent: ` + error.message);
        }
    }

    async showAgentDetails(agentId) {
        try {
            const response = await fetch(`/agents/${agentId}`);
            const data = await response.json();
            
            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = `
                <div class="agent-details">
                    <h3>Agent Configuration</h3>
                    <p><strong>ID:</strong> ${data.state.id}</p>
                    <p><strong>Status:</strong> ${data.state.status}</p>
                    <p><strong>Total Decisions:</strong> ${data.state.totalDecisions}</p>
                    <p><strong>Success Rate:</strong> ${Math.round(data.state.successRate * 100)}%</p>
                    <p><strong>Last Decision:</strong> ${new Date(data.state.lastDecision).toLocaleString()}</p>
                    
                    <h3>Portfolio</h3>
                    <p><strong>Total Value:</strong> $${data.state.currentPortfolio.totalValue.toLocaleString()}</p>
                    <p><strong>Assets:</strong> ${data.state.currentPortfolio.assets.length}</p>
                    
                    <h3>Recent Decisions</h3>
                    <div class="decisions-list">
                        ${data.decisionHistory.slice(-5).map(decision => `
                            <div class="decision-item">
                                <strong>${decision.decisionType}</strong> - ${decision.status}
                                <br><small>${new Date(decision.timestamp).toLocaleString()}</small>
                                <br><em>${decision.reasoning.split('\\n')[0]}</em>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('modalTitle').textContent = `Agent Details: ${agentId}`;
            document.getElementById('agentModal').style.display = 'block';
            
        } catch (error) {
            console.error('Failed to load agent details:', error);
            alert('Failed to load agent details: ' + error.message);
        }
    }

    loadSampleData() {
        document.getElementById('agentId').value = 'agent-' + Date.now().toString().slice(-6);
        document.getElementById('agentName').value = 'Primary Trading Agent';
        document.getElementById('autonomyLevel').value = 'SEMI_AUTO';
        document.getElementById('maxDailyVaR').value = '500000';
    }

    async emergencyShutdown() {
        if (confirm('Are you sure you want to initiate emergency shutdown? This will stop all agents immediately.')) {
            try {
                const response = await fetch('/emergency-shutdown', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ reason: 'Manual emergency shutdown from dashboard' })
                });

                if (response.ok) {
                    this.addActivityLog('EMERGENCY SHUTDOWN INITIATED');
                    this.updateSystemStatus('CRITICAL');
                    await this.loadAgents();
                    alert('Emergency shutdown initiated successfully');
                } else {
                    throw new Error('Failed to initiate emergency shutdown');
                }
                
            } catch (error) {
                console.error('Emergency shutdown failed:', error);
                alert('Emergency shutdown failed: ' + error.message);
            }
        }
    }

    addActivityLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.activityLog.unshift({ timestamp, message });
        
        // Keep only last 50 items
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }
        
        this.renderActivityFeed();
    }

    renderActivityFeed() {
        const feed = document.getElementById('activityFeed');
        feed.innerHTML = this.activityLog.map(item => `
            <div class="activity-item">
                <span class="timestamp">${item.timestamp}</span>
                <span class="message">${item.message}</span>
            </div>
        `).join('');
    }

    initializeChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'System Performance',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        this.updateChart();
    }

    updateChart() {
        // Generate mock performance data
        const now = new Date();
        const labels = [];
        const data = [];
        
        for (let i = 9; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000);
            labels.push(time.toLocaleTimeString());
            data.push(Math.random() * 20 + 80); // 80-100% performance
        }
        
        this.performanceChart.data.labels = labels;
        this.performanceChart.data.datasets[0].data = data;
        this.performanceChart.update();
    }

    startRealTimeUpdates() {
        // Update chart every minute
        setInterval(() => {
            this.updateChart();
        }, 60000);
        
        // Add random activity periodically
        setInterval(() => {
            const activities = [
                'Market data refreshed',
                'Risk limits checked',
                'Portfolio rebalancing assessed',
                'System health verified'
            ];
            
            if (Math.random() > 0.7) {
                const activity = activities[Math.floor(Math.random() * activities.length)];
                this.addActivityLog(activity);
            }
        }, 30000);
    }
}

// Initialize dashboard
const dashboard = new AgenticDashboard();

// Global functions for HTML onclick handlers
function loadSampleData() {
    dashboard.loadSampleData();
}

function emergencyShutdown() {
    dashboard.emergencyShutdown();
}

function closeModal() {
    document.getElementById('agentModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('agentModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}