import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '../services/api';
import { GateEvent, GateState, SystemMetrics } from '../types';

type GateContextType = {
  gateState: GateState | null;
  metrics: SystemMetrics | null;
  events: GateEvent[];
  isLoading: boolean;
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
  const [error, setError] = useState(null as string | null);
  // Sequence counters – discard responses that arrived out of order.
  const liteSeqRef = useRef(0);
  const fullSeqRef = useRef(0);

  const refreshLite = useCallback(async () => {
    const seq = ++liteSeqRef.current;
    try {
      const next = await api.getGateState();
      if (seq !== liteSeqRef.current) return; // stale response — discard
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
      if (seq !== fullSeqRef.current) return; // stale response — discard
      // Merge: preserve fields not returned by the full endpoint when null.
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
      // Brief pause: ESP32 processes commands asynchronously (motor startup,
      // sensor settling). Querying immediately would return the pre-command state.
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
    const liteId = setInterval(refreshLite, 700);
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

  const value = useMemo(
    () => ({
      gateState,
      metrics,
      events,
      isLoading,
      error,
      refreshState,
      toggleGate: () => runCommand('TOGGLE'),
      openGate: () => runCommand('OPEN'),
      closeGate: () => runCommand('CLOSE'),
      stopGate: () => runCommand('STOP'),
    }),
    [error, events, gateState, isLoading, metrics, refreshState, runCommand]
  );

  return <GateContext.Provider value={value}>{children}</GateContext.Provider>;
}
