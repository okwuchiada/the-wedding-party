const LEGACY_USER_AGENT =
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.7 Safari/534.34";

export async function loadGoogleFont(font: string, weight: number, italic = false) {
  const api = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:ital,wght@${italic ? 1 : 0},${weight}`;
  const css = await (await fetch(api, { headers: { "User-Agent": LEGACY_USER_AGENT } })).text();

  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) {
    throw new Error(`Could not load font: ${font}`);
  }

  const res = await fetch(match[1]);
  return res.arrayBuffer();
}
