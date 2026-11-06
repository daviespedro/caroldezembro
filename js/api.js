import {DAYS,dateKey,slotsFor} from './calendar.js';
let sequence = 0;
// JSONP é usado SOMENTE para disponibilidade pública, sem dados pessoais.
// Apps Script redireciona ContentService e não permite configurar CORS livremente.
export function readAvailability(apiUrl, timeoutMs = 15000) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(apiUrl)) {
    return Promise.reject(new Error('A consulta à agenda ainda não foi configurada. Fale com a Carol pelo WhatsApp.'));
  }
  return new Promise((resolve,reject) => {
    const callback = `mpAgenda_${Date.now()}_${++sequence}`;
    const script = document.createElement('script');
    const cleanup = () => {clearTimeout(timer); script.remove(); delete window[callback];};
    const fail = () => {cleanup(); reject(new Error('Não foi possível atualizar a agenda. Confira sua conexão e tente novamente.'));};
    const timer = setTimeout(fail, timeoutMs);
    window[callback] = data => {
      cleanup();
      const valid = new Set(DAYS.flatMap(day=>slotsFor(day).map(t=>`${dateKey(day)}|${t}`)));
      if (!data || data.ok !== true || !Array.isArray(data.busy) || !data.busy.every(k=>typeof k==='string' && valid.has(k))) {
        reject(new Error('A agenda retornou dados inválidos. Fale com a Carol.')); return;
      }
      resolve(new Set(data.busy));
    };
    script.onerror = fail;
    script.src = `${apiUrl}?callback=${callback}&_=${Date.now()}`;
    document.head.append(script);
  });
}
