'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','trainer-shell-v252.js'),'utf8');

class Element{
  constructor(tag,id=''){this.tagName=tag.toUpperCase();this.id=id;this.className='';this.dataset={};this.children=[];this.parentNode=null;this.style={display:'',setProperty:(k,v)=>{this.style[k]=v}};this.attributes={}}
  appendChild(child){if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);this.children.push(child);child.parentNode=this;return child}
  setAttribute(k,v){this.attributes[k]=String(v)}
  addEventListener(){}
  querySelector(sel){return this.querySelectorAll(sel)[0]||null}
  querySelectorAll(sel){
    const direct=sel.startsWith(':scope > '),needle=sel.replace(':scope > ','');
    const pool=direct?this.children:this.descendants();
    const m=needle.match(/^button\[data-p="([^"]+)"\]$/);
    if(m)return pool.filter(x=>x.tagName==='BUTTON'&&x.dataset.p===m[1]);
    if(needle==='button[data-p]')return pool.filter(x=>x.tagName==='BUTTON'&&x.dataset.p);
    return[]
  }
  descendants(){return this.children.flatMap(x=>[x,...x.descendants()])}
}

function boot(email,role){
  const navEl=new Element('nav');navEl.className='nav';
  const main=new Element('main');
  for(const id of ['home','plan','start','stats','exercises']){
    const page=new Element('section',id);page.className=id==='home'?'page active':'page';main.appendChild(page);
    const btn=new Element('button');btn.dataset.p=id;navEl.appendChild(btn)
  }
  const all=()=>[navEl,main,...navEl.descendants(),...main.descendants()];
  const document={
    hidden:false,
    createElement:tag=>new Element(tag),
    getElementById:id=>all().find(x=>x.id===id)||null,
    querySelector:sel=>sel==='.nav'?navEl:sel==='main'?main:sel==='.page.active'?main.children.find(x=>x.className.includes('active'))||null:null,
    addEventListener(){}
  };
  const baseNav=()=>{};
  const window={cloud:{user:email?{email}:null,profile:role?{role}:null},nav:baseNav,addEventListener(){}};
  const context={window,document,nav:baseNav,MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn(),console,Promise};
  vm.runInNewContext(source,context);
  return{navEl,main,window}
}

test('master trainer gets Programs and Clients in stable order before profile role arrives',()=>{
  const {navEl,main,window}=boot('butafutsiy@mail.ru',null);
  assert.equal(window.trainerIsTrainer(),true);
  assert.deepEqual(navEl.children.map(x=>x.dataset.p),['home','plan','programs','start','stats','exercises','clients']);
  assert.ok(main.children.some(x=>x.id==='programs'));
  assert.ok(main.children.some(x=>x.id==='clients'));
  assert.equal(navEl.style['--nav-cols'],'7');
});

test('ordinary client keeps the five-tab shell',()=>{
  const {navEl,window}=boot('client@example.com','client');
  assert.equal(window.trainerIsTrainer(),false);
  assert.deepEqual(navEl.children.map(x=>x.dataset.p),['home','plan','start','stats','exercises']);
  assert.equal(navEl.style['--nav-cols'],'5');
});
