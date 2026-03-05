import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://ryokoai.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://ryokoai.com/chat', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];
}
