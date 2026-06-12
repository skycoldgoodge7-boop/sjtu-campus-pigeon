// ====== 今日话题板（原校园传闻板 V2.0） ======
import { usePigeonStore } from '../store/pigeonStore';
import { haptic } from '../utils/haptic';

interface Props {
  embedded?: boolean; // 嵌入在日报内部时，缩小版
}

export default function RumorBoard({ embedded }: Props) {
  const campusRumor = usePigeonStore((s) => s.campusRumor);
  const userVoteRecord = usePigeonStore((s) => s.userVoteRecord);
  const castRumorVote = usePigeonStore((s) => s.castRumorVote);
  const todayDate = usePigeonStore((s) => s.todayDate);

  if (!campusRumor) {
    return (
      <div style={{
        textAlign: 'center', padding: 20,
        color: '#8B7355', opacity: 0.6, fontSize: 13,
      }}>
        💬 今天的话题还在路上...
      </div>
    );
  }

  const alreadyVoted = userVoteRecord?.date === todayDate && (userVoteRecord?.topicVote || userVoteRecord?.rumorVote);
  const total = campusRumor.trueVotes + campusRumor.falseVotes || 1;
  const truePct = Math.round(campusRumor.trueVotes / total * 100);
  const falsePct = 100 - truePct;

  const handleVote = (v: 'agree' | 'disagree') => {
    haptic('tap');
    castRumorVote(v === 'agree' ? 'true' : 'false'); // V2.0 桥接
  };

  const fontSize = embedded ? 'clamp(12px, 1vw, 14px)' : 'clamp(14px, 1.3vw, 17px)';
  const emojiSize = embedded ? 'clamp(24px, 2.5vw, 36px)' : 'clamp(32px, 3vw, 48px)';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,248,231,0.9), rgba(255,240,208,0.8))',
      borderRadius: 16,
      padding: embedded ? '14px 16px' : '20px 24px',
      border: '1px solid rgba(196,119,107,0.1)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: '#C4776B', marginBottom: 10,
        letterSpacing: 1,
      }}>
        💬 今日话题
      </div>

      <div style={{
        fontSize: emojiSize,
        textAlign: 'center',
        marginBottom: 10,
      }}>
        🕊️
      </div>

      <div style={{
        fontSize,
        color: '#4A3728',
        lineHeight: 1.8,
        fontWeight: 500,
        textAlign: 'center',
        marginBottom: 16,
      }}>
        "{campusRumor.content}"
      </div>

      {!alreadyVoted ? (
        <div style={{
          display: 'flex', gap: 10,
          justifyContent: 'center',
        }}>
          <button onPointerDown={() => handleVote('agree')} style={{
            flex: 1, maxWidth: 120,
            border: '1.5px solid rgba(139,115,85,0.15)',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.6)',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 1vw, 14px)',
            fontWeight: 600,
            color: '#4A3728',
            transition: 'all 0.2s ease',
          }}>
            👍 认同
          </button>
          <button onPointerDown={() => handleVote('disagree')} style={{
            flex: 1, maxWidth: 120,
            border: '1.5px solid rgba(139,115,85,0.15)',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.6)',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 1vw, 14px)',
            fontWeight: 600,
            color: '#4A3728',
            transition: 'all 0.2s ease',
          }}>
            👎 不认同
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4A3728', minWidth: 40 }}>👍 认同</span>
            <div style={{
              flex: 1, height: 8, borderRadius: 4,
              background: 'rgba(139,115,85,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${truePct}%`, height: '100%',
                background: 'linear-gradient(90deg, #A0B888, #C0D5B0)',
                borderRadius: 4,
                transition: 'width 0.6s var(--ease-out-expo)',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5A7A4A', minWidth: 32, textAlign: 'right' }}>
              {truePct}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4A3728', minWidth: 40 }}>👎 不认同</span>
            <div style={{
              flex: 1, height: 8, borderRadius: 4,
              background: 'rgba(139,115,85,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${falsePct}%`, height: '100%',
                background: 'linear-gradient(90deg, #D4A8A0, #E8C8C0)',
                borderRadius: 4,
                transition: 'width 0.6s var(--ease-out-expo)',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#A06050', minWidth: 32, textAlign: 'right' }}>
              {falsePct}%
            </span>
          </div>
          <div style={{
            textAlign: 'center', marginTop: 10,
            fontSize: 11, color: '#8B7355', opacity: 0.5,
          }}>
            {total} 人参与 · {(userVoteRecord?.topicVote === 'agree' || userVoteRecord?.rumorVote === 'true') ? '你选择了 👍' : (userVoteRecord?.topicVote === 'disagree' || userVoteRecord?.rumorVote === 'false') ? '你选择了 👎' : '已参与'}
          </div>
        </div>
      )}
    </div>
  );
}
