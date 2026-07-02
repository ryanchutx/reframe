import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "landmarks architecture";
  const page = req.nextUrl.searchParams.get("page") || "1";

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    q
  )}&per_page=18&page=${page}&orientation=landscape`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Unsplash error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();

  const photos = data.results.map(
    (p: {
      id: string;
      urls: { thumb: string; regular: string };
      alt_description?: string;
      description?: string;
      user: { name: string };
    }) => ({
      id: p.id,
      thumb: p.urls.thumb,
      regular: p.urls.regular,
      alt: p.alt_description || p.description || "Architectural landmark",
      credit: p.user.name,
    })
  );

  return NextResponse.json({ photos, total: data.total });
}
