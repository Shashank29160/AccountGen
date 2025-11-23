// Real Company Data Service - Fetches actual company data from multiple sources
// Uses free APIs: Alpha Vantage, Financial Modeling Prep, Yahoo Finance

// API Keys
const ALPHA_VANTAGE_API_KEY = 'SH1FW0DOG1VSB0EQ';
const FINANCIAL_MODELING_PREP_API_KEY = 'demo'; // Replace with your key if needed

export interface RealCompanyData {
  symbol?: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  revenue?: number;
  revenueGrowth?: number;
  profitMargin?: number;
  employees?: number;
  ceo?: string;
  headquarters?: string;
  website?: string;
  description?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  peRatio?: number;
  dividendYield?: number;
  yearHigh?: number;
  yearLow?: number;
  volume?: number;
  recentNews?: Array<{
    title: string;
    source: string;
    date: string;
    url?: string;
  }>;
}

// Company ticker mapping for common companies
const COMPANY_TICKERS: Record<string, string> = {
  'apple': 'AAPL',
  'microsoft': 'MSFT',
  'google': 'GOOGL',
  'alphabet': 'GOOGL',
  'amazon': 'AMZN',
  'tesla': 'TSLA',
  'meta': 'META',
  'facebook': 'META',
  'nvidia': 'NVDA',
  'netflix': 'NFLX',
  'oracle': 'ORCL',
  'ibm': 'IBM',
  'intel': 'INTC',
  'amd': 'AMD',
  'salesforce': 'CRM',
  'adobe': 'ADBE',
  'cisco': 'CSCO',
  'jpmorgan': 'JPM',
  'bank of america': 'BAC',
  'goldman sachs': 'GS',
  'morgan stanley': 'MS',
  'walmart': 'WMT',
  'target': 'TGT',
  'costco': 'COST',
  'starbucks': 'SBUX',
  'mcdonalds': 'MCD',
  'coca cola': 'KO',
  'pepsi': 'PEP',
  'disney': 'DIS',
  'boeing': 'BA',
  'general electric': 'GE',
  'ford': 'F',
  'general motors': 'GM',
};

// Extract ticker from company name
function extractTicker(companyName: string): string | null {
  const normalized = companyName.toLowerCase().trim();
  
  // Check if ticker is already in the name (e.g., "Apple AAPL")
  const tickerMatch = companyName.match(/\b([A-Z]{1,5})\b/);
  if (tickerMatch && tickerMatch[1].length >= 2 && tickerMatch[1].length <= 5) {
    return tickerMatch[1];
  }
  
  // Check our mapping
  for (const [key, ticker] of Object.entries(COMPANY_TICKERS)) {
    if (normalized.includes(key)) {
      return ticker;
    }
  }
  
  return null;
}

// Fetch company data from Financial Modeling Prep API (free tier)
async function fetchFromFinancialModelingPrep(ticker: string): Promise<RealCompanyData | null> {
  try {
    // Using Financial Modeling Prep free API
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FINANCIAL_MODELING_PREP_API_KEY}`;
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FINANCIAL_MODELING_PREP_API_KEY}`;
    
    const [profileRes, quoteRes] = await Promise.all([
      fetch(profileUrl).catch(() => null),
      fetch(quoteUrl).catch(() => null)
    ]);
    
    if (!profileRes || !quoteRes) return null;
    
    const [profileData, quoteData] = await Promise.all([
      profileRes.json().catch(() => null),
      quoteRes.json().catch(() => null)
    ]);
    
    if (!profileData || !Array.isArray(profileData) || profileData.length === 0) return null;
    if (!quoteData || !Array.isArray(quoteData) || quoteData.length === 0) return null;
    
    const profile = profileData[0];
    const quote = quoteData[0];
    
    return {
      symbol: profile.symbol,
      name: profile.companyName || profile.name,
      sector: profile.sector,
      industry: profile.industry,
      marketCap: profile.mktCap,
      ceo: profile.ceo,
      employees: profile.fullTimeEmployees,
      headquarters: profile.address,
      website: profile.website,
      description: profile.description,
      currentPrice: quote.price,
      priceChange: quote.change,
      priceChangePercent: quote.changesPercentage,
      peRatio: quote.pe,
      yearHigh: quote.yearHigh,
      yearLow: quote.yearLow,
      volume: quote.volume,
    };
  } catch (error) {
    console.error('Financial Modeling Prep API error:', error);
    return null;
  }
}

