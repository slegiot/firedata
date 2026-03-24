

export const Metrics = () => {
  return (
    <div className="flex pt-16 h-screen w-full bg-[#131313] overflow-hidden">
      {/* SideNavBar */}
      <aside className="h-[calc(100vh-64px)] w-64 border-r border-[#3b4b37] bg-[#131313] z-40 hidden md:flex flex-col">
        <div className="p-6 border-b border-[#3b4b37] bg-[#1a1a1a]">
          <div className="text-[#f9f9f9] font-black font-mono tracking-tight">TERMINAL_ROOT</div>
          <div className="text-[#00ff41] text-[10px] font-mono opacity-80 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
            0x00A4_ACTIVE
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1">
            <button className="flex w-full items-center gap-3 bg-[#3b4b37]/20 text-[#00ff41] border-l-4 border-[#00ff41] py-3 px-4 font-mono text-xs font-bold tracking-tight translate-x-1 duration-100">
              <span className="material-symbols-outlined text-sm">analytics</span> CORE_METRICS
            </button>
            <button className="flex w-full items-center gap-3 text-[#f9f9f9]/50 py-3 px-4 font-mono text-xs font-bold tracking-tight hover:bg-[#00ff41]/10 hover:text-[#00ff41]">
              <span className="material-symbols-outlined text-sm">lan</span> NETWORK_TRAFFIC
            </button>
            <button className="flex w-full items-center gap-3 text-[#f9f9f9]/50 py-3 px-4 font-mono text-xs font-bold tracking-tight hover:bg-[#00ff41]/10 hover:text-[#00ff41]">
              <span className="material-symbols-outlined text-sm">timer</span> LATENCY_LOGS
            </button>
            <button className="flex w-full items-center gap-3 text-[#f9f9f9]/50 py-3 px-4 font-mono text-xs font-bold tracking-tight hover:bg-[#00ff41]/10 hover:text-[#00ff41]">
              <span className="material-symbols-outlined text-sm">memory</span> NODE_HEALTH
            </button>
            <button className="flex w-full items-center gap-3 text-[#f9f9f9]/50 py-3 px-4 font-mono text-xs font-bold tracking-tight hover:bg-[#00ff41]/10 hover:text-[#00ff41]">
              <span className="material-symbols-outlined text-sm">shield</span> SECURITY_AUDIT
            </button>
            <button className="flex w-full items-center gap-3 text-[#f9f9f9]/50 py-3 px-4 font-mono text-xs font-bold tracking-tight hover:bg-[#00ff41]/10 hover:text-[#00ff41]">
              <span className="material-symbols-outlined text-sm">settings</span> SYSTEM_CONFIG
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-[#3b4b37] space-y-2">
          <button className="w-full bg-[#f9f9f9] text-[#131313] py-2 font-mono text-xs font-black uppercase tracking-widest active:scale-95 transition-transform">
            EXECUTE_NEW_STREAM
          </button>
          <div className="flex justify-between pt-2">
            <button className="text-[#f9f9f9]/40 text-[10px] flex items-center gap-1 hover:text-[#00ff41]">
              <span className="material-symbols-outlined text-xs">description</span> DOCS
            </button>
            <button className="text-[#f9f9f9]/40 text-[10px] flex items-center gap-1 hover:text-[#ffb4ab]">
              <span className="material-symbols-outlined text-xs">logout</span> LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 h-screen overflow-y-auto relative" style={{ backgroundImage: 'linear-gradient(#3b4b37 1px, transparent 1px), linear-gradient(90deg, #3b4b37 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundColor: '#131313' }}>
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-[#00ff41] pl-6 py-2">
            <div>
              <h1 className="text-4xl md:text-6xl font-black font-headline text-[#f9f9f9] tracking-tighter uppercase leading-none">CORE_METRICS</h1>
              <div className="flex items-center gap-4 mt-2 font-mono text-[10px] text-[#00ff41]/80">
                <span>SYS_ID: 0xFD-8892-KINETIC</span>
                <span className="text-[#84967e]">|</span>
                <span>UPTIME: 124:14:02:55</span>
                <span className="text-[#84967e]">|</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></span> STATUS: NOMINAL</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-[#2a2a2a] p-4 border border-[#3b4b37] flex flex-col items-end min-w-[120px]">
                <span className="text-[10px] text-[#84967e] uppercase font-mono">LATENCY_MS</span>
                <span className="text-2xl font-black text-[#00ff41] font-mono">14.02</span>
              </div>
              <div className="bg-[#2a2a2a] p-4 border border-[#3b4b37] flex flex-col items-end min-w-[120px]">
                <span className="text-[10px] text-[#84967e] uppercase font-mono">THROUGHPUT</span>
                <span className="text-2xl font-black text-[#f9f9f9] font-mono">8.4 GB/s</span>
              </div>
            </div>
          </header>

          {/* Real-time Performance Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CPU Chart */}
            <div className="lg:col-span-8 bg-[#201f1f] border border-[#3b4b37] p-1">
              <div className="bg-[#131313] p-6 h-[400px] relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[#f9f9f9] flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[#00ff41] text-lg">monitoring</span> 
                      CPU_UTILIZATION_REALTIME
                    </h3>
                    <p className="text-[10px] text-[#84967e] font-mono">SAMPLING_INTERVAL: 100ms</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-[#00ff41]">64.8%</span>
                  </div>
                </div>
                <div className="flex-1 w-full relative border-l border-b border-[#3b4b37]">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                    <path d="M0,250 L100,220 L200,240 L300,180 L400,210 L500,150 L600,190 L700,120 L800,140 L900,80 L1000,100 V300 H0 Z" fill="rgba(0, 255, 65, 0.05)" stroke="#00ff41" strokeWidth="2"></path>
                    <line stroke="#3b4b37" strokeDasharray="4" x1="0" x2="1000" y1="200" y2="200"></line>
                    <line stroke="#3b4b37" strokeDasharray="4" x1="0" x2="1000" y1="100" y2="100"></line>
                  </svg>
                  <div className="absolute inset-0 flex justify-between pointer-events-none p-2">
                    <div className="h-full flex flex-col justify-between text-[8px] font-mono text-[#84967e]">
                      <span>100%</span>
                      <span>50%</span>
                      <span>0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Gauges */}
            <div className="lg:col-span-4 space-y-6">
              {/* Disk Usage */}
              <div className="bg-[#201f1f] border border-[#3b4b37] p-6 flex flex-col h-[188px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono text-xs font-bold text-[#f9f9f9] uppercase">STORAGE_VOLUME_01</h3>
                  <span className="text-[10px] text-[#00ff41] font-mono">SSD_EXT_4</span>
                </div>
                <div className="flex-1 flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path className="stroke-[#2a2a2a]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4"></path>
                      <path className="stroke-[#00ff41]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="75, 100" strokeWidth="4"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-[#e5e2e1]">75%</div>
                  </div>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between gap-4"><span className="text-[#84967e] uppercase">USED:</span> <span className="text-[#f9f9f9]">1.4 TB</span></div>
                    <div className="flex justify-between gap-4"><span className="text-[#84967e] uppercase">FREE:</span> <span className="text-[#f9f9f9]">0.6 TB</span></div>
                    <div className="flex justify-between gap-4"><span className="text-[#84967e] uppercase">TEMP:</span> <span className="text-[#00ff41]">34°C</span></div>
                  </div>
                </div>
              </div>

              {/* Network Monitor */}
              <div className="bg-[#201f1f] border border-[#3b4b37] p-6 flex flex-col h-[188px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono text-xs font-bold text-[#f9f9f9] uppercase">NETWORK_LOAD</h3>
                  <span className="text-[10px] text-[#ffb4ab] font-mono flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">warning</span> HIGH_TRAFFIC
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#84967e] uppercase">INBOUND</span>
                      <span className="text-[#00ff41]">442 MB/s</span>
                    </div>
                    <div className="h-1 bg-[#2a2a2a] w-full">
                      <div className="h-full bg-[#00ff41]" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#84967e] uppercase">OUTBOUND</span>
                      <span className="text-[#f9f9f9]">128 MB/s</span>
                    </div>
                    <div className="h-1 bg-[#2a2a2a] w-full">
                      <div className="h-full bg-[#f9f9f9]" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* High Density Data Grid */}
          <section className="bg-[#201f1f] border border-[#3b4b37] overflow-hidden">
            <div className="bg-[#1a1a1a] px-6 py-3 border-b border-[#3b4b37] flex justify-between items-center">
              <h3 className="font-mono text-xs font-black text-[#f9f9f9] uppercase tracking-[0.2em]">ACTIVE_PROCESS_NODES</h3>
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-mono text-[#84967e]">FILTER: <span className="text-[#00ff41]">ALL_NODES</span></div>
                <div className="text-[10px] font-mono text-[#84967e]">NODES_ONLINE: <span className="text-[#00ff41]">42/42</span></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1c1b1b] font-mono text-[10px] text-[#84967e] border-b border-[#3b4b37]">
                    <th className="p-4 font-bold uppercase tracking-widest">PID_UUID</th>
                    <th className="p-4 font-bold uppercase tracking-widest">PROCESS_NAME</th>
                    <th className="p-4 font-bold uppercase tracking-widest">STATUS</th>
                    <th className="p-4 font-bold uppercase tracking-widest">MEM_RESERVATION</th>
                    <th className="p-4 font-bold uppercase tracking-widest">CPU_THREAD</th>
                    <th className="p-4 font-bold uppercase tracking-widest text-right">LATENCY</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-[#3b4b37]/20 text-[#e5e2e1]">
                  <tr className="hover:bg-[#00ff41]/5 group cursor-pointer transition-colors">
                    <td className="p-4 text-[#84967e] group-hover:text-[#00ff41]">0xFD-71A2</td>
                    <td className="p-4 text-[#f9f9f9] font-bold">CORE_ENNGINE_ALPHA</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-[#00ff41]/10 text-[#00ff41] text-[10px] font-bold">RUNNING</span>
                    </td>
                    <td className="p-4 text-[#84967e]">512 MB</td>
                    <td className="p-4 text-[#84967e]">0.4%</td>
                    <td className="p-4 text-right text-[#00ff41] font-bold">1.2ms</td>
                  </tr>
                  <tr className="bg-[#1c1b1b]/30 hover:bg-[#00ff41]/5 group cursor-pointer transition-colors">
                    <td className="p-4 text-[#84967e] group-hover:text-[#00ff41]">0xFD-92B1</td>
                    <td className="p-4 text-[#f9f9f9] font-bold">AUTH_GATEWAY_V2</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-[#00ff41]/10 text-[#00ff41] text-[10px] font-bold">RUNNING</span>
                    </td>
                    <td className="p-4 text-[#84967e]">1024 MB</td>
                    <td className="p-4 text-[#84967e]">1.2%</td>
                    <td className="p-4 text-right text-[#00ff41] font-bold">4.8ms</td>
                  </tr>
                  <tr className="hover:bg-[#00ff41]/5 group cursor-pointer transition-colors">
                    <td className="p-4 text-[#84967e] group-hover:text-[#00ff41]">0xFD-33X9</td>
                    <td className="p-4 text-[#f9f9f9] font-bold">DB_SYNC_PRIMARY</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-[#3b4b37]/20 text-[#84967e] text-[10px] font-bold">IDLE</span>
                    </td>
                    <td className="p-4 text-[#84967e]">256 MB</td>
                    <td className="p-4 text-[#84967e]">0.1%</td>
                    <td className="p-4 text-right text-[#f9f9f9] font-bold">0.4ms</td>
                  </tr>
                  <tr className="bg-[#1c1b1b]/30 hover:bg-[#00ff41]/5 group cursor-pointer transition-colors">
                    <td className="p-4 text-[#84967e] group-hover:text-[#00ff41]">0xFD-44K2</td>
                    <td className="p-4 text-[#f9f9f9] font-bold">ASSET_LOADER_S3</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold">STALLED</span>
                    </td>
                    <td className="p-4 text-[#84967e]">2048 MB</td>
                    <td className="p-4 text-[#84967e]">14.2%</td>
                    <td className="p-4 text-right text-[#ffb4ab] font-bold">892ms</td>
                  </tr>
                  <tr className="hover:bg-[#00ff41]/5 group cursor-pointer transition-colors">
                    <td className="p-4 text-[#84967e] group-hover:text-[#00ff41]">0xFD-12M8</td>
                    <td className="p-4 text-[#f9f9f9] font-bold">LOG_AGGR_DAEMON</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-[#00ff41]/10 text-[#00ff41] text-[10px] font-bold">RUNNING</span>
                    </td>
                    <td className="p-4 text-[#84967e]">128 MB</td>
                    <td className="p-4 text-[#84967e]">3.1%</td>
                    <td className="p-4 text-right text-[#00ff41] font-bold">2.1ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-[#0e0e0e] p-4 flex justify-between border-t border-[#3b4b37]">
              <div className="text-[10px] text-[#84967e] font-mono">SHOWING 5 OF 42 NODES</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-[#2a2a2a] border border-[#3b4b37] text-[10px] text-[#f9f9f9] hover:bg-[#f9f9f9] hover:text-[#131313] transition-colors">PREV</button>
                <button className="px-3 py-1 bg-[#2a2a2a] border border-[#3b4b37] text-[10px] text-[#f9f9f9] hover:bg-[#f9f9f9] hover:text-[#131313] transition-colors">NEXT</button>
              </div>
            </div>
          </section>

          {/* System Logs Overlay */}
          <section className="bg-[#0e0e0e] border border-[#3b4b37] border-t-4 border-t-[#00ff41] p-4 font-mono text-[10px] mb-8">
            <div className="flex items-center gap-2 text-[#00ff41] mb-2">
              <span className="material-symbols-outlined text-sm">terminal</span>
              <span className="font-bold uppercase">Live System Logs</span>
            </div>
            <div className="space-y-1 h-32 overflow-hidden opacity-80 text-[#e5e2e1]">
              <div className="flex gap-4"><span className="text-[#84967e]">[14:22:01]</span> <span className="text-[#f9f9f9]">INFO: Node 0xFD-71A2 successfully re-balanced memory load.</span></div>
              <div className="flex gap-4"><span className="text-[#84967e]">[14:22:03]</span> <span className="text-[#f9f9f9]">WARN: Inbound traffic spike detected on port 443. Scaling gateway...</span></div>
              <div className="flex gap-4"><span className="text-[#84967e]">[14:22:05]</span> <span className="text-[#ffb4ab]">CRIT: Connection timeout on ASSET_LOADER_S3. Retrying [1/3]...</span></div>
              <div className="flex gap-4"><span className="text-[#84967e]">[14:22:08]</span> <span className="text-[#f9f9f9]">AUTH: User root login from 192.168.1.104 confirmed.</span></div>
              <div className="flex gap-4"><span className="text-[#84967e]">[14:22:12]</span> <span className="text-[#00ff41]">SYS: Routine garbage collection complete. 4.2GB reclaimed.</span></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
