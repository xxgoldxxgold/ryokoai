import { Country } from '@/lib/types';
import { HIGHLIGHTED_CODES } from '@/lib/countries';

interface CountryLinkCardProps {
  country: Country;
  url: string;
  compact?: boolean;
}

export default function CountryLinkCard({ country, url, compact }: CountryLinkCardProps) {
  const isHighlighted = HIGHLIGHTED_CODES.includes(country.code);

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#1E293B] border border-white/5 hover:border-white/15 hover:bg-[#263548] transition-all text-sm"
      >
        <span className="text-base">{country.flag}</span>
        <span className="text-white/70">{country.nameJa}</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
        isHighlighted
          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10'
          : 'bg-[#1E293B] border-white/5 hover:border-white/15 hover:bg-[#263548]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{country.flag}</span>
        <div>
          <p className="text-white text-sm font-medium">{country.nameJa}</p>
          {country.note && (
            <p className={`text-xs mt-0.5 ${isHighlighted ? 'text-emerald-400/70' : 'text-white/30'}`}>
              {country.note}
            </p>
          )}
        </div>
      </div>
      <span className="text-xs text-white/40">開く →</span>
    </a>
  );
}
