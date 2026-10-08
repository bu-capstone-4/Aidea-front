export interface TextChange {
  index: number;
  deleteCount: number;
  insert: string;
}

// 이전 문자열과 새 문자열의 공통 prefix/suffix를 제외한 단일 변경 구간을 구한다
export function diffText(prev: string, next: string): TextChange {
  let start = 0;
  while (start < prev.length && start < next.length && prev[start] === next[start]) {
    start++;
  }
  let prevEnd = prev.length;
  let nextEnd = next.length;
  while (prevEnd > start && nextEnd > start && prev[prevEnd - 1] === next[nextEnd - 1]) {
    prevEnd--;
    nextEnd--;
  }
  return { index: start, deleteCount: prevEnd - start, insert: next.slice(start, nextEnd) };
}

export interface TextDeltaOp {
  insert?: unknown;
  retain?: number;
  delete?: number;
}

// Y.Text delta(retain/insert/delete)를 적용한 뒤 기존 index가 옮겨갈 위치를 구한다.
// 커서와 같은 위치에 들어온 원격 삽입은 커서 뒤에 놓인 것으로 본다(커서는 그대로).
export function transformIndex(index: number, delta: TextDeltaOp[]): number {
  let oldPos = 0;
  let result = index;
  for (const op of delta) {
    if (oldPos > index) break;
    if (op.retain !== undefined) {
      oldPos += op.retain;
    } else if (op.insert !== undefined) {
      const length = typeof op.insert === 'string' ? op.insert.length : 1;
      if (oldPos < index) result += length;
    } else if (op.delete !== undefined) {
      if (oldPos < index) result -= Math.min(op.delete, index - oldPos);
      oldPos += op.delete;
    }
  }
  return Math.max(0, result);
}
