import { GeneratedLink } from '@/lib/types';
import { HIGHLIGHTED_CODES } from '@/lib/countries';
import CountryLinkCard from './CountryLinkCard';

interface CountryLinkGridProps {
  links: GeneratedLink[];
}

export default function CountryLinkGrid({ links }: CountryLinkGridProps) {
  const highlighted = links.filter((l) => HIGHLIGHTED_CODES.includes(l.country.code));
  const others = links.filter((l) => !HIGHLIGHTED_CODES.includes(l.country.code));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          安くなりやすい国
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {highlighted.map((link) => (
            <CountryLinkCard key={link.country.code} country={link.country} url={link.url} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/40 font-medium mb-2">その他の国</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {others.map((link) => (
            <CountryLinkCard key={link.country.code} country={link.country} url={link.url} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