// Fetch from Alpha Vantage (free tier - 5 calls/minute)
async function fetchFromAlphaVantage(ticker: string): Promise<RealCompanyData | null> {
  try {
    // Alpha Vantage API with actual API key
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const [overviewRes, quoteRes] = await Promise.all([
      fetch(overviewUrl).catch(() => null),
      fetch(quoteUrl).catch(() => null)
    ]);
    
    if (!overviewRes || !quoteRes) return null;
    
    const [overview, quote] = await Promise.all([
      overviewRes.json().catch(() => null),
      quoteRes.json().catch(() => null)
    ]);
    
    // Check for API limit or errors
    if (overview?.Note || quote?.Note) {
      console.warn('Alpha Vantage API limit reached or error');
      return null;
    }
    
    if (!overview || !overview.Symbol) return null;
    
    const quoteData = quote?.['Global Quote'];
    
    // Calculate revenue growth if we have revenue data
    let revenueGrowth: number | undefined;
    if (overview.RevenueTTM && overview.RevenuePerShareTTM) {
      // Estimate growth (simplified - in production, compare with previous periods)
      revenueGrowth = undefined; // Would need historical data
    }
    
    // Calculate profit margin
    let profitMargin: number | undefined;
    if (overview.RevenueTTM && overview.GrossProfitTTM) {
      const revenue = parseFloat(overview.RevenueTTM);
      const grossProfit = parseFloat(overview.GrossProfitTTM);
      if (revenue > 0) {
        profitMargin = (grossProfit / revenue) * 100;
      }
    } else if (overview.ProfitMargin) {
      profitMargin = parseFloat(overview.ProfitMargin);
    }
    
    return {
      symbol: overview.Symbol,
      name: overview.Name,
      sector: overview.Sector,
      industry: overview.Industry,
      marketCap: overview.MarketCapitalization ? parseInt(overview.MarketCapitalization) : undefined,
      revenue: overview.RevenueTTM ? parseFloat(overview.RevenueTTM) : undefined,
      revenueGrowth,
      profitMargin,
      employees: overview.FullTimeEmployees ? parseInt(overview.FullTimeEmployees) : undefined,
      ceo: overview.CEO,
      headquarters: overview.Address,
      website: overview.Website,
      description: overview.Description,
      peRatio: overview.PERatio ? parseFloat(overview.PERatio) : undefined,
      dividendYield: overview.DividendYield ? parseFloat(overview.DividendYield) : undefined,
      currentPrice: quoteData?.['05. price'] ? parseFloat(quoteData['05. price']) : undefined,
      priceChange: quoteData?.['09. change'] ? parseFloat(quoteData['09. change']) : undefined,
      priceChangePercent: quoteData?.['10. change percent'] ? parseFloat(quoteData['10. change percent'].replace('%', '')) : undefined,
      volume: quoteData?.['06. volume'] ? parseInt(quoteData['06. volume']) : undefined,
      yearHigh: quoteData?.['03. high'] ? parseFloat(quoteData['03. high']) : undefined,
      yearLow: quoteData?.['04. low'] ? parseFloat(quoteData['04. low']) : undefined,
    };
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    return null;
  }
}

// Fetch from Yahoo Finance via scraping (fallback)
async function fetchFromYahooFinance(ticker: string): Promise<RealCompanyData | null> {
  try {
    // Using a CORS proxy or backend endpoint would be needed for production
    // For now, we'll use a public API that proxies Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    if (!meta) return null;
    
    return {
      symbol: meta.symbol,
      name: meta.longName || meta.shortName,
      currentPrice: meta.regularMarketPrice,
      priceChange: meta.regularMarketPrice - meta.previousClose,
      priceChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      volume: meta.regularMarketVolume,
      yearHigh: meta.fiftyTwoWeekHigh,
      yearLow: meta.fiftyTwoWeekLow,
    };
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return null;
  }
}

