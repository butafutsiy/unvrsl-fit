'use strict';
// Keep the application's existing script paths; package only public assets.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const publicFile=/\.(?:html|css|js|png|svg|webmanifest|json|ico)$/;
const directories=['assets','data','gif-source','programs'];
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.js'))){
 const check=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
 if(check.status!==0)throw Error(check.stderr);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
// A stale page release makes the update button offer the same release forever.
const pageRelease=html.match(/__unvrslRelease\s*=\s*['"](v\d+)['"]/)?.[1];
const workerRelease=fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/SW_RELEASE\s*=\s*['"](v\d+)['"]/)?.[1];
const registeredRelease=html.match(/serviceWorker\.register\('\.\/sw\.js\?v=(\d+)'/)?.[1];
if(!pageRelease||pageRelease!==workerRelease||pageRelease!=='v'+registeredRelease)
 throw Error('Page, service worker and registration releases must match');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 const file=match[1].split('?')[0];if(/^(https?:|data:)/.test(file))continue;
 if(!fs.existsSync(path.join(root,file)))throw Error('Missing public asset: '+file);
}
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist);
for(const file of fs.readdirSync(root))if(publicFile.test(file)&&fs.statSync(path.join(root,file)).isFile())fs.copyFileSync(path.join(root,file),path.join(dist,file));
for(const directory of directories)if(fs.existsSync(path.join(root,directory)))fs.cpSync(path.join(root,directory),path.join(dist,directory),{recursive:true});
console.log('Production static build ready: '+dist);

