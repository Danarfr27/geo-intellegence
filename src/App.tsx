import { useState, useEffect, useCallback } from 'react';
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
  Target,
  ExternalLink
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
  { id: '1', title: 'Israel launches targeted strikes on Gaza militant positions', source: 'Reuters', timestamp: new Date(Date.now() - 300000), category: 'Conflict', severity: 'critical', url: 'https://www.reuters.com/world/middle-east/' },
  { id: '2', title: 'Hezbollah claims responsibility for border attack', source: 'Al Jazeera', timestamp: new Date(Date.now() - 600000), category: 'Conflict', severity: 'high', url: 'https://www.aljazeera.com/news/' },
  { id: '3', title: 'Iran warns of decisive response to any aggression', source: 'BBC', timestamp: new Date(Date.now() - 900000), category: 'Diplomacy', severity: 'high', url: 'https://www.bbc.com/news/world-middle-east' },
  { id: '4', title: 'US deploys additional carrier group to Mediterranean', source: 'CNN', timestamp: new Date(Date.now() - 1200000), category: 'Military', severity: 'medium', url: 'https://edition.cnn.com/middleeast' },
  { id: '5', title: 'Russia condemns escalation in Middle East', source: 'RT', timestamp: new Date(Date.now() - 1500000), category: 'Diplomacy', severity: 'medium', url: 'https://www.rt.com/news/' },
  { id: '6', title: 'Egypt opens Rafah crossing for humanitarian aid', source: 'AP', timestamp: new Date(Date.now() - 1800000), category: 'Humanitarian', severity: 'low', url: 'https://apnews.com/hub/middle-east' },
  { id: '7', title: 'UN Security Council emergency session called', source: 'UN News', timestamp: new Date(Date.now() - 2100000), category: 'Diplomacy', severity: 'medium', url: 'https://news.un.org/en/' },
  { id: '8', title: 'Oil prices surge amid Middle East tensions', source: 'Bloomberg', timestamp: new Date(Date.now() - 2400000), category: 'Economy', severity: 'medium', url: 'https://www.bloomberg.com/middleeast' },
];

