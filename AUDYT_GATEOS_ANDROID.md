# Audyt GateOS Mobile / ESP32

## Co sprawdzono

- Aplikacja Android: Expo / React Native, natywny build Gradle.
- GateOS ESP32: HTTP API, autoryzacja tokenem, status, sterowanie i diagnostyka.
- Build Android: `npm.cmd run typecheck`, `android\gradlew.bat assembleRelease`.
- Build ESP32: `python -m platformio run -e esp32`.

## Naprawione w aplikacji

- Domyślny sterownik ustawiony na `http://chemixxx.duckdns.org:8080/`.
- Poprawione mapowanie odpowiedzi `/api/status-lite` i `/api/status`.
- Dodana obsługa `limitClose`, `inputs.limitClose` i `io.limitClose`.
- Pozycja bramy jest liczona z `positionPercent`, `positionMm` albo `gate.position + maxDistance`.
- Metryki są pobierane z aktualnej struktury GateOS: `runtime`, `wifi`, `mqtt`, `hb`.
- Komendy `/api/control` mają czytelne błędy dla `401` i `423 ota_active`.
- Host w ustawieniach może być wpisany jako IP, domena albo z prefiksem `http://`.
- Naprawiony lokalny path do Android SDK.

## Wyniki

- TypeScript: OK.
- APK release: OK.
- ESP32 firmware: OK.

## Plan dalszych ulepszeń

1. Dodać WebSocket `/ws`, żeby status bramy odświeżał się natychmiast, a polling był tylko fallbackiem.
2. Dodać ekran diagnostyki z `/api/diagnostics`: heap, reset reason, telAgeMs, fault, charger, OTA.
3. Dodać jawne przyciski `Otwórz`, `Stop`, `Zamknij` obok bezpiecznego przycisku hold-to-toggle.
4. Dodać sterowanie pozycją `/api/move`: suwak procent/metr z potwierdzeniem.
5. Dodać ekran kalibracji: `zero`, `max`, status homingu, blokady bezpieczeństwa.
6. Dodać wykrywanie urządzenia po `gate.local` i ręczny fallback po IP.
7. Dodać tryb serwisowy chroniony tokenem: restart, OTA, test MQTT, log ostatnich zdarzeń.
8. Uporządkować sekrety kamer: nie trzymać domyślnie hasła w kodzie aplikacji.
9. Dodać podpis release własnym keystore zamiast debug keystore.
10. Dodać testy mapowania API na przykładowych odpowiedziach GateOS.
