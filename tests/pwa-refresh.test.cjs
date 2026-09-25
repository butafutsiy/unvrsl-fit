const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('manifest has a stable GitHub Pages identity and installable PNG icons',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id,'/unvrsl-fit/');
  assert.equal(manifest.start_url,'/unvrsl-fit/');
  assert.equal(manifest.scope,'/unvrsl-fit/');
  assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons){
    const file=icon.src.split('?')[0];
    assert.equal(icon.type,'image/png');
    assert.ok(fs.existsSync(path.join(root,file)),`${file} is missing`);
  }
});

test('iOS uses a PNG touch icon and a versioned service worker',()=>{
  const html=read('index.html');
  assert.match(html,/apple-touch-icon[^>]+apple-touch-icon\.png\?v=422/);
  assert.match(html,/serviceWorker\.register\('\.\/sw\.js\?v=422'/);
  assert.match(html,/updateViaCache:'none'/);
  assert.doesNotMatch(html,/controllerchange|location\.reload\(\)/);
});

test('service worker isolates current shell and media from user data',()=>{
 const sw=read('sw.js');
 assert.match(sw,/SW_RELEASE = "v422"/);
 assert.match(sw,/cache\.put/);
 assert.doesNotMatch(sw,/localStorage\.clear|indexedDB\.deleteDatabase/);
});

test('every local script and stylesheet linked from the shell exists',()=>{
 const html=read('index.html');
 const urls=[...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)]
  .map(match=>match[1].split('?')[0]).filter(url=>!/^https?:|^data:|^#/.test(url));
 for(const url of urls)assert.ok(fs.existsSync(path.join(root,url)),`Missing shell asset: ${url}`);
 assert.match(html,/equipment-profiles-v405\.js\?v=422/);
});
