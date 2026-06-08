import type { CampusMood } from '../types';

// ====== 天气类型 ======
export type WeatherCondition =
  | 'clear' | 'mostly_clear' | 'partly_cloudy' | 'overcast'
  | 'fog' | 'drizzle' | 'rain' | 'rain_shower' | 'thunderstorm' | 'snow';

export interface WeatherData {
  temperature: number;       // Celsius
  humidity: number;          // percentage 0-100
  weatherCode: number;       // raw WMO code
  windSpeed: number;         // km/h
  isDay: boolean;
  condition: WeatherCondition;
  emoji: string;
  label: string;             // Chinese
  fetchedAt: number;         // epoch ms
}

// ====== WMO Weather Code Mapping ======
interface WeatherMeta {
  condition: WeatherCondition;
  emoji: string;
  label: string;
  moodEffect: Partial<CampusMood>;
}

const WMO_MAP: Record<number, WeatherMeta> = {
  // Clear
  0:  { condition: 'clear',        emoji: '☀️', label: '晴',     moodEffect: { warmth: 3, energy: 2 } },
  // Mostly clear
  1:  { condition: 'mostly_clear', emoji: '🌤️', label: '大部晴', moodEffect: { warmth: 2, energy: 1 } },
  // Partly cloudy
  2:  { condition: 'partly_cloudy',emoji: '⛅', label: '多云',   moodEffect: { academic: 1, slack: 1 } },
  // Overcast
  3:  { condition: 'overcast',     emoji: '☁️', label: '阴',     moodEffect: { loneliness: 2, academic: 2, energy: -1, warmth: -1 } },
  // Fog
  45: { condition: 'fog',          emoji: '🌫️', label: '雾',     moodEffect: { loneliness: 3, romance: 2, energy: -2 } },
  48: { condition: 'fog',          emoji: '🌫️', label: '雾凇',   moodEffect: { loneliness: 3, romance: 2, energy: -2 } },
  // Drizzle
  51: { condition: 'drizzle',      emoji: '🌦️', label: '轻毛毛雨', moodEffect: { loneliness: 1, academic: 1, warmth: -1 } },
  53: { condition: 'drizzle',      emoji: '🌦️', label: '毛毛雨', moodEffect: { loneliness: 2, academic: 2, warmth: -2 } },
  55: { condition: 'drizzle',      emoji: '🌧️', label: '大毛毛雨', moodEffect: { loneliness: 2, academic: 3, energy: -1 } },
  // Rain
  61: { condition: 'rain',         emoji: '🌧️', label: '小雨',   moodEffect: { loneliness: 3, academic: 2, warmth: -3, energy: -1 } },
  63: { condition: 'rain',         emoji: '🌧️', label: '中雨',   moodEffect: { loneliness: 4, academic: 3, warmth: -4, energy: -2 } },
  65: { condition: 'rain',         emoji: '🌧️', label: '大雨',   moodEffect: { loneliness: 5, academic: 4, warmth: -5, energy: -3 } },
  // Rain showers
  80: { condition: 'rain_shower',  emoji: '🌦️', label: '阵雨',   moodEffect: { loneliness: 2, warmth: -2, energy: -1 } },
  81: { condition: 'rain_shower',  emoji: '🌧️', label: '中阵雨', moodEffect: { loneliness: 3, warmth: -3, energy: -2 } },
  82: { condition: 'rain_shower',  emoji: '🌧️', label: '大阵雨', moodEffect: { loneliness: 4, warmth: -4, energy: -3 } },
  // Thunderstorm
  95: { condition: 'thunderstorm', emoji: '⛈️', label: '雷暴',   moodEffect: { stress: 3, loneliness: 4, energy: -3, warmth: -3 } },
  96: { condition: 'thunderstorm', emoji: '⛈️', label: '强雷暴', moodEffect: { stress: 5, loneliness: 5, energy: -4, warmth: -4 } },
  99: { condition: 'thunderstorm', emoji: '⛈️', label: '强雷暴', moodEffect: { stress: 5, loneliness: 5, energy: -4, warmth: -4 } },
};

function getDefaultMeta(code: number): WeatherMeta {
  if (code <= 3) return WMO_MAP[3]; // cloud family
  if (code >= 45 && code <= 49) return WMO_MAP[45]; // fog family
  if (code >= 50 && code <= 69) return WMO_MAP[61]; // rain family
  if (code >= 70 && code <= 79) return { condition: 'snow', emoji: '❄️', label: '雪', moodEffect: { romance: 3, loneliness: 2, energy: -2 } };
  if (code >= 80 && code <= 89) return WMO_MAP[80]; // shower family
  if (code >= 90 && code <= 99) return WMO_MAP[95]; // storm family
  return WMO_MAP[3]; // fallback: overcast
}

export function mapWeatherCode(code: number): WeatherMeta {
  return WMO_MAP[code] || getDefaultMeta(code);
}

// ====== API Fetch ======
const SJTU_LAT = 31.025;
const SJTU_LON = 121.437;

