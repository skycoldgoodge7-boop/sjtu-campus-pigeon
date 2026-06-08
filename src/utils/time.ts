export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 投票是否仍然开放（22:00 截止） */
export function isVoteOpen(): boolean {
  return new Date().getHours() < 22;
}

/** 是否到了生成日报的时间（23:00 之后、日期未切换之前） */
export function isNewspaperTime(): boolean {
  const h = new Date().getHours();
  return h >= 23;
}

/** 返回距离投票截止的分钟数（用于 UI 倒计时） */
export function minutesUntilVoteClose(): number {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(22, 0, 0, 0);
  const diff = cutoff.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 60000));
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '已归来';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}时${minutes}分`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickWeighted<T extends { rarity: string }>(
  items: T[],
  rarityWeights: Record<string, number>
): T {
  const weighted = items.flatMap((item) =>
    Array(rarityWeights[item.rarity] || 1).fill(item)
  );
  return pickRandom(weighted);
}
