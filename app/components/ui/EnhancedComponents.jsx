import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react';

export const StockCard = ({ 
  symbol, 
  price, 
  change = 0, 
  changePercent = 0, 
  selected = false, 
  onClick,
  className = ""
}) => {
  const isPositive = change >= 0;
  const isNeutral = change === 0;

  return (
    <button
      onClick={onClick}
      className={`
        group relative p-6 rounded-3xl border transition-all duration-300 
        hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50
        ${selected 
          ? 'bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/25' 
          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
        }
        ${className}
      `}
    >
      {/* Background Effects */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity ${
        selected ? 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10' : 'bg-gradient-to-br from-white/5 to-white/10'
      }`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              selected ? 'bg-emerald-500/20' : 'bg-white/10'
            }`}>
              <BarChart3 size={18} className={selected ? 'text-emerald-400' : 'text-gray-400'} />
            </div>
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Stock</span>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isNeutral ? 'bg-gray-500/20 text-gray-400' :
            isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isNeutral ? (
              <Activity size={12} />
            ) : isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {Math.abs(changePercent).toFixed(1)}%
          </div>
        </div>

        {/* Symbol */}
        <div className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
          {symbol}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl md:text-4xl font-bold text-emerald-400">
            ₹{Number(price).toFixed(2)}
          </span>
        </div>

        {/* Change */}
        <div className={`flex items-center gap-2 text-sm font-semibold ${
          isNeutral ? 'text-gray-400' :
          isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {isNeutral ? (
            <Activity size={14} />
          ) : isPositive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {isPositive ? '+' : ''}₹{change.toFixed(2)}
          <span className="text-xs text-gray-500">24h</span>
        </div>
      </div>

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
};

export const TradingCard = ({ 
  title, 
  subtitle, 
  children, 
  icon: Icon,
  className = "",
  gradient = "from-white/5 to-transparent"
}) => {
  return (
    <div className={`
      glass rounded-3xl p-8 border border-white/10 relative overflow-hidden group
      ${className}
    `}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        {(title || Icon) && (
          <div className="flex items-center gap-3 mb-6">
            {Icon && (
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <Icon size={24} className="text-black" />
              </div>
            )}
            {title && (
              <div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
              </div>
            )}
          </div>
        )}
        
        {/* Body */}
        {children}
      </div>
    </div>
  );
};

export const MetricCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  className = "",
  size = "default" 
}) => {
  const isPositiveTrend = trend === 'up';
  const isNeutralTrend = trend === 'neutral';

  return (
    <div className={`
      glass rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all hover:scale-105 group
      ${className}
    `}>
      {/* Icon */}
      {Icon && (
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon size={24} className="text-black" />
        </div>
      )}

      {/* Value */}
      <div className={`font-black mb-2 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent ${
        size === 'large' ? 'text-5xl md:text-6xl' : 
        size === 'small' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'
      }`}>
        {value}
      </div>

      {/* Label & Trend */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
          {label}
        </span>
        
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            isNeutralTrend ? 'text-gray-400' :
            isPositiveTrend ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isNeutralTrend ? (
              <Activity size={12} />
            ) : isPositiveTrend ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};

export const GlassButton = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = "",
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50";
  
  const sizeClasses = {
    small: "px-6 py-3 text-sm rounded-2xl",
    default: "px-8 py-4 text-base rounded-2xl",
    large: "px-10 py-5 text-lg rounded-3xl"
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:from-emerald-400 hover:to-blue-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md",
    ghost: "bg-transparent border border-white/20 text-white hover:bg-white/5 backdrop-blur-sm"
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Shine effect for primary variant */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
    </button>
  );
};

export default {
  StockCard,
  TradingCard, 
  MetricCard,
  GlassButton
};