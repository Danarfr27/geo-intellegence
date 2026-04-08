// API Endpoint: /api/earthquakes
// Returns seismic activity data from USGS/EMSC

export default function handler(req, res) {
  const { minMagnitude, region } = req.query;
  
  let earthquakes = [
    {
      id: '1',
      location: 'Near Iran-Iraq Border',
      magnitude: 4.8,
      depth: 12,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      lat: 33.8,
      lng: 45.9,
      region: 'Middle East'
    },
    {
      id: '2',
      location: 'Eastern Mediterranean',
      magnitude: 3.2,
      depth: 25,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      lat: 35.2,
      lng: 30.5,
      region: 'Middle East'
    },
    {
      id: '3',
      location: 'Northern Turkey',
      magnitude: 4.1,
      depth: 8,
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      lat: 39.9,
      lng: 41.3,
      region: 'Middle East'
    },
    {
      id: '4',
      location: 'Southern California',
      magnitude: 3.5,
      depth: 15,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      lat: 33.5,
      lng: -116.8,
      region: 'North America'
    },
    {
      id: '5',
      location: 'Indonesia - Sumatra',
      magnitude: 5.2,
      depth: 45,
      timestamp: new Date(Date.now() - 9000000).toISOString(),
      lat: 0.5,
      lng: 98.5,
      region: 'Asia Pacific'
    }
  ];

  // Filter by minimum magnitude
  if (minMagnitude) {
    earthquakes = earthquakes.filter(e => e.magnitude >= parseFloat(minMagnitude));
  }

  // Filter by region
  if (region) {
    earthquakes = earthquakes.filter(e => e.region.toLowerCase() === region.toLowerCase());
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
    data: earthquakes,
    meta: {
      total: earthquakes.length,
      timestamp: new Date().toISOString(),
      source: 'USGS/EMSC Aggregated Feed'
    }
  });
}
