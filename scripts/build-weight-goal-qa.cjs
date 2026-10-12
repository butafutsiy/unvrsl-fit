'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'progress.html'),'utf8');
const script=source.match(/<script src="public-progress\.js[^>]*><\/script>/)[0];
const snapshot={client:{name:'Тестовый профиль',height:177,targetWeight:80},measurements:[{date:'2026-10-01',weight:60,source:'client',measurements:{}},{date:'2026-10-12',weight:62,source:'client',measurements:{}}],strengths:[]};
const setup=`<script>
history.replaceState(null,'','#t='+('x'.repeat(44)));
window.UNVRSL_CLOUD={url:'https://fixture.invalid',anonKey:'test-public'};
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}})},rpc:async name=>name==='get_offline_progress_share_v334'?{data:{data:${JSON.stringify(snapshot)},viewer_source:'client'},error:null}:{error:{message:'Это тестовый просмотр. Записи не сохраняются.'}}})};
</script>`;
let html=source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
html=html.replace('<head>','<head><base href="../">').replace('<title>UNVRSL FIT','<title>UNVRSL FIT · проверка цели');
html=html.replace('<body>','<body><p style="max-width:700px;margin:20px auto;padding:12px;color:#f5f5f7;text-align:center">Тестовый пример: вес 60–62 кг, цель 80 кг.</p>');
html=html.replace('</body>',setup+script+'</body>');
fs.writeFileSync(path.join(root,'docs/qa-shared-weight-goal.html'),html);
console.log('Created isolated shared-weight visual fixture; no network or persisted writes');
