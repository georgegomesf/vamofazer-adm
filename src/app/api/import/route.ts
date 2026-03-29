import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Extracts a YouTube video ID from a URL.
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function decodeHTMLEntities(text: string): string {
  if (!text) return "";
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&quot;": '"',
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };

  let decoded = text.replace(/&[a-z]+;/gi, match => entities[match.toLowerCase()] || match);
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  
  return decoded;
}

/**
 * Fetches a public web page and extracts Open Graph / meta tags via simple regex.
 * This works for Instagram posts (public), general sites, etc.
 */
async function scrapeMetaTags(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RedeFilosoficaBot/1.0; +https://redefilosofica.com.br)",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
  const html = await res.text();

  const getMeta = (name: string): string => {
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*?)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+(?:name|property)=["']${name}["']`, "i"),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) return decodeHTMLEntities(m[1].trim());
    }
    return "";
  };

  const title =
    getMeta("og:title") ||
    getMeta("twitter:title") ||
    decodeHTMLEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "") ||
    "";

  const description = decodeHTMLEntities(
    getMeta("og:description") ||
    getMeta("twitter:description") ||
    getMeta("description") ||
    ""
  );

function cleanImageUrl(url: string): string {
  if (!url) return "";
  // Cannot modify Facebook/Instagram CDN URLs because they are signed with hashes (&oh=, &oe=).
  // Any modification to crop parameters breaks the URL signature, resulting in 403 Forbidden.
  return url;
}

  const image = cleanImageUrl(decodeHTMLEntities(
    getMeta("og:image") ||
    getMeta("og:image:secure_url") ||
    getMeta("twitter:image") ||
    ""
  ));

  const siteName = decodeHTMLEntities(getMeta("og:site_name") || "");
  const videoUrl = getMeta("og:video") || getMeta("og:video:url") || "";

  // Extract author(s) - OJS often uses multiple citation_author tags
  const authorPatterns = [
    /<meta[^>]+name=["']citation_author["'][^>]+content=["']([^"']*?)["']/gi,
    /<meta[^>]+name=["']author["'][^>]+content=["']([^"']*?)["']/gi,
  ];
  
  const authors: string[] = [];
  for (const p of authorPatterns) {
    let match;
    while ((match = p.exec(html)) !== null) {
      if (match[1]) authors.push(decodeHTMLEntities(match[1].trim()));
    }
    if (authors.length > 0) break;
  }
  
  const author = authors.join(", ");

  // Extract date
  const publishedAt = 
    getMeta("citation_date") || 
    getMeta("article:published_time") || 
    getMeta("published_at") || 
    "";

  return { title, description, image, siteName, videoUrl, url, author, publishedAt };
}

/**
 * Fetches YouTube video data via the Data API v3.
 * Falls back to scraping if the API key is missing.
 */
async function fetchYouTubeData(videoId: string, originalUrl: string) {
  if (YOUTUBE_API_KEY) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      const item = data.items?.[0];
      if (item) {
        const snippet = item.snippet;
        return {
          source: "youtube_api",
          title: snippet.title,
          description: snippet.description,
          image: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
          publishedAt: snippet.publishedAt,
          channelTitle: snippet.channelTitle,
          tags: snippet.tags || [],
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          url: originalUrl,
        };
      }
    }
  }

  // Fallback: scrape the YouTube page for OG tags
  const meta = await scrapeMetaTags(`https://www.youtube.com/watch?v=${videoId}`);
  return {
    source: "youtube_scrape",
    title: meta.title,
    description: meta.description,
    image: meta.image || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: null,
    channelTitle: meta.siteName,
    tags: [],
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    url: originalUrl,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL é obrigatória." }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // --- YouTube ---
    const youtubeId = extractYouTubeId(cleanUrl);
    if (youtubeId) {
      const data = await fetchYouTubeData(youtubeId, cleanUrl);
      return NextResponse.json({ type: "youtube", data });
    }

    // --- Instagram (and all other URLs) ---
    // Instagram blocks most scrapers; we do a best-effort OG extraction.
    const isInstagram = cleanUrl.includes("instagram.com");
    const meta = await scrapeMetaTags(cleanUrl);
    return NextResponse.json({
      type: isInstagram ? "instagram" : "webpage",
      data: { source: "metatags", ...meta },
    });
  } catch (err: any) {
    console.error("ImportAPI error:", err);
    return NextResponse.json({ error: err.message || "Erro ao importar dados." }, { status: 500 });
  }
}
