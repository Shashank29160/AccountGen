import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { CompanyData } from '@/services/companyResearchService';

interface RiskAnalysisChartProps {
  companyData: CompanyData;
}

// Extract numeric values from financial performance string
function extractFinancialMetrics(companyData: CompanyData) {
  const financialText = companyData.financialPerformance;
  
  // Extract P/E ratio
  const peMatch = financialText.match(/P\/E Ratio: ([\d.]+)/);
  const peRatio = peMatch ? parseFloat(peMatch[1]) : null;
  
  // Extract price change percent
  const priceChangeMatch = financialText.match(/([+-]?[\d.]+)%/);
  const priceChangePercent = priceChangeMatch ? parseFloat(priceChangeMatch[1]) : null;
  
  // Extract profit margin
  const marginMatch = financialText.match(/Profit Margin: ([\d.]+)%/);
  const profitMargin = marginMatch ? parseFloat(marginMatch[1]) : null;
  
  // Extract revenue growth
  const growthMatch = financialText.match(/([+-]?[\d.]+)% growth/);
  const revenueGrowth = growthMatch ? parseFloat(growthMatch[1]) : null;
  
  // Extract volatility
  const volatilityMatch = financialText.match(/([\d.]+)% volatility/);
  const volatility = volatilityMatch ? parseFloat(volatilityMatch[1]) : null;
  
  // Check for high/low valuation indicators
  const isHighValuation = financialText.includes('High valuation');
  const isLowValuation = financialText.includes('Value stock');
  const isHighGrowth = financialText.includes('High growth');
  const isProfitable = financialText.includes('Profitable');
  const isLossMaking = financialText.includes('Loss-making');
  
  return {
    peRatio,
    priceChangePercent,
    profitMargin,
    revenueGrowth,
    volatility,
    isHighValuation,
    isLowValuation,
    isHighGrowth,
    isProfitable,
    isLossMaking
  };
}

