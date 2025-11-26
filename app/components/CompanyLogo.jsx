import { useState, useEffect } from 'react';

// Company data mapping with real domains for logo fetching
const companyData = {
  // Reliance Industries
  'RELIANCE': {
    name: 'Reliance Industries',
    domain: 'ril.com',
    color: '#0066CC',
    sector: 'Oil & Gas'
  },
  
  // Tata Consultancy Services
  'TCS': {
    name: 'Tata Consultancy Services',
    domain: 'tcs.com',
    color: '#00539C',
    sector: 'IT Services'
  },
  
  // HDFC Bank
  'HDFCBANK': {
    name: 'HDFC Bank',
    domain: 'hdfcbank.com',
    color: '#004C8F',
    sector: 'Banking'
  },
  
  // Infosys
  'INFY': {
    name: 'Infosys',
    domain: 'infosys.com',
    color: '#007CC3',
    sector: 'IT Services'
  },
  
  // ICICI Bank
  'ICICIBANK': {
    name: 'ICICI Bank',
    domain: 'icicibank.com',
    color: '#F37021',
    sector: 'Banking'
  },
  
  // Bharti Airtel
  'BHARTIARTL': {
    name: 'Bharti Airtel',
    domain: 'airtel.in',
    color: '#E60012',
    sector: 'Telecom'
  },
  
  // ITC Limited
  'ITC': {
    name: 'ITC Limited',
    domain: 'itcportal.com',
    color: '#8B4513',
    sector: 'FMCG'
  },
  
  // State Bank of India
  'SBI': {
    name: 'State Bank of India',
    domain: 'sbi.co.in',
    color: '#1F4E79',
    sector: 'Banking'
  },
  
  // Hindustan Unilever
  'HINDUNILVR': {
    name: 'Hindustan Unilever',
    domain: 'hul.co.in',
    color: '#0078D4',
    sector: 'FMCG'
  },
  
  // Maruti Suzuki
  'MARUTI': {
    name: 'Maruti Suzuki',
    domain: 'marutisuzuki.com',
    color: '#E31837',
    sector: 'Auto'
  },
  
  // Asian Paints
  'ASIANPAINT': {
    name: 'Asian Paints',
    domain: 'asianpaints.com',
    color: '#FF6B35',
    sector: 'Paints'
  },
  
  // Larsen & Toubro
  'LT': {
    name: 'Larsen & Toubro',
    domain: 'larsentoubro.com',
    color: '#1E3A8A',
    sector: 'Infrastructure'
  },
  
  // Bajaj Finance
  'BAJFINANCE': {
    name: 'Bajaj Finance',
    domain: 'bajajfinserv.in',
    color: '#8B0000',
    sector: 'Finance'
  },
  
  // Sun Pharmaceutical
  'SUNPHARMA': {
    name: 'Sun Pharmaceutical',
    domain: 'sunpharma.com',
    color: '#FF8C00',
    sector: 'Pharma'
  },
  
  // HDFC Life
  'HDFCLIFE': {
    name: 'HDFC Life',
    domain: 'hdfclife.com',
    color: '#ED1C24',
    sector: 'Insurance'
  }
};

// Logo API endpoints with fallback priority
const logoAPIs = [
  (domain) => `https://logo.clearbit.com/${domain}?size=200`,
  (domain) => `https://img.logo.dev/${domain}?token=pk_X5dGd0K5QtKb6k6oow4mug&size=200`,
  (domain) => `https://unavatar.io/${domain}?fallback=false`
];

// Smart domain guessing for unknown stocks
const guessDomain = (symbol) => {
  const cleanSymbol = symbol.toLowerCase().replace(/[^a-z]/g, '');
  
  // Common domain patterns for Indian companies
  const domainPatterns = [
    `${cleanSymbol}.com`,
    `${cleanSymbol}.co.in`,
    `${cleanSymbol}.in`,
    `${cleanSymbol}ltd.com`,
    `${cleanSymbol}group.com`
  ];
  
  return domainPatterns;
};

const CompanyLogo = ({ 
  symbol, 
  size = 40, 
  showName = false, 
  className = '',
  fallbackStyle = 'gradient' // 'gradient' | 'solid' | 'icon'
}) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const company = companyData[symbol];
  const logoSize = typeof size === 'number' ? `${size}px` : size;
  
  // If company data doesn't exist, create a generic one
  const displayCompany = company || {
    name: symbol,
    color: '#6B7280',
    sector: 'Other'
  };

  // Fetch real company logo
  useEffect(() => {
    let isCancelled = false;
    
    const fetchLogo = async () => {
      setIsLoading(true);
      setLogoError(false);
      
      let domainsToTry = [];
      
      if (company?.domain) {
        // Use predefined domain if available
        domainsToTry = [company.domain];
      } else {
        // Guess domains for unknown stocks
        domainsToTry = guessDomain(symbol);
      }
      
      // Try each domain with each API
      for (const domain of domainsToTry) {
        if (isCancelled) break;
        
        for (const apiGenerator of logoAPIs) {
          if (isCancelled) break;
          
          try {
            const url = apiGenerator(domain);
            
            // Test if the logo URL is accessible
            const response = await fetch(url, { method: 'HEAD' });
            
            if (response.ok && !isCancelled) {
              setLogoUrl(url);
              setIsLoading(false);
              
              // Cache successful domain for future reference
              if (!company?.domain) {
                console.log(`✅ Found logo for ${symbol} at ${domain}`);
              }
              return;
            }
          } catch (error) {
            // Continue to next API/domain
            continue;
          }
        }
      }
      
      // All domains and APIs failed
      if (!isCancelled) {
        setLogoError(true);
        setIsLoading(false);
        console.log(`❌ No logo found for ${symbol}`);
      }
    };
    
    fetchLogo();
    
    return () => {
      isCancelled = true;
    };
  }, [symbol, company?.domain]);

  const handleImageError = () => {
    setLogoError(true);
    setLogoUrl(null);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Container */}
      <div 
        className={`relative flex items-center justify-center rounded-lg overflow-hidden shadow-lg ${
          fallbackStyle === 'gradient' 
            ? 'bg-gradient-to-br' 
            : 'bg-opacity-90'
        }`}
        style={{ 
          width: logoSize, 
          height: logoSize,
          backgroundColor: (!logoUrl || logoError) ? displayCompany.color : '#f8f9fa',
          backgroundImage: (!logoUrl || logoError) && fallbackStyle === 'gradient' 
            ? `linear-gradient(135deg, ${displayCompany.color}CC, ${displayCompany.color}FF)` 
            : undefined
        }}
      >
        {/* Loading State */}
        {isLoading && company?.domain && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Real Logo */}
        {logoUrl && !logoError && !isLoading && (
          <img
            src={logoUrl}
            alt={`${displayCompany.name} logo`}
            width={size}
            height={size}
            className="object-contain p-1"
            onError={handleImageError}
            onLoad={() => setIsLoading(false)}
          />
        )}
        
        {/* Fallback display */}
        {(!logoUrl || logoError || (!company?.domain)) && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
            {fallbackStyle === 'icon' ? (
              <div className="w-6 h-6 bg-white/20 rounded border border-white/30 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {symbol.substring(0, 2)}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-bold tracking-wider drop-shadow-sm">
                {symbol.length <= 4 ? symbol : symbol.substring(0, 3)}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Company Details */}
      {showName && (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-gray-100 leading-tight">
            {displayCompany.name}
          </span>
          {displayCompany.sector && (
            <span className="text-xs text-gray-400 leading-tight">
              {displayCompany.sector}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Export both the component and the company data
export { companyData };
export default CompanyLogo;