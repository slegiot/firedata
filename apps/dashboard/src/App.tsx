import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Logs } from './pages/Logs';
import { Metrics } from './pages/Metrics';

const API_KEY = 'fd_live_YOUR_API_KEY_HERE';
const BASE_URL = 'http://localhost:3000/v1';

export const fetcher = async (url: string) => {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'X-API-Key': API_KEY }
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

const Ticker = () => {
  const { data } = useQuery({
    queryKey: ['prices'],
    queryFn: () => fetcher('/finance/prices/latest?symbol=BTC-USD,ETH-USD,AAPL,TSLA,NVDA,NFLX'),
    refetchInterval: 10000
  });

  const prices = data?.data || [];
  
  if (!prices.length) {
    return (
      <div className="ticker-wrap h-8 flex items-center shrink-0">
        <div className="ticker text-[10px] font-bold tracking-[0.2em] text-[#00ff41] uppercase flex gap-12 items-center">
          <span>AWAITING STREAM...</span>
        </div>
      </div>
    );
  }

  const items = [...prices, ...prices, ...prices, ...prices, ...prices, ...prices];

  return (
    <div className="ticker-wrap h-8 flex items-center shrink-0 border-b border-[#3b4b37]">
      <div className="ticker text-[10px] font-bold tracking-[0.2em] text-[#00ff41] uppercase flex gap-12 items-center">
        {items.map((p: any, i) => {
          const isUp = p.open_24h ? p.price >= p.open_24h : true;
          return (
            <span key={i} className={!isUp ? 'text-[#ffb4ab]' : ''}>
              {p.asset_id.split('_').pop()}: {p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} {isUp ? '↑' : '↓'}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Header = ({ currentView, setView }: { currentView: string, setView: (v: string) => void }) => (
  <header className="flex justify-between items-center w-full px-6 h-16 border-b border-[#3b4b37] bg-[#131313] fixed top-0 z-50">
    <div className="flex items-center gap-8">
      <span className="text-xl font-black text-[#f9f9f9] tracking-widest uppercase">TERMINAL_OS_v1.0</span>
      <nav className="hidden md:flex gap-6 items-center">
        <button 
          onClick={() => setView('dashboard')}
          className={`font-mono uppercase tracking-tighter text-sm transition-colors ${currentView === 'dashboard' ? 'text-[#00ff41] border-b-2 border-[#00ff41] pb-1' : 'text-[#f9f9f9]/50 hover:text-[#f9f9f9]'}`}>
          DASHBOARD
        </button>
        <button 
          onClick={() => setView('logs')}
          className={`font-mono uppercase tracking-tighter text-sm transition-colors ${currentView === 'logs' ? 'text-[#00ff41] border-b-2 border-[#00ff41] pb-1' : 'text-[#f9f9f9]/50 hover:text-[#f9f9f9]'}`}>
          LOGS
        </button>
        <button 
          onClick={() => setView('metrics')}
          className={`font-mono uppercase tracking-tighter text-sm transition-colors ${currentView === 'metrics' ? 'text-[#00ff41] border-b-2 border-[#00ff41] pb-1' : 'text-[#f9f9f9]/50 hover:text-[#f9f9f9]'}`}>
          METRICS
        </button>
      </nav>
    </div>
    <div className="flex items-center gap-4">
      <button className="material-symbols-outlined text-[#00ff41] hover:bg-[#00ff41]/10 p-2 transition-all active:scale-95 duration-75">terminal</button>
      <button className="material-symbols-outlined text-[#f9f9f9]/50 hover:text-[#f9f9f9] p-2 transition-all active:scale-95 duration-75">settings</button>
      <div className="w-8 h-8 bg-[#2a2a2a] border border-[#3b4b37] flex items-center justify-center">
        <span className="material-symbols-outlined text-xs">person</span>
      </div>
    </div>
  </header>
);

const NewsFeed = () => {
  const { data } = useQuery({
    queryKey: ['news'],
    queryFn: () => fetcher('/news?limit=10'),
    refetchInterval: 30000
  });

  const news = data?.data || [];

  return (
    <aside className="w-64 bg-[#131313] border-r border-[#3b4b37] flex flex-col custom-scrollbar overflow-y-auto style_shell_layout">
      <div className="p-4 border-b border-[#3b4b37]">
        <div className="font-mono font-bold text-[#00ff41] uppercase text-xs">STREAM_MONITOR</div>
        <div className="font-mono text-[10px] opacity-50">V2.0.4_ACTIVE</div>
      </div>
      <div className="flex-1">
        <div className="p-4 uppercase text-[10px] font-bold text-[#f9f9f9] opacity-40 tracking-widest border-b border-[#3b4b37]/30">Live News Feed</div>
        <div className="divide-y divide-[#3b4b37]/30">
          {!news.length && <div className="p-4 text-xs opacity-50 text-[#f9f9f9]">AWAITING NEWS DATA...</div>}
          {news.map((item: any) => {
            const date = new Date(item.published_at);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={item.id} className="p-4 hover:bg-[#3b4b37]/10 transition-colors cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                <div className="text-[#00ff41] text-[10px] mb-1 font-mono">[{timeStr}] {item.source}</div>
                <div className="text-[#f9f9f9] text-xs font-bold leading-tight">{item.title}</div>
              </div>
            );
          })}
        </div>
      </div>
      <button className="m-4 bg-[#f9f9f9] text-[#131313] font-bold py-2 text-xs hover:invert transition-all uppercase">
        NEW_CONNECTION
      </button>
    </aside>
  );
};

const GameRow = ({ game }: { game: any }) => {
  const { data } = useQuery({
    queryKey: ['odds', game.id],
    queryFn: () => fetcher(`/odds/games/${game.id}`),
    refetchInterval: 30000
  });

  const odds = data?.data || [];
  const homeOdds = odds.find((o: any) => o.selection.includes('home') || o.selection === '1')?.price;
  const awayOdds = odds.find((o: any) => o.selection.includes('away') || o.selection === '2')?.price;

  return (
    <tr className="hover:bg-[#00ff41]/5">
      <td className="p-3">
        <div className="font-bold text-[#f9f9f9]">{game.home_team_id}</div>
        <div className="font-bold text-[#f9f9f9]">{game.away_team_id}</div>
      </td>
      <td className="p-3">
        <div className="text-[#00ff41]">{homeOdds || 'N/A'}</div>
        <div className="text-[#e5e2e1]">{awayOdds || 'N/A'}</div>
      </td>
      <td className="p-3 text-[#e5e2e1]">- / -</td>
      <td className="p-3 text-[#e5e2e1]">- / -</td>
    </tr>
  );
};

const SportsGrid = () => {
  const { data } = useQuery({
    queryKey: ['sports_games'],
    queryFn: () => fetcher('/sports/games?limit=6'),
    refetchInterval: 60000
  });

  const games = data?.data || [];
  
  const leagues = games.reduce((acc: any, game: any) => {
    const lid = game.league_id || 'UNKNOWN';
    if (!acc[lid]) acc[lid] = [];
    acc[lid].push(game);
    return acc;
  }, {});

  return (
    <section className="flex-1 bg-[#0e0e0e] p-6 custom-scrollbar overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-4xl font-black text-[#f9f9f9] tracking-tighter uppercase">SPORTS_GRID_ACTIVE</h1>
          <p className="text-[#00ff41] font-mono text-xs mt-2 uppercase tracking-widest">LIVE_ODDS_TRANSMISSION_PROTOCOL</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#2a2a2a] px-4 py-2 border-l-2 border-[#00ff41]">
            <div className="text-[10px] text-[#f9f9f9]/50 uppercase">Active Streams</div>
            <div className="text-lg font-bold text-[#f9f9f9]">{games.length}_CHANNELS</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
        {Object.entries(leagues).map(([leagueId, sectionGames]: [string, any]) => (
          <div key={leagueId} className="bg-[#131313] border border-[#3b4b37]">
            <div className="bg-[#1a1a1a] p-3 border-b border-[#3b4b37] flex justify-between items-center">
              <span className="font-bold text-[#f9f9f9] text-sm tracking-widest uppercase">{leagueId}</span>
              <span className="text-[10px] bg-[#00ff41] text-[#131313] px-2 font-bold animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">UPCOMING</span>
            </div>
            <table className="w-full text-xs font-mono text-[#e5e2e1]">
              <thead>
                <tr className="text-left text-[#b9ccb2] border-b border-[#3b4b37]">
                  <th className="p-3 font-normal">MATCHUP</th>
                  <th className="p-3 font-normal">ML (1X2)</th>
                  <th className="p-3 font-normal">SPREAD</th>
                  <th className="p-3 font-normal">O/U</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b4b37]/50">
                {sectionGames.map((g: any) => (
                  <GameRow key={g.id} game={g} />
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {games.length === 0 && (
          <div className="text-[#f9f9f9]/50 w-full col-span-2 p-4 border border-[#3b4b37] text-center font-mono">
            AWAITING DATA...
          </div>
        )}
      </div>
      
      {/* Dashboard Visualization */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
        <div className="bg-[#1c1b1b] border border-[#3b4b37] p-4">
          <div className="text-[10px] text-[#b9ccb2] uppercase mb-2 font-mono">Network Topology</div>
          <div className="h-32 bg-[#0a0a0a] border border-[#3b4b37]/30 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-[#00ff41]/20">
              <span className="material-symbols-outlined scale-[4]">hub</span>
            </div>
            <div className="absolute bottom-2 left-2 text-[8px] text-[#00ff41]">X: 142.2 Y: 88.4</div>
            <div className="absolute inset-x-0 h-[1px] bg-[#00ff41]/30 top-1/2"></div>
          </div>
        </div>
        <div className="bg-[#1c1b1b] border border-[#3b4b37] p-4 md:col-span-2">
          <div className="text-[10px] text-[#b9ccb2] uppercase mb-2 font-mono">Global Request Distribution</div>
          <div className="h-32 bg-[#0a0a0a] border border-[#3b4b37]/30 flex items-end p-2 gap-1">
            <div className="bg-[#00ff41]/80 w-full" style={{ height: '40%' }}></div>
            <div className="bg-[#00ff41]/60 w-full" style={{ height: '60%' }}></div>
            <div className="bg-[#00ff41]/90 w-full" style={{ height: '30%' }}></div>
            <div className="bg-[#00ff41]/40 w-full" style={{ height: '85%' }}></div>
            <div className="bg-[#00ff41]/70 w-full" style={{ height: '45%' }}></div>
            <div className="bg-[#00ff41]/50 w-full" style={{ height: '70%' }}></div>
            <div className="bg-[#00ff41]/85 w-full" style={{ height: '55%' }}></div>
            <div className="bg-[#00ff41]/30 w-full" style={{ height: '90%' }}></div>
            <div className="bg-[#00ff41]/75 w-full" style={{ height: '40%' }}></div>
            <div className="bg-[#00ff41]/60 w-full" style={{ height: '65%' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardView = () => (
  <div className="flex flex-col flex-1 pt-16 h-screen w-full bg-[#131313]">
    <Ticker />
    <main className="flex flex-1 overflow-hidden">
      <NewsFeed />
      <SportsGrid />
    </main>
    <footer className="h-8 bg-[#0a0a0a] border-t border-[#3b4b37] flex justify-between items-center px-6 overflow-hidden shrink-0 z-50">
      <div className="flex items-center space-x-8 text-[#00ff41] font-mono text-[10px] uppercase font-bold tracking-widest">
        <div className="flex items-center space-x-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
          <span className="material-symbols-outlined text-[14px]">emergency</span>
          <span>SYS_HEALTH:99.9%</span>
        </div>
        <div className="flex items-center space-x-2 opacity-80">
          <span className="material-symbols-outlined text-[14px]">timer</span>
          <span>LATENCY:14MS</span>
        </div>
        <div className="flex items-center space-x-2 opacity-80">
          <span className="material-symbols-outlined text-[14px]">speed</span>
          <span>REQ_SEC:4.2K</span>
        </div>
        <div className="flex items-center space-x-2 opacity-80">
          <span className="material-symbols-outlined text-[14px]">lan</span>
          <span>GATEWAY:ONLINE</span>
        </div>
      </div>
      <div className="hidden md:block text-[9px] text-[#f9f9f9]/40 uppercase font-mono">
        EST_CONNECTION_STABLE // 0x882A_FF_01
      </div>
    </footer>
  </div>
);

function App() {
  const [currentView, setView] = useState('dashboard');

  return (
    <>
      <Header currentView={currentView} setView={setView} />
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'logs' && <Logs />}
      {currentView === 'metrics' && <Metrics />}
    </>
  )
}

export default App;
