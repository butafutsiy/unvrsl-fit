'use strict';
// Keep client Play usable while Supabase and assigned programs hydrate.
(() => {
  if (window.__unvrslClientLaunchV519) return;
  window.__unvrslClientLaunchV519 = true;
  const W = window;
  let pending = null;
  const trainer = () => {
    const c = W.cloud;
    return !!c?.user && (
      String(c.user.email || '').toLowerCase() === 'butafutsiy@mail.ru' ||
      String(c.profile?.role || '').toLowerCase() === 'trainer'
    );
  };
  const tell = message => { try { W.toast?.(message); } catch (_) {} };
  const waitFor = (check, events, timeout = 12000) => new Promise(resolve => {
    if (check()) return resolve(true);
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      for (const name of events) W.removeEventListener(name, signal);
      resolve(ok);
    };
    const signal = () => { if (check()) finish(true); };
    const timer = setTimeout(() => finish(check()), timeout);
    for (const name of events) W.addEventListener(name, signal);
    signal();
  });
  function signIn() {
    if (typeof W.cloudPasswordLoginSheet === 'function') return W.cloudPasswordLoginSheet();
    if (typeof W.cloudAccountSheet === 'function') return W.cloudAccountSheet();
    tell('Вход ещё загружается. Повтори через несколько секунд.');
  }
  async function openPicker() {
    if (!W.cloud?.initSettled) {
      tell('Восстанавливаем вход…');
      await waitFor(() => !!W.cloud?.initSettled,
        ['unvrsl:cloud-ready', 'unvrsl:auth-changed'], 12000);
    }
    if (W.st?.current) return W.nav?.('start');
    if (!W.cloud?.user) {
      if (W.cloud?.initSettled) return signIn();
      return tell('Не удалось проверить вход. Проверь соединение и повтори.');
    }
    if (trainer()) return W.nav?.('start');
    const uid = String(W.cloud.user.id || '');
    const pickerReady = () =>
      !!uid &&
      String(W.cloud?.user?.id || '') === uid &&
      W.__unvrslClientRuntimeUserIdV519 === uid &&
      typeof W.openClientStartProgramPicker === 'function';
    if (!pickerReady()) {
      tell('Загружаем назначенную программу…');
      const ok = await waitFor(pickerReady,
        ['unvrsl:client-ready', 'unvrsl:client-settled', 'unvrsl:auth-changed'], 12000);
      if (!ok) return tell('Программа пока не загрузилась. Проверь соединение и нажми Play ещё раз.');
    }
    if (String(W.cloud?.user?.id || '') !== uid) return signIn();
    return W.openClientStartProgramPicker();
  }
  W.unvrslClientStartV519 = () => {
    if (pending) return pending;
    pending = Promise.resolve().then(openPicker)
      .catch(error => {
        console.warn('UNVRSL client start', error);
        tell('Не получилось открыть тренировку. Попробуй ещё раз.');
      })
      .finally(() => { pending = null; });
    return pending;
  };
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('.nav button[data-p="start"]')) return;
    // Trainer and active-session navigation retain their original behavior.
    if (trainer() || W.st?.current) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    W.unvrslClientStartV519();
  }, true);
})();