export async function fetchOpenMeteoWeather(): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${SJTU_LAT}&longitude=${SJTU_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=Asia/Shanghai`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const json = await response.json();
    const current = json.current;
    if (!current) return null;

    const code = current.weather_code ?? 3;
    const meta = mapWeatherCode(code);
    const temp = Math.max(-50, Math.min(55, current.temperature_2m ?? 20));

    return {
      temperature: Math.round(temp),
      humidity: Math.max(0, Math.min(100, current.relative_humidity_2m ?? 50)),
      weatherCode: code,
      windSpeed: Math.max(0, current.wind_speed_10m ?? 0),
      isDay: current.is_day === 1,
      condition: meta.condition,
      emoji: meta.emoji,
      label: meta.label,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

// ====== 游戏效果辅助 ======

/** 每次 decayMood tick (60s) 施加的情绪偏置，系数小让天气是缓慢的偏置 */
const MOOD_TICK_FACTOR = 0.15;

export function getWeatherMoodEffect(data: WeatherData): Partial<CampusMood> {
  const meta = mapWeatherCode(data.weatherCode);
  const scaled: Partial<CampusMood> = {};
  for (const [key, val] of Object.entries(meta.moodEffect)) {
    if (val) {
      scaled[key as keyof CampusMood] = (val as number) * MOOD_TICK_FACTOR;
    }
  }
  return scaled;
}

/** 活动权重倍率 map */
export function getWeatherActivityModifiers(data: WeatherData): Record<string, number> {
  const modifiers: Record<string, number> = {};
  const code = data.weatherCode;

  // Rain (51-82) → shelter more, outdoor less
  if (code >= 51 && code <= 82) {
    modifiers.sheltering = 3.0;
    modifiers.circling = 0.3;
    modifiers.hopping = 0.5;
    modifiers.observing = 0.6;
    modifiers.dancing = 0.3;
  }

  // Thunderstorm (95-99) → almost never go out
  if (code >= 95) {
    modifiers.sheltering = 6.0;
    modifiers.circling = 0.1;
    modifiers.hopping = 0.2;
    modifiers.observing = 0.3;
    modifiers.dancing = 0.1;
    modifiers.cooing = 0.5;
    modifiers.approaching = 0.1;
  }

  // Windy → circling bonus
  if (data.windSpeed > 20) {
    modifiers.circling = (modifiers.circling || 1) * 1.8;
    modifiers.perching = (modifiers.perching || 1) + 3;
  }

  // Clear + daytime → more active
  if (code === 0 && data.isDay) {
    modifiers.observing = (modifiers.observing || 1) * 1.3;
    modifiers.hopping = (modifiers.hopping || 1) * 1.2;
    modifiers.approaching = (modifiers.approaching || 1) * 1.2;
  }

  // Overcast → thinking
  if (code === 3) {
    modifiers.thinking = (modifiers.thinking || 1) * 1.3;
  }

  // Fog → less observing
  if (code >= 45 && code <= 49) {
    modifiers.sheltering = (modifiers.sheltering || 1) * 1.5;
    modifiers.observing = (modifiers.observing || 1) * 0.7;
  }

  return modifiers;
}

/** 照片/文案天气前缀 */
export function getWeatherCaptionPrefix(data: WeatherData): string {
  if (!data.isDay && data.weatherCode === 0) return '星空下';
  const prefixes: Record<WeatherCondition, string[]> = {
    clear: ['晴天里', '阳光暖暖的', '天很蓝'],
    mostly_clear: ['云淡淡的', '阳光时隐时现'],
    partly_cloudy: ['云朵飘过', '光影斑驳的'],
    overcast: ['阴天', '云层厚厚的', '天灰灰的'],
    fog: ['雾蒙蒙的', '雾里看花'],
    drizzle: ['飘着雨丝', '雨细细的'],
    rain: ['下雨天', '雨声滴答', '湿漉漉的'],
    rain_shower: ['阵雨过后', '雨刚停'],
    thunderstorm: ['雷声滚滚', '暴雨中'],
    snow: ['下雪了', '雪花飘飘', '银白色的'],
  };
  const pool = prefixes[data.condition] || [''];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 日记天气摘要 */
export function buildWeatherSummary(data: WeatherData): string {
  const temp = Math.round(data.temperature);
  let windDesc = '';
  if (data.windSpeed < 5) windDesc = '，微风';
  else if (data.windSpeed < 20) windDesc = `，${Math.round(data.windSpeed)}km/h风`;
  else windDesc = `，大风${Math.round(data.windSpeed)}km/h`;

  const humidityNote = data.humidity > 85 ? '，空气湿湿的' : '';

  return `今天天气：${data.emoji} ${data.label}，${temp}°C${windDesc}${humidityNote}。`;
}

/** 获取天气最简显示字符串 */
export function getWeatherDisplayString(data: WeatherData): string {
  return `${data.emoji} ${data.label} ${Math.round(data.temperature)}°C`;
}
