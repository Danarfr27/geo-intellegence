// API Endpoint: /api/events
// Returns conflict events and geopolitical incidents

export default function handler(req, res) {
  const { query, region, severity, type } = req.query;
  
  let events = [
    {
      id: '1',
      lat: 31.5,
      lng: 34.8,
      title: 'Gaza Strip Conflict',
      type: 'conflict',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      description: 'Active military operations reported',
      region: 'Middle East'
    },
    {
      id: '2',
      lat: 33.8,
      lng: 35.5,
      title: 'Lebanon Border Tensions',
      type: 'conflict',
      severity: 'high',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      description: 'Cross-border artillery exchange',
      region: 'Middle East'
    },
    {
      id: '3',
      lat: 35.7,
      lng: 51.4,
      title: 'Iran Military Activity',
      type: 'political',
      severity: 'medium',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      description: 'Increased military presence detected',
      region: 'Middle East'
    },
    {
      id: '4',
      lat: 32.9,
      lng: 13.2,
      title: 'Libya Clashes',
      type: 'conflict',
      severity: 'high',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      description: 'Militia conflict in Tripoli',
      region: 'Africa'
    },
    {
      id: '5',
      lat: 48.9,
      lng: 37.8,
      title: 'Ukraine Frontline',
      type: 'conflict',
      severity: 'critical',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      description: 'Heavy fighting reported',
      region: 'Eastern Europe'
    },
    {
      id: '6',
      lat: 15.5,
      lng: 44.2,
      title: 'Yemen Airstrikes',
      type: 'conflict',
      severity: 'high',
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      description: 'Coalition airstrikes in Sanaa',
      region: 'Middle East'
    },
    {
      id: '7',
      lat: 36.2,
      lng: 36.2,
      title: 'Syria Border Conflict',
      type: 'conflict',
      severity: 'medium',
      timestamp: new Date(Date.now() - 9000000).toISOString(),
      description: 'Turkish-Syrian border skirmishes',
      region: 'Middle East'
    },
    {
      id: '8',
      lat: 19.4,
      lng: -99.1,
      title: 'Mexico Cyber Attack',
      type: 'cyber',
      severity: 'medium',
      timestamp: new Date(Date.now() - 12600000).toISOString(),
      description: 'Government systems targeted',
      region: 'North America'
    }
  ];

  // Filter by query
  if (query) {
    const searchTerm = query.toLowerCase();
    events = events.filter(e => 
      e.title.toLowerCase().includes(searchTerm) ||
      e.description.toLowerCase().includes(searchTerm) ||
      e.region.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by region
  if (region) {
    events = events.filter(e => e.region.toLowerCase() === region.toLowerCase());
  }

  // Filter by severity
  if (severity) {
    events = events.filter(e => e.severity === severity);
  }

  // Filter by type
  if (type) {
    events = events.filter(e => e.type === type);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    success: true,
    data: events,
    meta: {
      total: events.length,
      timestamp: new Date().toISOString(),
      filters: { query, region, severity, type }
    }
  });
}
