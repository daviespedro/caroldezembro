/** Mundo Pet — script vinculado à planilha privada. */
const DAYS_ = [1,2,3,4,7,8,9,10,11,14,15,16,17,18,19,20,21,22,23,24];
const NORMAL_ = ['09:30','10:30','11:30','13:30','14:30','15:30'];
function slots_(day) {
  if (DAYS_.indexOf(day) === -1) return [];
  const list = day >= 18 ? Array.from({length:15}, function(_,i) {
    const m = 480+i*40; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  }) : NORMAL_;
  return list.filter(function(t){return [20,24].indexOf(day)===-1 || t<='11:00';});
}
function keys_() {
  return DAYS_.reduce(function(all, day) {
    return all.concat(slots_(day).map(function(time){return ['2026-12-'+String(day).padStart(2,'0'),time];}));
  },[]);
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mundo Pet').addItem('Abrir agenda','abrirAgenda').addToUi();
}
// Executar UMA vez no editor, estando conectado à conta proprietária.
function configurarAgenda() {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  if (!email) throw new Error('Entre com a conta Google que administrará a agenda.');
  const props = PropertiesService.getScriptProperties();
  if (adminEmails_().length) requireAdmin_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Crie este projeto por Extensões > Apps Script na planilha.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    let sheet = ss.getSheetByName('Agenda');
    if (!sheet) {
      sheet = ss.insertSheet('Agenda');
      sheet.getRange(1,1,1,6).setValues([['Data','Horário','Status','Data da última alteração','Espécie','Raça']]);
      sheet.getRange(2,1,keys_().length,6).setNumberFormat('@');
      const now = new Date().toISOString();
      sheet.getRange(2,1,keys_().length,6).setValues(keys_().map(function(k){return [k[0],k[1],'disponivel',now,'',''];}));
      sheet.setFrozenRows(1);sheet.autoResizeColumns(1,6);
    }
    props.setProperty('SHEET_ID',ss.getId());
    if (!props.getProperty('ADMIN_EMAIL')) props.setProperty('ADMIN_EMAIL',email);
    readRows_(); // Nunca apagar ou reinicializar dados existentes.
  } finally {lock.releaseLock();}
}
function adminEmails_() {
  const props = PropertiesService.getScriptProperties();
  return [props.getProperty('ADMIN_EMAIL')||'',props.getProperty('ADMIN_EMAILS')||'']
    .join(',').split(',').map(function(email){return email.trim().toLowerCase();}).filter(Boolean);
}
function requireAdmin_() {
  const actual = Session.getActiveUser().getEmail().toLowerCase();
  if (!actual || adminEmails_().indexOf(actual)===-1) throw new Error('Acesso negado. Use uma conta Google autorizada.');
}
function readRows_() {
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id) throw new Error('Configure a agenda antes de publicar.');
  const sh=SpreadsheetApp.openById(id).getSheetByName('Agenda');
  if(!sh || sh.getLastRow()!==keys_().length+1) throw new Error('Planilha incompleta. Não foi possível verificar a disponibilidade.');
  const rows=sh.getRange(2,1,keys_().length,6).getDisplayValues();
  const expected=keys_();
  rows.forEach(function(row,i){
    if(row[0]!==expected[i][0] || row[1]!==expected[i][1] || ['disponivel','ocupado'].indexOf(row[2])===-1 || !row[3]) throw new Error('Dados da agenda inválidos. Preserve a ordem das linhas e o formato texto.');
  });
  return {sheet:sh,rows:rows};
}
function snapshot_(rows) {
  return {ok:true,revision:JSON.stringify(rows),slots:rows.map(function(r){return {date:r[0],time:r[1],status:r[2],species:r[4]||'',breed:r[5]||''};})};
}
function abrirAgenda() {
  requireAdmin_();
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutputFromFile('Admin').setWidth(800).setHeight(650),'Mundo Pet — Agenda da Carol');
}
function getAdminData() {requireAdmin_();return snapshot_(readRows_().rows);}
function saveAdminSlots(request) {
  requireAdmin_();
  if(!request || typeof request.revision!=='string' || !Array.isArray(request.changes) || !request.changes.length || request.changes.length>15) throw new Error('Pedido inválido.');
  const allowed=keys_().map(function(k){return k.join('|');}),seen={};
  request.changes.forEach(function(c){
    if(!c || allowed.indexOf(c.key)===-1 || seen[c.key] || ['disponivel','ocupado'].indexOf(c.status)===-1) throw new Error('Horário ou status inválido.');
    if(c.species!==undefined || c.breed!==undefined) {
      if(!['Cachorro','Gato'].includes(c.species) || typeof c.breed!=='string' || !c.breed.trim() || c.breed.length>80 || /^[=+@-]/.test(c.breed.trim())) throw new Error('Informe cachorro ou gato e uma raça válida de até 80 caracteres.');
    }
    seen[c.key]=true;
  });
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    const data=readRows_();
    if(JSON.stringify(data.rows)!==request.revision) throw new Error('A agenda mudou em outra janela. Atualize antes de salvar novamente.');
    const now=new Date().toISOString();
    request.changes.forEach(function(c){
      const index=allowed.indexOf(c.key),row=data.rows[index];
      row[2]=c.status;row[3]=now;
      row[4]=row[4]||'';row[5]=row[5]||'';
      if(c.status==='disponivel') {row[4]='';row[5]='';}
      else if(c.species!==undefined) {row[4]=c.species;row[5]=c.breed.trim();}
    });
    data.sheet.getRange(2,1,data.rows.length,6).setValues(data.rows);
    SpreadsheetApp.flush();
    return snapshot_(readRows_().rows);
  } finally {lock.releaseLock();}
}
// Única rota pública: somente leitura. Não recebe nem publica dados de clientes.
function doGet(e) {
  const callback=(e&&e.parameter&&e.parameter.callback)||'';
  if(callback && !/^mpAgenda_\d+_\d+$/.test(callback)) return ContentService.createTextOutput('{"ok":false}').setMimeType(ContentService.MimeType.JSON);
  let result;
  try {
    const rows=readRows_().rows;
    result={ok:true,busy:rows.filter(function(r){return r[2]==='ocupado';}).map(function(r){return r[0]+'|'+r[1];}),updatedAt:new Date().toISOString()};
  } catch(error) {result={ok:false,error:'Agenda indisponível. Entre em contato com a Carol.'};}
  const json=JSON.stringify(result);
  return ContentService.createTextOutput(callback?callback+'('+json+');':json).setMimeType(callback?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}
// Não existe doPost. Escritas só ocorrem pelo painel Google autenticado.
