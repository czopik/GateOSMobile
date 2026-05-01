# GateOS Mobile

GateOS Mobile to aplikacja mobilna na Androida zbudowana w Expo/React Native do zdalnej obsługi sterownika bramy przesuwnej GateOS opartego o ESP32.

Aplikacja służy do codziennego sterowania bramą, podglądu kamery, sprawdzania stanu sterownika oraz wykonywania podstawowych czynności serwisowych bez wchodzenia w panel WWW urządzenia.

## Do czego służy aplikacja

- podgląd stanu bramy: zamknięta, otwarta, w ruchu, zatrzymana albo błąd,
- szybkie sterowanie bramą jednym przyciskiem typu przytrzymaj,
- podgląd obrazu z kamery przy bramie,
- obsługa kilku kamer w osobnym ekranie Kamery,
- połączenie ze sterownikiem GateOS przez API HTTP,
- natychmiastowe odświeżanie stanu przez WebSocket `/ws`,
- polling jako fallback, gdy WebSocket nie jest dostępny,
- odczyt diagnostyki i danych z ESP32/GateOS,
- narzędzia serwisowe chronione tokenem API.

## Główne ekrany

### Dashboard

Dashboard jest głównym ekranem aplikacji. Pokazuje kartę kamery, najważniejsze informacje o bramie i duży okrągły przycisk sterowania.

Przycisk sterowania działa przez przytrzymanie. Krótkie dotknięcie nie wyśle komendy. Po przytrzymaniu przez około 0,5 sekundy aplikacja wysyła polecenie `TOGGLE`, telefon wibruje, a przycisk dostaje aktywną kolorową obwódkę.

Takie działanie zmniejsza ryzyko przypadkowego otwarcia albo zamknięcia bramy.

### Kamery

Ekran Kamery pokazuje zapisane adresy kamer. Aplikacja najlepiej działa z adresem HTTP snapshot, np. z kamer Hikvision:

```text
http://uzytkownik:haslo@adres-kamery/ISAPI/Streaming/channels/2/picture
```

Adresy kamer ustawia się w ekranie Ustawienia. Można zapisać do trzech adresów.

Uwaga: klasyczny `rtsp://` nie jest bezpośrednio odtwarzany przez WebView w React Native. Najstabilniejsze opcje to HTTP snapshot, MJPEG/HTTP albo osobny odtwarzacz RTSP po stronie Androida.

### Ustawienia

W ustawieniach podaje się dane połączenia ze sterownikiem:

- host albo domenę GateOS,
- port API,
- token API,
- adresy kamer.

Po zapisaniu aplikacja zapamiętuje konfigurację lokalnie na telefonie.

## Połączenie z GateOS

Sterownik GateOS powinien udostępniać API HTTP oraz WebSocket. Aplikacja korzysta z tych endpointów:

- `GET /api/status-lite` - szybki status bramy,
- `GET /api/status` - pełniejszy status i zdarzenia,
- `POST /api/control` - sterowanie bramą,
- `POST /api/move` - jazda do pozycji,
- `GET /api/diagnostics` - diagnostyka ESP32 i sterownika,
- `POST /api/reboot` - restart urządzenia,
- `POST /api/mqtt/test` - test MQTT,
- `WS /ws` - odświeżanie statusu w czasie rzeczywistym.

Domyślny adres API w aplikacji jest ustawiany w `src/services/api.ts`. W telefonie można go zmienić z poziomu Ustawień.

## Jak używać

1. Zainstaluj aplikację na telefonie z Androidem.
2. Otwórz Ustawienia.
3. Wpisz host lub domenę sterownika GateOS.
4. Wpisz port API, najczęściej `8080`.
5. Wpisz token API, jeśli sterownik go wymaga.
6. Dodaj adres kamery HTTP snapshot.
7. Naciśnij `Zapisz i połącz`.
8. Wróć na Dashboard i steruj bramą dużym okrągłym przyciskiem.

## Tryb serwisowy

W Ustawieniach znajdują się narzędzia serwisowe:

- restart sterownika,
- przejście do aktualizacji OTA,
- test MQTT,
- podgląd ostatnich zdarzeń z aplikacji/API/WebSocket.

Do funkcji serwisowych wymagany jest token API. Nie należy używać trybu serwisowego, gdy ktoś korzysta z bramy albo gdy nie widać obszaru przejazdu.

## Bezpieczeństwo

Brama przesuwna jest urządzeniem mechanicznym, które może być niebezpieczne. Aplikacja nie zastępuje zabezpieczeń sprzętowych.

Przed używaniem zdalnego sterowania upewnij się, że:

- fotokomórki i krańcówki działają poprawnie,
- sterownik zatrzymuje ruch przy błędzie,
- obszar pracy bramy jest widoczny albo zabezpieczony,
- token API nie jest publicznie udostępniony,
- hasła do kamer nie są wpisywane w publicznych plikach repozytorium.

## Uruchomienie projektu lokalnie

Wymagania:

- Node.js,
- npm,
- Android SDK,
- JDK 17,
- Expo/React Native.

Instalacja zależności:

```bash
npm install
```

Start aplikacji w trybie developerskim:

```bash
npm run start
```

Uruchomienie na Androidzie:

```bash
npm run android
```

Sprawdzenie TypeScript:

```bash
npm run typecheck
```

Budowa APK release:

```bash
cd android
./gradlew :app:assembleRelease
```

Na Windowsie:

```powershell
cd android
.\gradlew.bat :app:assembleRelease
```

Gotowy APK znajduje się w:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Struktura projektu

```text
src/
  components/       Komponenty UI, w tym podgląd kamery
  context/          Kontekst autoryzacji i stanu bramy
  hooks/            Hooki do statusu GateOS
  navigation/       Dolna nawigacja aplikacji
  screens/          Ekrany Dashboard, Kamery, Ustawienia
  services/         Klient API GateOS
  types/            Typy TypeScript
  utils/            Kolory i pomocnicze stałe
```

## Aktualny status

Aplikacja jest dostosowana do projektu GateOS i sterownika ESP32:

- obsługuje API GateOS,
- ma WebSocket do odświeżania statusu,
- ma ekran kamer,
- ma uproszczony Dashboard pod telefon,
- ma ustawienia hosta, portu, tokenu i kamer,
- ma podstawowe narzędzia serwisowe.

Dalsze możliwe ulepszenia:

- natywne odtwarzanie RTSP w aplikacji,
- podpis release własnym keystore,
- osobny ekran pełnej diagnostyki,
- historia zdarzeń zapisywana lokalnie,
- powiadomienia push o błędach bramy.
