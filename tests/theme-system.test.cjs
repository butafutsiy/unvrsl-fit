'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../theme-contrast.js'),root=path.join(__dirname,'..');
test('all approved accents retain readable action text',()=>{for(const accent of ['#bf5af2','#30d158','#0a84ff','#ff9f0a','#ff375f','#ff453a','#64d2ff','#ffd60a'])assert.ok(C.contrast(C.action(accent),'#ffffff')>=4.5,accent);});
test('system theme tracks device light and dark appearance while preserving the preference',()=>{
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8'),definition=source.split('\n').find(s=>s.startsWith('function applyTheme('));const metas={};const context={st:{theme:'system'},window:{matchMedia:()=>({matches:true})},document:{documentElement:{dataset:{},style:{}},querySelector:s=>metas[s]||(metas[s]={})}};vm.createContext(context);vm.runInContext(definition+';applyTheme()',context);assert.equal(context.document.documentElement.dataset.theme,'light');assert.equal(context.st.theme,'system');context.window.matchMedia=()=>({matches:false});vm.runInContext('applyTheme()',context);assert.equal(context.document.documentElement.dataset.theme,'dark');context.st.theme='light';vm.runInContext('applyTheme()',context);assert.equal(context.document.documentElement.dataset.theme,'light');
});
test('boot theme resolves before styles and narrow navigation removes desktop transform',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.indexOf("localStorage.getItem('unvrsl-appearance-v1')")<html.indexOf('theme-light.css'));assert.doesNotMatch(html,/user-scalable=no/);const css=fs.readFileSync(path.join(root,'interface-system.css'),'utf8');assert.match(css,/\.nav\{[^}]*transform:none!important/);assert.match(css,/@media\(min-width:780px\)/);assert.match(css,/prefers-reduced-motion/);
});
