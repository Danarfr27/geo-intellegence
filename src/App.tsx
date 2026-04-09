import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Globe, Video, Activity, AlertTriangle, Command, TrendingUp, TrendingDown, Clock, Zap, Satellite, ChevronRight, Filter, RefreshCw, Database, Cpu, Eye, Target, Newspaper, ExternalLink, Flame, AlertCircle, Menu, X } from 'lucide-react';
import countries from './lib/countries.json';

// Utility
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface ConflictEvent {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'conflict' | 'earthquake' | 'cyber' | 'political' | 'war' | 'virus' | 'worldwar';
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  description: string;
  countryCode?: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: Date;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  url: string;
  imageUrl?: string;
}

interface VideoFeed {
  id: string;
  title: string;
  source: string;
  embedUrl: string;
  isLive: boolean;
}

interface EarthquakeData {
  id: string;
  location: string;
  magnitude: number;
  depth: number;
  timestamp: Date;
  lat: number;
  lng: number;
}

interface EscalationMetric {
  region: string;
  level: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

// API Configuration
const GDELT_CSV_URL = import.meta.env.VITE_GDELT_CSV_URL || 'http://data.gdeltproject.org/events/last15minutes.csv';
const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY;

// Helper function to parse country from prompt
function parseCountryFromPrompt(prompt: string) {
  const countryName = prompt.replace('/newsnow', '').trim();
  return countries.find((c: any) => c.name.toLowerCase().includes(countryName.toLowerCase()));
}

// Helper function to determine event severity based on Goldstein scale
function getSeverityFromGoldstein(scale: number): 'critical' | 'high' | 'medium' | 'low' {
  if (scale >= 8) return 'critical';
  if (scale >= 4) return 'high';
  if (scale >= 0) return 'medium';
  return 'low';
}

// Helper function to get event type
function getEventType(eventCode: string): 'conflict' | 'earthquake' | 'cyber' | 'political' | 'war' | 'virus' | 'worldwar' {
  const code = parseInt(eventCode);
  // World War events: 196-210 (international armed conflict)
  if (code >= 196 && code <= 210) return 'worldwar';
  // War events: 180-195 (armed conflict)
  if (code >= 180 && code <= 195) return 'war';
  // Conflict events: 160-179 (protest, violence)
  if (code >= 160 && code <= 179) return 'conflict';
  // Cyber events: high frequency, specific patterns
  if (code >= 140 && code <= 159) return 'cyber';
  // Virus/Pandemic: health-related
  if (code >= 100 && code <= 130) return 'virus';
  // Political events: 010-099
  if (code >= 10 && code <= 99) return 'political';
  return 'conflict';
}

// Custom Map Markers
const createCustomIcon = (severity: string, type: string) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };
  
  const icons: Record<string, string> = {
    conflict: '⚔️',
    earthquake: '🌋',
    cyber: '💻',
    political: '🏛️',
    war: '💥',
    worldwar: '🌍',
    virus: '🦠',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${colors[severity] || colors['medium']};
        border-radius: 50%;
        border: 2px solid #0a0c10;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 0 12px ${colors[severity] || colors['medium']}80;
        animation: marker-pulse 2s ease-in-out infinite;
      ">
        ${icons[type] || '📍'}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Components
function Header({ onCommand, eventCount, onToggleSidebar, sidebarOpen, selectedFilters, onFilterChange }: { onCommand: (cmd: string) => void; eventCount: number; onToggleSidebar?: () => void; sidebarOpen?: boolean; selectedFilters?: string[]; onFilterChange?: (filter: string) => void }) {
  const [command, setCommand] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onCommand(command.trim());
      setCommand('');
    }
  };

  const additionalFilters = [
    { id: 'cyber', label: 'Cyber War', icon: Cpu, color: '#a855f7' },
    { id: 'worldwar', label: 'World War', icon: Flame, color: '#10b981' },
    { id: 'political', label: 'Political', icon: Target, color: '#3b82f6' },
    { id: 'earthquake', label: 'Earthquakes', icon: AlertCircle, color: '#f97316' },
  ];
  
  return (
    <header className="h-12 bg-gradient-to-r from-[#0a0c10] via-[#0f1115] to-[#0a0c10] border-b border-[#2a2f3a] flex items-center px-4 shrink-0 shadow-lg shadow-red-500/5">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="hidden sm:hidden md:flex lg:hidden items-center justify-center w-8 h-8 text-gray-400 hover:text-red-500 transition-colors"
          title="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Filter Menu Button (3 lines) */}
        <div className="relative">
          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-400 transition-colors group"
            title="Additional filters"
          >
            <div className="flex flex-col gap-1">
              <div className="w-4 h-0.5 bg-current transition-all" style={{width: filterMenuOpen ? '16px' : '16px'}} />
              <div className="w-4 h-0.5 bg-current transition-all" style={{width: filterMenuOpen ? '16px' : '16px'}} />
              <div className="w-4 h-0.5 bg-current transition-all" style={{width: filterMenuOpen ? '16px' : '16px'}} />
            </div>
          </button>

          {/* Filter Dropdown Menu */}
          {filterMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f1115] border border-[#2a2f3a] rounded-lg shadow-lg z-50 overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(15,17,21,0.95) 0%, rgba(10,12,16,0.95) 100%)',
              backdropFilter: 'blur(10px)',
            }}>
              {additionalFilters.map((filter) => {
                const Icon = filter.icon;
                const isSelected = selectedFilters?.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onFilterChange?.(filter.id);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-left hover:bg-[rgba(75,85,99,0.2)] transition-all duration-200 border-b border-[rgba(75,85,99,0.1)] last:border-b-0 group"
                    style={{
                      color: isSelected ? filter.color : '#9ca3af',
                      background: isSelected ? `${filter.color}15` : 'transparent',
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{color: filter.color}} />
                    <div className="flex-1">{filter.label}</div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: filter.color}} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="relative">
          <Globe className="w-5 h-5 text-red-500 animate-spin" style={{animationDuration: '6s'}} />
          <div className="absolute inset-0 bg-red-500 blur-md opacity-20 rounded-full" />
        </div>
        <span className="font-black text-white tracking-widest text-sm" style={{textShadow: '0 0 20px rgba(239, 68, 68, 0.3)'}}>GEOPOLITICAL INTELLIGENCE</span>
        <span className="text-xs text-red-500 font-bold ml-2 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded">v3.0 LIVE</span>
      </div>
      
      <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#2a2f3a] to-transparent mx-4" />
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[#15181e]/60 border border-[#2a2f3a] rounded px-3 py-1.5 flex-1 max-w-lg backdrop-blur-sm hover:border-[#3a3f4a] transition-colors">
        <Command className="w-3.5 h-3.5 text-red-500" />
        <span className="text-red-500 text-xs font-mono font-bold">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="search location or /newsnow [COUNTRY]"
          className="bg-transparent border-none outline-none text-xs w-full text-gray-300 placeholder:text-gray-600 font-mono"
        />
        {command && (
          <button type="submit" className="text-gray-500 hover:text-red-500 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
      
      <div className="flex items-center gap-6 ml-auto">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-gray-400 font-medium">MONITORING</span>
          <span className="text-green-500 font-bold ml-2">{eventCount} EVENTS</span>
        </div>
        
        <div className="h-4 w-px bg-[#1e2128]" />
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{format(currentTime, 'HH:mm:ss')} UTC</span>
        </div>
        
        <div className="h-4 w-px bg-[#1e2128]" />
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">SOURCES:</span>
          <span className="text-green-500 font-bold">● GDELT ● NEWSAPI ● LIVE</span>
        </div>
      </div>
    </header>
  );
}

function StatsPanel() {
  const stats = [
    { label: 'CONFLICT ZONES', value: '47', icon: Target, change: '+3', color: 'red' },
    { label: 'EVENTS (LIVE)', value: '1289', icon: Zap, change: '+156', color: 'orange' },
    { label: 'COUNTRIES', value: '195', icon: Globe, change: '100%', color: 'blue' },
    { label: 'THREATS', value: 'HIGH', icon: AlertTriangle, change: '↑', color: 'red' },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-px bg-gradient-to-r from-[#1e2128]/50 via-[#2a2f3a]/50 to-[#1e2128]/50 border-b border-[#2a2f3a]/50">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const colorClass = stat.color === 'red' ? 'text-red-500' : stat.color === 'orange' ? 'text-orange-500' : 'text-blue-500';
        return (
          <div key={stat.label} className="bg-[#0a0c10] p-3 border-r border-[#1e2128] hover:bg-[#15181e]/50 transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
              <div className="text-[9px] text-gray-500 font-bold tracking-wider">{stat.label}</div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white group-hover:text-red-500 transition-colors">{stat.value}</span>
              {stat.change && (
                <span className={`text-[10px] font-bold ${stat.change.startsWith('+') || stat.change === '↑' ? 'text-red-500' : 'text-green-500'}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Sidebar({ selectedFilters, onFilterChange }: { 
  selectedFilters: string[]; 
  onFilterChange: (filter: string) => void;
}) {
  const filters = [
    { id: 'conflict', label: 'Conflict Zones', icon: Target, color: 'red', badge: 'CONFLICT' },
    { id: 'war', label: 'War', icon: Flame, color: 'red', badge: 'WAR' },
    { id: 'virus', label: 'Virus/Pandemic', icon: AlertTriangle, color: 'orange', badge: 'VIRUS' },
  ];
  
  const dataSources = [
    { name: 'GDELT API', status: 'active', latency: '45ms' },
    { name: 'NewsAPI', status: 'active', latency: '62ms' },
    { name: 'USGS', status: 'active', latency: '38ms' },
    { name: 'Reuters RSS', status: 'active', latency: '120ms' },
    { name: 'Liveuamap', status: 'warning', latency: '245ms' },
    { name: 'ADS-B Exchange', status: 'active', latency: '89ms' },
  ];
  
  return (
    <aside className="w-[220px] border-r border-[#1e2128] flex flex-col h-full overflow-hidden" style={{
      background: 'linear-gradient(180deg, rgba(10,12,16,0.9) 0%, rgba(15,17,21,0.8) 100%)',
      borderRightColor: 'rgba(75, 85, 99, 0.2)'
    }}>
      {/* Filter Section */}
      <div className="p-3 border-b" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
          <Filter className="w-3.5 h-3.5 text-red-400" />
          <span className="tracking-wider">EVENT FILTERS</span>
        </div>
      </div>
      
      <div className="p-2.5 space-y-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selectedFilters.includes(filter.id);
          const colorMap: any = {
            red: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5', icon: '#ef4444' },
            orange: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#fed7aa', icon: '#f97316' },
            purple: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe', icon: '#a855f7' },
            blue: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd', icon: '#3b82f6' },
          };
          
          const colors = colorMap[filter.color];
          
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 group"
              style={{
                background: isSelected ? colors.bg : 'rgba(75, 85, 99, 0.05)',
                border: `1px solid ${isSelected ? colors.border : 'rgba(75, 85, 99, 0.15)'}`,
                color: isSelected ? colors.text : '#9ca3af',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(75, 85, 99, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(75, 85, 99, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.15)';
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? colors.icon : 'inherit' }} />
              <div className="flex-1 text-left">
                <div>{filter.label}</div>
                <div className="text-[9px] opacity-60 font-normal">{filter.badge}</div>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors.icon }} />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Data Sources Section */}
      <div className="mt-auto">
        <div className="p-3 border-t border-b" style={{ borderColor: 'rgba(75, 85, 99, 0.2)' }}>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="tracking-wider">DATA SOURCES</span>
          </div>
        </div>
        
        <div className="p-2.5 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
          {dataSources.map((source) => (
            <div key={source.name} className="px-2.5 py-1.5 rounded-md transition-all duration-300" style={{
              background: 'rgba(75, 85, 99, 0.05)',
              border: '1px solid rgba(75, 85, 99, 0.15)',
            }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className={source.status === 'active' ? 'status-active' : 'status-warning'} />
                  <span className="text-[10px] font-medium text-gray-400">{source.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold leading-none" style={{
                  background: source.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                  color: source.status === 'active' ? '#6ee7b7' : '#fed7aa',
                }}>
                  {source.latency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function WorldMap({ 
  events, 
  selectedFilters,
  onRefresh,
  showSatellite,
  toggleSatellite,
  mapCenter
}: { 
  events: ConflictEvent[]; 
  selectedFilters: string[];
  onRefresh: () => void;
  showSatellite: boolean;
  toggleSatellite: () => void;
  mapCenter: [number, number];
}) {
  // Define regions for each filter type (lat/lng bounds)
  const filterRegions: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
    war: { minLat: 25, maxLat: 55, minLng: 10, maxLng: 70 }, // Middle East + Eastern Europe (Iran, Israel, Russia-Ukraine, Syria, Iraq)
    worldwar: { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 }, // Global major conflicts
    conflict: { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 }, // Global conflict zones
    virus: { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 }, // Worldwide epidemiology
    earthquake: { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 }, // Global seismic activity
    cyber: { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 }, // Global cyber threats
    political: { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 }, // Global political events
  };

  const isInRegion = (lat: number, lng: number, region: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
    return lat >= region.minLat && lat <= region.maxLat && lng >= region.minLng && lng <= region.maxLng;
  };

  const filteredEvents = selectedFilters.length > 0 
    ? events.filter(e => {
        const hasType = selectedFilters.includes(e.type);
        if (!hasType) return false;
        const region = filterRegions[e.type];
        if (!region) return true;
        return isInRegion(e.lat, e.lng, region);
      })
    : events;
    
  return (
    <div className="relative h-full bg-[#0a0c10]">
      <MapContainer
        center={mapCenter}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          url={showSatellite 
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
          attribution={showSatellite ? 'Esri' : 'CARTO'}
        />
        {filteredEvents.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={createCustomIcon(event.severity, event.type)}
          >
            <Popup>
              <div className="rounded p-4 min-w-[220px]" style={{
                background: 'linear-gradient(135deg, rgba(10,12,16,0.95) 0%, rgba(15,17,21,0.95) 100%)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
              }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="px-2 py-1 rounded text-[10px] font-bold" style={{
                    background: event.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                               event.severity === 'high' ? 'rgba(249, 115, 22, 0.2)' :
                               event.severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: event.severity === 'critical' ? '#fca5a5' :
                           event.severity === 'high' ? '#fed7aa' :
                           event.severity === 'medium' ? '#fef08a' : '#a7f3d0',
                  }}>
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{event.type}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{event.title}</h3>
                <p className="text-xs text-gray-300 mb-2.5">{event.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                  <Clock className="w-3 h-3" />
                  {format(event.timestamp, 'HH:mm:ss')} UTC
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={onRefresh}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(15,17,21,0.9) 0%, rgba(10,12,16,0.8) 100%)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            color: '#9ca3af'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,17,21,0.95) 0%, rgba(10,12,16,0.9) 100%)';
            e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,17,21,0.9) 0%, rgba(10,12,16,0.8) 100%)';
            e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Refresh Map"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button 
          onClick={toggleSatellite}
          className="w-9 h-9 border rounded-lg flex items-center justify-center transition-all duration-300"
          style={{
            background: showSatellite ? 'rgba(59, 130, 246, 0.2)' : 'linear-gradient(135deg, rgba(15,17,21,0.9) 0%, rgba(10,12,16,0.8) 100%)',
            borderColor: showSatellite ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.3)',
            color: showSatellite ? '#93c5fd' : '#9ca3af',
            boxShadow: showSatellite ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!showSatellite) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,17,21,0.95) 0%, rgba(10,12,16,0.9) 100%)';
              e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showSatellite) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,17,21,0.9) 0%, rgba(10,12,16,0.8) 100%)';
              e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          title="Toggle Satellite View"
        >
          <Satellite className="w-4 h-4" />
        </button>
        <button 
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(15,17,21,0.9) 0%, rgba(10,12,16,0.8) 100%)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            color: '#9ca3af'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,17,21,0.95) 0%, rgba(10,12,16,0.9) 100%)';
            e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,17,21,0.9) 0%, rgba(10,12,16,0.8) 100%)';
            e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Toggle Markers"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      {/* Legend removed */}
    </div>
  );
}




function RealTimeNewsPanel({ 
  news, 
  isLoading, 
  onRefresh, 
  selectedCountry 
}: { 
  news: NewsItem[]; 
  isLoading: boolean;
  onRefresh: () => void;
  selectedCountry: any;
}) {
  return (
    <div className="flex flex-col bg-gradient-to-b from-[rgba(15,17,21,0.95)] to-[rgba(10,12,16,0.85)] border border-[rgba(75,85,99,0.2)] rounded-lg shadow-lg h-full max-h-[250px]" style={{
      background: 'linear-gradient(135deg, rgba(15,17,21,0.95) 0%, rgba(10,12,16,0.85) 100%)',
      border: '1px solid rgba(75,85,99,0.2)',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderBottomColor: 'rgba(75,85,99,0.2)' }}>
        <div className="flex items-center gap-2 flex-1">
          <Newspaper className="w-4 h-4 text-blue-400" />
          <div className="flex-1">
            <div className="text-xs font-bold text-gray-200 tracking-wider">LIVE NEWS</div>
            {selectedCountry && (
              <div className="text-[10px] text-gray-400 font-semibold">{selectedCountry.name}</div>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded hover:bg-blue-500/10 transition-colors flex-shrink-0"
          title="Refresh news"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {news.length > 0 ? (
          <div>
            {news.map((item, idx) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 hover:bg-[rgba(75,85,99,0.1)] transition-all duration-300 group"
                style={{
                  borderBottom: idx < news.length - 1 ? '1px solid rgba(75,85,99,0.15)' : 'none'
                }}
              >
                {/* Image */}
                {item.imageUrl && (
                  <div className="mb-2 rounded overflow-hidden max-h-20">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Title */}
                <h4 className="text-xs font-bold text-gray-100 mb-1.5 line-clamp-2 group-hover:text-white transition-colors leading-snug">
                  {item.title}
                </h4>
                
                {/* Meta */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-400 hover:text-blue-400 transition-colors">
                      {item.source}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">
                      {new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Asia/Jakarta',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).format(item.timestamp)}
                      <span className="text-gray-600 ml-1">WIB</span>
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="animate-spin mb-2">
                <RefreshCw className="w-5 h-5 mx-auto" />
              </div>
              <div className="text-xs">Memuat berita...</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            Tidak ada berita terbaru
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPanel({ videos }: { videos: VideoFeed[] }) {
  return (
    <div className="flex flex-col" style={{
      background: 'linear-gradient(180deg, rgba(15,17,21,0.8) 0%, rgba(10,12,16,0.6) 100%)',
      border: '1px solid rgba(75, 85, 99, 0.2)',
      borderRadius: '8px',
    }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200 tracking-wider">
          <Video className="w-4 h-4 text-red-400" />
          <span>LIVE VIDEO FEEDS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-gray-400">{videos.length} ACTIVE</span>
          <div className="w-2 h-2 rounded-full status-error" />
        </div>
      </div>
      <div className="p-2.5 grid grid-cols-2 gap-2">
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video.id} className="relative rounded-lg overflow-hidden group" style={{
              background: 'rgba(10, 12, 16, 0.8)',
              border: '1px solid rgba(75, 85, 99, 0.2)',
            }}>
              <div className="aspect-video relative">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 rounded-md px-2 py-1 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full status-error" />
                  <span className="text-[10px] font-bold text-white">LIVE</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="text-[9px] text-white/90 truncate font-semibold">{video.source}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-4 text-center text-gray-500 text-xs">No videos available</div>
        )}
      </div>
    </div>
  );
}

function EscalationPanel({ metrics }: { metrics: EscalationMetric[] }) {
  const chartData = [
    { time: '00:00', value: 45 },
    { time: '04:00', value: 52 },
    { time: '08:00', value: 48 },
    { time: '12:00', value: 67 },
    { time: '16:00', value: 78 },
    { time: '20:00', value: 85 },
    { time: '24:00', value: 87 },
  ];

  return (
    <div className="flex flex-col" style={{
      background: 'linear-gradient(180deg, rgba(15,17,21,0.8) 0%, rgba(10,12,16,0.6) 100%)',
      border: '1px solid rgba(75, 85, 99, 0.2)',
      borderRadius: '8px',
    }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200 tracking-wider">
          <TrendingUp className="w-4 h-4 text-red-400" />
          <span>ESCALATION INDEX</span>
        </div>
        <span className="text-[9px] font-mono text-gray-500 bg-red-500/10 px-2 py-1 rounded">24H</span>
      </div>
      
      <div className="p-3 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.region} className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-gray-300">{metric.region}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white" style={{
                  color: metric.level >= 80 ? '#fca5a5' : 
                         metric.level >= 60 ? '#fed7aa' :
                         metric.level >= 40 ? '#fef08a' : '#a7f3d0'
                }}>{metric.level}</span>
                <span className={cn(
                  "flex items-center gap-0.5 text-[9px] font-semibold",
                  metric.trend === 'up' && "text-red-400",
                  metric.trend === 'down' && "text-green-400",
                  metric.trend === 'stable' && "text-gray-500",
                )}>
                  {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {metric.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  <span>{metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{Math.abs(metric.change)}</span>
                </span>
              </div>
            </div>
            <div className="h-2 rounded-lg overflow-hidden" style={{ background: 'rgba(75, 85, 99, 0.1)' }}>
              <div 
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${metric.level}%`,
                  background: metric.level >= 80 ? 'linear-gradient(90deg, #ef4444 0%, #ef4444 100%)' : 
                             metric.level >= 60 ? 'linear-gradient(90deg, #f97316 0%, #f97316 100%)' :
                             metric.level >= 40 ? 'linear-gradient(90deg, #eab308 0%, #eab308 100%)' : 'linear-gradient(90deg, #10b981 0%, #10b981 100%)',
                  boxShadow: metric.level >= 80 ? '0 0 10px rgba(239, 68, 68, 0.5)' :
                            metric.level >= 60 ? '0 0 10px rgba(249, 115, 22, 0.5)' : 'none'
                }}
              />
            </div>
          </div>
        ))}
        
        {/* Mini Chart */}
        <div className="pt-2 border-t" style={{ borderTopColor: 'rgba(75, 85, 99, 0.2)' }}>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <Area type="monotone" dataKey="value" stroke="#ef4444" fill="url(#colorGradient)" isAnimationActive={false} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function EarthquakePanel({ earthquakes }: { earthquakes: EarthquakeData[] }) {
  return (
    <div className="flex flex-col" style={{
      background: 'linear-gradient(180deg, rgba(15,17,21,0.8) 0%, rgba(10,12,16,0.6) 100%)',
      border: '1px solid rgba(75, 85, 99, 0.2)',
      borderRadius: '8px',
    }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200 tracking-wider">
          <Activity className="w-4 h-4 text-orange-400" />
          <span>SEISMIC ACTIVITY</span>
        </div>
        <span className="text-[9px] font-mono text-gray-500 bg-orange-500/10 px-2 py-1 rounded">USGS</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="sticky top-0 bg-black/20" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>
              <th className="text-left p-3 font-semibold text-gray-400 border-b" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>Location</th>
              <th className="text-center p-3 font-semibold text-gray-400 border-b" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>Magnitude</th>
              <th className="text-center p-3 font-semibold text-gray-400 border-b" style={{ borderBottomColor: 'rgba(75, 85, 99, 0.2)' }}>Depth</th>
            </tr>
          </thead>
          <tbody>
            {earthquakes.length > 0 ? (
              earthquakes.map((eq) => (
                <tr key={eq.id} className="border-b transition-colors duration-300 hover:bg-[rgba(75,85,99,0.1)]" style={{
                  borderBottomColor: 'rgba(75, 85, 99, 0.15)',
                }}>
                  <td className="p-3 text-gray-300 font-medium">{eq.location}</td>
                  <td className="text-center p-3 font-bold" style={{
                    color: eq.magnitude >= 7 ? '#fca5a5' : eq.magnitude >= 5.5 ? '#fed7aa' : '#fef08a'
                  }}>
                    {eq.magnitude}
                  </td>
                  <td className="text-center p-3 text-gray-400 font-mono">{eq.depth}km</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">No seismic activity</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['conflict', 'war', 'worldwar', 'virus', 'earthquake', 'cyber', 'political']);
  const [showSatellite, setShowSatellite] = useState(false);
  const [gdeltEvents, setGdeltEvents] = useState<ConflictEvent[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25, 20]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch GDELT CSV and parse (auto-refresh every 30 seconds)
  useEffect(() => {
    const fetchGDELT = async () => {
      try {
        const response = await fetch(GDELT_CSV_URL);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const events: ConflictEvent[] = [];
            const csvData = results.data as string[][];
            
            csvData.slice(0, 1000).forEach((row, idx) => {
              if (row.length > 54 && row[53] && row[54]) {
                try {
                  const lat = parseFloat(row[53]);
                  const lng = parseFloat(row[54]);
                  const eventCode = row[23] || '190';
                  const goldsteinScale = parseFloat(row[26] || '1');
                  const actor = row[34] || 'Unknown';
                  const timestamp = new Date();
                  
                  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    events.push({
                      id: row[0] || `gdelt-${idx}`,
                      lat,
                      lng,
                      title: `Event: ${actor}`,
                      type: getEventType(eventCode),
                      severity: getSeverityFromGoldstein(goldsteinScale),
                      timestamp,
                      description: `Event Code: ${eventCode}, Actor: ${actor}`,
                      countryCode: row[51],
                    });
                  }
                } catch (e) {
                  // Skip parsing errors
                }
              }
            });
            
            setGdeltEvents(events);
          }
        });
      } catch (error) {
        console.error('Failed to fetch GDELT:', error);
      }
    };
    
    fetchGDELT();
    const interval = setInterval(fetchGDELT, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch and refresh news function
  const fetchNews = async () => {
    if (!NEWSAPI_KEY) {
      console.warn('VITE_NEWSAPI_KEY not set');
      return;
    }
    
    setIsLoadingNews(true);
    try {
      const country = selectedCountry?.name || 'world';
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${country}&sortBy=publishedAt&language=en&pageSize=30&apiKey=${NEWSAPI_KEY}`
      );
      const data = await response.json();
      
      const news: NewsItem[] = (data.articles || []).map((article: any, idx: number) => ({
        id: `news-${idx}`,
        title: article.title,
        source: article.source.name,
        timestamp: new Date(article.publishedAt),
        category: article.category || 'News',
        severity: 'medium' as const,
        url: article.url,
        imageUrl: article.urlToImage,
      }));
      
      setFilteredNews(news);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Auto-refresh news every 60 seconds
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [selectedCountry]);

  // Handle command submission
  const handleCommand = (cmd: string) => {
    if (cmd.startsWith('/newsnow')) {
      const country = parseCountryFromPrompt(cmd);
      if (country) {
        setSelectedCountry(country);
        setMapCenter([country.lat, country.lng]);
      }
    }
  };

  const mockEarthquakes: EarthquakeData[] = [
    { id: '1', location: 'Near Iran-Iraq Border', magnitude: 4.8, depth: 12, timestamp: new Date(Date.now() - 1800000), lat: 33.8, lng: 45.9 },
    { id: '2', location: 'Eastern Mediterranean', magnitude: 3.2, depth: 25, timestamp: new Date(Date.now() - 3600000), lat: 35.2, lng: 30.5 },
    { id: '3', location: 'Northern Turkey', magnitude: 4.1, depth: 8, timestamp: new Date(Date.now() - 5400000), lat: 39.9, lng: 41.3 },
  ];

  const mockMetrics: EscalationMetric[] = [
    { region: 'Middle East', level: 87, trend: 'up', change: 12 },
    { region: 'Eastern Europe', level: 72, trend: 'stable', change: 0 },
    { region: 'East Asia', level: 45, trend: 'down', change: -5 },
    { region: 'Africa', level: 58, trend: 'up', change: 8 },
  ];

  const mockVideos: VideoFeed[] = [
    { id: '1', title: 'Al Jazeera English - Live', source: 'Al Jazeera', embedUrl: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&mute=1', isLive: true },
    { id: '2', title: 'Sky News - Live', source: 'Sky News', embedUrl: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1', isLive: true },
    { id: '3', title: 'TRT World - Live', source: 'TRT World', embedUrl: 'https://www.youtube.com/embed/8ISV-K2cWeg?autoplay=1&mute=1', isLive: true },
    { id: '4', title: 'FRANCE 24 - Live', source: 'FRANCE 24', embedUrl: 'https://www.youtube.com/embed/h3MuIUNCCzI?autoplay=1&mute=1', isLive: true },
  ];

  const toggleSatellite = () => setShowSatellite(!showSatellite);
  const handleRefresh = () => setGdeltEvents([...gdeltEvents]);
  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFilterChange = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] text-gray-100 overflow-hidden">
      <Header onCommand={handleCommand} eventCount={gdeltEvents.length} onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
      <StatsPanel />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Responsive */}
        <div className="hidden lg:flex">
          <Sidebar selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
        </div>
        
        {/* Mobile/Tablet Sidebar Overlay */}
        {sidebarOpen && (
          <div className="absolute z-50 left-0 top-24 h-96 max-h-[calc(100vh-6rem)]">
            <Sidebar selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
          </div>
        )}
        
        {/* Main Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorldMap 
            events={gdeltEvents}
            selectedFilters={selectedFilters}
            onRefresh={handleRefresh}
            showSatellite={showSatellite}
            toggleSatellite={toggleSatellite}
            mapCenter={mapCenter}
          />
        </div>
      </div>
      
      {/* Bottom Panels */}
      <div className="flex gap-2 p-3 border-t max-h-[280px]" style={{
        borderTopColor: 'rgba(75, 85, 99, 0.2)',
        background: 'linear-gradient(180deg, rgba(10,12,16,0.5) 0%, rgba(10,12,16,0.8) 100%)',
      }}>
        {/* Left: Earthquake and Escalation */}
        <div className="flex flex-col gap-2 w-72">
          <div className="grid grid-cols-2 gap-2 h-full">
            <EarthquakePanel earthquakes={mockEarthquakes} />
            <EscalationPanel metrics={mockMetrics} />
          </div>
        </div>
        
        {/* Center: Real-time News (Main Panel) */}
        <div className="flex-1">
          <RealTimeNewsPanel 
            news={filteredNews} 
            isLoading={isLoadingNews}
            onRefresh={fetchNews}
            selectedCountry={selectedCountry}
          />
        </div>
        
        {/* Right: Video Feeds */}
        <div className="w-96">
          <VideoPanel videos={mockVideos} />
        </div>
      </div>
    </div>
  );
}

export default App;
