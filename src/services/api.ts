import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceConfig, GateEvent, GateState, SystemMetrics } from '../types';

const STORAGE_KEY = 'deviceConfig';
const LEGACY_CAMERA_URL = 'http://admin:chemik!1983@chemixxx.duckdns.org:8081/ISAPI/Streaming/channels/2/picture';

export const DEFAULT_DEVICE_CONFIG: DeviceConfig = {
  name: 'ChemiX Gate',
  host: 'chemixxx.duckdns.org',
  port: 8080,
  token: '',
  cameraUrl: 'http://admin:chemik!1983@chemixxx.duckdns.org:8088/ISAPI/Streaming/channels/2/picture',
  cameraUrl2: '',
  cameraUrl3: '',
};

const DEFAULT_GATE_STATE: GateState = {
  status: 'unknown',
  rawState: 'unknown',
  position: 0,
  targetPosition: null,
  lastUpdate: 0,
  isMoving: false,
  wifiConnected: false,
  wifiSsid: '',
  wifiRssi: -100,
  wifiMode: '',
  ip: '',
  mqttConnected: false,
  batteryVoltage: null,
  currentAmp: null,
  rpm: null,
  errorCode: 0,
  stopReason: null,
  limitOpen: null,
  limitClosed: null,
  distanceM: null,
  pulses: null,
};

class APIClient {
  private client: AxiosInstance;
  private token = '';

