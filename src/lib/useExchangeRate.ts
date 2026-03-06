'use client';

import { useEffect, useState } from 'react';

let cachedRate: { rate: number; expires: number } | null = null;

export function useUsdToJpy(): number | null {
  const [rate, setRate] = useState<number | null>(cachedRate && Date.now() < cachedRate.expires ? cachedRate.rate : null);

  useEffect(() => {
    if (cachedRate && Date.now() < cachedRate.expires) {
      setRate(cachedRate.rate);
      return;
    }
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        const jpy = data.rates?.JPY;
        if (jpy) {
          cachedRate = { rate: jpy, expires: Date.now() + 3600000 };
          setRate(jpy);
        }
      })
      .catch(() => {});
  }, []);

  return rate;
}

export function toJpy(usd: number, rate: number | null): string | null {
  if (!rate) return null;
  return `¥${Math.round(usd * rate).toLocaleString()}`;
}
