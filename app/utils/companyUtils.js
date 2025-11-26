// Utility functions for company management

// Auto-generate company data when adding new stocks
export const generateCompanyData = async (symbol, companyName) => {
  const cleanSymbol = symbol.toLowerCase().replace(/[^a-z]/g, '');
  
  // Smart domain guessing based on company name and symbol
  const domainGuesses = [
    // Direct symbol domains
    `${cleanSymbol}.com`,
    `${cleanSymbol}.co.in`,
    `${cleanSymbol}.in`,
    
    // Company name based domains
    ...(companyName ? [
      `${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      `${companyName.toLowerCase().replace(/[^a-z]/g, '')}.co.in`,
    ] : []),
    
    // Common corporate patterns
    `${cleanSymbol}ltd.com`,
    `${cleanSymbol}group.com`,
    `${cleanSymbol}corp.com`,
    `${cleanSymbol}india.com`,
  ];
  
  // Test domains to find working logo
  for (const domain of domainGuesses) {
    try {
      const logoUrl = `https://logo.clearbit.com/${domain}?size=200`;
      const response = await fetch(logoUrl, { method: 'HEAD' });
      
      if (response.ok) {
        return {
          symbol,
          name: companyName || symbol,
          domain,
          logoUrl,
          color: generateBrandColor(symbol),
          sector: guessSector(companyName || symbol)
        };
      }
    } catch (error) {
      continue;
    }
  }
  
  // No logo found, return basic data
  return {
    symbol,
    name: companyName || symbol,
    domain: null,
    logoUrl: null,
    color: generateBrandColor(symbol),
    sector: guessSector(companyName || symbol)
  };
};

// Generate consistent brand colors based on symbol
export const generateBrandColor = (symbol) => {
  const colors = [
    '#0066CC', '#E60012', '#007CC3', '#F37021', '#8B4513',
    '#1F4E79', '#0078D4', '#E31837', '#FF6B35', '#1E3A8A',
    '#8B0000', '#FF8C00', '#ED1C24', '#00539C', '#004C8F'
  ];
  
  // Use symbol hash to pick consistent color
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Smart sector guessing based on company name
export const guessSector = (companyName) => {
  const name = companyName.toLowerCase();
  
  if (name.includes('bank') || name.includes('finance') || name.includes('capital')) return 'Banking';
  if (name.includes('tech') || name.includes('software') || name.includes('system')) return 'IT Services';
  if (name.includes('pharma') || name.includes('drug') || name.includes('medicine')) return 'Pharma';
  if (name.includes('auto') || name.includes('motor') || name.includes('car')) return 'Auto';
  if (name.includes('steel') || name.includes('metal') || name.includes('mining')) return 'Metals';
  if (name.includes('oil') || name.includes('gas') || name.includes('petroleum')) return 'Oil & Gas';
  if (name.includes('power') || name.includes('energy') || name.includes('electric')) return 'Power';
  if (name.includes('telecom') || name.includes('communication')) return 'Telecom';
  if (name.includes('cement')) return 'Cement';
  if (name.includes('textile') || name.includes('cotton')) return 'Textile';
  
  return 'Other';
};

// Validate company data before adding to database
export const validateCompanyData = (data) => {
  const errors = [];
  
  if (!data.symbol || data.symbol.length < 2) {
    errors.push('Symbol must be at least 2 characters long');
  }
  
  if (!data.name || data.name.length < 2) {
    errors.push('Company name must be at least 2 characters long');
  }
  
  if (data.symbol && !/^[A-Z0-9]+$/.test(data.symbol)) {
    errors.push('Symbol should only contain uppercase letters and numbers');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format company data for display in admin panel
export const formatCompanyForAdmin = (data) => {
  return {
    ...data,
    displayName: `${data.symbol} - ${data.name}`,
    hasLogo: !!data.logoUrl,
    sectorTag: data.sector || 'Other'
  };
};