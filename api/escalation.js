// API Endpoint: /api/escalation
// Returns escalation index metrics by region

export default function handler(req, res) {
  const metrics = [
    {
      region: 'Middle East',
      level: 87,
      trend: 'up',
      change: 12,
      factors: ['Active conflicts', 'Border tensions', 'Military deployments'],
      history: [
        { time: '00:00', value: 45 },
        { time: '04:00', value: 52 },
        { time: '08:00', value: 48 },
        { time: '12:00', value: 67 },
        { time: '16:00', value: 78 },
        { time: '20:00', value: 85 },
        { time: '24:00', value: 87 }
      ]
    },
    {
      region: 'Eastern Europe',
      level: 72,
      trend: 'stable',
      change: 0,
      factors: ['Ongoing conflict', 'Sanctions', 'Diplomatic tensions'],
      history: [
        { time: '00:00', value: 70 },
        { time: '04:00', value: 71 },
        { time: '08:00', value: 72 },
        { time: '12:00', value: 72 },
        { time: '16:00', value: 71 },
        { time: '20:00', value: 72 },
        { time: '24:00', value: 72 }
      ]
    },
    {
      region: 'East Asia',
      level: 45,
      trend: 'down',
      change: -5,
      factors: ['Trade disputes', 'Military exercises', 'Territorial claims'],
      history: [
        { time: '00:00', value: 50 },
        { time: '04:00', value: 49 },
        { time: '08:00', value: 48 },
        { time: '12:00', value: 47 },
        { time: '16:00', value: 46 },
        { time: '20:00', value: 45 },
        { time: '24:00', value: 45 }
      ]
    },
    {
      region: 'Africa',
      level: 58,
      trend: 'up',
      change: 8,
      factors: ['Civil unrest', 'Resource conflicts', 'Terrorism'],
      history: [
        { time: '00:00', value: 50 },
        { time: '04:00', value: 52 },
        { time: '08:00', value: 54 },
        { time: '12:00', value: 55 },
        { time: '16:00', value: 56 },
        { time: '20:00', value: 57 },
        { time: '24:00', value: 58 }
      ]
    },
    {
      region: 'South Asia',
      level: 62,
      trend: 'up',
      change: 3,
      factors: ['Border disputes', 'Internal conflicts', 'Water security'],
      history: [
        { time: '00:00', value: 59 },
        { time: '04:00', value: 60 },
        { time: '08:00', value: 60 },
        { time: '12:00', value: 61 },
        { time: '16:00', value: 61 },
        { time: '20:00', value: 62 },
        { time: '24:00', value: 62 }
      ]
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
    data: metrics,
    meta: {
      timestamp: new Date().toISOString(),
      algorithm: 'Fird-Geopolitics Escalation Index v2.1',
      updateInterval: '5 minutes'
    }
  });
}
