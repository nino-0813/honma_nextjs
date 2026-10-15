import fs from 'node:fs';
import path from 'node:path';

const source = '/Users/yusukeninomiya/Downloads/ikevege-about.html';
const outputDir = path.join(process.cwd(), 'public', 'about-editorial');
const assetsDir = path.join(outputDir, 'assets');

fs.mkdirSync(assetsDir, { recursive: true });

let html = fs.readFileSync(source, 'utf8');
let imageIndex = 0;
html = html.replace(/data:image\/([^;]+);base64,([^"']+)/g, (_, rawExtension, data) => {
  imageIndex += 1;
  const extension = rawExtension === 'jpeg' ? 'jpg' : rawExtension;
  const filename = `editorial-${String(imageIndex).padStart(2, '0')}.${extension}`;
  fs.writeFileSync(path.join(assetsDir, filename), Buffer.from(data, 'base64'));
  return `/about-editorial/assets/${filename}`;
});

// Remove authoring notes and local source filenames before publishing.
html = html
  .replace(/<span class="chk">[\s\S]*?<\/span>/g, '')
  .replace(/<div class="memo">[\s\S]*?<\/div>/g, '')
  .replace(/<span class="fn">[\s\S]*?<\/span>/g, '')
  .replace(/<link[^>]+fonts\.googleapis\.com[^>]*>/g, '')
  .replace(/<link[^>]+fonts\.gstatic\.com[^>]*>/g, '');

const style = (html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '')
  .replace(':root{', ':host{');
const content = html.match(/<div class="wrap">([\s\S]*?)<\/div>\s*<\/body>/)?.[1];

if (!content) throw new Error('Could not find the editorial content wrapper.');

const shadowDocument = `<style>
:host{display:block;color:#1c1d1d;font-family:"Noto Serif JP","Times New Roman",YuMincho,"Yu Mincho","Hiragino Mincho ProN",serif}
${style}
.wrap{max-width:none;margin:0;padding:0 0 48px;background:transparent}
article{scroll-margin-top:110px}
.memo,.chk,.fn{display:none!important}
</style>
<div class="wrap">${content}</div>`;

fs.writeFileSync(path.join(outputDir, 'content.html'), shadowDocument);
console.log(`Imported ${imageIndex} editorial images.`);
