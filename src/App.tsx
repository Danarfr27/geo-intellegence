import { useState, useEffect } from 'react';
import { 
  Globe, 
  Newspaper, 
  Video, 
  Activity, 
  AlertTriangle, 
  Command,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Shield,
  Satellite,
  ChevronRight,
  Play,
  Filter,
  RefreshCw,
  Database,
  Cpu,
  Eye,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: Date;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface VideoFeed {
  id: string;
  title: string;
  source: string;
  thumbnail: string;
  isLive: boolean;
  viewers?: number;
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

// Mock Data
const mockConflictEvents: ConflictEvent[] = [
  { id: '1', lat: 31.5, lng: 34.8, title: 'Gaza Strip Conflict', type: 'conflict', severity: 'critical', timestamp: new Date(), description: 'Active military operations reported' },
  { id: '2', lat: 33.8, lng: 35.5, title: 'Lebanon Border Tensions', type: 'conflict', severity: 'high', timestamp: new Date(Date.now() - 3600000), description: 'Cross-border artillery exchange' },
  { id: '3', lat: 35.7, lng: 51.4, title: 'Iran Military Activity', type: 'political', severity: 'medium', timestamp: new Date(Date.now() - 7200000), description: 'Increased military presence detected' },
  { id: '4', lat: 32.9, lng: 13.2, title: 'Libya Clashes', type: 'conflict', severity: 'high', timestamp: new Date(Date.now() - 10800000), description: 'Militia conflict in Tripoli' },
  { id: '5', lat: 48.9, lng: 37.8, title: 'Ukraine Frontline', type: 'conflict', severity: 'critical', timestamp: new Date(Date.now() - 1800000), description: 'Heavy fighting reported' },
  { id: '6', lat: 15.5, lng: 44.2, title: 'Yemen Airstrikes', type: 'conflict', severity: 'high', timestamp: new Date(Date.now() - 5400000), description: 'Coalition airstrikes in Sanaa' },
  { id: '7', lat: 36.2, lng: 36.2, title: 'Syria Border Conflict', type: 'conflict', severity: 'medium', timestamp: new Date(Date.now() - 9000000), description: 'Turkish-Syrian border skirmishes' },
  { id: '8', lat: 19.4, lng: -99.1, title: 'Mexico Cyber Attack', type: 'cyber', severity: 'medium', timestamp: new Date(Date.now() - 12600000), description: 'Government systems targeted' },
];

const mockNews: NewsItem[] = [
  { id: '1', title: 'Israel launches targeted strikes on Gaza militant positions', source: 'Reuters', timestamp: new Date(Date.now() - 300000), category: 'Conflict', severity: 'critical' },
  { id: '2', title: 'Hezbollah claims responsibility for border attack', source: 'Al Jazeera', timestamp: new Date(Date.now() - 600000), category: 'Conflict', severity: 'high' },
  { id: '3', title: 'Iran warns of decisive response to any aggression', source: 'BBC', timestamp: new Date(Date.now() - 900000), category: 'Diplomacy', severity: 'high' },
  { id: '4', title: 'US deploys additional carrier group to Mediterranean', source: 'CNN', timestamp: new Date(Date.now() - 1200000), category: 'Military', severity: 'medium' },
  { id: '5', title: 'Russia condemns escalation in Middle East', source: 'RT', timestamp: new Date(Date.now() - 1500000), category: 'Diplomacy', severity: 'medium' },
  { id: '6', title: 'Egypt opens Rafah crossing for humanitarian aid', source: 'AP', timestamp: new Date(Date.now() - 1800000), category: 'Humanitarian', severity: 'low' },
  { id: '7', title: 'UN Security Council emergency session called', source: 'UN News', timestamp: new Date(Date.now() - 2100000), category: 'Diplomacy', severity: 'medium' },
  { id: '8', title: 'Oil prices surge amid Middle East tensions', source: 'Bloomberg', timestamp: new Date(Date.now() - 2400000), category: 'Economy', severity: 'medium' },
];

const mockVideos: VideoFeed[] = [
  { id: '1', title: 'Bloomberg Live: Middle East Crisis', source: 'Bloomberg', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400', isLive: true, viewers: 125000 },
  { id: '2', title: 'Al Jazeera: Gaza Coverage', source: 'Al Jazeera', thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400', isLive: true, viewers: 89000 },
  { id: '3', title: 'CNN: Breaking News', source: 'CNN', thumbnail: 'https://images.unsplash.com/photo-1586899028174-e7098604235b?w=400', isLive: true, viewers: 67000 },
  { id: '4', title: 'Reuters: Live Feed', source: 'Reuters', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', isLive: true, viewers: 45000 },
];

const mockEarthquakes: EarthquakeData[] = [
  { id: '1', location: 'Near Iran-Iraq Border', magnitude: 4.8, depth: 12, timestamp: new Date(Date.now() - 1800000), lat: 33.8, lng: 45.9 },
  { id: '2', location: 'Eastern Mediterranean', magnitude: 3.2, depth: 25, timestamp: new Date(Date.now() - 3600000), lat: 35.2, lng: 30.5 },
  { id: '3', location: 'Northern Turkey', magnitude: 4.1, depth: 8, timestamp: new Date(Date.now() - 5400000), lat: 39.9, lng: 41.3 },
];

const mockEscalationMetrics: EscalationMetric[] = [
  { region: 'Middle East', level: 87, trend: 'up', change: 12 },
  { region: 'Eastern Europe', level: 72, trend: 'stable', change: 0 },
  { region: 'East Asia', level: 45, trend: 'down', change: -5 },
  { region: 'Africa', level: 58, trend: 'up', change: 8 },
];

const chartData = [
  { time: '00:00', value: 45 },
  { time: '04:00', value: 52 },
  { time: '08:00', value: 48 },
  { time: '12:00', value: 67 },
  { time: '16:00', value: 78 },
  { time: '20:00', value: 85 },
  { time: '24:00', value: 87 },
];

// Custom Map Markers
const createCustomIcon = (severity: string, type: string) => {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };
  
  const icons = {
    conflict: '⚔️',
    earthquake: '🌋',
    cyber: '💻',
    political: '🏛️',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[severity as keyof typeof colors]};
        border-radius: 50%;
        border: 3px solid #0a0c10;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 0 15px ${colors[severity as keyof typeof colors]}80;
        animation: marker-pulse 2s ease-in-out infinite;
      ">
        ${icons[type as keyof typeof icons]}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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
    <header className="intel-header h-12">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-red-500" />
          <span className="font-bold text-white tracking-wide">FIRD-GEOPOLITICS</span>
          <span className="text-xs text-gray-500 ml-2">v2.4.1</span>
        </div>
        
        <div className="h-6 w-px bg-[#1e2128] mx-2" />
        
        <form onSubmit={handleSubmit} className="command-prompt flex-1 max-w-xl">
          <Command className="w-4 h-4 text-red-500" />
          <span className="text-red-500 text-sm font-mono">/</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="newsnow iran israel war"
            className="command-input"
          />
          {command && (
            <button type="submit" className="text-gray-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="status-dot status-live" />
          <span>LIVE</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{format(currentTime, 'HH:mm:ss')} UTC</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Data Sources:</span>
          <span className="text-green-400 font-mono">12 ACTIVE</span>
        </div>
      </div>
    </header>
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
    { name: 'ACLED', status: 'active', latency: '62ms' },
    { name: 'USGS', status: 'active', latency: '38ms' },
    { name: 'Reuters RSS', status: 'active', latency: '120ms' },
    { name: 'Liveuamap', status: 'warning', latency: '245ms' },
    { name: 'ADS-B Exchange', status: 'active', latency: '89ms' },
  ];
  
  return (
    <aside className="intel-panel flex flex-col h-full">
      <div className="p-3 border-b border-[#1e2128]">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Filter className="w-4 h-4" />
          <span>FILTERS</span>
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selectedFilters.includes(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all",
                isSelected 
                  ? `bg-${filter.color}-500/20 text-${filter.color}-400 border border-${filter.color}-500/30`
                  : "bg-[#15181e] text-gray-400 border border-transparent hover:border-[#2a2f3a]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{filter.label}</span>
              {isSelected && <div className={`ml-auto w-2 h-2 rounded-full bg-${filter.color}-500`} />}
            </button>
          );
        })}
      </div>
      
      <div className="mt-auto border-t border-[#1e2128]">
        <div className="p-3 border-b border-[#1e2128]">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Database className="w-4 h-4" />
            <span>DATA SOURCES</span>
          </div>
        </div>
        
        <div className="p-3 space-y-2">
          {dataSources.map((source) => (
            <div key={source.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{source.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-1.5 py-0.5 rounded font-mono",
                  source.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                )}>
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

function WorldMap({ events, selectedFilters }: { events: ConflictEvent[]; selectedFilters: string[] }) {
  const filteredEvents = selectedFilters.length > 0 
    ? events.filter(e => selectedFilters.includes(e.type))
    : events;
    
  return (
    <div className="relative h-full bg-[#0a0c10]">
      <MapContainer
        center={[30, 20]}
        zoom={3}
        minZoom={2}
        maxZoom={10}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        {filteredEvents.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={createCustomIcon(event.severity, event.type)}
          >
            <Popup>
              <div className="map-popup">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    event.severity === 'critical' && "bg-red-500/20 text-red-400",
                    event.severity === 'high' && "bg-orange-500/20 text-orange-400",
                    event.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                    event.severity === 'low' && "bg-green-500/20 text-green-400",
                  )}>
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{event.type}</span>
                </div>
                <h3 className="font-medium text-white mb-1">{event.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                <div className="text-xs text-gray-500">
                  {format(event.timestamp, 'HH:mm')} UTC
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button className="bg-[#0f1115] border border-[#1e2128] p-2 rounded hover:bg-[#15181e]">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
        <button className="bg-[#0f1115] border border-[#1e2128] p-2 rounded hover:bg-[#15181e]">
          <Satellite className="w-4 h-4 text-gray-400" />
        </button>
        <button className="bg-[#0f1115] border border-[#1e2128] p-2 rounded hover:bg-[#15181e]">
          <Eye className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 z-[400] bg-[#0f1115]/90 border border-[#1e2128] rounded p-3">
        <div className="text-xs font-medium text-gray-400 mb-2">LEGEND</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-300">Critical</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-300">High</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-300">Medium</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-300">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsPanel({ news }: { news: NewsItem[] }) {
  return (
    <div className="intel-panel flex flex-col h-[280px]">
      <div className="p-3 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Newspaper className="w-4 h-4" />
          <span>LIVE NEWS FEED</span>
        </div>
        <div className="status-dot status-live" />
      </div>
      
      <div className="flex-1 overflow-y-auto intel-scroll">
        {news.map((item) => (
          <div key={item.id} className="news-item">
            <div className="flex items-start gap-2">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 mt-0.5",
                item.severity === 'critical' && "bg-red-500/20 text-red-400",
                item.severity === 'high' && "bg-orange-500/20 text-orange-400",
                item.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                item.severity === 'low' && "bg-green-500/20 text-green-400",
              )}>
                {item.category}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-gray-200 leading-tight mb-1 line-clamp-2">{item.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{format(item.timestamp, 'HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoPanel({ videos }: { videos: VideoFeed[] }) {
  return (
    <div className="intel-panel flex flex-col h-[240px]">
      <div className="p-3 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Video className="w-4 h-4" />
          <span>LIVE VIDEO FEEDS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">4 ACTIVE</span>
          <div className="status-dot status-live" />
        </div>
      </div>
      
      <div className="flex-1 p-3 grid grid-cols-2 gap-2 overflow-y-auto intel-scroll">
        {videos.map((video) => (
          <div key={video.id} className="video-tile group cursor-pointer">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
              <div className="status-dot status-live" />
              <span className="text-[10px] font-medium text-white">LIVE</span>
            </div>
            {video.viewers && (
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1 text-[10px] text-white/80">
                <Eye className="w-3 h-3" />
                <span>{(video.viewers / 1000).toFixed(0)}K</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
              <div className="text-xs font-medium text-white line-clamp-1">{video.title}</div>
              <div className="text-[10px] text-white/60">{video.source}</div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-red-500/90 flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EscalationPanel({ metrics }: { metrics: EscalationMetric[] }) {
  return (
    <div className="intel-panel flex flex-col h-[200px]">
      <div className="p-3 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <TrendingUp className="w-4 h-4" />
          <span>ESCALATION INDEX</span>
        </div>
        <span className="text-xs text-gray-500">24H</span>
      </div>
      
      <div className="flex-1 p-3 space-y-3 overflow-y-auto intel-scroll">
        {metrics.map((metric) => (
          <div key={metric.region} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{metric.region}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-white">{metric.level}</span>
                <span className={cn(
                  "flex items-center gap-0.5 text-[10px]",
                  metric.trend === 'up' && "text-red-400",
                  metric.trend === 'down' && "text-green-400",
                  metric.trend === 'stable' && "text-gray-400",
                )}>
                  {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {metric.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  {metric.change > 0 && '+'}{metric.change}
                </span>
              </div>
            </div>
            <div className="escalation-bar">
              <div 
                className={cn(
                  "escalation-fill",
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
        
        <div className="pt-2 border-t border-[#1e2128]">
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="escalationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#escalationGradient)" 
                  strokeWidth={1.5}
                />
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
    <div className="intel-panel flex flex-col h-[160px]">
      <div className="p-3 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Activity className="w-4 h-4" />
          <span>SEISMIC ACTIVITY</span>
        </div>
        <span className="text-xs text-gray-500">USGS FEED</span>
      </div>
      
      <div className="flex-1 overflow-y-auto intel-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Mag</th>
              <th>Depth</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {earthquakes.map((eq) => (
              <tr key={eq.id} className="hover:bg-[#15181e] cursor-pointer">
                <td className="text-gray-300">{eq.location}</td>
                <td>
                  <span className={cn(
                    "font-mono font-medium",
                    eq.magnitude >= 5 && "text-red-400",
                    eq.magnitude >= 4 && eq.magnitude < 5 && "text-orange-400",
                    eq.magnitude < 4 && "text-yellow-400",
                  )}>
                    {eq.magnitude.toFixed(1)}
                  </span>
                </td>
                <td className="text-gray-400 font-mono">{eq.depth}km</td>
                <td className="text-gray-500 text-xs">{format(eq.timestamp, 'HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AISummaryPanel() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  return (
    <div className="intel-panel flex flex-col">
      <div className="p-3 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>AI INTELLIGENCE SUMMARY</span>
        </div>
        <button 
          onClick={() => setIsGenerating(!isGenerating)}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
          REGENERATE
        </button>
      </div>
      
      <div className="p-3">
        <div className="ai-summary">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Current Situation Analysis</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Tensions in the Middle East have escalated significantly in the past 24 hours. 
                Military operations in Gaza Strip continue with increased intensity. 
                Hezbollah has claimed responsibility for cross-border attacks, raising concerns 
                of wider regional conflict. Iran has issued warnings of decisive response to any aggression. 
                US has deployed additional naval assets to the Mediterranean as deterrent measure.
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-orange-400">HIGH RISK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] text-gray-500">Updated 2 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsPanel() {
  const stats = [
    { label: 'Active Conflicts', value: 47, change: 3 },
    { label: 'Events (24h)', value: 1289, change: 156 },
    { label: 'Data Points', value: '2.4M', change: 12 },
    { label: 'Sources', value: 12, change: 0 },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-2 p-2 bg-[#0a0c10] border-b border-[#1e2128]">
      {stats.map((stat) => (
        <div key={stat.label} className="metric-card">
          <div className="metric-label">{stat.label}</div>
          <div className="flex items-end gap-2">
            <div className="metric-value">{stat.value}</div>
            {stat.change !== 0 && (
              <div className="metric-change mb-1 text-red-400">
                +{stat.change}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main App
function App() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['conflict']);
  const [showCommandResult, setShowCommandResult] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  
  const handleCommand = (cmd: string) => {
    setCommandQuery(cmd);
    setShowCommandResult(true);
    setTimeout(() => setShowCommandResult(false), 5000);
  };
  
  const handleFilterChange = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#0a0c10]">
      <Header onCommand={handleCommand} />
      
      {/* Command Result Toast */}
      {showCommandResult && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0f1115] border border-red-500/30 rounded-lg px-4 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="status-dot status-live" />
            <div>
              <div className="text-sm text-white">Processing query: <span className="text-red-400">/{commandQuery}</span></div>
              <div className="text-xs text-gray-400">Updating dashboard with latest intelligence...</div>
            </div>
          </div>
        </div>
      )}
      
      <StatsPanel />
      
      <div className="flex-1 grid grid-cols-[280px_1fr_380px] gap-px bg-[#1e2128] overflow-hidden">
        <Sidebar selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
        
        <main className="bg-[#0a0c10] relative">
          <WorldMap events={mockConflictEvents} selectedFilters={selectedFilters} />
        </main>
        
        <aside className="flex flex-col gap-px bg-[#1e2128]">
          <NewsPanel news={mockNews} />
          <VideoPanel videos={mockVideos} />
          <EscalationPanel metrics={mockEscalationMetrics} />
          <EarthquakePanel earthquakes={mockEarthquakes} />
          <AISummaryPanel />
        </aside>
      </div>
    </div>
  );
}

export default App;
