/**
 * LOCAL DEVELOPMENT SERVER
 * Access at: http://localhost:3000
 * 
 * Routes:
 *   / - Dashboard (HTML view)
 *   /api/trips - JSON API
 *   /api/stats - Statistics
 *   /api/search?q=location - Search
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Load trips data
function loadTrips() {
    const dataPath = path.join(__dirname, 'data', 'trips.json');
    if (!fs.existsSync(dataPath)) {
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
        console.error('Error loading trips:', err.message);
        return [];
    }
}

// API Routes
app.use(express.json());

/**
 * GET / - Dashboard (HTML)
 */
app.get('/', (req, res) => {
    const trips = loadTrips();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Youth Camping Scraper - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
        
        .trips-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .trip-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .trip-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .trip-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        .trip-content {
            padding: 20px;
        }
        .trip-title { font-weight: bold; font-size: 18px; color: #333; margin-bottom: 5px; }
        .trip-meta { font-size: 13px; color: #666; margin: 5px 0; }
        .trip-price { font-size: 20px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .trip-details { font-size: 12px; color: #999; }
        
        .apis {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-top: 30px;
        }
        .api-endpoint {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            font-family: monospace;
            color: #333;
            border-left: 4px solid #667eea;
        }
        
        .search-box {
            margin: 20px 0;
        }
        input {
            width: 100%;
            max-width: 400px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        button {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        button:hover { background: #764ba2; }
        
        footer {
            text-align: center;
            color: white;
            margin-top: 50px;
            padding: 20px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Youth Camping Scraper</h1>
            <p class="subtitle">Local Verification Dashboard</p>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">
                Status: <strong style="color: #28a745;">✅ Running on localhost:3000</strong>
            </p>
        </header>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${trips.length}</div>
                <div class="stat-label">Total Trips</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">₹${trips.length > 0 ? Math.round(trips.reduce((s,t) => s + t.price, 0) / trips.length).toLocaleString() : 0}</div>
                <div class="stat-label">Avg Price</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">₹${trips.length > 0 ? Math.min(...trips.map(t => t.price)).toLocaleString() : 0}</div>
                <div class="stat-label">Cheapest</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">₹${trips.length > 0 ? Math.max(...trips.map(t => t.price)).toLocaleString() : 0}</div>
                <div class="stat-label">Most Expensive</div>
            </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-bottom: 15px;">🔍 Quick Search</h3>
            <input type="text" id="search" placeholder="Search by location (e.g., Manali, Spiti)" style="width: 100%; max-width: 600px; padding: 12px;">
            <div id="searchResults" style="margin-top: 15px;"></div>
        </div>
        
        <h2 style="color: white; margin: 30px 0 20px;">📋 All Trips</h2>
        <div class="trips-grid" id="tripsGrid">
            ${trips.length === 0 ? '<div class="loading" style="grid-column: 1/-1;">No trips yet. Run: npm run scrape</div>' : trips.map(trip => `
                <div class="trip-card">
                    <div class="trip-image">${trip.images.length} Images</div>
                    <div class="trip-content">
                        <div class="trip-title">${trip.title}</div>
                        <div class="trip-meta">📍 ${trip.location}</div>
                        <div class="trip-meta">⏱️ ${trip.duration}</div>
                        <div class="trip-price">₹${trip.price.toLocaleString()}</div>
                        <div class="trip-details">
                            ${trip.itinerary.length} days • ${trip.inclusions.length} inclusions
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="apis">
            <h3 style="margin-bottom: 20px;">🔌 API Endpoints</h3>
            <p style="color: #666; margin-bottom: 15px;">These endpoints are available for integration:</p>
            
            <div class="api-endpoint">GET /api/trips<br>
            <span style="color: #999; font-size: 12px;">Returns all trips as JSON</span></div>
            
            <div class="api-endpoint">GET /api/stats<br>
            <span style="color: #999; font-size: 12px;">Returns statistics (count, avg price, etc.)</span></div>
            
            <div class="api-endpoint">GET /api/search?q=location<br>
            <span style="color: #999; font-size: 12px;">Search trips by location</span></div>
            
            <div class="api-endpoint">GET /api/trips/:id<br>
            <span style="color: #999; font-size: 12px;">Get single trip details</span></div>
        </div>
        
        <footer>
            <p>✨ Scraper is working correctly!</p>
            <p style="font-size: 12px; margin-top: 10px;">Files: data/trips.json | Ready for: MongoDB sync, Task Scheduler, Production deploy</p>
        </footer>
    </div>
    
    <script>
        // Search functionality
        document.getElementById('search').addEventListener('keyup', async function(e) {
            const query = e.target.value.toLowerCase();
            const resultsDiv = document.getElementById('searchResults');
            
            if (!query) {
                resultsDiv.innerHTML = '';
                return;
            }
            
            try {
                const response = await fetch(\`/api/search?q=\${query}\`);
                const results = await response.json();
                
                if (results.length === 0) {
                    resultsDiv.innerHTML = '<p style="color: #666; font-size: 13px;">No results found</p>';
                    return;
                }
                
                resultsDiv.innerHTML = \`<p style="color: #666; font-size: 13px;">\${results.length} result(s) found</p>\` +
                    results.map(trip => \`
                        <div style="padding: 10px; border-bottom: 1px solid #eee;">
                            <strong>\${trip.title}</strong> - \${trip.location} (₹\${trip.price.toLocaleString()})
                        </div>
                    \`).join('');
            } catch (err) {
                resultsDiv.innerHTML = '<p style="color: red;">Error searching</p>';
            }
        });
    </script>
</body>
</html>
    `;
    
    res.send(html);
});

/**
 * GET /api/trips - All trips as JSON
 */
app.get('/api/trips', (req, res) => {
    const trips = loadTrips();
    res.json(trips);
});

/**
 * GET /api/trips/:index - Single trip
 */
app.get('/api/trips/:index', (req, res) => {
    const trips = loadTrips();
    const trip = trips[parseInt(req.params.index)];
    
    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json(trip);
});

/**
 * GET /api/stats - Statistics
 */
app.get('/api/stats', (req, res) => {
    const trips = loadTrips();
    
    const stats = {
        total: trips.length,
        avgPrice: trips.length > 0 ? Math.round(trips.reduce((s, t) => s + t.price, 0) / trips.length) : 0,
        minPrice: trips.length > 0 ? Math.min(...trips.map(t => t.price)) : 0,
        maxPrice: trips.length > 0 ? Math.max(...trips.map(t => t.price)) : 0,
        locations: [...new Set(trips.map(t => t.location))],
        avgIteraryDays: trips.length > 0 ? Math.round(trips.reduce((s, t) => s + t.itinerary.length, 0) / trips.length) : 0,
        avgImages: trips.length > 0 ? Math.round(trips.reduce((s, t) => s + t.images.length, 0) / trips.length) : 0
    };
    
    res.json(stats);
});

/**
 * GET /api/search - Search trips
 */
app.get('/api/search', (req, res) => {
    const trips = loadTrips();
    const query = (req.query.q || '').toLowerCase();
    
    if (!query) {
        return res.json(trips);
    }
    
    const results = trips.filter(trip =>
        trip.title.toLowerCase().includes(query) ||
        trip.location.toLowerCase().includes(query) ||
        trip.description.toLowerCase().includes(query)
    );
    
    res.json(results);
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
    const trips = loadTrips();
    res.json({
        status: 'ok',
        tripsCount: trips.length,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    const trips = loadTrips();
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 LOCAL DEVELOPMENT SERVER              ║
║                                            ║
║   🌐 Running on: http://localhost:${PORT}     ║
║                                            ║
║   📊 Dashboard: http://localhost:${PORT}     ║
║   📡 API: http://localhost:${PORT}/api/trips   ║
║   📈 Stats: http://localhost:${PORT}/api/stats ║
║                                            ║
║   📋 Trips Available: ${trips.length}              ║
║                                            ║
║   Press Ctrl+C to stop                     ║
╚════════════════════════════════════════════╝
    `);
    
    if (trips.length === 0) {
        console.log('⚠️  No trips found. Run: npm run scrape');
    } else {
        console.log(`✅ ${trips.length} trips ready to verify!`);
    }
});
