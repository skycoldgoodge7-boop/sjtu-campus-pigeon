import { usePigeonStore } from '../store/pigeonStore';

export default function DailyJournal() {
  const journals = usePigeonStore((s) => s.journalEntries);

  const latest = journals[0];

  if (!latest) {
    return (
      <div style={{
        padding: '20px', textAlign: 'center',
        color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
        lineHeight: 2,
      }}>
        <div style={{ fontSize: 'clamp(20px, 2vw, 32px)', marginBottom: 12 }}>📋</div>
        <div>还没有校园记录</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>每天凌晨自动生成</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>记录这一天的校园故事</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%', overflow: 'auto', padding: '16px',
    }}>
      <div style={{
        whiteSpace: 'pre-line',
        fontSize: 'clamp(12px, 1vw, 15px)',
        color: '#4A3728',
        lineHeight: 2,
        background: 'rgba(139,0,0,0.03)',
        borderRadius: 16,
        padding: '20px',
        animation: 'fadeInUp 0.6s ease',
      }}>
        {latest.content}
      </div>

      {/* Past journals */}
      {journals.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontSize: 'clamp(11px, 0.9vw, 13px)',
            fontWeight: 600, color: '#8B7355', marginBottom: 12,
          }}>
            往期记录
          </div>
          {journals.slice(1, 8).map((j) => (
            <div key={j.id} style={{
              padding: '10px 14px',
              marginBottom: 8,
              background: 'rgba(139,0,0,0.02)',
              borderRadius: 12,
              fontSize: 'clamp(10px, 0.85vw, 13px)',
              color: '#8B7355',
              cursor: 'default',
            }}>
              <span style={{ fontWeight: 600 }}>{j.date.slice(5)}</span>
              <span style={{ marginLeft: 8 }}>
                {j.feedCount}次投喂 · 去了{j.landmarksVisited.length}个地方
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
