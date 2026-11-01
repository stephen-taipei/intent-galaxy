#!/usr/bin/env node
// Placeholder chibi avatars a01–a12 (and brand) for the public feed. Replace any file in
// public/avatars/ with the final brand illustration of the same name.
import { mkdirSync, writeFileSync } from 'node:fs';

const skins = ['#ffd9b8', '#f6c49a', '#e9a97c', '#c98b5e'];
const hairs = ['#2b2b3a', '#5b3a29', '#8a5a2b', '#d9a441', '#6c5ce7', '#e17055'];
const backs = ['#e8e7ff', '#ffe8ef', '#e6f7ef', '#fff3d6', '#e3f1ff', '#f1e9ff'];
const styles = ['bob', 'spiky', 'bun', 'cap', 'long', 'side'];
const extras = ['none', 'glasses', 'star', 'none', 'headband', 'glasses'];

function hair(style, color) {
  switch (style) {
    case 'bob': return `<path d="M22 52c0-20 12-32 28-32s28 12 28 32v10H66c-4-8-10-14-16-16-8 3-16 9-22 16h-6z" fill="${color}"/>`;
    case 'spiky': return `<path d="M22 50l6-18 6 8 6-14 8 10 6-14 6 12 8-8 4 18 4 8H66c-6-6-12-8-16-8s-12 2-20 10h-8z" fill="${color}"/>`;
    case 'bun': return `<circle cx="50" cy="16" r="9" fill="${color}"/><path d="M22 52c0-18 12-30 28-30s28 12 28 30c-8-8-18-12-28-12s-20 4-28 12z" fill="${color}"/>`;
    case 'cap': return `<path d="M20 46c2-16 14-26 30-26s28 10 30 26z" fill="${color}"/><rect x="48" y="40" width="38" height="7" rx="3.5" fill="${color}"/>`;
    case 'long': return `<path d="M20 54c0-22 12-34 30-34s30 12 30 34v30h-10V56c-6-8-12-12-20-12s-14 4-20 12v28H20z" fill="${color}"/>`;
    default: return `<path d="M22 52c0-20 12-32 28-32s28 12 28 32c-10-4-22-14-28-20-4 10-16 16-28 20z" fill="${color}"/>`;
  }
}
function extra(kind) {
  if (kind === 'glasses') return '<g fill="none" stroke="#2b2b3a" stroke-width="2.4"><circle cx="40" cy="60" r="7"/><circle cx="60" cy="60" r="7"/><path d="M47 60h6"/></g>';
  if (kind === 'star') return '<path d="M74 28l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fdcb6e"/>';
  if (kind === 'headband') return '<rect x="24" y="38" width="52" height="6" rx="3" fill="#ff7675"/>';
  return '';
}
mkdirSync(new URL('../public/avatars/', import.meta.url), { recursive: true });
for (let i = 0; i < 12; i++) {
  const id = `a${String(i + 1).padStart(2, '0')}`;
  const skin = skins[i % skins.length]; const color = hairs[(i * 5) % hairs.length]; const back = backs[i % backs.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="avatar ${id}">`
    + `<rect width="100" height="100" rx="50" fill="${back}"/>`
    + `<ellipse cx="50" cy="92" rx="26" ry="14" fill="${hairs[(i + 2) % hairs.length]}" opacity=".85"/>`
    + `<circle cx="50" cy="58" r="27" fill="${skin}"/>`
    + hair(styles[i % styles.length], color)
    + `<circle cx="40" cy="60" r="3.4" fill="#2b2b3a"/><circle cx="60" cy="60" r="3.4" fill="#2b2b3a"/>`
    + `<circle cx="34" cy="69" r="4" fill="#ff8a8a" opacity=".45"/><circle cx="66" cy="69" r="4" fill="#ff8a8a" opacity=".45"/>`
    + `<path d="M44 72q6 ${i % 3 === 0 ? 6 : 4} 12 0" fill="none" stroke="#2b2b3a" stroke-width="2.4" stroke-linecap="round"/>`
    + extra(extras[i % extras.length]) + '</svg>\n';
  writeFileSync(new URL(`../public/avatars/${id}.svg`, import.meta.url), svg);
}
// The brand account that publishes the examples: a small star mascot.
writeFileSync(new URL('../public/avatars/brand.svg', import.meta.url), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="brand avatar">'
  + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#365be5"/><stop offset="1" stop-color="#7452dc"/></linearGradient></defs>'
  + '<rect width="100" height="100" rx="50" fill="url(#g)"/>'
  + '<path d="M50 16l9 20 22 3-16 15 4 22-19-10-19 10 4-22-16-15 22-3z" fill="#ffe08a"/>'
  + '<circle cx="43" cy="49" r="3.2" fill="#2b2b3a"/><circle cx="57" cy="49" r="3.2" fill="#2b2b3a"/>'
  + '<path d="M45 57q5 5 10 0" fill="none" stroke="#2b2b3a" stroke-width="2.4" stroke-linecap="round"/>'
  + '<circle cx="38" cy="56" r="3.4" fill="#ff8a8a" opacity=".5"/><circle cx="62" cy="56" r="3.4" fill="#ff8a8a" opacity=".5"/></svg>\n');
console.log('wrote 12 avatars and the brand avatar to apps/hosted/public/avatars/');
