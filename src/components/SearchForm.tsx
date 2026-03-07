'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const router = useRouter();
  const [hotel, setHotel] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hotel.trim() || !checkin || !checkout) return;
    const params = new URLSearchParams({
      hotel: hotel.trim(),
      checkin,
      checkout,
      adults: adults.toString(),
      rooms: rooms.toString(),
    });
    router.push(`/search?${params.toString()}`);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div>
        <input
          type="text"
          value={hotel}
          onChange={(e) => setHotel(e.target.value)}
          placeholder="ホテル名 または TripAdvisorのURL"
          required
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label className="block text-xs text-gray-500 mb-1">チェックイン</label>
          <input
            type="date"
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
            min={today}
            required
            className="w-full px-2 sm:px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 shadow-sm"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs text-gray-500 mb-1">チェックアウト</label>
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            min={checkin || today}
            required
            className="w-full px-2 sm:px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">大人</label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 shadow-sm"
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
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 shadow-sm"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}室</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-colors shadow-md shadow-indigo-500/20"
      >
        価格を比較する
      </button>
      <p className="text-gray-400 text-[10px] text-center">
        ホテル名を入力するだけでOTA価格比較が表示されます
      </p>
    </form>
  );
}
