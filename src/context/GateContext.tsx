import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '../services/api';
import { GateEvent, GateState, SystemMetrics } from '../types';

type GateContextType = {
  gateState: GateState | null;
  metrics: SystemMetrics | null;
  events: GateEvent[];
  isLoading: boolean;
  wsConnected: boolean;
  lastRealtimeAt: number | null;
  error: string | null;
  refreshState: () => Promise<void>;
  toggleGate: () => Promise<void>;
  openGate: () => Promise<void>;
  closeGate: () => Promise<void>;
  stopGate: () => Promise<void>;
};

export const GateContext = createContext({
  gateState: null,
  metrics: null,
  events: [],
  isLoading: false,
  wsConnected: false,
  lastRealtimeAt: null,
  error: null,
  refreshState: async () => {},
  toggleGate: async () => {},
  openGate: async () => {},
  closeGate: async () => {},
  stopGate: async () => {},
} as GateContextType);

export function GateProvider({ children }: { children: any }) {
  const [gateState, setGateState] = useState(null as GateState | null);
  const [metrics, setMetrics] = useState(null as SystemMetrics | null);
  const [events, setEvents] = useState([] as GateEvent[]);
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastRealtimeAt, setLastRealtimeAt] = useState(null as number | null);
  const [error, setError] = useState(null as string | null);
  const liteSeqRef = useRef(0);
  const fullSeqRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectedRef = useRef(false);

  const refreshLite = useCallback(async () => {
    const seq = ++liteSeqRef.current;
    try {
      const next = await api.getGateState();
      if (seq !== liteSeqRef.current) return;
      setGateState((current: GateState | null) => ({
        ...(current ?? next),
        ...next,
        distanceM: next.distanceM ?? current?.distanceM ?? null,
        pulses: next.pulses ?? current?.pulses ?? null,
      }));
      setError(null);
    } catch (e) {
      if (seq !== liteSeqRef.current) return;
      setError(e instanceof Error ? e.message : 'Nieznany błąd');
    }
  }, []);

  const refreshState = useCallback(async () => {
    const seq = ++fullSeqRef.current;
    try {
      const details = await api.getGateDetails();
      if (seq !== fullSeqRef.current) return;
      setGateState((current: GateState | null) => ({
        ...(current ?? details.gateState),
        ...details.gateState,
        distanceM: details.gateState.distanceM ?? current?.distanceM ?? null,
        pulses: details.gateState.pulses ?? current?.pulses ?? null,
      }));
      setMetrics(details.metrics);
      setEvents(details.events);
      setError(null);
    } catch (e) {
      if (seq !== fullSeqRef.current) return;
      setError(e instanceof Error ? e.message : 'Nieznany błąd');
    }
  }, []);

  const runCommand = useCallback(async (command: 'TOGGLE' | 'STOP' | 'OPEN' | 'CLOSE') => {
    setIsLoading(true);
    try {
      await api.sendGateCommand(command);
      await new Promise<void>(resolve => setTimeout(resolve, 350));
      await refreshState();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd sterowania');
    } finally {
      setIsLoading(false);
    }
  }, [refreshState]);

  useEffect(() => {
    const refreshNow = () => {
      void refreshLite();
      void refreshState();
    };

    refreshNow();
    const liteId = setInterval(() => {
      if (!wsConnectedRef.current) void refreshLite();
    }, 700);
    const fullId = setInterval(refreshState, 3000);
    const appStateSub = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') {
        refreshNow();
      }
    });

    return () => {
      clearInterval(liteId);
      clearInterval(fullId);
      appStateSub.remove();
    };
  }, [refreshLite, refreshState]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      try {
        wsRef.current?.close();
        const ws = new WebSocket(api.getWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          wsConnectedRef.current = true;
          setWsConnected(true);
          setError(null);
        };
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(String(event.data));
            if (msg?.type === 'status') {
              const next = api.normalizeGateState(msg.data ?? msg);
              setGateState((current: GateState | null) => ({
                ...(current ?? next),
                ...next,
                distanceM: next.distanceM ?? current?.distanceM ?? null,
                pulses: next.pulses ?? current?.pulses ?? null,
              }));
              setLastRealtimeAt(Date.now());
              setError(null);
            } else if (msg?.type === 'event') {
              const eventItem: GateEvent = {
                ts: Date.now(),
                level: typeof msg.level === 'string' ? msg.level : 'info',
                message: typeof msg.message === 'string' ? msg.message : 'Zdarzenie GateOS',
              };
              setEvents((current) => [eventItem, ...current].slice(0, 80));
            }
          } catch {
            // Ignore malformed websocket payloads from development builds.
          }
        };
        ws.onerror = () => {
          wsConnectedRef.current = false;
          setWsConnected(false);
        };
        ws.onclose = () => {
          wsConnectedRef.current = false;
          setWsConnected(false);
          if (!disposed) {
            reconnectTimer = setTimeout(connect, 2500);
          }
        };
      } catch {
        wsConnectedRef.current = false;
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 2500);
      }
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
      wsConnectedRef.current = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      gateState,
      metrics,
      events,
      isLoading,
      wsConnected,
      lastRealtimeAt,
      error,
      refreshState,
      toggleGate: () => runCommand('TOGGLE'),
      openGate: () => runCommand('OPEN'),
      closeGate: () => runCommand('CLOSE'),
      stopGate: () => runCommand('STOP'),
    }),
    [error, events, gateState, isLoading, lastRealtimeAt, metrics, refreshState, runCommand, wsConnected]
  );

  return <GateContext.Provider value={value}>{children}</GateContext.Provider>;
}
