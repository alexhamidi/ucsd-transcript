import { NextResponse } from "next/server";

const KALTURA_PARTNER = "2323111";
const KALTURA_API = "https://www.kaltura.com/api_v3/service/caption_captionAsset/action/serveByEntryId";

function parseCaptionToText(body: string): string {
  const lines = body.split("\n");
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\d+$/.test(trimmed)) continue;
    if (/^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+/.test(trimmed)) continue;
    textLines.push(trimmed);
  }

  return textLines.join("\n\n");
}

function extractKalturaConfig(html: string): { entryId: string; ks: string } | null {
  const entryMatch = html.match(/['"]entry_id['"]\s*:\s*['"]([^'"]+)['"]/);
  const ksMatch = html.match(/['"]ks['"]\s*:\s*['"]([^'"]+)['"]/);
  if (entryMatch && ksMatch) {
    return { entryId: entryMatch[1], ks: ksMatch[1] };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid url" },
        { status: 400 }
      );
    }

    if (!url.includes("podcast.ucsd.edu")) {
      return NextResponse.json(
        { error: "URL must be a UCSD podcast URL" },
        { status: 400 }
      );
    }

    let path: string;
    try {
      path = new URL(url).pathname;
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }
    if (!/\/\d+$/.test(path)) {
      return NextResponse.json(
        {
          error:
            "URL must point to a specific lecture, eg 'cogs169_a00/1'",
        },
        { status: 400 }
      );
    }

    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://podcast.ucsd.edu/",
      },
    });
    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Could not load podcast page (${pageRes.status})` },
        { status: 502 }
      );
    }

    const html = await pageRes.text();
    const config = extractKalturaConfig(html);

    if (!config) {
      return NextResponse.json(
        { error: "Could not find video data. The lecture may not exist or may not be available." },
        { status: 404 }
      );
    }

    const params = new URLSearchParams({
      entryId: config.entryId,
      ks: config.ks,
      partnerId: KALTURA_PARTNER,
      format: "1",
    });

    const captionRes = await fetch(KALTURA_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!captionRes.ok) {
      const errText = await captionRes.text();
      if (errText.includes("SERVICE_DOES_NOT_EXISTS") || errText.includes("Invalid")) {
        return NextResponse.json(
          { error: "No transcript found. The video may not have captions." },
          { status: 404 }
        );
      }
      const detail = errText.includes("Kaltura") ? errText.slice(0, 150) : `HTTP ${captionRes.status}`;
      return NextResponse.json(
        { error: `Failed to fetch captions: ${detail}` },
        { status: 502 }
      );
    }

    const captionBody = await captionRes.text();
    const transcript = parseCaptionToText(captionBody);

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "Transcript is empty" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract transcript";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
