import {DAYS,dateKey,slotsFor,labelDate,whatsappUrl} from './calendar.js';
import {config} from './config.js';
import {readAvailability} from './api.js';
const $ = selector => document.querySelector(selector);
let day = 1, selectedTime = null, busy = new Set(), verified = false, loading = false, lastSync = 0;
const status = $('#sync-status'), dialog = $('#booking-dialog'), form = $('#booking-form');
function renderCalendar() {
  const calendar = $('#calendar'); calendar.replaceChildren();
  // 1 de dezembro de 2026 é terça-feira: dois espaços antes do dia 1.
  for (let i=0;i<2;i++) calendar.append(document.createElement('span'));
  for (let value=1;value<=31;value++) {
    const button = document.createElement('button');
    button.type='button'; button.textContent=String(value).padStart(2,'0');
    button.disabled=!DAYS.includes(value); button.className=value===day?'day active':'day';
    button.setAttribute('aria-label',`${labelDate(value)}${button.disabled?', sem atendimento':''}`);
    button.setAttribute('aria-pressed',String(value===day));
    button.onclick=()=>{day=value; selectedTime=null; renderCalendar();renderSlots();};
    calendar.append(button);
  }
}
function renderSlots() {
  $('#selected-date').textContent=labelDate(day);
  $('#selected-weekday').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'long',timeZone:'America/Sao_Paulo'}).format(new Date(`${dateKey(day)}T12:00:00-03:00`));
  $('.times-panel').setAttribute('aria-busy',String(loading));
  $('#refresh').disabled=loading;
  const container=$('#slots');container.replaceChildren();
  for (const time of slotsFor(day)) {
    const occupied=busy.has(`${dateKey(day)}|${time}`), button=document.createElement('button');
    button.type='button';button.textContent=time;
    button.className=`slot ${!verified?'unknown':occupied?'occupied':time===selectedTime?'chosen':''}`;
    button.disabled=loading||!verified||occupied;
    button.setAttribute('aria-label',`${time}, ${!verified?'disponibilidade não verificada':occupied?'ocupado':'disponível'}`);
    button.setAttribute('aria-pressed',String(time===selectedTime));
    button.onclick=()=>{
      selectedTime=time;renderSlots();$('#booking-summary').textContent=`${labelDate(day)} de 2026 · ${time}`;
      $('#form-status').textContent='';$('#whatsapp-ready').hidden=true;$('.submit-button').hidden=false;
      dialog.showModal();
    };
    container.append(button);
  }
}
async function refresh() {
  if(loading) return false;
  loading=true;status.textContent='Consultando a agenda…';status.className='sync-status';renderSlots();
  try {
    busy=await readAvailability(config.apiUrl);verified=true;lastSync=Date.now();
    status.textContent=`Atualizado às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · atualização automática`;
    if(selectedTime&&busy.has(`${dateKey(day)}|${selectedTime}`)) {
      selectedTime=null;$('#form-status').textContent='Esse horário acabou de ser ocupado. Feche e escolha outro.';
      $('#whatsapp-ready').hidden=true;$('.submit-button').hidden=false;
    }
    return true;
  } catch(error) {
    verified=false;status.textContent=error.message;status.className='sync-status error';
    if(dialog.open) {$('#form-status').textContent='Disponibilidade não verificada. Tente novamente com conexão.';$('#whatsapp-ready').hidden=true;$('.submit-button').hidden=false;}
    return false;
  } finally {loading=false;renderSlots();}
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const data=Object.fromEntries(new FormData(form));
  const phone=data.phone.replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
  if(!data.name.trim()||!data.pet.trim()) {$('#form-status').textContent='Preencha os nomes do responsável e do pet.';return;}
  if(!['Cachorro','Gato'].includes(data.species)||!data.breed.trim()) {$('#form-status').textContent='Selecione cachorro ou gato e informe a raça. Para mestiços, escreva sem raça definida (SRD).';return;}
  if(!/^\d{10,11}$/.test(phone)) {$('#form-status').textContent='Informe um WhatsApp com DDD e 10 ou 11 dígitos.';return;}
  if(!selectedTime) {$('#form-status').textContent='Escolha outro horário disponível.';return;}
  const submit=$('.submit-button');submit.disabled=true;
  const chosen=selectedTime;
  $('#form-status').textContent='Conferindo o horário antes de abrir o WhatsApp…';
  const success=await refresh();submit.disabled=false;
  if(!success||selectedTime!==chosen) return;
  const url=whatsappUrl({...data,day,time:chosen});
  $('#whatsapp-ready').href=url;$('#whatsapp-ready').hidden=false;submit.hidden=true;
  $('#form-status').textContent='Mensagem pronta. Envie no WhatsApp e aguarde a confirmação da Carol.';
  // Link permanece visível caso o navegador bloqueie a nova janela após a consulta.
  window.open(url,'_blank','noopener,noreferrer');
});
form.addEventListener('input',()=>{
  $('#whatsapp-ready').hidden=true;$('.submit-button').hidden=false;$('#form-status').textContent='';
});
for(const modal of document.querySelectorAll('dialog')) {
  modal.querySelector('.close-dialog').onclick=()=>{modal.close();if(modal===dialog){selectedTime=null;renderSlots();}};
  modal.addEventListener('cancel',()=>{if(modal===dialog){selectedTime=null;renderSlots();}});
}
$('#refresh').onclick=refresh;
$('#owner').onclick=()=>{
  if(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(config.ownerUrl)) {$('#owner-link').href=config.ownerUrl;$('#owner-link').hidden=false;$('#owner-setup').hidden=true;}
  $('#owner-dialog').showModal();
};
renderCalendar();refresh();
setInterval(()=>{if(!document.hidden)refresh();},config.refreshMs);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastSync>10000)refresh();});
window.addEventListener('online',refresh);
window.addEventListener('offline',()=>{verified=false;status.textContent='Você está sem conexão. Reconecte para consultar os horários.';status.className='sync-status error';renderSlots();$('#whatsapp-ready').hidden=true;});
