export const shop = {
  name: 'Mahima Sweets',
  latitude: 15.4356073,
  longitude: 76.5353909,
  phone: '+91 94406 56817',
  telephone: '+919440656817',
  whatsapp: '919440656817',
  secondaryPhone: '+91 94907 19577',
  secondaryTelephone: '+919490719577',
  address: 'Mahima Sweets, Opposite Amar Hospitals, Gangavathi, Karnataka – 583227',
};
const mapCoordinates = encodeURIComponent(`${shop.latitude},${shop.longitude}`);
export const shopDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapCoordinates}&dir_action=navigate`;
export const shopMapUrl = `https://www.google.com/maps/search/?api=1&query=${mapCoordinates}`;
export const shopMapEmbedUrl = `https://www.google.com/maps?q=${mapCoordinates}&z=17&output=embed`;
export function whatsappLink(message = 'Hi Mahima Sweets! I would like to know about your sweets, namkeens and specials in Gangavathi.') {
  return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
}
