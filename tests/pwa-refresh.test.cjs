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
  assert.match(html,/apple-touch-icon[^>]+apple-touch-icon\.png\?v=251/);
  assert.match(html,/serviceWorker\.register\('\.\/sw\.js\?v=251'/);
  assert.match(html,/updateViaCache:'none'/);
});

test('service worker update cannot be blocked by one failed optional asset',()=>{
  const source=read('sw.js');
  assert.match(source,/Promise\.allSettled/);
  assert.doesNotMatch(source,/cache\.addAll/);
  assert.match(source,/event\.request\.mode==='navigate'/);
  assert.match(source,/fetch\(event\.request,\{cache:'no-store'\}\)/);
});
