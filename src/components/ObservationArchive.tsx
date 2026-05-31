import { usePigeonStore } from '../store/pigeonStore';
import { characters } from '../data/characters';

export default function ObservationArchive() {
  const remembered = usePigeonStore((s) => s.rememberedCharacters);
  const todayEncounters = usePigeonStore((s) => s.todayEncounters);
  const traces = usePigeonStore((s) => s.characterTraces);

  const known = [...remembered].sort((a, b) => b.lastSeen - a.lastSeen);
  const active = known.filter((r) => !r.disappeared);
  const disappeared = known.filter((r) => r.disappeared);

  // Active traces — characters with recorded traces but not yet recognized
  const activeTraceIds = Object.keys(traces).filter(
    (id) => !remembered.find((r) => r.characterId === id)
  );

  // Today's encounters with full character data
  const todayList = todayEncounters
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is typeof characters[number] => c != null);

  const hasContent = active.length > 0 || activeTraceIds.length > 0 || disappeared.length > 0;

  if (!hasContent) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center',
        color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
        lineHeight: 2,
      }}>
        <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>🕊️</div>
        <div>鸽子还没有注意到校园里的其他生命</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>它在校园里慢慢生活</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>会逐渐发现不同的存在</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>

      {/* 今天的痕迹 & 遇见 */}
      {(todayList.length > 0 || activeTraceIds.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 'clamp(12px, 1vw, 14px)',
            fontWeight: 600, color: '#4A3728', marginBottom: 12,
            letterSpacing: '0.5px',
          }}>
            今天它留意到
          </div>

          {/* Active traces today — vague hints */}
          {activeTraceIds.map((cid) => {
            const char = characters.find((c) => c.id === cid);
            if (!char) return null;
            const count = traces[cid] || 0;
            return (
              <div key={cid} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', marginBottom: 6,
                background: 'rgba(139,0,0,0.02)',
                borderRadius: 12,
                opacity: 0.7,
              }}>
                <span style={{ fontSize: 'clamp(16px, 1.5vw, 22px)', opacity: 0.5 }}>{char.isRumor ? char.silhouette : '?'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#8B7355', fontStyle: 'italic',
                    fontSize: 'clamp(11px, 0.9vw, 13px)',
                  }}>
                    {char.traceHint}
                    {char.isRumor && (
                      <span style={{
                        marginLeft: 6, fontSize: '0.75em',
                        color: '#8B7355', opacity: 0.45,
                        fontStyle: 'normal',
                      }}>
                        传闻
                      </span>
                    )}
                  </div>
                  <div style={{
                    marginTop: 2, fontSize: 'clamp(9px, 0.7vw, 11px)',
                    color: '#8B7355', opacity: 0.4,
                  }}>
                    {char.isRumor
                      ? '鸽子好像察觉到了什么……但不确定'
                      : count >= char.traceThreshold - 1
                        ? '鸽子开始留意这件事了'
                        : '鸽子注意到了什么'
                    }
                  </div>
                </div>
              </div>
            );
          })}

          {/* Today's recognized encounters */}
          {todayList.map((char) => {
            const rc = remembered.find((r) => r.characterId === char!.id);
            const obsIdx = rc ? Math.min(2, Math.floor((rc.encounterCount - 1) / 3)) : 0;
            return (
              <div key={char!.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', marginBottom: 8,
                background: 'rgba(139,0,0,0.04)', borderRadius: 14,
                animation: 'fadeInUp 0.5s ease both',
              }}>
                <span style={{ fontSize: 'clamp(24px, 2vw, 32px)', lineHeight: 1.2 }}>
                  {char!.silhouette}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600, color: '#4A3728',
                    fontSize: 'clamp(12px, 1vw, 15px)', marginBottom: 4,
                  }}>
                    {char!.name}
                    {rc && rc.stage >= 2 && (
                      <span style={{
                        marginLeft: 6, fontSize: '0.75em', fontWeight: 400,
                        color: '#8B7355', opacity: 0.5,
                      }}>
                        {rc.stage === 3 ? '老友' : '认识'}
                      </span>
                    )}
                  </div>
                  <div style={{
                    color: '#8B7355', opacity: 0.8,
                    fontSize: 'clamp(10px, 0.8vw, 12px)', lineHeight: 1.5,
                  }}>
                    {char.observationLevels[obsIdx]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 它已经认识的 */}
      {active.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 'clamp(12px, 1vw, 14px)',
            fontWeight: 600, color: '#4A3728', marginBottom: 12,
          }}>
            它已经认识的生命
          </div>
          {active.map((rc) => {
            const char = characters.find((c) => c.id === rc.characterId);
            if (!char) return null;
            const shownToday = todayEncounters.includes(rc.characterId);
            const obsIdx = Math.min(2, Math.floor((rc.encounterCount - 1) / 3));

            return (
              <div key={rc.characterId} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 6,
                background: shownToday ? 'transparent' : 'rgba(139,0,0,0.02)',
                borderRadius: 12,
                opacity: shownToday ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 'clamp(18px, 1.5vw, 24px)', width: 32, textAlign: 'center' }}>
                  {char.silhouette}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, color: '#4A3728',
                    fontSize: 'clamp(10px, 0.85vw, 13px)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {char.name}
                    <span style={{ marginLeft: 4, opacity: 0.4, fontSize: '0.8em' }}>
                      {formatLastSeen(rc.lastSeen)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(9px, 0.7vw, 11px)',
                    color: '#8B7355', opacity: 0.55,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {char.observationLevels[obsIdx]}
                  </div>
                </div>
                <span style={{ fontSize: '0.75em', color: '#8B7355', opacity: 0.35, whiteSpace: 'nowrap' }}>
                  {rc.encounterCount}次
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 已经很久没见到了 — disappeared */}
      {disappeared.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 'clamp(11px, 0.9vw, 13px)',
            fontWeight: 600, color: '#8B7355', marginBottom: 12,
            opacity: 0.7,
          }}>
            已经很久没见到了
          </div>
          {disappeared.map((rc) => {
            const char = characters.find((c) => c.id === rc.characterId);
            if (!char) return null;

            return (
              <div key={rc.characterId} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', marginBottom: 6,
                background: 'rgba(139,0,0,0.02)', borderRadius: 12,
                opacity: 0.55,
              }}>
                <span style={{
                  fontSize: 'clamp(18px, 1.5vw, 24px)',
                  opacity: 0.35, width: 32, textAlign: 'center',
                }}>
                  {char.silhouette}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600, color: '#4A3728',
                    fontSize: 'clamp(10px, 0.85vw, 13px)',
                    opacity: 0.6,
                  }}>
                    {char.name}
                  </div>
                  <div style={{
                    fontSize: 'clamp(9px, 0.7vw, 11px)',
                    color: '#8B7355', fontStyle: 'italic',
                    lineHeight: 1.5, marginTop: 2,
                  }}>
                    {char.disappearMessage}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        textAlign: 'center', color: '#8B7355', opacity: 0.35,
        fontSize: 'clamp(9px, 0.7vw, 11px)',
        padding: '20px 0', lineHeight: 1.8,
      }}>
        鸽子会慢慢认识这座校园里的生命
      </div>
    </div>
  );
}

function formatLastSeen(ts: number): string {
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  const weeks = Math.floor(days / 7);
  return `${weeks}周前`;
}
