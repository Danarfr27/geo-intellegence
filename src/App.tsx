import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Globe, Newspaper, Video, Activity, AlertTriangle, Command, TrendingUp, TrendingDown, Clock, Zap, Shield, Satellite, ChevronRight, Filter, RefreshCw, Database, Cpu, Eye, Target, ExternalLink } from 'lucide-react';
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
  type: 'conflict' | 'earthquake' | 'cyber' | 'political';
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
function getEventType(eventCode: string): 'conflict' | 'earthquake' | 'cyber' | 'political' {
  const code = parseInt(eventCode);
  if (code >= 190 && code <= 195) return 'conflict';
  if (code >= 10 && code <= 13) return 'political';
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
function Header({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [command, setCommand] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
  
  return (
    <header className="h-12 bg-[#0a0c10] border-b border-[#1e2128] flex items-center px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-red-500" />
        <span className="font-bold text-white tracking-wide text-sm">FIRD-GEOPOLITICS</span>
        <span className="text-xs text-gray-600">v2.4.1</span>
      </div>
      
      <div className="h-5 w-px bg-[#1e2128] mx-4" />
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[#15181e] border border-[#2a2f3a] rounded px-3 py-1.5 flex-1 max-w-lg">
        <Command className="w-3.5 h-3.5 text-red-500" />
        <span className="text-red-500 text-xs font-mono">/</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="newsnow [COUNTRY NAME]"
          className="bg-transparent border-none outline-none text-xs w-full text-gray-300 placeholder:text-gray-600"
        />
        {command && (
          <button type="submit" className="text-gray-500 hover:text-white">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
      
      <div className="flex items-center gap-6 ml-auto">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-gray-400">LIVE</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{format(currentTime, 'HH:mm:ss')} UTC</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Data Sources:</span>
          <span className="text-green-500 font-mono">12 ACTIVE</span>
        </div>
      </div>
    </header>
  );
}

function StatsPanel() {
  const stats = [
    { label: 'ACTIVE CONFLICTS', value: '47', change: '+3' },
    { label: 'EVENTS (24H)', value: '1289', change: '+156' },
    { label: 'DATA POINTS', value: '2.4M', change: '+12' },
    { label: 'SOURCES', value: '12', change: '' },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-px bg-[#1e2128]">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-[#0f1115] p-3">
          <div className="text-[10px] text-gray-500 font-medium tracking-wider">{stat.label}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-white">{stat.value}</span>
            {stat.change && (
              <span className="text-xs text-red-400 font-medium">{stat.change}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ selectedFilters, onFilterChange }: { 
  selectedFilters: string[]; 
  onFilterChange: (filter: string) => void;
}) {
  const filters = [
    { id: 'conflict', label: 'Conflict Zones', icon: Target, color: 'red' },
    { id: 'earthquake', label: 'Earthquakes', icon: Activity, color: 'orange' },
    { id: 'cyber', label: 'Cyber Attacks', icon: Cpu, color: 'purple' },
    { id: 'political', label: 'Political', icon: Shield, color: 'blue' },
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
    <aside className="w-[220px] bg-[#0f1115] border-r border-[#1e2128] flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#1e2128]">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          <span>FILTERS</span>
        </div>
      </div>
      
      <div className="p-2 space-y-1">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selectedFilters.includes(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-all",
                isSelected 
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : "bg-transparent text-gray-400 border border-transparent hover:bg-[#15181e] hover:text-gray-300"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{filter.label}</span>
              {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          );
        })}
      </div>
      
      <div className="mt-auto">
        <div className="p-3 border-t border-b border-[#1e2128]">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <Database className="w-3.5 h-3.5" />
            <span>DATA SOURCES</span>
          </div>
        </div>
        
        <div className="p-2 space-y-1">
          {dataSources.map((source) => (
            <div key={source.name} className="flex items-center justify-between text-[10px] py-1">
              <span className="text-gray-500">{source.name}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded font-mono text-[9px]",
                source.status === 'active' ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"
              )}>
                {source.latency}
              </span>
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
  const filteredEvents = selectedFilters.length > 0 
    ? events.filter(e => selectedFilters.includes(e.type))
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
              <div className="bg-[#0f1115] border border-[#1e2128] rounded p-3 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    event.severity === 'critical' && "bg-red-500/20 text-red-400",
                    event.severity === 'high' && "bg-orange-500/20 text-orange-400",
                    event.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                    event.severity === 'low' && "bg-green-500/20 text-green-400",
                  )}>
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase">{event.type}</span>
                </div>
                <h3 className="text-sm font-medium text-white mb-1">{event.title}</h3>
                <p className="text-xs text-gray-400 mb-2">{event.description}</p>
                <div className="text-[10px] text-gray-500 font-mono">
                  {format(event.timestamp, 'HH:mm')} UTC
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <button 
          onClick={onRefresh}
          className="w-8 h-8 bg-[#0f1115] border border-[#1e2128] rounded flex items-center justify-center hover:bg-[#15181e] hover:border-[#2a2f3a] transition-colors"
          title="Refresh Map"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <button 
          onClick={toggleSatellite}
          className={cn(
            "w-8 h-8 border rounded flex items-center justify-center transition-colors",
            showSatellite 
              ? "bg-blue-500/20 border-blue-500/50 text-blue-400" 
              : "bg-[#0f1115] border-[#1e2128] hover:bg-[#15181e] hover:border-[#2a2f3a]"
          )}
          title="Toggle Satellite View"
        >
          <Satellite className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <button 
          className="w-8 h-8 bg-[#0f1115] border border-[#1e2128] rounded flex items-center justify-center hover:bg-[#15181e] hover:border-[#2a2f3a] transition-colors"
          title="Toggle Markers"
        >
          <Eye className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#0f1115]/95 border border-[#1e2128] rounded p-2.5">
        <div className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wider">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-gray-400">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-[10px] text-gray-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-gray-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-400">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsPanel({ news }: { news: NewsItem[] }) {
  return (
    <div className="flex flex-col h-[280px] bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Newspaper className="w-3.5 h-3.5" />
          <span>LIVE NEWS FEED</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {news.length > 0 ? (
          news.map((item) => (
            <a 
              key={item.id} 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 border-b border-[#1e2128] hover:bg-[#15181e] transition-colors group"
            >
              <div className="flex items-start gap-2">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 mt-0.5",
                  item.severity === 'critical' && "bg-red-500/20 text-red-400",
                  item.severity === 'high' && "bg-orange-500/20 text-orange-400",
                  item.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                  item.severity === 'low' && "bg-green-500/20 text-green-400",
                )}>
                  {item.category}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs text-gray-200 leading-snug mb-1 line-clamp-2 group-hover:text-white transition-colors">{item.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{format(item.timestamp, 'HH:mm')}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 text-xs">No news available</div>
        )}
      </div>
    </div>
  );
}

function VideoPanel({ videos }: { videos: VideoFeed[] }) {
  return (
    <div className="flex flex-col bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Video className="w-3.5 h-3.5" />
          <span>LIVE VIDEO FEEDS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{videos.length} ACTIVE</span>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2">
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video.id} className="relative bg-[#0a0c10] rounded overflow-hidden group">
              <div className="aspect-video relative">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-medium text-white">LIVE</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="text-[9px] text-white/90 truncate">{video.source}</div>
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
    <div className="flex flex-col bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>ESCALATION INDEX</span>
        </div>
        <span className="text-[10px] text-gray-500">24H</span>
      </div>
      
      <div className="p-2.5 space-y-2.5">
        {metrics.map((metric) => (
          <div key={metric.region} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-400">{metric.region}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-medium text-white">{metric.level}</span>
                <span className={cn(
                  "flex items-center gap-0.5 text-[9px]",
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
            <div className="h-1.5 rounded-full overflow-hidden bg-[#1e2128]">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  metric.level >= 80 && "bg-gradient-to-r from-red-600 to-red-400",
                  metric.level >= 60 && metric.level < 80 && "bg-gradient-to-r from-orange-600 to-orange-400",
                  metric.level >= 40 && metric.level < 60 && "bg-gradient-to-r from-yellow-600 to-yellow-400",
                  metric.level < 40 && "bg-gradient-to-r from-green-600 to-green-400",
                )}
                style={{ width: `${metric.level}%` }}
              />
            </div>
          </div>
        ))}
        
        {/* Mini Chart */}
        <div className="pt-2 border-t border-[#1e2128]">
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" isAnimationActive={false} />
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
    <div className="flex flex-col bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Activity className="w-3.5 h-3.5" />
          <span>SEISMIC ACTIVITY</span>
        </div>
        <span className="text-[10px] text-gray-500">USGS FEED</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-gray-500 border-b border-[#1e2128]">
              <th className="text-left p-2">Location</th>
              <th className="text-center p-2">Magnitude</th>
              <th className="text-center p-2">Depth</th>
            </tr>
          </thead>
          <tbody>
            {earthquakes.length > 0 ? (
              earthquakes.map((eq) => (
                <tr key={eq.id} className="border-b border-[#1e2128] hover:bg-[#15181e]">
                  <td className="p-2 text-gray-300">{eq.location}</td>
                  <td className="text-center p-2 text-orange-400 font-medium">{eq.magnitude}</td>
                  <td className="text-center p-2 text-gray-400">{eq.depth}km</td>
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

function AISummaryPanel() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };
  
  return (
    <div className="flex flex-col bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>AI SUMMARY</span>
        </div>
        <button 
          onClick={handleRegenerate}
          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
          REGENERATE
        </button>
      </div>
      
      <div className="p-2.5">
        <div className="space-y-2">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-[10px] text-purple-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium mb-1">Current Status Summary</p>
                <p className="text-purple-400/80">Global escalation metrics showing increased activity in the Middle East region. Multiple conflict zones reporting elevated tensions. Recommend monitoring closely over next 48 hours.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#15181e] p-2 rounded">
              <div className="text-[9px] text-gray-500 mb-1">Predicted Trend</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400 font-medium">INCREASING</span>
              </div>
            </div>
            <div className="bg-[#15181e] p-2 rounded">
              <div className="text-[9px] text-gray-500 mb-1">Confidence</div>
              <span className="text-[10px] text-blue-400 font-medium">87%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-2">
          <div className="h-1 flex-1 bg-red-500/20 rounded-full" />
          <div className="h-1 flex-1 bg-red-500/20 rounded-full" />
          <div className="h-1 flex-1 bg-red-500/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['conflict']);
  const [showSatellite, setShowSatellite] = useState(false);
  const [gdeltEvents, setGdeltEvents] = useState<ConflictEvent[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25, 20]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

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
            
            csvData.slice(0, 100).forEach((row, idx) => {
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

  // Fetch NewsAPI (auto-refresh every 60 seconds)
  useEffect(() => {
    const fetchNews = async () => {
      if (!NEWSAPI_KEY) {
        console.warn('VITE_NEWSAPI_KEY not set');
        return;
      }
      
      try {
        const country = selectedCountry?.name || 'world';
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${country}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${NEWSAPI_KEY}`
        );
        const data = await response.json();
        
        const news: NewsItem[] = (data.articles || []).slice(0, 10).map((article: any, idx: number) => ({
          id: `news-${idx}`,
          title: article.title,
          source: article.source.name,
          timestamp: new Date(article.publishedAt),
          category: 'News',
          severity: 'medium' as const,
          url: article.url,
        }));
        
        setFilteredNews(news);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    };
    
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

  const handleFilterChange = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] text-gray-100 overflow-hidden">
      <Header onCommand={handleCommand} />
      <StatsPanel />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
        
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
      <div className="grid grid-cols-3 gap-px bg-[#1e2128] border-t border-[#1e2128] max-h-[420px]">
        <NewsPanel news={filteredNews} />
        <VideoPanel videos={mockVideos} />
        <div className="grid grid-rows-2 gap-px bg-[#1e2128]">
          <EscalationPanel metrics={mockMetrics} />
          <div className="grid grid-cols-2 gap-px bg-[#1e2128]">
            <EarthquakePanel earthquakes={mockEarthquakes} />
            <AISummaryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