export const RiskAnalysisChart = ({ companyData }: RiskAnalysisChartProps) => {
  const metrics = extractFinancialMetrics(companyData);
  
  // Calculate risk scores based on actual company data
  const calculateRiskScore = (category: string): { score: number; severity: 'high' | 'medium' | 'low' } => {
    let score = 50; // Base score
    
    switch (category) {
      case 'Market Risk':
        if (metrics.volatility) {
          score = Math.min(95, 30 + (metrics.volatility / 2));
        } else if (metrics.priceChangePercent) {
          score = 50 + Math.abs(metrics.priceChangePercent) * 2;
        }
        if (metrics.isHighValuation) score += 15;
        if (metrics.isLossMaking) score += 20;
        break;
        
      case 'Competition':
        if (metrics.isHighGrowth) score = 70;
        else if (metrics.revenueGrowth !== null && metrics.revenueGrowth < 0) score = 80;
        else score = 60;
        break;
        
      case 'Regulatory':
        // Higher for financial services, healthcare
        if (companyData.name.toLowerCase().includes('bank') || 
            companyData.name.toLowerCase().includes('financial')) {
          score = 65;
        } else if (companyData.name.toLowerCase().includes('health') ||
                   companyData.name.toLowerCase().includes('pharma')) {
          score = 60;
        } else {
          score = 45;
        }
        break;
        
      case 'Supply Chain':
        // Base on sector and profitability
        if (metrics.isProfitable) score = 45;
        else if (metrics.isLossMaking) score = 65;
        else score = 55;
        break;
        
      case 'Technology':
        // Higher for tech companies
        if (companyData.name.toLowerCase().includes('tech') ||
            companyData.name.toLowerCase().includes('software') ||
            companyData.name.toLowerCase().includes('cloud')) {
          score = 60;
        } else {
          score = 50;
        }
        break;
        
      case 'Cybersecurity':
        // Higher for tech and financial services
        if (companyData.name.toLowerCase().includes('tech') ||
            companyData.name.toLowerCase().includes('software') ||
            companyData.name.toLowerCase().includes('bank') ||
            companyData.name.toLowerCase().includes('financial')) {
          score = 55;
        } else {
          score = 40;
        }
        break;
    }
    
    score = Math.max(20, Math.min(95, score)); // Clamp between 20-95
    
    let severity: 'high' | 'medium' | 'low';
    if (score >= 65) severity = 'high';
    else if (score >= 45) severity = 'medium';
    else severity = 'low';
    
    return { score: Math.round(score), severity };
  };
  
  // Calculate opportunity scores based on actual company data
  const calculateOpportunityScore = (category: string): { score: number; potential: 'high' | 'medium' | 'low' } => {
    let score = 60; // Base score
    
    switch (category) {
      case 'Market Growth':
        if (metrics.isHighGrowth) score = 85;
        else if (metrics.revenueGrowth !== null && metrics.revenueGrowth > 10) score = 75;
        else if (metrics.revenueGrowth !== null && metrics.revenueGrowth > 0) score = 65;
        else score = 50;
        break;
        
      case 'Geographic Expansion':
        if (metrics.isHighGrowth) score = 80;
        else if (metrics.isProfitable) score = 70;
        else score = 60;
        break;
        
      case 'Product Innovation':
        if (companyData.name.toLowerCase().includes('tech') ||
            companyData.name.toLowerCase().includes('software')) {
          score = 80;
        } else if (metrics.isHighGrowth) {
          score = 75;
        } else {
          score = 65;
        }
        break;
        
      case 'Strategic Partnerships':
        if (metrics.isLowValuation && metrics.isProfitable) score = 75;
        else if (metrics.isHighGrowth) score = 70;
        else score = 60;
        break;
        
      case 'Digital Transformation':
        if (companyData.name.toLowerCase().includes('tech') ||
            companyData.name.toLowerCase().includes('software')) {
          score = 90;
        } else {
          score = 75;
        }
        break;
        
      case 'M&A Opportunities':
        if (metrics.isProfitable && !metrics.isHighValuation) score = 70;
        else if (metrics.isHighGrowth) score = 65;
        else score = 55;
        break;
    }
    
    score = Math.max(40, Math.min(95, score)); // Clamp between 40-95
    
    let potential: 'high' | 'medium' | 'low';
    if (score >= 75) potential = 'high';
    else if (score >= 60) potential = 'medium';
    else potential = 'low';
    
    return { score: Math.round(score), potential };
  };
  
  const riskCategories = [
    { name: 'Market Risk', ...calculateRiskScore('Market Risk') },
    { name: 'Competition', ...calculateRiskScore('Competition') },
    { name: 'Regulatory', ...calculateRiskScore('Regulatory') },
    { name: 'Supply Chain', ...calculateRiskScore('Supply Chain') },
    { name: 'Technology', ...calculateRiskScore('Technology') },
    { name: 'Cybersecurity', ...calculateRiskScore('Cybersecurity') },
  ];

  const opportunityCategories = [
    { name: 'Market Growth', ...calculateOpportunityScore('Market Growth') },
    { name: 'Geographic Expansion', ...calculateOpportunityScore('Geographic Expansion') },
    { name: 'Product Innovation', ...calculateOpportunityScore('Product Innovation') },
    { name: 'Strategic Partnerships', ...calculateOpportunityScore('Strategic Partnerships') },
    { name: 'Digital Transformation', ...calculateOpportunityScore('Digital Transformation') },
    { name: 'M&A Opportunities', ...calculateOpportunityScore('M&A Opportunities') },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-status-thinking';
      case 'low': return 'bg-status-active';
      default: return 'bg-muted';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-status-active';
      case 'medium': return 'bg-primary';
      case 'low': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-8">
      {/* Risk Assessment Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Risk Assessment Matrix</h3>
            <p className="text-sm text-muted-foreground">Quantified risk exposure across key categories</p>
          </div>
        </div>

        <div className="space-y-4">
          {riskCategories.map((risk, index) => (
            <motion.div
              key={risk.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="font-medium">{risk.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{risk.score}%</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    risk.severity === 'high' ? 'bg-destructive/20 text-destructive' :
                    risk.severity === 'medium' ? 'bg-status-thinking/20 text-status-thinking' :
                    'bg-status-active/20 text-status-active'
                  }`}>
                    {risk.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.score}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                  className={`h-full rounded-full ${getSeverityColor(risk.severity)}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Risk Summary */}
        <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Key Risk Insights
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {companyData.risksOpportunities.risks.slice(0, 3).map((risk, i) => (
              <li key={i}>• {risk}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Opportunity Analysis Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-status-active/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-status-active" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Opportunity Landscape</h3>
            <p className="text-sm text-muted-foreground">Growth potential across strategic initiatives</p>
          </div>
        </div>

        <div className="space-y-4">
          {opportunityCategories.map((opp, index) => (
            <motion.div
              key={opp.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-status-active" />
                  <span className="font-medium">{opp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{opp.score}%</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    opp.potential === 'high' ? 'bg-status-active/20 text-status-active' :
                    opp.potential === 'medium' ? 'bg-primary/20 text-primary' :
                    'bg-muted/20 text-muted-foreground'
                  }`}>
                    {opp.potential.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${opp.score}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                  className={`h-full rounded-full ${getPotentialColor(opp.potential)}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Opportunity Summary */}
        <div className="mt-6 p-4 bg-status-active/5 border border-status-active/20 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Strategic Opportunities
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {companyData.risksOpportunities.opportunities.slice(0, 3).map((opp, i) => (
              <li key={i}>• {opp}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
