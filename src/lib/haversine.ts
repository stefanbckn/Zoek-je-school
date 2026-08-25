const AARDSTRAAL_KM = 6371

/** Hemelsbrede afstand in km tussen twee WGS84-punten (geen reisafstand). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return AARDSTRAAL_KM * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
