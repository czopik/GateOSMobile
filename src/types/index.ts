export type GateStatus = 'open' | 'closed' | 'opening' | 'closing' | 'stopped' | 'error' | 'unknown';

export interface GateEvent {
  ts: number;
  level: 'info' | 'warn' | 'error' | string;
  message: string;
}

export interface GateState {
  status: GateStatus;
  rawState: string;
  position: number;
  targetPosition: number | null;
  lastUpdate: number;
  isMoving: boolean;
  wifiConnected: boolean;
  wifiSsid: string;
  wifiRssi: number;
  wifiMode: string;
  ip: string;
  mqttConnected: boolean;
  batteryVoltage: number | null;
  currentAmp: number | null;
  rpm: number | null;
  errorCode: number;
  stopReason: number | null;
  limitOpen: boolean | null;
  limitClosed: boolean | null;
  distanceM: number | null;
  pulses: number | null;
}

export interface DeviceConfig {
  host: string;
  port: number;
  token: string;
  name: string;
  cameraUrl: string;
  cameraUrl2: string;
  cameraUrl3: string;
}

export interface SystemMetrics {
  uptime: number;
  heapFree: number;
  heapTotal: number;
  heapFragmentation: number;
  rssi: number;
  wifiQuality: number;
  mqttConnected: boolean;
  cpuLoad: number;
  temperature: number;
  apiRequests: number;
  apiErrors: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  code?: number;
}
