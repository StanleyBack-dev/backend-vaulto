import { formatCurrencyBRL } from "./format-currency.util";

function integerToWords(n: number): string {
  if (n === 0) return "zero";

  const units = [
    "",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ];

  const tens = [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa",
  ];

  const hundreds = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos",
  ];

  if (n === 100) return "cem";
  if (n < 20) return units[n];

  if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} e ${units[unit]}`;
  }

  if (n < 1_000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest === 0
      ? hundreds[h]
      : `${hundreds[h]} e ${integerToWords(rest)}`;
  }

  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1_000);
    const rest = n % 1_000;
    const thousandsWord =
      thousands === 1 ? "mil" : `${integerToWords(thousands)} mil`;
    if (rest === 0) return thousandsWord;
    const connector = rest < 100 || rest % 100 === 0 ? " e " : ", ";
    return `${thousandsWord}${connector}${integerToWords(rest)}`;
  }

  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const millionsWord =
    millions === 1 ? "um milhão" : `${integerToWords(millions)} milhões`;
  if (rest === 0) return millionsWord;
  return `${millionsWord} e ${integerToWords(rest)}`;
}

/**
 * Formats a BRL monetary value with its written-out extension in Portuguese.
 * Example: 1500 → "R$ 1.500,00 (mil e quinhentos reais)"
 */
export function formatCurrencyExtended(value: number): string {
  const brl = formatCurrencyBRL(value);
  const rounded = Math.round((value || 0) * 100);
  const reais = Math.floor(rounded / 100);
  const centavos = rounded % 100;

  const reaisWords =
    reais > 0
      ? `${integerToWords(reais)} ${reais === 1 ? "real" : "reais"}`
      : "";

  const centavosWords =
    centavos > 0
      ? `${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`
      : "";

  const extenso =
    [reaisWords, centavosWords].filter(Boolean).join(" e ") || "zero reais";

  return `${brl} (${extenso})`;
}
