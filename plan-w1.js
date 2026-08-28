(()=>{
  if(window.__unvrslBootScreen)return;
  window.__unvrslBootScreen=true;
  const started=performance.now();
  let bootAccent='#30d158';
  try{
    for(const key of ['unvrsl-fit-v3','unvrsl-fit-v2']){
      const raw=localStorage.getItem(key);if(!raw)continue;
      const saved=JSON.parse(raw),accent=String(saved?.accent||'').trim();
      if(/^#[0-9a-f]{6}$/i.test(accent)){bootAccent=accent;break}
    }
  }catch(e){}
  document.documentElement.style.setProperty('--boot-accent',bootAccent);
  const style=document.createElement('style');
  style.id='unvrsl-boot-style';
  style.textContent=`
    body.unvrsl-booting{overflow:hidden!important;background:#050505!important}
    body.unvrsl-booting>.app,body.unvrsl-booting>.nav,body.unvrsl-booting>#timer,body.unvrsl-booting>#modal,body.unvrsl-booting>#toast{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    #unvrslBoot{position:fixed;inset:0;z-index:10000;background:#050505;display:flex;align-items:center;justify-content:center;transition:opacity .18s ease;pointer-events:auto}
    #unvrslBoot.out{opacity:0;pointer-events:none}
    #unvrslBoot .boot-inner{display:flex;flex-direction:column;align-items:center;gap:14px;transform:translateY(-2vh)}
    #unvrslBoot .boot-brand{font:850 34px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;letter-spacing:-1.3px;color:#f5f5f7}
    #unvrslBoot .boot-dot{width:7px;height:7px;border-radius:50%;color:var(--boot-accent,#30d158);background:currentColor;box-shadow:0 0 18px currentColor;animation:unvrslBootPulse 1s ease-in-out infinite alternate}
    @keyframes unvrslBootPulse{from{opacity:.35;transform:scale(.8)}to{opacity:1;transform:scale(1.15)}}
  `;
  document.head.appendChild(style);
  document.body.classList.add('unvrsl-booting');
  const boot=document.createElement('div');
  boot.id='unvrslBoot';
  boot.innerHTML='<div class="boot-inner"><div class="boot-brand">UNVRSL FIT</div><div class="boot-dot"></div></div>';
  document.body.appendChild(boot);

  let released=false;
  function ready(){
    return !!(
      window.__unvrslTrainerDirectUIV3 &&
      window.__unvrslClientsActionLayout &&
      window.__unvrslMobileFinalFix &&
      window.__unvrslHomeStatsV2 &&
      document.querySelector('#home .home-stats-v2')
    );
  }
  function release(){
    if(released)return;
    released=true;
    const wait=Math.max(0,220-(performance.now()-started));
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.body.classList.remove('unvrsl-booting');
      boot.classList.add('out');
      setTimeout(()=>boot.remove(),220);
    })),wait);
  }
  const timer=setInterval(()=>{
    if(ready()||performance.now()-started>6500){clearInterval(timer);release()}
  },40);
  window.addEventListener('unvrsl:ready',()=>{clearInterval(timer);release()},{once:true});
})();

