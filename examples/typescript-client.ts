const API_KEY = 'fd_live_YOUR_API_KEY_HERE';
const BASE_URL = 'http://localhost:3000/v1';

async function fetchApi(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, String(params[key]));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'X-API-Key': API_KEY,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  try {
    // 1. Fetch latest price for an asset (e.g. Apple)
    console.log('\n=== Latest AAPL Price ===');
    const priceData = await fetchApi('/finance/prices/latest', { symbol: 'AAPL' });
    console.log(JSON.stringify(priceData, null, 2));

    // 2. Fetch latest news for 'finance'
    console.log('\n=== Latest Finance News ===');
    const newsData = await fetchApi('/news', { category: 'finance', limit: 3 });
    console.log(JSON.stringify(newsData, null, 2));

    // 3. List upcoming soccer games
    console.log('\n=== Upcoming Soccer Games ===');
    // For specific league like EPL
    const gamesData = await fetchApi('/sports/games', { status: 'upcoming', limit: 5 });
    console.log(JSON.stringify(gamesData, null, 2));

    // 4. Get odds for a specific game
    const games = gamesData.data || [];
    if (games.length > 0) {
      const gameId = games[0].id;
      console.log(`\n=== Odds for Game ${gameId} ===`);
      const oddsData = await fetchApi(`/odds/games/${gameId}`, { market: '1x2' });
      console.log(JSON.stringify(oddsData, null, 2));
    } else {
      console.log('No upcoming games found to check odds for.');
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
}

main();
