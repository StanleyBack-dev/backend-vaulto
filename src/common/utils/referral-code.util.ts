import { randomInt } from "crypto";

const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 8): string {
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += REFERRAL_CODE_ALPHABET[randomInt(REFERRAL_CODE_ALPHABET.length)];
  }

  return code;
}

export async function generateUniqueReferralCode(
  isTaken: (code: string) => Promise<boolean>,
  attempts = 5,
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const code = generateReferralCode();
    if (!(await isTaken(code))) {
      return code;
    }
  }

  throw new Error("Could not generate a unique referral code");
}
