export const DAYS = Object.freeze([1,2,3,4,7,8,9,10,11,14,15,16,17,18,19,20,21,22,23,24]);
export const NORMAL = Object.freeze(['09:30','10:30','11:30','13:30','14:30','15:30']);
export const SPECIAL = Object.freeze(Array.from({length:15}, (_, i) => {
  const minutes = 480 + i * 40;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}));
export const dateKey = day => `2026-12-${String(day).padStart(2,'0')}`;
export function slotsFor(day) {
  if (!DAYS.includes(day)) return [];
  const slots = day >= 18 ? SPECIAL : NORMAL;
  return slots.filter(time => ![20,24].includes(day) || time <= '11:00');
}
export const labelDate = day => new Intl.DateTimeFormat('pt-BR', {day:'numeric',month:'long',timeZone:'America/Sao_Paulo'}).format(new Date(`${dateKey(day)}T12:00:00-03:00`));
export function whatsappUrl({name,pet,species,breed,service,phone,day,time}) {
  const text = `Olá, Carol! 🐾 Gostaria de agendar um horário no Mundo Pet.\n\nNome: ${name.trim()}\nPet: ${pet.trim()}\nEspécie: ${species}\nRaça: ${breed.trim()}\nServiço: ${service}\nWhatsApp: ${phone.trim()}\nData: ${String(day).padStart(2,'0')}/12/2026\nHorário: ${time}\n\nAguardo sua confirmação! 🎄`;
  return `https://wa.me/5512988644334?text=${encodeURIComponent(text)}`;
}
