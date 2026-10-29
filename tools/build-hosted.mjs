import fs from 'node:fs';
import path from 'node:path';
import { ROOT, isMain, libSources, transpileTo, webLocaleSources } from './transpile.mjs';

export function buildHosted() {
  const target = path.join(ROOT, 'apps/hosted/dist');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'apps/hosted/public'), target, { recursive: true });
  const modules = ['apps/web/galaxy-overlay.js', 'apps/web/decision-view.js', 'apps/web/decision-view.css', 'apps/web/decision-copy.js',
    ...libSources('core', 'protocol'), ...webLocaleSources()];
  for (const name of modules) transpileTo(path.join(target, 'galaxy'), name);
  fs.cpSync(path.join(ROOT, 'apps/extension/icons/ui'), path.join(target, 'icons/ui'), { recursive: true });
  const logo = path.join(ROOT, 'apps/extension/icons/icon128.png');
  if (fs.existsSync(logo)) fs.copyFileSync(logo, path.join(target, 'icon.png'));
  fs.writeFileSync(path.join(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  fs.writeFileSync(path.join(target, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Cache-Control: no-store\n');
  console.log(`Hosted static assets built (${modules.length} shared modules); no private data or keys included.`);
  return target;
}
if (isMain(import.meta.url)) buildHosted();