  constructor() {
    this.client = axios.create({ timeout: 10000 });
    this.client.interceptors.request.use((config: any) => {
      if (this.token) {
        config.headers = config.headers ?? {};
        config.headers['X-API-Token'] = this.token;
        config.headers['X-Api-Key'] = this.token;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response: any) => response,
      (error: AxiosError) => Promise.reject(error)
    );
  }

  async init(): Promise<DeviceConfig> {
    const cfg = await this.loadConfig();
    this.applyConfig(cfg);
    return cfg;
  }

  private normalizeConfig(config?: Partial<DeviceConfig> | null): DeviceConfig {
    const storedCameraUrl = typeof config?.cameraUrl === 'string' && config.cameraUrl ? config.cameraUrl : '';
    const host = typeof config?.host === 'string' && config.host.trim() ? config.host.trim() : DEFAULT_DEVICE_CONFIG.host;
    const port = Number(config?.port);

    return {
      name: DEFAULT_DEVICE_CONFIG.name,
      host,
      port: Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_DEVICE_CONFIG.port,
      token: typeof config?.token === 'string' ? config.token : '',
      cameraUrl: storedCameraUrl && storedCameraUrl !== LEGACY_CAMERA_URL ? storedCameraUrl : DEFAULT_DEVICE_CONFIG.cameraUrl,
      cameraUrl2: typeof config?.cameraUrl2 === 'string' ? config.cameraUrl2 : DEFAULT_DEVICE_CONFIG.cameraUrl2,
      cameraUrl3: typeof config?.cameraUrl3 === 'string' ? config.cameraUrl3 : DEFAULT_DEVICE_CONFIG.cameraUrl3,
    };
  }

  private applyConfig(config: DeviceConfig): void {
    this.token = config.token;
    this.client.defaults.baseURL = `http://${config.host}:${config.port}`;
  }

  async loadConfig(): Promise<DeviceConfig> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<DeviceConfig>) : null;
    const config = this.normalizeConfig(stored);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
    return config;
  }

  async saveConfig(config: Partial<DeviceConfig>): Promise<DeviceConfig> {
    const normalized = this.normalizeConfig(config);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    this.applyConfig(normalized);
    return normalized;
  }

  async clearAuth(): Promise<void> {
    this.token = '';
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as Partial<DeviceConfig>) : DEFAULT_DEVICE_CONFIG;
      const cleared = this.normalizeConfig({ ...current, token: '' });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
      this.applyConfig(cleared);
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.applyConfig(DEFAULT_DEVICE_CONFIG);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/status-lite');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getGateState(): Promise<GateState> {
    const response = await this.client.get('/api/status-lite');
    return this.mapGateState(response.data);
  }

  async getGateDetails(): Promise<{ gateState: GateState; events: GateEvent[]; metrics: SystemMetrics }> {
    const response = await this.client.get('/api/status');
    const data = response.data.data ?? response.data;
    return {
      gateState: this.mapGateState(data),
      events: this.mapEvents(data?.events),
      metrics: this.mapMetrics(data),
    };
  }

  async sendGateCommand(command: 'OPEN' | 'CLOSE' | 'STOP' | 'TOGGLE'): Promise<void> {
    await this.client.post('/api/control', { action: command.toLowerCase() });
  }

  async getMetrics(): Promise<SystemMetrics> {
    try {
      const response = await this.client.get('/api/status');
      const data = response.data.data ?? response.data;
      return this.mapMetrics(data);
    } catch {
      return {
        uptime: 0,
        heapFree: 0,
        heapTotal: 0,
        heapFragmentation: 0,
        rssi: -100,
        wifiQuality: 0,
        mqttConnected: false,
        cpuLoad: 0,
        temperature: 0,
        apiRequests: 0,
        apiErrors: 0,
      };
    }
  }

  private normalizePosition(data: any): number {
    const percent =
      data?.positionPercent ??
      data?.gate?.positionPercent ??
      data?.position ??
      data?.gate?.position ??
      0;

    if (typeof percent === 'number' && Number.isFinite(percent)) {
      return Math.max(0, Math.min(100, percent));
    }

    return 0;
  }

  private normalizeStatus(rawStatus: string, position: number): GateState['status'] {
    const status = rawStatus.toLowerCase();
    if (status === 'opening') return 'opening';
    if (status === 'closing') return 'closing';
    if (status === 'error') return 'error';
    if (status === 'open') return 'open';
    if (status === 'closed') return 'closed';
    if (status === 'stopped') {
      if (position >= 98) return 'open';
      if (position <= 2) return 'closed';
      return 'stopped';
    }
    return 'unknown';
  }

  private readBoolean(...values: any[]): boolean | null {
    for (const value of values) {
      if (value == null) continue;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'active', 'aktywny', 'aktywna', 'on', 'yes'].includes(normalized)) return true;
        if (['0', 'false', 'inactive', 'nieaktywny', 'nieaktywna', 'off', 'no'].includes(normalized)) return false;
      }
    }

    return null;
  }

  private mapGateState(data: any): GateState {
    if (!data || typeof data !== 'object') {
      return { ...DEFAULT_GATE_STATE, lastUpdate: Date.now() };
    }

    const gate = data.gate ?? data;
    const wifi = data.wifi ?? {};
    const mqtt = data.mqtt ?? {};
    const hb = data.hb ?? {};
    const rawState = String(gate.state ?? data.state ?? 'unknown');
    const position = this.normalizePosition(data);

    return {
      status: this.normalizeStatus(rawState, position),
      rawState,
      position,
      targetPosition:
        typeof gate.targetPosition === 'number'
          ? gate.targetPosition
          : typeof data.targetPosition === 'number'
            ? data.targetPosition
            : null,
      lastUpdate: Date.now(),
      isMoving: Boolean(gate.moving ?? data.moving),
      wifiConnected: Boolean(wifi.connected),
      wifiSsid: String(wifi.ssid ?? ''),
      wifiRssi: typeof wifi.rssi === 'number' ? wifi.rssi : -100,
      wifiMode: String(wifi.mode ?? ''),
      ip: String(wifi.ip ?? ''),
      mqttConnected: Boolean(mqtt.connected ?? data.mqttConnected),
      batteryVoltage: typeof hb.batV === 'number' && hb.batV > 0 ? hb.batV : null,
      currentAmp: typeof hb.iA === 'number' ? hb.iA : typeof data.iA === 'number' ? data.iA : null,
      rpm: typeof hb.rpm === 'number' ? hb.rpm : typeof data.rpm === 'number' ? data.rpm : null,
      errorCode: typeof gate.errorCode === 'number' ? gate.errorCode : typeof data.errorCode === 'number' ? data.errorCode : 0,
      stopReason: typeof gate.stopReason === 'number' ? gate.stopReason : null,
      limitOpen: this.readBoolean(
        gate.limitOpen,
        gate.openLimit,
        gate.endstopOpen,
        gate.openEndstop,
        gate.limit_open,
        gate.endstop_open,
        data.limitOpen,
        data.openLimit,
        data.endstopOpen,
        data.openEndstop,
        data.limit_open,
        data.endstop_open,
      ),
      limitClosed: this.readBoolean(
        gate.limitClosed,
        gate.closedLimit,
        gate.closeLimit,
        gate.endstopClosed,
        gate.closedEndstop,
        gate.closeEndstop,
        gate.limit_closed,
        gate.endstop_closed,
        data.limitClosed,
        data.closedLimit,
        data.closeLimit,
        data.endstopClosed,
        data.closedEndstop,
        data.closeEndstop,
        data.limit_closed,
        data.endstop_closed,
      ),
      distanceM: typeof gate.distanceM === 'number' ? gate.distanceM : typeof data.distanceM === 'number' ? data.distanceM : null,
      pulses: typeof gate.pulses === 'number' ? gate.pulses : typeof data.pulses === 'number' ? data.pulses : null,
    };
  }

  private mapEvents(events: any): GateEvent[] {
    if (!Array.isArray(events)) {
      return [];
    }

    return events
      .filter((item) => item && typeof item.message === 'string')
      .map((item) => ({
        ts: typeof item.ts === 'number' ? item.ts : 0,
        level: typeof item.level === 'string' ? item.level : 'info',
        message: item.message,
      }))
      .reverse();
  }

  private mapMetrics(data: any): SystemMetrics {
    const wifiQuality = data?.wifi?.rssi ? Math.max(0, Math.min(100, 2 * (data.wifi.rssi + 100))) : 0;
    return {
      uptime: data?.uptime ?? data?.uptimeMs ?? 0,
      heapFree: data?.heapFree ?? 0,
      heapTotal: data?.heapTotal ?? data?.fs?.totalBytes ?? 0,
      heapFragmentation: data?.heapFragmentation ?? 0,
      rssi: data?.rssi ?? data?.wifi?.rssi ?? -100,
      wifiQuality: data?.wifiQuality ?? wifiQuality,
      mqttConnected: data?.mqttConnected ?? data?.mqtt?.connected ?? false,
      cpuLoad: data?.cpuLoad ?? 0,
      temperature: data?.temperature ?? 0,
      apiRequests: data?.apiRequests ?? 0,
      apiErrors: data?.apiErrors ?? 0,
    };
  }
}

export const api = new APIClient();
