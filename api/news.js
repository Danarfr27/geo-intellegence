// API Endpoint: /api/news
// Returns latest geopolitical news feed

export default function handler(req, res) {
  const news = [
    {
      id: '1',
      title: 'Israel launches targeted strikes on Gaza militant positions',
      source: 'Reuters',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      category: 'Conflict',
      severity: 'critical',
      location: { lat: 31.5, lng: 34.8 }
    },
    {
      id: '2',
      title: 'Hezbollah claims responsibility for border attack',
      source: 'Al Jazeera',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      category: 'Conflict',
      severity: 'high',
      location: { lat: 33.8, lng: 35.5 }
    },
    {
      id: '3',
      title: 'Iran warns of decisive response to any aggression',
      source: 'BBC',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      category: 'Diplomacy',
      severity: 'high',
      location: { lat: 35.7, lng: 51.4 }
    },
    {
      id: '4',
      title: 'US deploys additional carrier group to Mediterranean',
      source: 'CNN',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      category: 'Military',
      severity: 'medium',
      location: { lat: 36.5, lng: 15.0 }
    },
    {
      id: '5',
      title: 'Russia condemns escalation in Middle East',
      source: 'RT',
      timestamp: new Date(Date.now() - 1500000).toISOString(),
      category: 'Diplomacy',
      severity: 'medium',
      location: { lat: 55.7, lng: 37.6 }
    }
  ];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    success: true,
    data: news,
    meta: {
      total: news.length,
      timestamp: new Date().toISOString(),
      source: 'Fird-Geopoltics Intelligence API'
    }
  });
}
