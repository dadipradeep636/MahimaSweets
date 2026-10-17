export const shop = {
  name: 'Mahima Sweets',
  phone: '+91 94406 56817',
  telephone: '+919440656817',
  whatsapp: '919440656817',
  secondaryPhone: '+91 94907 19577',
  secondaryTelephone: '+919490719577',
  address: 'Mahima Sweets, Opposite Amar Hospitals, Gangavathi, Karnataka – 583227',
};
export function whatsappLink(message = 'Hi Mahima Sweets! I would like to know about your sweets, namkeens and specials in Gangavathi.') {
  return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
}
