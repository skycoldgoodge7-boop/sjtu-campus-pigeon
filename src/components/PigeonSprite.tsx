// ====== 鸽子精灵组件 ======
// 静态时显示单体图，飞行(walking)时显示翅膀展开的静态帧平移

import spriteSheet from '../assets/pigeon/飞行序列图.png';
import staticImg from '../assets/pigeon/鸽子单体图.png';
import type { PigeonActivity } from '../types';

const FRAME_COUNT = 8;
const FLY_FRAME = 3; // 第4帧，翅膀展开最明显

interface Props {
  activity: PigeonActivity;
  width: string | number;
}

export default function PigeonSprite({ activity, width }: Props) {
  const isFlying = activity === 'walking';

  if (!isFlying) {
    // 静态鸽子
    return (
      <img
        src={staticImg}
        alt="校园鸽"
        style={{
          width,
          height: 'auto',
          display: 'block',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
        }}
      />
    );
  }

  // 飞行：展示序列图中翅膀展开的一个静态帧，随地图平移自然移动
  const frameW = typeof width === 'string' ? width : `${width}px`;

  return (
    <div style={{
      width: frameW,
      overflow: 'hidden',
      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
    }}>
      <img
        src={spriteSheet}
        alt="校园鸽飞行中"
        style={{
          height: 'auto',
          width: `calc(${frameW} * ${FRAME_COUNT})`,
          display: 'block',
          marginLeft: `calc(${frameW} * -${FLY_FRAME})`,
          imageRendering: 'auto',
        }}
      />
    </div>
  );
}
