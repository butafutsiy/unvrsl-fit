'use strict';
// v4: one canonical draft journal. No timed resurrection from historical snapshots.
// Legacy backup keys remain untouched for explicit recovery/export.
Promise.resolve()
 .then(()=>window.UNVRSL_CLOUD?null:loadExternalScript('cloud-config.js?v=392'))
 .then(()=>loadExternalScript('supabase-loader.js?v=392'))
 .then(()=>window.UNVRSL_SUPABASE_READY)
 .then(()=>window.cloud?.client?null:loadExternalScript('cloud.js?v=392'))
 .then(()=>loadExternalScript('account-sync.js?v=392'))
 .catch(e=>console.warn('UNVRSL account bootstrap',e));
