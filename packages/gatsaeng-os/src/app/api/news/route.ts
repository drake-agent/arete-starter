import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  // query가 있으면 검색, 없으면 한국 주요 뉴스
  const rssUrl = query
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`
    : `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`

  try {
    const res = await fetch(rssUrl, { next: { revalidate: 300 } }) // 5분 캐시
    const xml = await res.text()

    // 간단한 XML 파싱 (DOMParser 대신 regex로)
    const items: { title: string; link: string; pubDate: string; source: string }[] = []
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || []

    for (const item of itemMatches.slice(0, 10)) { // 최대 10개
      const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || ''
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || ''
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''
      const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || ''

      if (title) {
        items.push({ title, link, pubDate, source })
      }
    }

    return NextResponse.json(items)
  } catch {
    return NextResponse.json([])
  }
}
