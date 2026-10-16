export const shop = {
  name: 'Mahima Sweets',
  phone: '+91 99237 09094',
  telephone: '+919923709094',
  whatsapp: '919923709094',
};
export function whatsappLink(message = 'Hi Mahima Sweets! I would like to know about your sweets, namkeens and specials in Gangavathi.') {
  return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
}
