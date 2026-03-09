import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href || '';
  const destinations = await getCollection('destinations');
  const withVideo = destinations.filter(d => d.data.heroVideo);

  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${withVideo.map(d => `  <url>
    <loc>${siteUrl}destinations/${d.slug}/</loc>
    <video:video>
      <video:thumbnail_loc>${siteUrl}${d.data.heroImage ? d.data.heroImage.replace(/^\//, '') : 'og-default.jpg'}</video:thumbnail_loc>
      <video:title>${escapeXml(d.data.title)} Travel Guide</video:title>
      <video:description>${escapeXml(d.data.description || `Explore ${d.data.title}`)}</video:description>
      <video:content_loc>${siteUrl}${d.data.heroVideo.replace(/^\//, '')}</video:content_loc>
    </video:video>
  </url>`).join('
')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
