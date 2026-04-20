export interface Country {
  code: string;
  flag: string;
  name: string;
  image: string; // path served from /public
}

export const COUNTRIES: Country[] = [
  { code: "sg", flag: "🇸🇬", name: "Singapore",    image: "/images/countries/sg.jpg" },
  { code: "my", flag: "🇲🇾", name: "Malaysia",     image: "/images/countries/my.jpg" },
  { code: "th", flag: "🇹🇭", name: "Thailand",     image: "/images/countries/th.jpg" },
  { code: "vn", flag: "🇻🇳", name: "Việt Nam",     image: "/images/countries/vn.jpg" },
  { code: "id", flag: "🇮🇩", name: "Indonesia",    image: "/images/countries/id.jpg" },
  { code: "jp", flag: "🇯🇵", name: "Japan",        image: "/images/countries/jp.jpg" },
  { code: "kr", flag: "🇰🇷", name: "Korea",        image: "/images/countries/kr.jpg" },
  { code: "tw", flag: "🇹🇼", name: "Taiwan",       image: "/images/countries/tw.jpg" },
  { code: "hk", flag: "🇭🇰", name: "Hong Kong",   image: "/images/countries/hk.jpg" },
  { code: "au", flag: "🇦🇺", name: "Australia",    image: "/images/countries/au.jpg" },
  { code: "fr", flag: "🇫🇷", name: "France",       image: "/images/countries/fr.jpg" },
  { code: "it", flag: "🇮🇹", name: "Italy",        image: "/images/countries/it.jpg" },
  { code: "gb", flag: "🇬🇧", name: "UK",           image: "/images/countries/gb.jpg" },
  { code: "us", flag: "🇺🇸", name: "USA",          image: "/images/countries/us.jpg" },
];

const BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): Country | undefined {
  return BY_CODE[code];
}

/** Build trip display name from country codes */
export function buildTripName(codes: string[]): string {
  if (!codes.length) return "Chuyến đi mới";
  const names = codes.map((c) => BY_CODE[c]?.name ?? c);
  if (names.length === 1) return names[0];
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return `${rest.join(", ")} & ${last}`;
}

/** Return the hero image for the first selected country, fallback to sg */
export function getHeroImage(codes: string[]): string {
  const primary = codes[0] ? BY_CODE[codes[0]] : undefined;
  return primary?.image ?? "/images/countries/sg.jpg";
}