// Main function to fetch real company data
export async function fetchRealCompanyData(companyName: string): Promise<RealCompanyData | null> {
  const ticker = extractTicker(companyName);
  
  if (!ticker) {
    // Try to find ticker by searching common patterns
    const normalized = companyName.toLowerCase().trim();
    for (const [key, value] of Object.entries(COMPANY_TICKERS)) {
      if (normalized.includes(key)) {
        return fetchRealCompanyDataByTicker(value);
      }
    }
    return null;
  }
  
  return fetchRealCompanyDataByTicker(ticker);
}

// Fetch by ticker symbol
export async function fetchRealCompanyDataByTicker(ticker: string): Promise<RealCompanyData | null> {
  // Try multiple sources in order of preference
  const sources = [
    () => fetchFromYahooFinance(ticker),
    () => fetchFromFinancialModelingPrep(ticker),
    () => fetchFromAlphaVantage(ticker),
  ];
  
  for (const source of sources) {
    try {
      const data = await source();
      if (data && data.name) {
        return data;
      }
    } catch (error) {
      console.error('Error fetching from source:', error);
      continue;
    }
  }
  
  return null;
}

// Convert real data to CompanyData format with unique, accurate data
export function convertToCompanyData(realData: RealCompanyData, companyName: string): import('./companyResearchService').CompanyData {
  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };
  
  const formatNumber = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };
  
  // Calculate unique metrics for this company
  const priceVolatility = realData.yearHigh && realData.yearLow && realData.currentPrice
    ? ((realData.yearHigh - realData.yearLow) / realData.currentPrice * 100).toFixed(1)
    : null;
  
  const isHighValuation = realData.peRatio ? realData.peRatio > 25 : false;
  const isLowValuation = realData.peRatio ? realData.peRatio < 15 : false;
  const isHighGrowth = realData.revenueGrowth ? realData.revenueGrowth > 15 : false;
  const isProfitable = realData.profitMargin ? realData.profitMargin > 0 : false;
  const isHighDividend = realData.dividendYield ? realData.dividendYield > 3 : false;
  
  // Generate truly unique executive summary based on actual data (2025)
  const currentYear = 2025;
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  let executiveSummary = '';
  
  // Build a unique narrative based on company-specific characteristics
  if (realData.description) {
    // Use API description but enhance it with current 2025 context
    const baseDescription = realData.description;
    let enhanced = baseDescription.substring(0, 400);
    
    // Add 2025-specific context
    const contextParts: string[] = [];
    if (realData.currentPrice && realData.priceChangePercent) {
      const trend = realData.priceChangePercent > 0 ? 'positive momentum' : 'market challenges';
      contextParts.push(`As of ${monthName} 2025, the company shows ${trend} with its stock ${realData.priceChangePercent > 0 ? 'gaining' : 'declining'} ${Math.abs(realData.priceChangePercent).toFixed(2)}%`);
    }
    if (realData.marketCap) {
      const size = realData.marketCap > 100e9 ? 'large-cap' : realData.marketCap > 10e9 ? 'mid-cap' : 'small-cap';
      contextParts.push(`As a ${size} company with ${formatCurrency(realData.marketCap)} in market value`);
    }
    
    if (contextParts.length > 0) {
      enhanced += ` ${contextParts.join(', ')}.`;
    }
    
    if (baseDescription.length > 400) enhanced += '...';
    executiveSummary = enhanced;
  } else {
    // Generate unique summary from scratch based on company data
    const summaryParts: string[] = [];
    
    // Opening statement - unique per company
    summaryParts.push(`${realData.name}${realData.symbol ? ` (${realData.symbol})` : ''}`);
    
    // Sector and industry - specific
    if (realData.sector && realData.industry) {
      summaryParts.push(`is a prominent player in the ${realData.sector} sector, specifically focusing on ${realData.industry}`);
    } else if (realData.sector) {
      summaryParts.push(`operates within the ${realData.sector} sector`);
    }
    
    // Market position - unique metrics
    if (realData.marketCap) {
      const marketCapFormatted = formatCurrency(realData.marketCap);
      if (realData.marketCap > 500e9) {
        summaryParts.push(`As one of the world's largest companies with a market capitalization of ${marketCapFormatted} as of ${monthName} 2025`);
      } else if (realData.marketCap > 100e9) {
        summaryParts.push(`With a substantial market capitalization of ${marketCapFormatted} in early 2025`);
      } else {
        summaryParts.push(`Maintains a market capitalization of ${marketCapFormatted}`);
      }
    }
    
    // Current trading status - unique
    if (realData.currentPrice) {
      const priceContext: string[] = [];
      priceContext.push(`the company's stock trades at $${realData.currentPrice.toFixed(2)}`);
      
      if (realData.priceChangePercent) {
        if (realData.priceChangePercent > 5) {
          priceContext.push(`showing strong performance with a ${realData.priceChangePercent.toFixed(2)}% gain`);
        } else if (realData.priceChangePercent > 0) {
          priceContext.push(`up ${realData.priceChangePercent.toFixed(2)}%`);
        } else if (realData.priceChangePercent < -5) {
          priceContext.push(`facing headwinds with a ${Math.abs(realData.priceChangePercent).toFixed(2)}% decline`);
        } else {
          priceContext.push(`down ${Math.abs(realData.priceChangePercent).toFixed(2)}%`);
        }
      }
      
      if (realData.yearHigh && realData.yearLow && realData.currentPrice) {
        const distanceFromHigh = ((realData.yearHigh - realData.currentPrice) / realData.yearHigh * 100).toFixed(1);
        const distanceFromLow = ((realData.currentPrice - realData.yearLow) / realData.yearLow * 100).toFixed(1);
        
        if (parseFloat(distanceFromHigh) < 10) {
          priceContext.push(`trading near its 52-week high of $${realData.yearHigh.toFixed(2)}`);
        } else if (parseFloat(distanceFromLow) < 10) {
          priceContext.push(`trading near its 52-week low of $${realData.yearLow.toFixed(2)}`);
        }
      }
      
      summaryParts.push(priceContext.join(', '));
    }
    
    // Valuation analysis - unique
    if (realData.peRatio) {
      if (isHighValuation) {
        summaryParts.push(`The company commands a premium valuation with a P/E ratio of ${realData.peRatio.toFixed(2)}, reflecting investor confidence in its growth trajectory through 2025`);
      } else if (isLowValuation) {
        summaryParts.push(`Trading at a P/E ratio of ${realData.peRatio.toFixed(2)}, the company presents a value-oriented investment opportunity in the current 2025 market environment`);
      } else {
        summaryParts.push(`With a P/E ratio of ${realData.peRatio.toFixed(2)}, the company is valued in line with market expectations`);
      }
    }
    
    // Financial health - unique
    if (realData.profitMargin !== undefined) {
      if (isProfitable && realData.profitMargin > 20) {
        summaryParts.push(`The company demonstrates strong profitability with a profit margin of ${realData.profitMargin.toFixed(2)}%`);
      } else if (isProfitable) {
        summaryParts.push(`Maintains profitability with a ${realData.profitMargin.toFixed(2)}% profit margin`);
      } else {
        summaryParts.push(`Currently operating at a ${Math.abs(realData.profitMargin).toFixed(2)}% loss margin as it invests in growth`);
      }
    }
    
    // Growth trajectory - unique
    if (realData.revenueGrowth !== undefined) {
      if (isHighGrowth) {
        summaryParts.push(`The company is experiencing robust revenue growth of ${realData.revenueGrowth.toFixed(1)}%, positioning it well for continued expansion in 2025`);
      } else if (realData.revenueGrowth > 0) {
        summaryParts.push(`Revenue growth of ${realData.revenueGrowth.toFixed(1)}% indicates steady business expansion`);
      } else if (realData.revenueGrowth < 0) {
        summaryParts.push(`Facing revenue decline of ${Math.abs(realData.revenueGrowth).toFixed(1)}%, the company is navigating market challenges`);
      }
    }
    
    // Scale and operations - unique
    if (realData.employees) {
      const employeeCount = formatNumber(realData.employees);
      if (realData.employees > 100000) {
        summaryParts.push(`With a workforce of approximately ${employeeCount} employees, the company operates at a massive scale`);
      } else if (realData.employees > 10000) {
        summaryParts.push(`Employing around ${employeeCount} people, the company maintains significant operational capacity`);
      } else {
        summaryParts.push(`The company employs approximately ${employeeCount} people`);
      }
    }
    
    // Leadership - unique if available
    if (realData.ceo) {
      summaryParts.push(`Under the leadership of ${realData.ceo}`);
    }
    
    // Location - unique if available
    if (realData.headquarters) {
      const locationParts = realData.headquarters.split(',').slice(-2).join(',').trim();
      if (locationParts) {
        summaryParts.push(`headquartered in ${locationParts}`);
      }
    }
    
    executiveSummary = summaryParts.join(', ') + '.';
  }
  
  // Generate unique financial performance based on actual metrics (2025)
  const financialPerformance = `Financial Overview - ${monthName} 2025:\n\n` +
    `${realData.currentPrice ? `• Current Stock Price: $${realData.currentPrice.toFixed(2)}` : ''}${realData.priceChange ? ` (${realData.priceChange > 0 ? '+' : ''}$${realData.priceChange.toFixed(2)}, ${realData.priceChangePercent ? `${realData.priceChangePercent > 0 ? '+' : ''}${realData.priceChangePercent.toFixed(2)}%` : ''})` : ''}\n` +
    `${realData.marketCap ? `• Market Capitalization: ${formatCurrency(realData.marketCap)}` : ''}\n` +
    `${realData.peRatio ? `• P/E Ratio: ${realData.peRatio.toFixed(2)}${isHighValuation ? ' (High valuation - growth expectations)' : isLowValuation ? ' (Value stock)' : ''}` : ''}\n` +
    `${realData.dividendYield ? `• Dividend Yield: ${realData.dividendYield.toFixed(2)}%${isHighDividend ? ' (Attractive dividend)' : ''}` : ''}\n` +
    `${realData.yearHigh && realData.yearLow ? `• 52-Week Range: $${realData.yearLow.toFixed(2)} - $${realData.yearHigh.toFixed(2)}${priceVolatility ? ` (${priceVolatility}% volatility)` : ''}` : ''}\n` +
    `${realData.volume ? `• Trading Volume: ${formatNumber(realData.volume)} shares` : ''}\n` +
    `${realData.revenue ? `• Revenue: ${formatCurrency(realData.revenue)}` : ''}${realData.revenueGrowth ? ` (${realData.revenueGrowth > 0 ? '+' : ''}${realData.revenueGrowth.toFixed(1)}% growth${isHighGrowth ? ' - High growth company' : ''})` : ''}\n` +
    `${realData.profitMargin ? `• Profit Margin: ${realData.profitMargin.toFixed(2)}%${isProfitable ? ' (Profitable)' : ' (Loss-making)'}` : ''}`;
  
  // Generate unique key decision makers based on company data
  const keyDecisionMakers = [
    realData.ceo ? `${realData.ceo} - Chief Executive Officer` : 'Chief Executive Officer - Oversees overall strategy and operations',
    'Chief Financial Officer - Manages financial planning and investor relations',
    'Chief Operating Officer - Drives operational excellence and execution',
    realData.sector === 'Technology' || realData.industry?.toLowerCase().includes('tech') 
      ? 'Chief Technology Officer - Leads innovation and digital transformation' 
      : 'Chief Technology Officer - Oversees technology strategy',
    'Chief Marketing Officer - Directs brand strategy and customer engagement',
    'VP of Corporate Development - Spearheads strategic partnerships and M&A'
  ];
  
  // Generate unique strategic goals based on actual company metrics and sector
  const strategicGoals: string[] = [];
  
  if (realData.sector) {
    if (realData.sector === 'Technology') {
      strategicGoals.push(`Accelerate innovation in ${realData.industry || 'technology solutions'}`);
      strategicGoals.push('Scale cloud and AI capabilities');
      strategicGoals.push('Expand developer ecosystem and partnerships');
    } else if (realData.sector === 'Financial Services') {
      strategicGoals.push('Enhance digital banking and fintech offerings');
      strategicGoals.push('Strengthen regulatory compliance and risk management');
      strategicGoals.push('Expand wealth management services');
    } else if (realData.sector === 'Healthcare') {
      strategicGoals.push('Advance research and development pipeline');
      strategicGoals.push('Expand into emerging markets');
      strategicGoals.push('Enhance patient care through technology');
    } else {
      strategicGoals.push(`Strengthen market position in ${realData.sector}`);
    }
  }
  
  if (isHighGrowth) {
    strategicGoals.push('Maintain high growth trajectory through market expansion');
  } else if (!isHighGrowth && realData.revenueGrowth !== undefined) {
    strategicGoals.push('Focus on operational efficiency and margin improvement');
  }
  
  if (isHighValuation) {
    strategicGoals.push('Deliver on growth expectations to justify valuation');
  }
  
  if (realData.marketCap && realData.marketCap > 100e9) {
    strategicGoals.push('Leverage scale advantages for competitive positioning');
  }
  
  strategicGoals.push('Execute digital transformation initiatives');
  strategicGoals.push('Build sustainable competitive advantages');
  strategicGoals.push('Optimize customer experience and retention');
  if (!isHighDividend) {
    strategicGoals.push('Pursue strategic acquisitions and partnerships');
  }
  
  // Generate unique risks based on actual company data
  const risks: string[] = [];
  
  if (priceVolatility && parseFloat(priceVolatility) > 40) {
    risks.push(`High stock price volatility (${priceVolatility}%) indicating market uncertainty`);
  }
  
  if (isHighValuation) {
    risks.push('Elevated valuation multiples creating downside risk if growth expectations are not met');
  }
  
  if (realData.sector === 'Technology') {
    risks.push('Rapid technology disruption requiring continuous innovation');
    risks.push('Cybersecurity threats and data privacy regulatory changes');
  } else if (realData.sector === 'Financial Services') {
    risks.push('Regulatory changes and compliance requirements');
    risks.push('Interest rate sensitivity impacting profitability');
  } else if (realData.sector === 'Healthcare') {
    risks.push('Regulatory approval processes and patent expirations');
    risks.push('Pricing pressure from payers and governments');
  }
  
  if (!isProfitable && realData.profitMargin !== undefined) {
    risks.push(`Current unprofitability (${realData.profitMargin.toFixed(2)}% margin) requiring path to profitability`);
  }
  
  if (realData.revenueGrowth !== undefined && realData.revenueGrowth < 0) {
    risks.push('Declining revenue growth indicating market challenges');
  }
  
  risks.push('Macroeconomic uncertainty impacting business operations');
  risks.push('Intensifying competitive pressure in the market');
  risks.push('Supply chain and operational disruptions');
  risks.push('Talent acquisition and retention challenges');
  
  // Generate unique opportunities based on actual company data
  const opportunities: string[] = [];
  
  if (isLowValuation) {
    opportunities.push('Attractive valuation creating potential for value appreciation');
  }
  
  if (isHighGrowth) {
    opportunities.push(`Strong revenue growth (${realData.revenueGrowth?.toFixed(1)}%) indicating market momentum`);
  }
  
  if (isHighDividend) {
    opportunities.push(`Attractive dividend yield (${realData.dividendYield?.toFixed(2)}%) for income-focused investors`);
  }
  
  if (realData.sector) {
    opportunities.push(`Expanding market opportunities in ${realData.sector} sector`);
  }
  
  if (realData.marketCap && realData.marketCap < 10e9) {
    opportunities.push('Smaller market cap providing flexibility for strategic pivots');
  } else if (realData.marketCap && realData.marketCap > 100e9) {
    opportunities.push('Large market cap enabling strategic M&A and market consolidation');
  }
  
  if (realData.peRatio && realData.peRatio < 20 && isProfitable) {
    opportunities.push('Reasonable valuation with profitability creating investment appeal');
  }
  
  opportunities.push('Geographic expansion into emerging markets');
  opportunities.push('Product and service portfolio diversification');
  opportunities.push('Strategic partnerships and alliances');
  opportunities.push('Digital transformation enabling new business models');
  opportunities.push('Sustainability initiatives opening new market segments');
  opportunities.push('AI and automation driving efficiency gains');
  
  return {
    name: realData.name || companyName,
    executiveSummary,
    financialPerformance,
    keyDecisionMakers,
    strategicGoals: strategicGoals.slice(0, 7), // Limit to 7 goals
    risksOpportunities: {
      risks: risks.slice(0, 7), // Limit to 7 risks
      opportunities: opportunities.slice(0, 8) // Limit to 8 opportunities
    }
  };
}

