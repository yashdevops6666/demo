// ICAO 9303 three-letter codes for the states most often seen. Unknown codes are shown as-is.
const NAMES = {
  ARE: 'United Arab Emirates', ARG: 'Argentina', AUS: 'Australia', AUT: 'Austria', BEL: 'Belgium',
  BGD: 'Bangladesh', BRA: 'Brazil', CAN: 'Canada', CHE: 'Switzerland', CHN: 'China', D: 'Germany',
  DNK: 'Denmark', EGY: 'Egypt', ESP: 'Spain', FIN: 'Finland', FRA: 'France', GBR: 'United Kingdom',
  GHA: 'Ghana', GRC: 'Greece', IDN: 'Indonesia', IND: 'India', IRL: 'Ireland', ITA: 'Italy',
  JPN: 'Japan', KEN: 'Kenya', KOR: 'South Korea', LKA: 'Sri Lanka', MEX: 'Mexico', MYS: 'Malaysia',
  NGA: 'Nigeria', NLD: 'Netherlands', NOR: 'Norway', NPL: 'Nepal', NZL: 'New Zealand',
  PAK: 'Pakistan', PHL: 'Philippines', POL: 'Poland', PRT: 'Portugal', SAU: 'Saudi Arabia',
  SGP: 'Singapore', SWE: 'Sweden', THA: 'Thailand', TUR: 'Türkiye', USA: 'United States',
  UTO: 'Utopia (specimen)', VNM: 'Vietnam', ZAF: 'South Africa',
};

export const countryName = (code) => NAMES[code] || code || '';

// ISO 3166-1 alpha-3 plus the extra codes ICAO 9303 allows in passports.
const CODES = new Set(
  (
    'ABW AFG AGO AIA ALA ALB AND ARE ARG ARM ASM ATA ATF ATG AUS AUT AZE BDI BEL BEN BES BFA BGD BGR BHR BHS BIH ' +
    'BLM BLR BLZ BMU BOL BRA BRB BRN BTN BVT BWA CAF CAN CCK CHE CHL CHN CIV CMR COD COG COK COL COM CPV CRI CUB ' +
    'CUW CXR CYM CYP CZE DEU DJI DMA DNK DOM DZA ECU EGY ERI ESH ESP EST ETH FIN FJI FLK FRA FRO FSM GAB GBR GEO ' +
    'GGY GHA GIB GIN GLP GMB GNB GNQ GRC GRD GRL GTM GUF GUM GUY HKG HMD HND HRV HTI HUN IDN IMN IND IOT IRL IRN ' +
    'IRQ ISL ISR ITA JAM JEY JOR JPN KAZ KEN KGZ KHM KIR KNA KOR KWT LAO LBN LBR LBY LCA LIE LKA LSO LTU LUX LVA ' +
    'MAC MAF MAR MCO MDA MDG MDV MEX MHL MKD MLI MLT MMR MNE MNG MNP MOZ MRT MSR MTQ MUS MWI MYS MYT NAM NCL NER ' +
    'NFK NGA NIC NIU NLD NOR NPL NRU NZL OMN PAK PAN PCN PER PHL PLW PNG POL PRI PRK PRT PRY PSE PYF QAT REU ROU ' +
    'RUS RWA SAU SDN SEN SGP SGS SHN SJM SLB SLE SLV SMR SOM SPM SRB SSD STP SUR SVK SVN SWE SWZ SXM SYC SYR TCA ' +
    'TCD TGO THA TJK TKL TKM TLS TON TTO TUN TUR TUV TWN TZA UGA UKR UMI URY USA UZB VAT VCT VEN VGB VIR VNM VUT ' +
    'WLF WSM YEM ZAF ZMB ZWE ' +
    'D EUE GBD GBN GBO GBP GBS RKS UNA UNK UNO UTO XBA XCC XIM XOM XPO XXA XXB XXC XXX'
  ).split(' ')
);

export const isStateCode = (code) => CODES.has(code);