window.UNVRSL_ROUTINES=(window.UNVRSL_ROUTINES||[]).concat([{"w":1,"c":"A1","t":"Квадрицепс + приводящие + икры","p":"3-1-2 | база 2–3м / изол. 60–90с","e":[{"n":"Аэробайк — W1","s":1,"m":7,"d":"План: 6–8 мин"},{"n":"Присед HB","s":4,"r":8,"w":150.0},{"n":"Жим ногами","s":4,"r":10,"w":300.0,"d":"Для диапазонов веса указаны по середине/верхней рабочей точке."},{"n":"Разгибание ног","s":3,"r":12,"w":75.0},{"n":"Сведение ног","s":3,"r":15,"w":65.0},{"n":"Икры","s":4,"r":15,"w":95.0}]},{"w":1,"c":"B","t":"Грудь + плечи + бицепс","p":"3-1-2 | база 2–3м / изол. 60–90с","e":[{"n":"Жим лёжа","s":4,"r":8,"w":110.0},{"n":"Жим гантелей на наклонной","s":4,"r":8,"w":40.0,"d":"Вес указан на одну гантель."},{"n":"Разводка / бабочка","s":3,"r":12,"w":17.0},{"n":"Жим гантелей сидя","s":4,"r":8,"w":32.0,"d":"Вес указан на одну гантель."},{"n":"Махи в стороны","s":3,"r":12,"w":13.0},{"n":"Кроссовер","s":3,"r":12,"w":37.5},{"n":"EZ / скамья Скотта","s":3,"r":10,"w":42.5},{"n":"Молотковые сгибания с канатом","s":3,"r":12,"w":37.5},{"n":"Отжимания с дополнительным весом","s":2,"r":15,"w":14.0,"bw":1,"d":"Повторы в плане — до максимума/субмаксимума; число в приложении — ориентир."}]},{"w":1,"c":"C","t":"Спина + задняя дельта + трицепс","p":"3-1-2 | база 2–3м / изол. 60–90с","e":[{"n":"Тяга штанги в наклоне","s":4,"r":8,"w":90.0,"d":"W8: тест 3–5ПМ или 3×5 100–105."},{"n":"Подтягивания с весом","s":4,"r":6,"w":15.0,"bw":1},{"n":"Тяга Т-грифа","s":3,"r":8,"w":85.0},{"n":"Верхний блок","s":3,"r":10,"w":75.0,"d":"W2 рабочая точка 79–80 кг."},{"n":"Нижний блок","s":3,"r":10,"w":70.0},{"n":"Жим плеч в тренажёре","s":3,"r":10,"w":75.0},{"n":"Задняя дельта","s":3,"r":12,"w":15.0},{"n":"Французский жим EZ","s":3,"r":10,"w":47.5},{"n":"Канат на трицепс","s":3,"r":12,"w":42.5},{"n":"Гиперэкстензия с диском","s":3,"r":15,"w":15.0,"bw":1}]},{"w":1,"c":"A2","t":"Бицепс бедра + ягодицы","p":"3-1-2 | база 2–3м / изол. 60–90с","e":[{"n":"Аэробайк A2 — W1","s":1,"m":6},{"n":"Румынская тяга","s":3,"r":10,"w":120.0,"d":"W8 рабочий диапазон 100–110."},{"n":"Ягодичный мост","s":3,"r":10,"w":115.0},{"n":"Сгибание ног лёжа","s":3,"r":12,"w":57.5},{"n":"Выпады назад","s":3,"r":16,"w":28.0,"sd":1,"d":"Повторы в приложении — суммарно на обе ноги."},{"n":"Зашагивания","s":3,"r":20,"w":22.0,"sd":1,"d":"Вес усреднён в пределах диапазона; повторы суммарно на обе ноги."},{"n":"Разведение ног","s":3,"r":20,"w":60.0}]},{"w":1,"c":"D","t":"Руки + армейский жим","p":"3-1-2 | база 2–3м / изол. 60–90с","e":[{"n":"Подъём штанги на бицепс","s":4,"r":8,"w":47.5},{"n":"Армейский жим","s":4,"r":6,"w":70.0},{"n":"Разгибание гантели из-за головы","s":3,"r":10,"w":30.0,"d":"Вес на одну гантель."},{"n":"Сгибание гантелей с супинацией","s":3,"r":12,"w":17.0,"d":"Вес на одну гантель."},{"n":"Канат на трицепс","s":3,"r":12,"w":42.5},{"n":"Молотковые сгибания","s":3,"r":12,"w":20.0,"d":"Вес на одну гантель."},{"n":"Сгибание рук в блоке","s":3,"r":15,"w":27.5},{"n":"Французский жим с гантелями","s":3,"r":10,"w":22.5,"d":"Вес на одну гантель."}]}]);