'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom'),root=path.resolve(__dirname,'..');
(async()=>{
 const dom=new JSDOM(fs.readFileSync(path.join(root,'intake.html'),'utf8'),{url:'https://app.test/unvrsl-fit/intake.html',runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'data/anatome-body-paths.json'),'utf8'))});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
 for(const file of ['exercise-catalog.js','intake-profile.js','intake-engine.js','intake-page.js','intake-wizard.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 await new Promise(r=>setTimeout(r,0));const $=id=>w.document.getElementById(id),form=$('intakeForm'),set=(name,value)=>{const e=form.elements[name];e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}))};
 const change=e=>e.dispatchEvent(new w.Event('change',{bubbles:true}));const next=()=>$('wizardNext').click();const panel=()=>[...form.querySelectorAll('fieldset')].findIndex(p=>!p.hidden);
 assert.equal(panel(),0);next();assert.equal(panel(),0);
 for(const [k,v] of Object.entries({firstName:'Семён',lastName:'Бутаков',age:25,sex:'male',height:183,weight:92,goal:'muscle'}))set(k,v);next();assert.equal(panel(),1);
 for(const [k,v] of Object.entries({sportExperience:'y2plus',strengthExperience:'y2plus',trainingBreak:'none'}))set(k,v);next();assert.equal(panel(),2);next();assert.equal(panel(),3);next();assert.equal(panel(),3);assert.match($('error').textContent,/оборудование/);
 const gym=form.querySelector('[value="gym"]');gym.checked=true;change(gym);next();assert.equal(panel(),4);
 $('noConditions').checked=true;change($('noConditions'));set('pain','none');set('medicalRestrictions','none');next();assert.equal(panel(),5);
 for(const [k,v] of Object.entries({nutritionGoal:'gain',overweight:'no',dailyActivity:'moderate',steps:9000,currentSessions:3}))set(k,v);next();assert.equal(panel(),6);
 for(const k of ['core','arms']){const e=form.querySelector(`[name="focus"][value="${k}"]`);e.checked=true;change(e)}
 assert.equal(form.querySelector('[name="focus"][value="legs"]').disabled,true);assert.ok($('focusMap').querySelector('path.selected'));
 set('format','varied');assert.ok(w.sessionStorage.getItem('unvrsl-intake-draft-v475'));
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal($('resultView').hidden,false);assert.equal($('formView').hidden,true);assert.ok($('result').querySelector('.program-overview'));assert.equal($('result').querySelectorAll('details').length,4);assert.ok($('result').querySelectorAll('.volume-row').length===6);assert.equal(w.sessionStorage.getItem('unvrsl-intake-draft-v475'),null);
 $('edit').click();assert.equal($('formView').hidden,false);assert.equal(panel(),6);assert.equal(form.elements.format.value,'varied');$('wizardBack').click();assert.equal(panel(),5);
 // A submit from an intermediate step cannot bypass validation or generate a plan.
 set('steps',-5);form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(panel(),5);assert.equal($('resultView').hidden,true);
 assert.equal(form.elements.firstName.value,'Семён');dom.window.close();console.log('PASS: step validation, required equipment, focus cap, anatomy highlighting, draft persistence, summary, edit/back and invalid submission.');
})().catch(e=>{console.error(e);process.exitCode=1});
