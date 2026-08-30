import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const output=resolve(root,'dist-v11');
const files=[
  'index.html','manifest.webmanifest','icon.svg','cloud-config.js','sw.js',
  'plan-w1.js','plan-w2.js','plan-w3.js','plan-w4.js','plan-w5.js','plan-w6.js','plan-w7.js','plan-w8.js'
];

await rm(output,{recursive:true,force:true});
await mkdir(resolve(output,'v11'),{recursive:true});
for(const file of files)await cp(resolve(root,file),resolve(output,file));
await cp(resolve(root,'v11'),resolve(output,'v11'),{recursive:true});

const index=await readFile(resolve(output,'index.html'),'utf8');
const required=['v11/app.css','v11/app.mjs','plan-w1.js','plan-w8.js','sw.js'];
for(const asset of required)if(!index.includes(asset)&&asset!=='sw.js')throw new Error(`index.html does not reference ${asset}`);
await writeFile(resolve(output,'VERSION'),'1.1.0\n');
console.log(`Built ${output} with only v1.1 runtime assets`);
