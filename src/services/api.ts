import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceConfig, GateDiagnostics, GateEvent, GateState, SystemMetrics } from '../types';

const STORAGE_KEY = 'deviceConfig';
const LEGACY_CAMERA_URL = '';

export const DEFAULT_DEVICE_CONFIG: DeviceConfig = {
  name: 'ChemiX Gate',
  host: '',
  port: 8080,
  token: '',
  cameraUrl: '',
  cameraUrl2: '',
  cameraUrl3: '',
};

const DEFAULT_GATE_STATE: GateState = {
  status: 'unknown',
  rawState: 'unknown',
  position: 0,
  maxDistanceM: null,
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
  private config: DeviceConfig = DEFAULT_DEVICE_CONFIG;

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
    const host = this.normalizeHost(config?.host);
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

  private normalizeHost(host?: string): string {
    if (typeof host !== 'string') return DEFAULT_DEVICE_CONFIG.host;
    return host
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/g, '') || DEFAULT_DEVICE_CONFIG.host;
  }

  private applyConfig(config: DeviceConfig): void {
    this.config = config;
    this.token = config.token;
    this.client.defaults.baseURL = `http://${config.host}:${config.port}`;
  }

  getWsUrl(): string {
    const tokenPart = this.token ? `?token=${encodeURIComponent(this.token)}` : '';
    return `ws://${this.config.host}:${this.config.port}/ws${tokenPart}`;
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
    try {
      await this.client.post('/api/control', { action: command.toLowerCase() });
    } catch (error) {
      throw new Error(this.describeAxiosError(error, 'Nie udało się wysłać komendy do bramy'));
    }
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

  async getDiagnostics(): Promise<GateDiagnostics> {
    const response = await this.client.get('/api/diagnostics');
    return this.mapDiagnostics(response.data.data ?? response.data);
  }

  async moveGateToPercent(percent: number, maxDistanceM: number | null | undefined): Promise<void> {
    const bounded = Math.max(0, Math.min(100, Math.round(percent)));
    const maxDistance = typeof maxDistanceM === 'number' && maxDistanceM > 0 ? maxDistanceM : 10;
    const position = Number(((bounded / 100) * maxDistance).toFixed(3));
    try {
      await this.client.post('/api/move', { position });
    } catch (error) {
      throw new Error(this.describeAxiosError(error, 'Nie udało się wysłać pozycji bramy'));
    }
  }

  async reboot(): Promise<void> {
    await this.client.post('/api/reboot');
  }

  async testMqtt(): Promise<boolean> {
    const response = await this.client.post('/api/mqtt/test');
    const data = response.data.data ?? response.data;
    return Boolean(data?.ok ?? data?.success ?? data?.connected ?? response.status === 200);
  }

  normalizeGateState(data: any): GateState {
    return this.mapGateState(data?.data ?? data);
  }

  private normalizePosition(data: any): number {
    const percent =
      data?.positionPercent ??
      data?.gate?.positionPercent ??
      data?.percent ??
      data?.gate?.percent;

    if (typeof percent === 'number' && Number.isFinite(percent)) {
      if (percent >= 0) return Math.max(0, Math.min(100, percent));
    }

    const positionMm = data?.positionMm ?? data?.gate?.positionMm;
    const positionM =
      typeof data?.position === 'number' ? data.position :
      typeof data?.gate?.position === 'number' ? data.gate.position :
      typeof positionMm === 'number' ? positionMm / 1000 :
      null;
    const maxDistance =
      typeof data?.maxDistance === 'number' ? data.maxDistance :
      typeof data?.gate?.maxDistance === 'number' ? data.gate.maxDistance :
      null;

    if (typeof positionM === 'number' && Number.isFinite(positionM)) {
      if (typeof maxDistance === 'number' && maxDistance > 0) {
        return Math.max(0, Math.min(100, Math.round((positionM / maxDistance) * 100)));
      }
      if (positionM >= 0 && positionM <= 100) return Math.round(positionM);
    }

    return 0;
  }

  private normalizeStatus(rawStatus: string, position: number, moving: boolean): GateState['status'] {
    const status = rawStatus.toLowerCase();
    if (['opening', 'openning', 'opening_gate'].includes(status)) return 'opening';
    if (['closing', 'closing_gate'].includes(status)) return 'closing';
    if (['error', 'fault'].includes(status)) return 'error';
    if (['open', 'opened', 'fully_open'].includes(status)) return 'open';
    if (['closed', 'close', 'fully_closed'].includes(status)) return 'closed';
    if (moving) return 'opening';
    if (['stopped', 'stop', 'idle', 'ready'].includes(status)) {
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
    const isMoving = Boolean(gate.moving ?? data.moving);

    return {
      status: this.normalizeStatus(rawState, position, isMoving),
      rawState,
      position,
      maxDistanceM:
        typeof gate.maxDistance === 'number' ? gate.maxDistance :
        typeof data.maxDistance === 'number' ? data.maxDistance :
        null,
      targetPosition:
        typeof gate.targetPosition === 'number'
          ? gate.targetPosition
          : typeof data.targetPosition === 'number'
            ? data.targetPosition
            : null,
      lastUpdate: Date.now(),
      isMoving,
      wifiConnected: Boolean(wifi.connected ?? data.wifiConnected),
      wifiSsid: String(wifi.ssid ?? data.wifiSsid ?? ''),
      wifiRssi: typeof wifi.rssi === 'number' ? wifi.rssi : typeof data.wifiRssi === 'number' ? data.wifiRssi : -100,
      wifiMode: String(wifi.mode ?? data.wifiMode ?? ''),
      ip: String(wifi.ip ?? data.ip ?? this.config.host),
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
        data.inputs?.limitOpen,
        data.io?.limitOpen,
      ),
      limitClosed: this.readBoolean(
        gate.limitClosed,
        gate.limitClose,
        gate.closedLimit,
        gate.closeLimit,
        gate.endstopClosed,
        gate.closedEndstop,
        gate.closeEndstop,
        gate.limit_closed,
        gate.endstop_closed,
        data.limitClosed,
        data.limitClose,
        data.closedLimit,
        data.closeLimit,
        data.endstopClosed,
        data.closedEndstop,
        data.closeEndstop,
        data.limit_closed,
        data.endstop_closed,
        data.inputs?.limitClose,
        data.io?.limitClose,
      ),
      distanceM:
        typeof gate.position === 'number' ? gate.position :
        typeof data.positionMm === 'number' ? data.positionMm / 1000 :
        typeof gate.distanceM === 'number' ? gate.distanceM :
        typeof data.distanceM === 'number' ? data.distanceM :
        null,
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
    const runtime = data?.runtime ?? {};
    const wifi = data?.wifi ?? {};
    const hb = data?.hb ?? {};
    const wifiRssi = typeof wifi.rssi === 'number' ? wifi.rssi : typeof data?.wifiRssi === 'number' ? data.wifiRssi : -100;
    const wifiQuality = wifiRssi > -100 ? Math.max(0, Math.min(100, 2 * (wifiRssi + 100))) : 0;
    return {
      uptime: runtime.uptimeMs ?? data?.uptimeMs ?? data?.uptime ?? 0,
      heapFree: runtime.freeHeap ?? data?.heapFree ?? 0,
      heapTotal: data?.heapTotal ?? data?.fs?.totalBytes ?? 0,
      heapFragmentation: data?.heapFragmentation ?? 0,
      rssi: wifiRssi,
      wifiQuality: data?.wifiQuality ?? wifiQuality,
      mqttConnected: data?.mqttConnected ?? data?.mqtt?.connected ?? false,
      cpuLoad: data?.cpuLoad ?? 0,
      temperature: data?.temperature ?? hb.temperature ?? 0,
      apiRequests: runtime.apiReqCount ?? data?.apiRequests ?? 0,
      apiErrors: runtime.statusErrors ?? data?.apiErrors ?? 0,
    };
  }

  private mapDiagnostics(data: any): GateDiagnostics {
    const runtime = data?.runtime ?? {};
    const hb = data?.hb ?? data?.hoverUart ?? {};
    const ota = data?.ota ?? {};
    const mqtt = data?.mqtt ?? {};
    const wifi = data?.wifi ?? {};
    return {
      uptimeMs: runtime.uptimeMs ?? data?.uptimeMs ?? 0,
      resetReason: String(runtime.resetReason ?? data?.resetReason ?? '-'),
      heapFree: runtime.freeHeap ?? data?.heapFree ?? 0,
      minFreeHeap: runtime.minFreeHeap ?? data?.minFreeHeap ?? 0,
      apiRequests: runtime.apiReqCount ?? data?.apiRequests ?? 0,
      apiErrors: runtime.statusErrors ?? data?.apiErrors ?? 0,
      telAgeMs: typeof hb.telAgeMs === 'number' ? hb.telAgeMs : null,
      hoverFault: Boolean(hb.fault),
      chargerConnected: Boolean(hb.chargerConnected),
      chargerKnown: Boolean(hb.chargerKnown),
      otaActive: Boolean(ota.active),
      otaReady: Boolean(ota.ready),
      otaProgress: typeof ota.progress === 'number' ? ota.progress : -1,
      mqttConnected: Boolean(mqtt.connected ?? data?.mqttConnected),
      wifiRssi: typeof wifi.rssi === 'number' ? wifi.rssi : -100,
      firmware: String(data?.build ?? data?.version ?? '-'),
    };
  }

  private describeAxiosError(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const payload: any = error.response?.data;
      const backendError =
        payload?.error?.message ??
        payload?.error ??
        payload?.status ??
        error.message;
      if (status === 401) return 'Brak autoryzacji. Sprawdź token API w ustawieniach.';
      if (status === 423) return 'Sterownik jest zajęty OTA i chwilowo blokuje sterowanie.';
      if (status) return `${fallback}: HTTP ${status} (${backendError})`;
      if (error.code === 'ECONNABORTED') return 'Sterownik nie odpowiedział w czasie.';
      return `${fallback}: ${error.message}`;
    }
    return fallback;
  }
}

export const api = new APIClient();
