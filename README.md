# GateOS Mobile

Poprawiony szkielet aplikacji Expo/React Native dla sterownika GateOS.

## Start

```bash
npm install
npx expo start
```

## Co poprawiono względem szkicu

- dodane brakujące ekrany: Login, Automation, Notifications
- poprawiona struktura startowa Expo (`index.js` + `src/App.tsx`)
- poprawiony typ `GateState.status`, który wcześniej zwracał `unknown`, ale nie był zadeklarowany
- uproszczone endpointy API pod GateOS (`/api/status`, `/api/status-lite`, `/api/control`)
- uproszczona konfiguracja do wersji, którą da się realnie rozwinąć dalej

## Uwaga

Ten projekt jest przygotowany jako poprawny szkielet. Finalny build APK/IPA wymaga pobrania zależności i uruchomienia Expo/EAS na Twoim komputerze.
