import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const outputDirectory = resolve('docs/.vitepress/dist');
const siteUrl = 'https://vdokkupalle-ebsco.github.io/flixel-pixi';

function readOutput(path) {
  return readFileSync(resolve(outputDirectory, path), 'utf8');
}

function requireMatch(value, pattern, message) {
  if (!pattern.test(value)) throw new Error(message);
}

function structuredData(html, page) {
  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map(([, json]) => JSON.parse(json));
  if (blocks.length === 0)
    throw new Error(`${page} structured data is missing.`);
  return blocks.flatMap((block) => block['@graph'] ?? [block]);
}

const sitemapPath = resolve(outputDirectory, 'sitemap.xml');
const sitemap = readOutput('sitemap.xml');
if (statSync(sitemapPath).size > 1_000_000)
  throw new Error('sitemap.xml exceeds the 1 MB crawl-budget guardrail.');
requireMatch(
  sitemap,
  /^<\?xml version="1\.0" encoding="UTF-8"\?>/,
  'Invalid sitemap XML declaration.',
);
requireMatch(
  sitemap,
  /<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/,
  'Invalid sitemap urlset namespace.',
);

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => url,
);
if (urls.length < 20) throw new Error('sitemap.xml contains too few URLs.');
if (urls.length !== new Set(urls).size)
  throw new Error('sitemap.xml contains duplicate URLs.');
if (urls.some((url) => !url.startsWith(`${siteUrl}/`)))
  throw new Error('sitemap.xml contains a URL outside the canonical site.');
if (urls.some((url) => url.includes('/versions/')))
  throw new Error('Archived documentation must not appear in sitemap.xml.');
for (const requiredUrl of [
  `${siteUrl}/`,
  `${siteUrl}/guide/getting-started`,
  `${siteUrl}/level-editor/`,
  `${siteUrl}/particle-editor/`,
])
  if (!urls.includes(requiredUrl))
    throw new Error(`sitemap.xml is missing ${requiredUrl}.`);

const robots = readOutput('robots.txt');
requireMatch(
  robots,
  new RegExp(`Sitemap: ${siteUrl.replaceAll('.', '\\.')}/sitemap\\.xml`),
  'robots.txt does not advertise the canonical sitemap.',
);

const home = readOutput('index.html');
requireMatch(
  home,
  /<link rel="canonical" href="https:\/\/vdokkupalle-ebsco\.github\.io\/flixel-pixi\/">/,
  'Homepage canonical URL is missing.',
);
requireMatch(
  home,
  /TypeScript HTML5 2D Game Engine/,
  'Homepage title does not describe the HTML5 game engine.',
);
if (
  !structuredData(home, 'Homepage').some(
    (item) => item['@type'] === 'SoftwareApplication',
  )
)
  throw new Error('Homepage SoftwareApplication structured data is missing.');

const archivedVersion = readdirSync(resolve(outputDirectory, 'versions')).find(
  (entry) => entry !== 'next',
);
if (!archivedVersion)
  throw new Error('No archived documentation version is available to verify.');
const archivedHome = readOutput(`versions/${archivedVersion}/index.html`);
requireMatch(
  archivedHome,
  /<link rel="canonical" href="https:\/\/vdokkupalle-ebsco\.github\.io\/flixel-pixi\/">/,
  'Archived documentation does not canonicalize to the current page.',
);
requireMatch(
  archivedHome,
  /<meta name="robots" content="noindex, follow,[^"]+">/,
  'Archived documentation must be marked noindex.',
);

for (const editor of ['level-editor', 'particle-editor']) {
  const html = readOutput(`${editor}/index.html`);
  requireMatch(
    html,
    /<meta[^>]+name="description"[^>]+content="[^"]+"[^>]*>/,
    `${editor} description is missing.`,
  );
  requireMatch(
    html,
    new RegExp(
      `<link[^>]+rel="canonical"[^>]+href="${siteUrl.replaceAll('.', '\\.')}/${editor}/"[^>]*>`,
    ),
    `${editor} canonical URL is missing.`,
  );
  if (
    !structuredData(html, editor).some(
      (item) => item['@type'] === 'WebApplication',
    )
  )
    throw new Error(`${editor} WebApplication structured data is missing.`);
}

console.log(
  `Documentation SEO contract passed: ${urls.length} canonical URLs in ${(statSync(sitemapPath).size / 1024).toFixed(1)} KB.`,
);
