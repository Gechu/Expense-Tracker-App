/** Kody walut (ISO 4217) do wyboru w polach typu "waluta". Lista ograniczona
   do tego, co obsługuje Frankfurter (frankfurter.dev, dane EBC) - dzięki temu
   każda waluta na liście ma też dostępny automatyczny kurs. */
export const CURRENCIES = [
  { code: 'PLN', name: 'Polski złoty' },
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'Dolar amerykański' },
  { code: 'GBP', name: 'Funt brytyjski' },
  { code: 'CHF', name: 'Frank szwajcarski' },
  { code: 'CZK', name: 'Korona czeska' },
  { code: 'NOK', name: 'Korona norweska' },
  { code: 'SEK', name: 'Korona szwedzka' },
  { code: 'DKK', name: 'Korona duńska' },
  { code: 'HUF', name: 'Forint węgierski' },
  { code: 'RON', name: 'Lej rumuński' },
  { code: 'JPY', name: 'Jen japoński' },
  { code: 'CNY', name: 'Juan chiński' },
  { code: 'CAD', name: 'Dolar kanadyjski' },
  { code: 'AUD', name: 'Dolar australijski' },
  { code: 'NZD', name: 'Dolar nowozelandzki' },
  { code: 'TRY', name: 'Lira turecka' },
  { code: 'INR', name: 'Rupia indyjska' },
  { code: 'BRL', name: 'Real brazylijski' },
  { code: 'MXN', name: 'Peso meksykańskie' },
  { code: 'ZAR', name: 'Rand południowoafrykański' },
  { code: 'SGD', name: 'Dolar singapurski' },
  { code: 'HKD', name: 'Dolar hongkoński' },
  { code: 'KRW', name: 'Won południowokoreański' },
  { code: 'THB', name: 'Bat tajski' },
  { code: 'ILS', name: 'Szekel izraelski' },
  { code: 'ISK', name: 'Korona islandzka' },
  { code: 'PHP', name: 'Peso filipińskie' },
  { code: 'IDR', name: 'Rupia indonezyjska' },
  { code: 'MYR', name: 'Ringgit malezyjski' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']
