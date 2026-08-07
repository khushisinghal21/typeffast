declare module "bcryptjs" {
  export function genSaltSync(rounds?: number, minor?: string): string;
  export function genSalt(rounds?: number, minor?: string): Promise<string>;
  export function genSalt(
    rounds: number,
    minor: string,
    cb: (err: Error | null, salt: string) => void
  ): void;

  export function hashSync(s: string, salt: string | number): string;
  export function hash(
    s: string,
    salt: string | number
  ): Promise<string>;
  export function hash(
    s: string,
    salt: string | number,
    cb: (err: Error | null, hash: string) => void
  ): void;

  export function compareSync(s: string, hash: string): boolean;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function compare(
    s: string,
    hash: string,
    cb: (err: Error | null, success: boolean) => void
  ): void;

  export function getRounds(hash: string): number;
  export function getSalt(hash: string): string;

  export const version: string;
}
