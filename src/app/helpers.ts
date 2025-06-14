// 1D0C697F-D20B-48FD-8658-978B970756F9 -> bytes32
export const sahhaIdToBytes32 = (sahhaId: string) => {
  return `0x${sahhaId.replace(/-/g, '').slice(0, 32)}`;
};