# Fird-Geopolitics

Real-time Geopolitical Intelligence Dashboard - A comprehensive web application for monitoring global conflicts, seismic activity, and geopolitical events in real-time.

![Dashboard Preview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200)

## Features

### 🌍 Interactive World Map
- Real-time conflict markers with severity indicators
- Filter by event type (Conflict, Earthquake, Cyber, Political)
- Custom animated markers with popup details
- Dark-themed CartoDB basemap

### 📰 Live News Feed
- Aggregated news from multiple sources (Reuters, BBC, CNN, Al Jazeera)
- Severity categorization (Critical, High, Medium, Low)
- Real-time timestamp updates
- Category filtering

### 📺 Live Video Feeds
- Multiple news channel streams
- Live viewer counts
- Quick preview thumbnails
- Play overlay on hover

### 📊 Escalation Index
- Regional conflict intensity metrics
- 24-hour trend visualization
- Historical chart data
- Trend indicators (up/down/stable)

### 🌋 Seismic Activity Monitor
- Real-time earthquake data from USGS
- Magnitude and depth information
- Geographic location tracking
- Color-coded severity levels

### 🤖 AI Intelligence Summary
- Automated situation analysis
- Risk level assessment
- Key event highlights
- Regeneratable summaries

### ⌨️ Command Interface
- Quick search with `/` commands
- Example: `/newsnow iran israel war`
- Real-time query processing feedback

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns

## API Endpoints

The application includes mock API endpoints for Vercel deployment:

| Endpoint | Description |
|----------|-------------|
| `/api/news` | Latest geopolitical news feed |
| `/api/events` | Conflict events and incidents |
| `/api/earthquakes` | Seismic activity data |
| `/api/escalation` | Escalation index metrics |
| `/api/summary` | AI-generated intelligence summary |

## Folder Structure

```
/
├── api/                    # Vercel API endpoints
│   ├── news.js
│   ├── events.js
│   ├── earthquakes.js
│   ├── escalation.js
│   └── summary.js
├── src/
│   ├── App.tsx            # Main dashboard component
│   ├── index.css          # Global styles
│   └── main.tsx           # Entry point
├── dist/                   # Build output
├── vercel.json            # Vercel configuration
└── package.json
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Deploy automatically

```bash
# Local development
npm install
npm run dev

# Build for production
npm run build
```

### Environment Variables

```env
# Optional: Add real API keys for production
VITE_GDELT_API_KEY=your_key
VITE_USGS_API_KEY=your_key
VITE_REUTERS_API_KEY=your_key
```

## Data Sources

The dashboard is designed to integrate with:

- **GDELT API** - Global news events
- **ACLED** - Armed conflict data
- **USGS** - Earthquake data
- **Reuters RSS** - News feed
- **Liveuamap** - Conflict mapping
- **ADS-B Exchange** - Aircraft tracking

## Customization

### Adding New Map Markers

Edit `createCustomIcon` function in `App.tsx`:

```typescript
const icons = {
  conflict: '⚔️',
  earthquake: '🌋',
  cyber: '💻',
  political: '🏛️',
  // Add new types here
};
```

### Modifying Color Scheme

Edit CSS variables in `index.css`:

```css
:root {
  --intel-red: 0 72% 51%;
  --intel-orange: 25 95% 53%;
  --intel-yellow: 45 100% 50%;
  --intel-green: 142 76% 36%;
  --intel-blue: 217 91% 60%;
}
```

## License

MIT License - Feel free to use and modify for your own projects.

---

Built with ❤️ for global awareness and transparency.
