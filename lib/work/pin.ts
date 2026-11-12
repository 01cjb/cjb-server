import "server-only";
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

// PIN: 6자리 숫자. DB에는 scrypt 해시만 저장
export const isPin = (s: unknown): s is string => typeof s === "string" && /^\d{6}$/.test(s);

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pin, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}

// 너무 쉬운 PIN 거르기 (같은 숫자 반복, 연속 숫자)
export function weakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  return "0123456789".includes(pin) || "9876543210".includes(pin);
}

export function randomPin(): string {
  let p = "";
  do p = String(randomInt(0, 1_000_000)).padStart(6, "0"); while (weakPin(p));
  return p;
}

export const newToken = () => randomBytes(32).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export { digits, fmtPhone } from "./format";
