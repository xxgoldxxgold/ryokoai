import { Country } from './types';

export const COUNTRIES: Country[] = [
  // Southeast Asia
  { code: 'TH', name: 'Thailand', nameJa: 'タイ', flag: '🇹🇭', region: 'Southeast Asia', currency: 'THB', note: '東南アジア割引' },
  { code: 'VN', name: 'Vietnam', nameJa: 'ベトナム', flag: '🇻🇳', region: 'Southeast Asia', currency: 'VND', note: '東南アジア割引' },
  { code: 'ID', name: 'Indonesia', nameJa: 'インドネシア', flag: '🇮🇩', region: 'Southeast Asia', currency: 'IDR', note: '東南アジア割引' },
  { code: 'MY', name: 'Malaysia', nameJa: 'マレーシア', flag: '🇲🇾', region: 'Southeast Asia', currency: 'MYR' },
  { code: 'PH', name: 'Philippines', nameJa: 'フィリピン', flag: '🇵🇭', region: 'Southeast Asia', currency: 'PHP' },

  // South Asia
  { code: 'IN', name: 'India', nameJa: 'インド', flag: '🇮🇳', region: 'South Asia', currency: 'INR', note: '最安値になりやすい' },

  // East Asia
  { code: 'JP', name: 'Japan', nameJa: '日本', flag: '🇯🇵', region: 'East Asia', currency: 'JPY', note: 'ベースライン' },
  { code: 'KR', name: 'South Korea', nameJa: '韓国', flag: '🇰🇷', region: 'East Asia', currency: 'KRW' },
  { code: 'CN', name: 'China', nameJa: '中国', flag: '🇨🇳', region: 'East Asia', currency: 'CNY' },
  { code: 'TW', name: 'Taiwan', nameJa: '台湾', flag: '🇹🇼', region: 'East Asia', currency: 'TWD' },
  { code: 'HK', name: 'Hong Kong', nameJa: '香港', flag: '🇭🇰', region: 'East Asia', currency: 'HKD' },

  // North America
  { code: 'US', name: 'United States', nameJa: 'アメリカ', flag: '🇺🇸', region: 'North America', currency: 'USD' },

  // Europe
  { code: 'GB', name: 'United Kingdom', nameJa: 'イギリス', flag: '🇬🇧', region: 'Europe', currency: 'GBP' },
  { code: 'DE', name: 'Germany', nameJa: 'ドイツ', flag: '🇩🇪', region: 'Europe', currency: 'EUR' },

  // South America
  { code: 'BR', name: 'Brazil', nameJa: 'ブラジル', flag: '🇧🇷', region: 'South America', currency: 'BRL', note: '通貨安割引の可能性' },
  { code: 'AR', name: 'Argentina', nameJa: 'アルゼンチン', flag: '🇦🇷', region: 'South America', currency: 'ARS', note: '通貨安割引の可能性' },

  // Middle East
  { code: 'TR', name: 'Turkey', nameJa: 'トルコ', flag: '🇹🇷', region: 'Middle East', currency: 'TRY', note: '通貨安割引の可能性' },

  // Africa
  { code: 'EG', name: 'Egypt', nameJa: 'エジプト', flag: '🇪🇬', region: 'Africa', currency: 'EGP', note: '通貨安割引の可能性' },
];

export const HIGHLIGHTED_CODES = ['IN', 'TH', 'VN', 'BR', 'AR', 'TR'];
