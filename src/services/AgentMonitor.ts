import { PortfolioAgent } from '../agents/PortfolioAgent';
import { AgentState, AgentDecision, Alert } from '../types/agent';

export interface MonitoringConfig {
  checkInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
  emergencyContacts: string[];
  autoShutdownTriggers: ShutdownTrigger[];
}

export interface AlertThresholds {
  maxDailyLoss: number;
  maxDrawdown: number;
  minSuccessRate: number;
  maxConsecutiveFailures: number;
  maxRiskExposure: number;
}

export interface ShutdownTrigger {
  condition: string;
  threshold: number;
  description: string;
}

export class AgentMonitor {
  private agents: Map<string, PortfolioAgent> = new Map();
  private config: MonitoringConfig;
  private intervalId?: NodeJS.Timeout;
  private emergencyShutdownActive = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  public registerAgent(agent: PortfolioAgent): void {
    const state = agent.getState();
    this.agents.set(state.id, agent);
    console.log(`Agent ${state.id} registered for monitoring`);
  }

  public unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    console.log(`Agent ${agentId} unregistered from monitoring`);
  }

  public startMonitoring(): void {
    console.log('Starting agent monitoring system');
    
    this.intervalId = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.checkInterval);
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Agent monitoring system stopped');
  }

  public async emergencyShutdown(reason: string): Promise<void> {
    if (this.emergencyShutdownActive) return;
    
    this.emergencyShutdownActive = true;
    console.log(`EMERGENCY SHUTDOWN INITIATED: ${reason}`);
    
    // Stop all agents
    for (const [agentId, agent] of this.agents) {
      try {
        agent.stop();
        console.log(`Agent ${agentId} stopped`);
      } catch (error) {
        console.error(`Failed to stop agent ${agentId}:`, error);
      }
    }

    // Send emergency notifications
    await this.sendEmergencyNotification(reason);
    
    // Stop monitoring
    this.stopMonitoring();
  }

  public getSystemStatus(): any {
    const agentStatuses = Array.from(this.agents.entries()).map(([id, agent]) => {
      const state = agent.getState();
      return {
        id,
        status: state.status,
        lastDecision: state.lastDecision,
        totalDecisions: state.totalDecisions,
        successRate: state.successRate,
        alertCount: state.alerts.length,
        performance: state.performance
      };
    });

    return {
      monitoringActive: !!this.intervalId,
      emergencyShutdownActive: this.emergencyShutdownActive,
      agentCount: this.agents.size,
      agents: agentStatuses,
      systemHealth: this.calculateSystemHealth(agentStatuses)
    };
  }

  public getAgentPerformance(agentId: string): any {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const state = agent.getState();
    const decisions = agent.getDecisionHistory();
    
    return {
      performance: state.performance,
      recentDecisions: decisions.slice(-10),
      riskMetrics: this.calculateAgentRiskMetrics(decisions),
      alerts: state.alerts.filter(a => !a.acknowledged)
    };
  }

  public async overrideAgent(agentId: string, action: 'PAUSE' | 'RESUME' | 'STOP'): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    try {
      switch (action) {
        case 'PAUSE':
          agent.pause();
          break;
        case 'RESUME':
          agent.start();
          break;
        case 'STOP':
          agent.stop();
          break;
      }
      
      console.log(`Agent ${agentId} ${action} action executed`);
      return true;
    } catch (error) {
      console.error(`Failed to ${action} agent ${agentId}:`, error);
      return false;
    }
  }

  public acknowledgeAlert(agentId: string, alertId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const state = agent.getState();
    const alert = state.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    
    return false;
  }

  private performMonitoringCycle(): void {
    if (this.emergencyShutdownActive) return;

    for (const [agentId, agent] of this.agents) {
      try {
        this.monitorAgent(agentId, agent);
      } catch (error) {
        console.error(`Error monitoring agent ${agentId}:`, error);
      }
    }
  }

  private monitorAgent(agentId: string, agent: PortfolioAgent): void {
    const state = agent.getState();
    const decisions = agent.getDecisionHistory();
    
    // Check for performance issues
    this.checkPerformanceAlerts(agentId, state, decisions);
    
    // Check for risk limit breaches
    this.checkRiskLimits(agentId, state);
    
    // Check for system errors
    this.checkSystemHealth(agentId, state);
    
    // Check for emergency shutdown conditions
    this.checkShutdownTriggers(agentId, state, decisions);
  }

  private checkPerformanceAlerts(agentId: string, state: AgentState, decisions: AgentDecision[]): void {
    // Check success rate
    if (state.successRate < this.config.alertThresholds.minSuccessRate) {
      console.warn(`Agent ${agentId}: Low success rate ${(state.successRate * 100).toFixed(1)}%`);
    }

    // Check consecutive failures
    const recentDecisions = decisions.slice(-5);
    const consecutiveFailures = this.countConsecutiveFailures(recentDecisions);
    
    if (consecutiveFailures >= this.config.alertThresholds.maxConsecutiveFailures) {
      console.warn(`Agent ${agentId}: ${consecutiveFailures} consecutive failures detected`);
      // Consider pausing agent
      this.overrideAgent(agentId, 'PAUSE');
    }

    // Check drawdown
    if (state.performance.maxDrawdown > this.config.alertThresholds.maxDrawdown) {
      console.warn(`Agent ${agentId}: Excessive drawdown ${(state.performance.maxDrawdown * 100).toFixed(1)}%`);
    }
  }

  private checkRiskLimits(agentId: string, state: AgentState): void {
    // Check for critical alerts
    const criticalAlerts = state.alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged);
    
    if (criticalAlerts.length > 0) {
      console.error(`Agent ${agentId}: ${criticalAlerts.length} unacknowledged critical alerts`);
      
      // Auto-pause agent if too many critical alerts
      if (criticalAlerts.length >= 3) {
        this.overrideAgent(agentId, 'PAUSE');
      }
    }
  }

  private checkSystemHealth(agentId: string, state: AgentState): void {
    // Check if agent is stuck (no decisions for extended period)
    const timeSinceLastDecision = Date.now() - state.lastDecision.getTime();
    const maxIdleTime = 30 * 60 * 1000; // 30 minutes
    
    if (state.status === 'ACTIVE' && timeSinceLastDecision > maxIdleTime) {
      console.warn(`Agent ${agentId}: No activity for ${Math.round(timeSinceLastDecision / 60000)} minutes`);
    }

    // Check for error status
    if (state.status === 'ERROR') {
      console.error(`Agent ${agentId}: In error state`);
    }
  }

  private checkShutdownTriggers(agentId: string, state: AgentState, decisions: AgentDecision[]): void {
    for (const trigger of this.config.autoShutdownTriggers) {
      let triggerValue = 0;
      
      switch (trigger.condition) {
        case 'daily_loss':
          triggerValue = this.calculateDailyLoss(decisions);
          break;
        case 'max_drawdown':
          triggerValue = state.performance.maxDrawdown;
          break;
        case 'success_rate':
          triggerValue = state.successRate;
          break;
      }
      
      const thresholdBreached = trigger.condition === 'success_rate' 
        ? triggerValue < trigger.threshold
        : triggerValue > trigger.threshold;
      
      if (thresholdBreached) {
        this.emergencyShutdown(`${trigger.description}: ${triggerValue} (threshold: ${trigger.threshold})`);
        break;
      }
    }
  }

  private countConsecutiveFailures(decisions: AgentDecision[]): number {
    let count = 0;
    
    for (let i = decisions.length - 1; i >= 0; i--) {
      if (decisions[i].status === 'FAILED') {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  }

  private calculateDailyLoss(decisions: AgentDecision[]): number {
    const today = new Date().toDateString();
    const todayDecisions = decisions.filter(d => d.timestamp.toDateString() === today);
    
    return todayDecisions
      .filter(d => d.status === 'COMPLETED' && d.executionDetails)
      .reduce((loss, d) => {
        const cost = d.executionDetails?.totalCost || 0;
        const expectedReturn = d.expectedOutcome.yieldImprovement || 0;
        return loss + Math.max(0, cost - expectedReturn);
      }, 0);
  }

  private calculateSystemHealth(agentStatuses: any[]): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    if (agentStatuses.length === 0) return 'CRITICAL';
    
    const activeAgents = agentStatuses.filter(a => a.status === 'ACTIVE').length;
    const errorAgents = agentStatuses.filter(a => a.status === 'ERROR').length;
    const avgSuccessRate = agentStatuses.reduce((sum, a) => sum + a.successRate, 0) / agentStatuses.length;
    
    if (errorAgents > 0 || avgSuccessRate < 0.7) return 'CRITICAL';
    if (activeAgents < agentStatuses.length * 0.8 || avgSuccessRate < 0.85) return 'WARNING';
    
    return 'HEALTHY';
  }

  private calculateAgentRiskMetrics(decisions: AgentDecision[]): any {
    const completedDecisions = decisions.filter(d => d.status === 'COMPLETED');
    
    if (completedDecisions.length === 0) {
      return {
        totalDecisions: 0,
        averageConfidence: 0,
        riskDistribution: {},
        averageExecutionTime: 0
      };
    }
    
    const averageConfidence = completedDecisions.reduce((sum, d) => sum + d.confidence, 0) / completedDecisions.length;
    const riskDistribution = this.calculateRiskDistribution(completedDecisions);
    const averageExecutionTime = completedDecisions
      .filter(d => d.executionDetails)
      .reduce((sum, d) => sum + (d.executionDetails?.executionTime || 0), 0) / completedDecisions.length;
    
    return {
      totalDecisions: completedDecisions.length,
      averageConfidence,
      riskDistribution,
      averageExecutionTime
    };
  }

  private calculateRiskDistribution(decisions: AgentDecision[]): any {
    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    
    decisions.forEach(d => {
      distribution[d.recommendation.priority]++;
    });
    
    return distribution;
  }

  private async sendEmergencyNotification(reason: string): Promise<void> {
    const message = `EMERGENCY SHUTDOWN: Portfolio Agent System\nReason: ${reason}\nTime: ${new Date().toISOString()}`;
    
    // In a real implementation, this would send notifications via:
    // - Email (SMTP)
    // - SMS (Twilio, AWS SNS)
    // - Slack/Teams webhooks
    // - PagerDuty alerts
    // - Phone calls for critical incidents
    
    console.log('EMERGENCY NOTIFICATION:', message);
    
    for (const contact of this.config.emergencyContacts) {
      console.log(`Notifying: ${contact}`);
      // await this.sendNotification(contact, message);
    }
  }
}