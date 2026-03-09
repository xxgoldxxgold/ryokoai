'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

interface Suggestion {
  name: string;
  hotel_key: string;
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface FormProps {
  initialHotel?: string;
  initialCheckin?: string;
  initialCheckout?: string;
  initialAdults?: number;
  initialRooms?: number;
}

export default function SearchForm({ initialHotel, initialCheckin, initialCheckout, initialAdults, initialRooms }: FormProps = {}) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [hotel, setHotel] = useState(initialHotel || '');
  const [checkin, setCheckin] = useState(initialCheckin || '');
  const [checkout, setCheckout] = useState(initialCheckout || '');
  const [adults, setAdults] = useState(initialAdults || 2);
  const [rooms, setRooms] = useState(initialRooms || 1);
  const [today, setToday] = useState('');

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(!!initialHotel);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setToday(toLocalDate(now));
    if (!initialCheckin) setCheckin(toLocalDate(now));
    if (!initialCheckout) setCheckout(toLocalDate(tomorrow));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        () => { /* ignore */ }
      );
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function fetchSuggestions(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const loc = locationRef.current;
        const geoParam = loc ? `&lat=${loc.lat}&lng=${loc.lng}` : '';
        const res = await fetch(`https://vpn.ryokoai.com/suggest.php?q=${encodeURIComponent(query)}${geoParam}`);
        if (res.ok) {
          const data: Suggestion[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }, 150);
  }

  function handleInputChange(value: string) {
    const prev = hotel;
    setHotel(value);
    if (skipFetchRef.current) {
      // Only clear skip flag if user actually changed the text
      if (value !== prev) {
        skipFetchRef.current = false;
        fetchSuggestions(value);
      }
      return;
    }
    fetchSuggestions(value);
  }

  const selectedKeyRef = useRef<string | null>(null);
  const initialHotelRef = useRef(initialHotel || '');

  function selectSuggestion(s: Suggestion) {
    skipFetchRef.current = true;
    setHotel(s.name);
    selectedKeyRef.current = s.hotel_key;
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hotel.trim() || !checkin || !checkout) return;
    setShowSuggestions(false);

    // If hotel name unchanged from initial, just re-search with same name (no suggestion needed)
    const hotelUnchanged = initialHotelRef.current && hotel.trim() === initialHotelRef.current;

    // If no key selected but suggestions exist, use the first (most relevant) one
    if (!selectedKeyRef.current && suggestions.length > 0 && !hotelUnchanged) {
      selectedKeyRef.current = suggestions[0].hotel_key;
    }

    const params = new URLSearchParams({
      hotel: selectedKeyRef.current || hotel.trim(),
      checkin,
      checkout,
      adults: adults.toString(),
      rooms: rooms.toString(),
    });
    if (selectedKeyRef.current) {
      params.set('name', hotel.trim());
    }
    router.push(`/search?${params.toString()}`);
    selectedKeyRef.current = null;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          value={hotel}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0 && !skipFetchRef.current) setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          placeholder="ホテル名"
          required
          autoComplete="off"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-600 shadow-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li
                key={s.hotel_key}
                onMouseDown={() => selectSuggestion(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-4 py-3 cursor-pointer text-sm text-gray-800 transition-colors ${
                  i === activeIndex ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'
                } ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{s.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-xs text-gray-500 mb-1">チェックイン</label>
          <input
            type="date"
            value={checkin}
            onChange={(e) => {
              const val = e.target.value;
              setCheckin(val);
              if (val) {
                const [y, m, d] = val.split('-').map(Number);
                const next = new Date(y, m - 1, d + 1);
                setCheckout(toLocalDate(next));
              }
            }}
            min={today || undefined}
            required
            className="w-full px-1 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-600 shadow-sm"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs text-gray-500 mb-1">チェックアウト</label>
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            min={checkin || today || undefined}
            required
            className="w-full px-1 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-600 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">大人</label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-600 shadow-sm"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}名</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">部屋数</label>
          <select
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-600 shadow-sm"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}室</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-md shadow-blue-700/20"
      >
        価格を比較する
      </button>
      {!isLoggedIn && (
        <div className="mt-2">
          <Link href="/login" className="block bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-800 font-bold text-sm">ログインして更に激安価格をゲット！！</p>
                <p className="text-amber-600 text-xs mt-0.5">マジで安くなる。これを知らない人が意外に多い。</p>
              </div>
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      )}
    </form>
  );
}
