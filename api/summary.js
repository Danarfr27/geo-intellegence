// API Endpoint: /api/summary
// Returns AI-generated intelligence summary

export default function handler(req, res) {
  const { region, topic } = req.query;
  
  const summaries = {
    default: {
      title: 'Global Situation Analysis',
      content: `Tensions in the Middle East have escalated significantly in the past 24 hours. 
        Military operations in Gaza Strip continue with increased intensity. 
        Hezbollah has claimed responsibility for cross-border attacks, raising concerns 
        of wider regional conflict. Iran has issued warnings of decisive response to any aggression. 
        US has deployed additional naval assets to the Mediterranean as deterrent measure.`,
      riskLevel: 'HIGH',
      keyEvents: 12,
      sourcesAnalyzed: 47,
      confidence: 87
    },
    'middle-east': {
      title: 'Middle East Crisis Analysis',
      content: `The situation in Gaza remains highly volatile with ongoing military operations. 
        Cross-border tensions between Lebanon and Israel have intensified following 
        Hezbollah's claimed attacks. Iran's rhetoric has become more confrontational, 
        raising concerns of direct involvement. Regional actors are mobilizing diplomatic 
        efforts to prevent wider escalation.`,
      riskLevel: 'CRITICAL',
      keyEvents: 8,
      sourcesAnalyzed: 32,
      confidence: 92
    },
    'ukraine': {
      title: 'Ukraine Conflict Update',
      content: `Frontline activity continues with concentrated engagements in eastern sectors. 
        International support remains strong with new aid packages announced. 
        Winter conditions are affecting operational tempo. Diplomatic channels 
        remain open but progress on negotiations is limited.`,
      riskLevel: 'HIGH',
      keyEvents: 15,
      sourcesAnalyzed: 28,
      confidence: 85
    }
  };

  const summary = region && summaries[region as keyof typeof summaries] 
    ? summaries[region as keyof typeof summaries] 
    : summaries.default;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    success: true,
    data: summary,
    meta: {
      timestamp: new Date().toISOString(),
      model: 'Fird-Geopolitics AI v3.2',
      processingTime: '1.2s',
      query: { region, topic }
    }
  });
}
