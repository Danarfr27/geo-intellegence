# Setup Instructions

## Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Geo Intellegence/app"
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
VITE_NEWSAPI_KEY=your_newsapi_key_here
VITE_GDELT_CSV_URL=http://data.gdeltproject.org/events/last15minutes.csv
```

## Getting API Keys

### NewsAPI
1. Visit: https://newsapi.org/
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `VITE_NEWSAPI_KEY` in `.env.local`

### GDELT (No API Key Required)
- Uses public GDELT Project CSV feed
- Auto-updates every 30 seconds
- No registration needed

## Running the Application

### Development
```bash
npm run dev
```
- Opens at http://localhost:5173/
- Hot-reload enabled
- Real-time GDELT + NewsAPI data

### Production Build
```bash
npm run build
```
- Creates optimized `dist/` folder
- Ready for deployment

### Preview Build
```bash
npm run preview
```

## Features

✅ **Real-Time Global Event Mapping**
- GDELT API for live conflict events
- Auto-refresh every 30 seconds

✅ **Live News Feed**
- NewsAPI for latest headlines
- Filter by country
- Auto-refresh every 60 seconds

✅ **World Map Visualization**
- Leaflet.js map
- Event markers by severity
- Satellite view toggle

✅ **Country Selection**
- `/newsnow [COUNTRY_NAME]` command
- Auto-centers map to country
- Filters news by country

✅ **195 Countries Database**
- Pre-loaded country coordinates
- For instant geo-mapping

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`

### Self-Hosted
```bash
npm run build
# Copy dist/ folder to your server
```

## Troubleshooting

**No news appearing?**
- Check `.env.local` has valid `VITE_NEWSAPI_KEY`
- Verify API key has correct permissions

**Map not loading?**
- Check internet connection
- GDELT CSV should auto-load from public source

**Build fails?**
- Delete `node_modules` and `dist`
- Run `npm install` again
- Ensure Node.js 20.19+

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Map**: Leaflet.js
- **Styling**: Tailwind CSS
- **Data Parsing**: PapaParse
- **Build**: Vite
- **Icons**: Lucide React
- **Charts**: Recharts

## API References

- GDELT: https://www.gdeltproject.org/
- NewsAPI: https://newsapi.org/
- Leaflet: https://leafletjs.com/

---

Made with ❤️ for Geo-Intelligence
