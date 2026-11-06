import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DAYS,NORMAL,SPECIAL,dateKey,slotsFor,whatsappUrl} from '../js/calendar.js';
import {readAvailability} from '../js/api.js';
const source=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
function backend() {
  let email='carol@example.test',rows=[],writes=0;
  const props={ADMIN_EMAIL:email,SHEET_ID:'private-sheet'};
  const sheet={getLastRow:()=>rows.length+1,getRange:()=>({getDisplayValues:()=>rows.map(r=>[...r]),setValues:value=>{rows=value.map(r=>[...r]);writes++;}})};
  const context=vm.createContext({Session:{getActiveUser:()=>({getEmail:()=>email})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>{props[k]=v;}})},SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>props.SHEET_ID,getSheetByName:()=>sheet}),openById:()=>({getSheetByName:()=>sheet}),flush:()=>{}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput:text=>({text,setMimeType(){return this;}})}});
  vm.runInContext(source,context);
  rows=JSON.parse(vm.runInContext('JSON.stringify(keys_())',context)).map(k=>[...k,'disponivel','2026-11-06T00:00:00Z','','']);
  return {context,impersonate:value=>email=value,setAdmins:value=>props.ADMIN_EMAILS=value,get writes(){return writes;},corrupt:()=>rows.pop()};
}
test('20 dias exatos, dezembro de 2026 e 163 horários válidos',()=>{
  assert.deepEqual(DAYS,[1,2,3,4,7,8,9,10,11,14,15,16,17,18,19,20,21,22,23,24]);
  assert.equal(new Date('2026-12-01T12:00:00-03:00').getUTCDay(),2);
  assert.equal(DAYS.reduce((n,d)=>n+slotsFor(d).length,0),163);
  for(let d=1;d<=31;d++) {
    if(!DAYS.includes(d))assert.deepEqual(slotsFor(d),[]);
    else if(d<18)assert.deepEqual(slotsFor(d),NORMAL);
    else if([20,24].includes(d))assert.deepEqual(slotsFor(d),['08:00','08:40','09:20','10:00','10:40']);
    else assert.deepEqual(slotsFor(d),SPECIAL);
  }
});
test('backend e frontend geram os mesmos horários',()=>{
  const {context}=backend();
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(keys_())',context)),DAYS.flatMap(d=>slotsFor(d).map(t=>[dateKey(d),t])));
});
test('WhatsApp preserva campos, acentos e caracteres especiais',()=>{
  const url=new URL(whatsappUrl({name:' Ana & João ',pet:'Pérola 🐶',species:'Gato',breed:'Siamês',service:'Banho e Tosa',phone:'(12) 99999-9999',day:24,time:'10:40'}));
  assert.equal(url.origin+url.pathname,'https://wa.me/5512988644334');
  for(const value of ['Nome: Ana & João','Pet: Pérola 🐶','Espécie: Gato','Raça: Siamês','Serviço: Banho e Tosa','Data: 24/12/2026','Horário: 10:40','Aguardo sua confirmação! 🎄'])assert.ok(url.searchParams.get('text').includes(value));
});
test('bloqueia, persiste em nova leitura, sincroniza e libera múltiplos',()=>{
  const b=backend(), c=b.context,initial=c.getAdminData();
  const changes=['09:30','10:30'].map(time=>({key:'2026-12-01|'+time,status:'ocupado'}));
  const saved=c.saveAdminSlots({revision:initial.revision,changes});
  assert.equal(b.writes,1);assert.equal(saved.slots.filter(s=>s.status==='ocupado').length,2);
  assert.equal(c.getAdminData().revision,saved.revision);
  assert.deepEqual(JSON.parse(c.doGet({parameter:{}}).text).busy,changes.map(c=>c.key));
  assert.throws(()=>c.saveAdminSlots({revision:initial.revision,changes}),/outra janela/);
  c.saveAdminSlots({revision:saved.revision,changes:changes.map(c=>({...c,status:'disponivel'}))});
  assert.equal(JSON.parse(c.doGet({parameter:{}}).text).busy.length,0);
});
test('nega visitante, conta incorreta, horários e status inválidos',()=>{
  const b=backend(),c=b.context,initial=c.getAdminData();
  for(const identity of ['', 'intruso@example.test']) {
    b.impersonate(identity);
    assert.throws(()=>c.getAdminData(),/Acesso negado/);
    assert.throws(()=>c.saveAdminSlots({revision:initial.revision,changes:[]}),/Acesso negado/);
  }
  b.impersonate('carol@example.test');
  for(const change of [{key:'2026-12-25|08:00',status:'ocupado'},{key:'2026-12-01|09:30',status:'inválido'}])assert.throws(()=>c.saveAdminSlots({revision:initial.revision,changes:[change]}),/inválido/);
  assert.equal(b.writes,0);assert.equal(typeof c.doPost,'undefined');
});
test('API pública não vaza dados privados e falha com planilha incompleta',()=>{
  const b=backend(),c=b.context;
  const output=c.doGet({parameter:{callback:'mpAgenda_123_1'}}).text;
  assert.match(output,/^mpAgenda_123_1\(/);assert.ok(!output.includes('revision'));assert.ok(!output.includes('carol@'));
  assert.equal(c.doGet({parameter:{callback:'alert(1)'}}).text,'{"ok":false}');
  b.corrupt();assert.equal(JSON.parse(c.doGet({parameter:{}}).text).ok,false);
});
test('configuração ausente não informa horários livres',async()=>{
  await assert.rejects(readAvailability(''),/não foi configurada/);
});
test('cliente JSONP recebe dados reais, rejeita erro e encerra timeout',async()=>{
  globalThis.window={};
  let mode='success';
  globalThis.document={createElement:()=>({remove(){}}),head:{append(script){
    const name=new URL(script.src).searchParams.get('callback');
    if(mode==='success')queueMicrotask(()=>window[name]({ok:true,busy:['2026-12-01|09:30']}));
    if(mode==='invalid')queueMicrotask(()=>window[name]({ok:true,busy:['2026-12-25|09:30']}));
    if(mode==='error')queueMicrotask(()=>script.onerror());
  }}};
  const url='https://script.google.com/macros/s/test/exec';
  assert.ok((await readAvailability(url)).has('2026-12-01|09:30'));
  mode='invalid';await assert.rejects(readAvailability(url),/dados inválidos/);
  mode='error';await assert.rejects(readAvailability(url),/conexão/);
  mode='timeout';await assert.rejects(readAvailability(url,5),/conexão/);
  assert.equal(Object.keys(window).length,0);
  delete globalThis.document;delete globalThis.window;
});

test('espécie e raça persistem somente no painel privado e são limpas ao liberar',()=>{
  const {context:c}=backend();
  const saved=c.saveAdminSlots({revision:c.getAdminData().revision,changes:[{key:'2026-12-01|09:30',status:'ocupado',species:'Gato',breed:'Siamês'}]});
  assert.equal(saved.slots[0].species,'Gato');assert.equal(saved.slots[0].breed,'Siamês');
  const publicData=c.doGet({parameter:{}}).text;
  assert.ok(!publicData.includes('Gato'));assert.ok(!publicData.includes('Siamês'));
  assert.throws(()=>c.saveAdminSlots({revision:saved.revision,changes:[{key:'2026-12-01|09:30',status:'ocupado',species:'Outro',breed:'SRD'}]}),/raça válida/);
  assert.throws(()=>c.saveAdminSlots({revision:saved.revision,changes:[{key:'2026-12-01|09:30',status:'ocupado',species:'Gato',breed:'=IMPORTXML()'}]}),/raça válida/);
  const cleared=c.saveAdminSlots({revision:saved.revision,changes:[{key:'2026-12-01|09:30',status:'disponivel'}]});
  assert.equal(cleared.slots[0].species,'');assert.equal(cleared.slots[0].breed,'');
});
test('administradores adicionais mantêm o acesso do proprietário e negam visitantes',()=>{
  const b=backend(),c=b.context;
  b.setAdmins(' CAROL.SECOND@example.test , outro@example.test ');
  assert.equal(c.getAdminData().slots.length,163);
  b.impersonate('carol.second@example.test');
  c.configurarAgenda();
  const saved=c.saveAdminSlots({revision:c.getAdminData().revision,changes:[{key:'2026-12-01|09:30',status:'ocupado'}]});
  assert.equal(saved.slots[0].status,'ocupado');
  b.impersonate('carol@example.test');
  assert.equal(c.getAdminData().slots[0].status,'ocupado');
  b.impersonate('intruso@example.test');
  assert.throws(()=>c.getAdminData(),/Acesso negado/);
  b.impersonate('');
  assert.throws(()=>c.getAdminData(),/Acesso negado/);
});
