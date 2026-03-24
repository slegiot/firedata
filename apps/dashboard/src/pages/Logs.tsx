

export const Logs = () => {
  return (
    <div className="flex pt-16 h-screen w-full bg-surface-container-lowest overflow-hidden">
      {/* SideNavBar */}
      <aside className="flex flex-col h-full fixed left-0 w-64 border-r border-[#3b4b37] bg-[#1a1a1a] z-40">
        <div className="p-4 border-b border-[#3b4b37]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#00ff41]">STREAMS</span>
            <span className="text-[10px] text-on-surface-variant/50">v1.2.4</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#f9f9f9]/40">ACTIVE_THREADS: 12</div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <div className="bg-[#00ff41] text-[#131313] font-bold p-3 flex items-center gap-3 cursor-pointer group">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">AUTH_STREAM</span>
          </div>
          <div className="text-[#f9f9f9]/70 p-3 border-b border-[#3b4b37]/30 flex items-center gap-3 cursor-pointer hover:bg-[outline-variant]/50 transition-none hover:translate-x-1">
            <span className="material-symbols-outlined text-sm">database</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">DB_INSTANCE_01</span>
          </div>
          <div className="text-[#f9f9f9]/70 p-3 border-b border-[#3b4b37]/30 flex items-center gap-3 cursor-pointer hover:bg-outline-variant/50 transition-none hover:translate-x-1">
            <span className="material-symbols-outlined text-sm">lan</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">NETWORK_TRAFFIC</span>
          </div>
          <div className="text-[#f9f9f9]/70 p-3 border-b border-[#3b4b37]/30 flex items-center gap-3 cursor-pointer hover:bg-outline-variant/50 transition-none hover:translate-x-1">
            <span className="material-symbols-outlined text-sm">router</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">GATEWAY_LOGS</span>
          </div>
          <div className="p-4 mt-4">
            <button className="w-full border border-[#3b4b37] py-2 px-3 text-[11px] text-[#f9f9f9] hover:bg-[#00ff41]/5 transition-all text-left flex justify-between items-center">
              NEW_FILTER
              <span className="material-symbols-outlined text-xs">add</span>
            </button>
          </div>
        </nav>
        <div className="p-4 bg-surface-container-lowest border-t border-[#3b4b37]">
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter text-[#b9ccb2]">CPU_LOAD</div>
              <div className="h-1 w-full bg-[#3b4b37]/20">
                <div className="h-full bg-[#00ff41] w-[42%]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter text-[#b9ccb2]">MEM_ALLOC</div>
              <div className="h-1 w-full bg-[#3b4b37]/20">
                <div className="h-full bg-[#00ff41] w-[78%]"></div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-[#f9f9f9]/50 hover:text-[#00ff41] cursor-pointer transition-colors group">
              <span className="material-symbols-outlined text-sm">memory</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">SYSTEM_STATUS</span>
            </div>
            <div className="flex items-center gap-2 text-[#f9f9f9]/50 hover:text-[#f9f9f9] cursor-pointer transition-colors group">
              <span className="material-symbols-outlined text-sm">help_outline</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">HELP</span>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content Canvas */}
      <main className="ml-64 flex flex-1 h-full bg-[#0e0e0e] overflow-hidden w-full">
        {/* Terminal Section */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#131313]">
          {/* Log Controls */}
          <div className="h-12 border-b border-[#3b4b37] flex items-center px-4 justify-between bg-[#131313]">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#3b4b37] px-2 bg-[#1c1b1b] focus-within:border-[#00ff41] transition-colors">
                <span className="material-symbols-outlined text-sm text-[#b9ccb2] mr-2">search</span>
                <input className="bg-transparent border-none outline-none focus:ring-0 text-[11px] font-mono text-[#e5e2e1] w-48 placeholder:text-[#b9ccb2]/30 uppercase" placeholder="FILTER_LOGS..." type="text"/>
              </div>
              <div className="h-6 w-[1px] bg-[#3b4b37]/30 mx-2"></div>
              <div className="flex gap-1">
                <button className="px-2 py-1 text-[10px] border border-[#3b4b37] hover:bg-[#3b4b37]/20 text-[#00ff41] font-bold">INFO</button>
                <button className="px-2 py-1 text-[10px] border border-[#3b4b37] hover:bg-[#3b4b37]/20 text-[#b9ccb2]/50">WARN</button>
                <button className="px-2 py-1 text-[10px] border border-[#3b4b37] hover:bg-[#3b4b37]/20 text-[#b9ccb2]/50">ERROR</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1 text-[10px] border border-[#3b4b37] hover:bg-[#3b4b37]/20 transition-all uppercase text-[#e5e2e1]">
                <span className="material-symbols-outlined text-xs">pause</span> PAUSE
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-[10px] border border-[#3b4b37] hover:bg-[#3b4b37]/20 transition-all uppercase text-[#e5e2e1]">
                <span className="material-symbols-outlined text-xs">delete_sweep</span> CLEAR
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-[10px] bg-[#f9f9f9] text-[#131313] hover:invert transition-all uppercase font-bold">
                <span className="material-symbols-outlined text-xs">download</span> EXPORT
              </button>
            </div>
          </div>
          
          {/* Log Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[12px] leading-tight selection:bg-[#00ff41] selection:text-[#131313]">
            <div className="flex gap-4 p-1 hover:bg-[#1c1b1b] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:12]</span>
              <span className="text-[#00ff41] font-bold shrink-0">INFO</span>
              <span className="text-[#e5e2e1] truncate">Incoming connection from gateway_node_04 (IP: 192.168.1.104)</span>
            </div>
            <div className="flex gap-4 p-1 hover:bg-[#1c1b1b] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:12]</span>
              <span className="text-[#00ff41] font-bold shrink-0">INFO</span>
              <span className="text-[#e5e2e1] truncate">Authentication handshake initialized: SHA-256 validation pending...</span>
            </div>
            <div className="flex gap-4 p-1 bg-[#2a2a2a] border-l-2 border-[#00ff41] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:13]</span>
              <span className="text-[#00ff41] font-bold shrink-0">INFO</span>
              <span className="text-[#f9f9f9] truncate">User "SYS_ADMIN_B" authenticated successfully via RSA_TOKEN_4.</span>
            </div>
            <div className="flex gap-4 p-1 hover:bg-[#1c1b1b] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:15]</span>
              <span className="text-[#ffcc00] font-bold shrink-0">WARN</span>
              <span className="text-[#e5e2e1] truncate">Latency spike detected in stream node "US-EAST-01". current_delay: 142ms</span>
            </div>
            <div className="flex gap-4 p-1 hover:bg-[#1c1b1b] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:18]</span>
              <span className="text-[#00ff41] font-bold shrink-0">INFO</span>
              <span className="text-[#e5e2e1] truncate">Stream buffer optimized. Reclaiming 240MB idle memory.</span>
            </div>
            <div className="flex gap-4 p-1 hover:bg-[#1c1b1b] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:22]</span>
              <span className="text-[#ffb4ab] font-bold shrink-0">ERRO</span>
              <span className="text-[#ffb4ab] truncate">Connection terminated: SOCKET_ERROR_0x04. Stream "GATEWAY_LOGS" disconnected.</span>
            </div>
            <div className="flex gap-4 p-1 hover:bg-[#1c1b1b] cursor-pointer group transition-colors">
              <span className="text-[#b9ccb2]/40 shrink-0">[14:45:23]</span>
              <span className="text-[#00ff41] font-bold shrink-0">INFO</span>
              <span className="text-[#e5e2e1] truncate">Auto-restart protocol engaged for thread ID: 0xFF021.</span>
            </div>
          </div>
          
          {/* Footer Status Bar */}
          <div className="h-8 bg-[#1c1b1b] border-t border-[#3b4b37] flex items-center px-4 justify-between text-[10px] uppercase tracking-widest text-[#b9ccb2]/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#00ff41] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></span>
                <span>LIVE_CONNECTION: ESTABLISHED</span>
              </div>
              <div className="h-4 w-[1px] bg-[#3b4b37]/30"></div>
              <span>EVENT_RATE: 2.4/S</span>
            </div>
            <div className="flex items-center gap-4">
              <span>REGION: US-EAST-1</span>
              <span>ENC: AES-256-GCM</span>
            </div>
          </div>
        </section>
        
        {/* Detailed Log Panel (Right) */}
        <aside className="w-96 border-l border-[#3b4b37] bg-[#1a1a1a] flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-[#3b4b37] bg-[#131313]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-headline font-bold text-sm tracking-widest uppercase text-[#f9f9f9]">Entry Details</h2>
              <button className="material-symbols-outlined text-sm hover:text-white text-[#e5e2e1]">close</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[#0e0e0e] p-2 border border-[#3b4b37]/30">
                <div className="text-[9px] text-[#b9ccb2] uppercase">Log_ID</div>
                <div className="text-[11px] text-[#00ff41]">#0x2849F-2</div>
              </div>
              <div className="bg-[#0e0e0e] p-2 border border-[#3b4b37]/30">
                <div className="text-[9px] text-[#b9ccb2] uppercase">Priority</div>
                <div className="text-[11px] text-[#00ff41]">NORMAL</div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="text-[10px] text-[#b9ccb2] uppercase mb-2 font-bold tracking-widest">Metadata</div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] border-b border-[#3b4b37]/10 py-1 text-[#e5e2e1]">
                  <span className="text-[#b9ccb2]/50">TIMESTAMP:</span>
                  <span>2023-10-27T14:45:13.442Z</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-[#3b4b37]/10 py-1 text-[#e5e2e1]">
                  <span className="text-[#b9ccb2]/50">SOURCE:</span>
                  <span>AUTH_NODE_07</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-[#3b4b37]/10 py-1 text-[#e5e2e1]">
                  <span className="text-[#b9ccb2]/50">LEVEL:</span>
                  <span className="text-[#00ff41]">INFO</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-[#3b4b37]/10 py-1 text-[#e5e2e1]">
                  <span className="text-[#b9ccb2]/50">PROTOCOL:</span>
                  <span>HTTP/2.0</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] text-[#b9ccb2] uppercase font-bold tracking-widest">RAW_JSON_PAYLOAD</div>
                <span className="material-symbols-outlined text-xs cursor-pointer hover:text-[#00ff41] text-[#b9ccb2]">content_copy</span>
              </div>
              <div className="bg-[#0e0e0e] p-3 font-mono text-[10px] text-[#e5e2e1] leading-relaxed border border-[#3b4b37]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#000000]/20 to-transparent pointer-events-none"></div>
                <pre className="text-[#00ff41]/80">
{`{
  "event": "AUTH_SUCCESS",
  "actor": {
    "id": "USR-9921",
    "role": "SYS_ADMIN",
    "perm_mask": "0xFFFF"
  },
  "context": {
    "request_id": "REQ-002-88",
    "latency_ms": 12,
    "geo": "US-WEST"
  },
  "security": {
    "method": "RSA_TOKEN_4",
    "verified": true,
    "integrity_hash": "a4f2e9..."
  }
}`}
                </pre>
              </div>
            </div>
            <div className="p-4 border border-[#3b4b37]/30 bg-[#1c1b1b]">
              <div className="text-[10px] text-[#b9ccb2] uppercase mb-2 font-bold tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[10px]">info</span> Quick_Action
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="text-[9px] border border-[#3b4b37] p-2 hover:bg-[#00ff41]/10 text-[#f9f9f9] uppercase text-center">Trace Request</button>
                <button className="text-[9px] border border-[#3b4b37] p-2 hover:bg-[#00ff41]/10 text-[#f9f9f9] uppercase text-center">Block Actor</button>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
