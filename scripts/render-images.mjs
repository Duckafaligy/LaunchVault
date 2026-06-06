// Render PNGs from SVG strings via @resvg/resvg-js.
// Generates:
//   public/og-default.png   1200x630 — Open Graph / Twitter share image
//   public/icon-512.png     512x512  — Organization-schema logo
//
// Run with:  node scripts/render-images.mjs
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const FONT = `font-family="Segoe UI, system-ui, Arial, sans-serif"`;

const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6366F1"/>
      <stop offset="0.52" stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#D946EF"/>
    </linearGradient>
    <radialGradient id="hi" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#hi)"/>
  <g transform="translate(280,315) scale(1.05) translate(-256,-256)">
    <g fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
      <path d="M152 372 L256 296 L360 372" stroke-opacity="0.38"/>
      <path d="M152 288 L256 212 L360 288" stroke-opacity="0.72"/>
      <path d="M152 204 L256 128 L360 204" stroke-opacity="1.0"/>
    </g>
  </g>
  <text x="560" y="270" ${FONT} font-size="104" font-weight="800" letter-spacing="-3" fill="#ffffff">LaunchVault</text>
  <text x="560" y="335" ${FONT} font-size="34" font-weight="600" letter-spacing="4" fill="#ffffff" fill-opacity="0.92">THE AI LEARNING PLATFORM</text>
  <text x="560" y="405" ${FONT} font-size="24" font-weight="500" letter-spacing="0" fill="#ffffff" fill-opacity="0.80">Prompts · Courses · AI Agents · refreshed every 2h</text>
  <text x="560" y="475" ${FONT} font-size="22" font-weight="600" letter-spacing="1" fill="#ffffff" fill-opacity="0.70">Free to start · launchvault.ca</text>
</svg>`;

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="40" y1="40" x2="472" y2="472" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6366F1"/>
      <stop offset="0.52" stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#D946EF"/>
    </linearGradient>
    <radialGradient id="hi" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#g)"/>
  <rect width="512" height="512" rx="116" fill="url(#hi)"/>
  <g fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
    <path d="M152 372 L256 296 L360 372" stroke-opacity="0.38"/>
    <path d="M152 288 L256 212 L360 288" stroke-opacity="0.72"/>
    <path d="M152 204 L256 128 L360 204" stroke-opacity="1.0"/>
  </g>
</svg>`;

function render(svg, width, outPath) {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true },
    background: "rgba(0,0,0,0)",
  }).render().asPng();
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes)`);
}

render(OG_SVG, 1200, "public/og-default.png");
render(ICON_SVG, 512, "public/icon-512.png");
console.log("done.");
