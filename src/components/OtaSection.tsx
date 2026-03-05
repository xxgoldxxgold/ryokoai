import { GeneratedLink } from '@/lib/types';
import CountryLinkGrid from './CountryLinkGrid';

interface OtaSectionProps {
  name: string;
  color: string;
  links: GeneratedLink[];
}

export default function OtaSection({ name, color, links }: OtaSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`h-px flex-1 ${color}`} />
        <h2 className="text-white font-bold text-base">{name}</h2>
        <div className={`h-px flex-1 ${color}`} />
      </div>
      <CountryLinkGrid links={links} />
    </section>
  );
}
