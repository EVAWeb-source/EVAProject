const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23fffdf9"/><circle cx="32" cy="32" r="28" fill="none" stroke="%23b79558" stroke-width="3"/><text x="32" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="%23272320">EVA</text></svg>';

export function GET(){
  return new Response(decodeURIComponent(svg),{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=31536000, immutable'}});
}