// YouTube Live News Feeds
const mockVideos: VideoFeed[] = [
  { id: '1', title: 'Al Jazeera English - Live', source: 'Al Jazeera', embedUrl: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=0&mute=1', isLive: true },
  { id: '2', title: 'Sky News - Live', source: 'Sky News', embedUrl: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=0&mute=1', isLive: true },
  { id: '3', title: 'TRT World - Live', source: 'TRT World', embedUrl: 'https://www.youtube.com/embed/8ISV-K2cWeg?autoplay=0&mute=1', isLive: true },
  { id: '4', title: 'FRANCE 24 - Live', source: 'FRANCE 24', embedUrl: 'https://www.youtube.com/embed/h3MuIUNCCzI?autoplay=0&mute=1', isLive: true },
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
        width: 28px;
        height: 28px;
        background: ${colors[severity as keyof typeof colors]};
        border-radius: 50%;
        border: 2px solid #0a0c10;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 0 12px ${colors[severity as keyof typeof colors]}80;
        animation: marker-pulse 2s ease-in-out infinite;
      ">
        ${icons[type as keyof typeof icons]}
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
          placeholder="newsnow iran israel war"
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
    { name: 'ACLED', status: 'active', latency: '62ms' },
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
  toggleSatellite
}: { 
  events: ConflictEvent[]; 
  selectedFilters: string[];
  onRefresh: () => void;
  showSatellite: boolean;
  toggleSatellite: () => void;
}) {
  const filteredEvents = selectedFilters.length > 0 
    ? events.filter(e => selectedFilters.includes(e.type))
    : events;
    
  return (
    <div className="relative h-full bg-[#0a0c10]">
      <MapContainer
        center={[25, 20]}
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
        {news.map((item) => (
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
        ))}
      </div>
    </div>
  );
}

function VideoPanel({ videos }: { videos: VideoFeed[] }) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  return (
    <div className="flex flex-col bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Video className="w-3.5 h-3.5" />
          <span>LIVE VIDEO FEEDS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">4 ACTIVE</span>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>
      
      <div className="p-2 grid grid-cols-2 gap-2">
        {videos.map((video) => (
          <div key={video.id} className="relative bg-[#0a0c10] rounded overflow-hidden group">
            <div className="aspect-video relative">
              {activeVideo === video.id ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1d24] to-[#0a0c10] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-red-500/30 transition-colors">
                        <Play className="w-4 h-4 text-red-500 ml-0.5" />
                      </div>
                      <p className="text-[9px] text-gray-500">Click to play</p>
                    </div>
                  </div>
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => setActiveVideo(video.id)}
                  />
                </>
              )}
              
              {/* Live Badge */}
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-medium text-white">LIVE</span>
              </div>
              
              {/* Source */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-[9px] text-white/90 truncate">{video.source}</div>
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
                  {metric.change > 0 && '+'}{metric.change}
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
                  strokeWidth={1}
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
            <tr className="text-left">
              <th className="py-2 px-2.5 text-gray-500 font-medium">Location</th>
              <th className="py-2 px-2.5 text-gray-500 font-medium w-12">Mag</th>
              <th className="py-2 px-2.5 text-gray-500 font-medium w-14">Depth</th>
              <th className="py-2 px-2.5 text-gray-500 font-medium w-12">Time</th>
            </tr>
          </thead>
          <tbody>
            {earthquakes.map((eq) => (
              <tr key={eq.id} className="border-t border-[#1e2128] hover:bg-[#15181e]">
                <td className="py-2 px-2.5 text-gray-300 truncate max-w-[100px]">{eq.location}</td>
                <td className="py-2 px-2.5">
                  <span className={cn(
                    "font-mono font-medium",
                    eq.magnitude >= 5 && "text-red-400",
                    eq.magnitude >= 4 && eq.magnitude < 5 && "text-orange-400",
                    eq.magnitude < 4 && "text-yellow-400",
                  )}>
                    {eq.magnitude.toFixed(1)}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-gray-500 font-mono">{eq.depth}km</td>
                <td className="py-2 px-2.5 text-gray-500">{format(eq.timestamp, 'HH:mm')}</td>
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
  
  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };
  
  return (
    <div className="flex flex-col bg-[#0f1115]">
      <div className="p-2.5 border-b border-[#1e2128] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>AI INTELLIGENCE SUMMARY</span>
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
        <div className="bg-gradient-to-br from-purple-500/8 to-blue-500/8 border border-purple-500/15 rounded p-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded bg-purple-500/15 flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-white mb-1.5">Current Situation Analysis</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Tensions in the Middle East have escalated significantly in the past 24 hours. 
                Military operations in Gaza Strip continue with increased intensity. 
                Hezbollah has claimed responsibility for cross-border attacks, raising concerns 
                of wider regional conflict.
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span className="text-[9px] text-orange-400">HIGH RISK</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[9px] text-gray-500">Updated 2 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['conflict']);
  const [showCommandResult, setShowCommandResult] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [showSatellite, setShowSatellite] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  
  const handleCommand = (cmd: string) => {
    setCommandQuery(cmd);
    setShowCommandResult(true);
    setTimeout(() => setShowCommandResult(false), 4000);
  };
  
  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);
  
  const handleRefreshMap = () => {
    setMapKey(prev => prev + 1);
  };
  
  const toggleSatellite = () => {
    setShowSatellite(prev => !prev);
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#0a0c10] overflow-hidden">
      <Header onCommand={handleCommand} />
      
      {/* Command Result Toast */}
      {showCommandResult && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0f1115] border border-red-500/30 rounded-lg px-4 py-2.5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div>
              <div className="text-sm text-white">Processing: <span className="text-red-400">/{commandQuery}</span></div>
              <div className="text-xs text-gray-500">Updating dashboard with latest intelligence...</div>
            </div>
          </div>
        </div>
      )}
      
      <StatsPanel />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
        
        {/* Main Content - Single Map */}
        <main className="flex-1 bg-[#0a0c10] relative">
          <WorldMap 
            key={mapKey}
            events={mockConflictEvents} 
            selectedFilters={selectedFilters}
            onRefresh={handleRefreshMap}
            showSatellite={showSatellite}
            toggleSatellite={toggleSatellite}
          />
        </main>
        
        {/* Right Sidebar */}
        <aside className="w-[320px] bg-[#0f1115] border-l border-[#1e2128] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-px bg-[#1e2128]">
              <NewsPanel news={mockNews} />
              <VideoPanel videos={mockVideos} />
              <EscalationPanel metrics={mockEscalationMetrics} />
              <EarthquakePanel earthquakes={mockEarthquakes} />
              <AISummaryPanel />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
