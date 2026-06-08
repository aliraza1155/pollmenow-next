// app/api/sitemap/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const revalidate = 3600; // ISR: regenerate every hour

export async function GET() {
  const baseUrl = 'https://www.pollmenow.com';
  const staticPages = ['', '/explore', '/search', '/upgrade', '/blog', '/contact', '/privacy', '/terms', '/faq', '/affiliates'];
  
  let pollUrls: string[] = [];
  try {
    const pollsQuery = query(collection(db, 'polls'), where('visibility', '==', 'public'));
    const snapshot = await getDocs(pollsQuery);
    pollUrls = snapshot.docs.map(doc => `/poll/${doc.id}`);
  } catch (err) {
    console.error('Sitemap: failed to fetch polls', err);
    // still return static pages even if Firestore fails
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  [...staticPages, ...pollUrls].forEach(url => {
    xml += `  <url>\n    <loc>${baseUrl}${url === '' ? '' : url}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n  </url>\n`;
  });
  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}