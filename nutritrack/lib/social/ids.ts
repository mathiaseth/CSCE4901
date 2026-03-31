/** Lexicographic pair id: smallerUid__largerUid */
export function friendshipPairId(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

export function friendRequestDocId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}
