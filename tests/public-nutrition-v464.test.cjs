const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public-progress.js','utf8');
const goal={calories:[2000,2200],protein:[140,160],fat:[60,70],carbs:[200,240]};
async function page({selected=null,failSave=false}={}){
  let saved=selected;
  const root={innerHTML:'',querySelectorAll:()=>[]},panel={outerHTML:''},calls=[];
  const snapshot=()=>({client:{name:'Тест'},measurements:[],strengths:[],nutritionGoal:saved,nutrition:{stale:true,bmr:1600,tdee:2400,activityFactor:1.55,formula:'Test',goals:{cut:goal,maintain:goal,gain:goal}}});
  const window={location:{hash:'#t='+'a'.repeat(48)},UNVRSL_CLOUD:{url:'test',anonKey:'public'},supabase:{createClient:()=>({auth:{getSession:async()=>({data:{session:null}})},rpc:async(name,args)=>{
    calls.push([name,args]);
    if(name==='set_offline_nutrition_goal_v464'){
      if(failSave)return{error:{message:'Нет связи'}};
      saved=args.p_goal;
    }
    return{data:{data:snapshot()}};
  }})}};
  vm.runInNewContext(source,{window,document:{getElementById:id=>id==='progressRoot'?root:id==='publicNutritionPanel'?panel:null},URLSearchParams,TextEncoder,crypto:require('node:crypto').webcrypto,requestAnimationFrame:fn=>fn(),console});
  for(let i=0;i<20&&!root.innerHTML;i++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.match(root.innerHTML,/publicNutritionPanel/);
  return{window,root,panel,calls};
}
test('stale nutrition stays above charts and shows a recalculation note',async()=>{
  const {root}=await page();
  assert.match(root.innerHTML,/последний сохранённый расчёт/);
  assert.ok(root.innerHTML.indexOf('publicNutritionPanel')<root.innerHTML.indexOf('>ВЕС</div>'));
});
test('goal selection is confirmed on server and restored on reopen',async()=>{
  const p=await page();
  p.window.publicProgressNutritionGoalV325('gain');
  await p.window.publicProgressSaveNutritionGoalV464();
  assert.equal(p.calls.at(-1)[1].p_goal,'gain');
  assert.match(p.panel.outerHTML,/Цель зафиксирована/);
  const reopened=await page({selected:'gain'});
  assert.match(reopened.root.innerHTML,/<option value="gain" selected>/);
});
test('failed save does not claim success and allows retry',async()=>{
  const p=await page({failSave:true});
  p.window.publicProgressNutritionGoalV325('cut');
  await p.window.publicProgressSaveNutritionGoalV464();
  assert.match(p.panel.outerHTML,/Нет связи/);
  assert.doesNotMatch(p.panel.outerHTML,/Цель зафиксирована/);
});
