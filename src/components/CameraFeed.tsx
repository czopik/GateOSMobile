import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import WebView from 'react-native-webview';
import { Colors } from '../utils/colors';

// Camera: 500 ms between successful frames, 2000 ms backoff on error (set in buildHtml).

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type Props = {
  url: string;
  height?: number;
  framed?: boolean;
};

interface ParsedUrl {
  cleanUrl: string;
  baseUrl: string;
  username: string;
  password: string;
}

function parseUrl(rawUrl: string): ParsedUrl {
  try {
    const m = rawUrl.match(/^(https?:\/\/)([^:@\/]+):([^@]+)@(.+)$/);
    if (m) {
      const [, scheme, user, pass, rest] = m;
      const cleanUrl = `${scheme}${rest}`;
      const origin = cleanUrl.match(/^(https?:\/\/[^/]+)/)?.[1] ?? cleanUrl;
      return { cleanUrl, baseUrl: origin, username: user, password: pass };
    }
    const origin = rawUrl.match(/^(https?:\/\/[^/]+)/)?.[1] ?? rawUrl;
    return { cleanUrl: rawUrl, baseUrl: origin, username: '', password: '' };
  } catch {
    return { cleanUrl: rawUrl, baseUrl: rawUrl, username: '', password: '' };
  }
}

function buildHtml(cleanUrl: string, username: string, password: string): string {
  const u = JSON.stringify(cleanUrl);
  const usr = JSON.stringify(username);
  const pwd = JSON.stringify(password);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;overflow:hidden}#c{display:block;width:100vw;height:100vh;object-fit:cover;filter:brightness(.78) contrast(1.08)}</style></head><body><img id="c"><script>
var url=${u},usr=${usr},pwd=${pwd};
function refresh(){
  var xhr=new XMLHttpRequest();
  xhr.open("GET",url+"?_t="+Date.now(),true,usr,pwd);
  xhr.responseType="blob";
  xhr.timeout=5000;
  xhr.onload=function(){
    if(xhr.status===200){
      var img=document.getElementById("c");
      var prev=img.src;
      img.src=URL.createObjectURL(xhr.response);
      if(prev&&prev.startsWith("blob:"))URL.revokeObjectURL(prev);
    }
    setTimeout(refresh,500);
  };
  xhr.onerror=function(){setTimeout(refresh,2000);};
  xhr.ontimeout=function(){setTimeout(refresh,2000);};
  xhr.send();
}
refresh();
</script></body></html>`;
}

export function CameraFeed({ url, height = 240, framed = false }: Props) {
  const { width, height: screenHeight } = useWindowDimensions();
  const overlayScale = clamp(Math.min(width / 430, screenHeight / 900), 0.76, 1);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(() => Date.now());
  const webRef = useRef(null);

  const isRtsp = url.startsWith('rtsp://');
  const { cleanUrl, baseUrl, username, password } = useMemo(() => parseUrl(url), [url]);
  const html = useMemo(
    () => buildHtml(cleanUrl, username, password),
    [cleanUrl, username, password],
  );

  useEffect(() => {
    setError(false);
    setRetryKey(Date.now());
  }, [url]);

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active' && url) {
        setError(false);
        setRetryKey(Date.now());
      }
    });

    return () => appStateSub.remove();
  }, [url]);

  if (!url) {
    return (
      <View style={[styles.placeholder, framed && styles.framedContainer, { height }]}>
        <Text style={styles.placeholderText} allowFontScaling={false}>Brak URL kamery</Text>
        <Text style={styles.placeholderSub} allowFontScaling={false}>Ustaw w Ustawieniach: Kamera URL</Text>
      </View>
    );
  }

  if (isRtsp) {
    return (
      <View style={[styles.placeholder, framed && styles.framedContainer, { height }]}>
        <Text style={styles.errorText} allowFontScaling={false}>RTSP nie jest obsługiwany</Text>
        <Text style={styles.placeholderSub} allowFontScaling={false}>
          Podaj URL snapshota HTTP z kamery
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.placeholder, framed && styles.framedContainer, { height }]}>
        <Text style={styles.errorText} allowFontScaling={false}>Błąd połączenia z kamerą</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => { setError(false); setRetryKey((k: number) => k + 1); }}
        >
          <Text style={styles.retryLabel} allowFontScaling={false}>Ponów połączenie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, framed && styles.framedContainer, { height }]}>
      <WebView
        key={retryKey}
        ref={webRef}
        source={{ html, baseUrl }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        onError={() => setError(true)}
        onHttpError={() => setError(true)}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.58)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.liveBadge,
          {
            top: 18 * overlayScale,
            left: 18 * overlayScale,
            borderRadius: 16 * overlayScale,
            paddingHorizontal: 12 * overlayScale,
            paddingVertical: 7 * overlayScale,
            gap: 8 * overlayScale,
          },
        ]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.liveDot,
            { width: 11 * overlayScale, height: 11 * overlayScale, borderRadius: 5.5 * overlayScale },
          ]}
        />
        <Text
          style={[styles.liveText, { fontSize: 17 * overlayScale, lineHeight: 21 * overlayScale }]}
          allowFontScaling={false}
        >
          LIVE
        </Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          {
            top: 18 * overlayScale,
            right: 18 * overlayScale,
            borderRadius: 16 * overlayScale,
            paddingHorizontal: 12 * overlayScale,
            paddingVertical: 7 * overlayScale,
            gap: 8 * overlayScale,
          },
        ]}
        pointerEvents="none"
      >
        <MaterialCommunityIcons name="wifi" size={19 * overlayScale} color="#fff" />
        <Text
          style={[styles.badgeText, { fontSize: 16 * overlayScale, lineHeight: 20 * overlayScale }]}
          allowFontScaling={false}
        >
          61
        </Text>
      </View>

      <View
        style={[
          styles.locationBadge,
          {
            bottom: 18 * overlayScale,
            left: 18 * overlayScale,
            borderRadius: 16 * overlayScale,
            paddingHorizontal: 12 * overlayScale,
            paddingVertical: 7 * overlayScale,
            gap: 8 * overlayScale,
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={[styles.locationText, { fontSize: 15 * overlayScale, lineHeight: 19 * overlayScale }]}
          allowFontScaling={false}
          numberOfLines={1}
        >
          Zewnętrzna
        </Text>
        <View
          style={[
            styles.locationDot,
            { width: 9 * overlayScale, height: 9 * overlayScale, borderRadius: 4.5 * overlayScale },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  framedContainer: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 150, 174, 0.42)',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  liveBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 10, 14, 0.62)',
  },
  liveDot: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOpacity: 0.75,
    shadowRadius: 8,
    elevation: 6,
  },
  liveText: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0,
  },
  statusBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 10, 14, 0.62)',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
  },
  locationBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 10, 14, 0.62)',
  },
  locationText: {
    color: '#fff',
    fontWeight: '700',
  },
  locationDot: {
    backgroundColor: Colors.success,
  },
  placeholder: {
    width: '100%',
    backgroundColor: '#07131D',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  placeholderText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  placeholderSub: {
    color: Colors.grey,
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  retryLabel: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
