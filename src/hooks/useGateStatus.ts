import { useContext, useMemo } from 'react';
import { GateContext } from '../context/GateContext';

const STATUS_LABELS: Record<string, string> = {
  open: 'OTWARTA',
  opening: 'OTWIERANIE',
  closed: 'ZAMKNIĘTA',
  closing: 'ZAMYKANIE',
  stopped: 'STOP',
  error: 'BŁĄD',
  unknown: 'BRAK DANYCH',
};

export function useGateStatus() {
  const gate = useContext(GateContext);

  return useMemo(() => {
    const gateState = gate.gateState;
    const position = Math.max(0, Math.min(100, gateState?.position ?? 0));
    const status = gateState?.status ?? 'unknown';
    const label = STATUS_LABELS[status] ?? 'BRAK DANYCH';
    // isOnline: true when we successfully received any state and there's no REST error.
    // wifiConnected reflects ESP32's own WiFi – it is NOT a reliable indicator of
    // whether the app can currently reach the controller.
    const isOnline = gateState !== null && !gate.error;

    // Derive limit switch states from API or position
    const limitOpen = gateState?.limitOpen ?? (status === 'open' || position >= 98);
    const limitClosed = gateState?.limitClosed ?? (status === 'closed' || position <= 2);

    let actionLabel = 'OTWÓRZ BRAMĘ';
    if (status === 'open') {
      actionLabel = 'ZAMKNIJ BRAMĘ';
    } else if (status === 'opening' || status === 'closing') {
      actionLabel = 'STOP / TOGGLE';
    }

    return {
      ...gate,
      position,
      status,
      statusLabel: label,
      actionLabel,
      refresh: gate.refreshState,
      isOnline,
      limitOpen,
      limitClosed,
    };
  }, [gate]);
}
