import { timingSafeEqual } from "crypto";

export function verifyWebhookToken(
  received: string | undefined,
  expected: string | undefined,
): boolean {
  if (!received || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}
