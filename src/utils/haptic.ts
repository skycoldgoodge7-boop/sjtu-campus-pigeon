// ====== 触觉反馈工具 ======
// 封装的 navigator.vibrate，自动检测支持

type HapticPattern = 'tap' | 'feed' | 'swipe' | 'retrieve' | 'send' | 'bubble';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,                     // 轻触
  feed: [20, 30, 20],         // 投喂：短-停-短，模拟鸽子啄食
  swipe: [15],                 // 滑动切换
  retrieve: [30, 50, 30],     // 捞漂流瓶：两段震
  send: [25, 40, 50],         // 发送消息：渐强
  bubble: 12,                  // 气泡出现
};

export function haptic(pattern: HapticPattern): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    // 静默失败 — 不支持振动的设备
  }
}
