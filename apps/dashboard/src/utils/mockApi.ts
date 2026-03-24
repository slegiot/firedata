export type LogLevel = 'INFO' | 'WARN' | 'ERRO';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

const SOURCES = ['AUTH_NODE_07', 'gateway_node_04', 'DB_SYNC_PRIMARY', 'LOG_AGGR_DAEMON'];
const MESSAGES = [
  'Incoming connection established',
  'Authentication handshake initialized: SHA-256 validation pending',
  'Stream buffer optimized. Reclaiming 240MB idle memory.',
  'Auto-restart protocol engaged for thread ID: 0xFF021.',
  'Latency spike detected in stream node "US-EAST-01".',
  'Connection terminated: SOCKET_ERROR_0x04. Stream disconnected.',
  'Routine garbage collection complete. 4.2GB reclaimed.',
];

// In-memory logs
let mockLogs: LogEntry[] = [];
let logCounter = 1;

export const generateMockLog = (): LogEntry => {
  const levelRand = Math.random();
  const level: LogLevel = levelRand > 0.9 ? 'ERRO' : levelRand > 0.7 ? 'WARN' : 'INFO';
  return {
    id: `#0x2849F-${logCounter++}`,
    timestamp: new Date().toISOString(),
    level,
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
  };
};

// Start with some logs
for (let i = 0; i < 15; i++) {
  mockLogs.push({ ...generateMockLog(), timestamp: new Date(Date.now() - (15 - i) * 1000).toISOString() });
}

export const fetchLogs = async (): Promise<LogEntry[]> => {
  // Add 0-2 new logs on each fetch
  const newLogsCount = Math.floor(Math.random() * 3);
  for (let i = 0; i < newLogsCount; i++) {
    mockLogs.push(generateMockLog());
  }
  // Keep only the last 100
  if (mockLogs.length > 100) {
    mockLogs = mockLogs.slice(mockLogs.length - 100);
  }
  return [...mockLogs].reverse(); // newest first
};

export interface SystemMetrics {
  cpuUtilization: number;
  memoryUsedTB: number;
  memoryTotalTB: number;
  diskUsedTB: number;
  diskTotalTB: number;
  networkInboundMBs: number;
  networkOutboundMBs: number;
  activeNodes: number;
  latencyMs: number;
  throughputGBs: number;
}

export const fetchMetrics = async (): Promise<SystemMetrics> => {
  // Return random slightly fluctuating metrics
  return {
    cpuUtilization: 40 + Math.random() * 40,
    memoryUsedTB: 1.2 + Math.random() * 0.4,
    memoryTotalTB: 2.0,
    diskUsedTB: 1.4,
    diskTotalTB: 2.0,
    networkInboundMBs: 300 + Math.random() * 200,
    networkOutboundMBs: 100 + Math.random() * 50,
    activeNodes: 42,
    latencyMs: 12 + Math.random() * 5,
    throughputGBs: 8.0 + Math.random() * 1.0,
  };
};
