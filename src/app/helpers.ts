export const sahhaIdToBytes32 = (sahhaId: string): `0x${string}` => {
  let hex = sahhaId.replace(/-/g, "");
  hex = hex.padEnd(64, "0");
  return `0x${hex}` as `0x${string}`;
};