import debug from "debug";

export function makeDebugger(tag: string) {
  return debug(`qwxyz:${tag}`);
}
