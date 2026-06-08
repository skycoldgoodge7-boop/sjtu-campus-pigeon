// ====== 校园鸽报 — 向下滑动查看往期 ======
import { usePigeonStore } from '../store/pigeonStore';
import RumorBoard from './RumorBoard';
import type { DailyNewspaper as DailyNewspaperType } from '../types';

export default function DailyNewspaper() {
  const dailyNewspaper = usePigeonStore((s) => s.dailyNewspaper);
  const pastNewspapers = usePigeonStore((s) => s.pastNewspapers);
  const journalEntries = usePigeonStore((s) => s.journalEntries);

  const np = dailyNewspaper;

  // 往期报纸（排除当前显示的）
  const pastPapers = pastNewspapers.filter((p) => !np || p.id !== np.id);
  // 往期日记（排除已在报纸中显示的日期）
  const newspaperDates = new Set(pastNewspapers.map((p) => p.date));
  const pastJournals = journalEntries.filter((j) => !newspaperDates.has(j.date));

  if (!np && pastPapers.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)', lineHeight: 2 }}>
        <div style={{ fontSize: 'clamp(28px, 2.5vw, 44px)', marginBottom: 12 }}>📰</div>
        <div>还没有校园日报</div>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>明天凌晨会生成第一份日报哦</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '16px', WebkitOverflowScrolling: 'touch' }}>
      {/* 当前日报 */}
      {np ? (
        <NewspaperContent np={np} />
      ) : (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          color: '#8B7355', fontSize: 'clamp(12px, 1vw, 15px)',
          lineHeight: 2,
        }}>
          <div style={{ fontSize: 'clamp(32px, 3vw, 48px)', marginBottom: 12 }}>📰</div>
          <div style={{ fontWeight: 600, color: '#4A3728' }}>今日鸽报还在排版中</div>
          <div style={{ fontSize: '0.85em', opacity: 0.7 }}>每天 23:00 鸽子会整理当天的鸽报</div>
          <div style={{ fontSize: '0.85em', opacity: 0.7 }}>明早起来就能看到了 🕊️</div>
        </div>
      )}

      {/* 往期报纸 — 优先展示完整的日报 */}
      {pastPapers.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8B7355', marginBottom: 12, marginTop: 8 }}>
            📰 往期鸽报 ({pastPapers.length} 期)
          </div>
          {pastPapers.map((p) => (
            <PastNewspaperCard key={p.id} np={p} />
          ))}
        </div>
      )}

      {/* 往期数据摘要 — 没有完整日报的日期用简洁摘要补充 */}
      {pastJournals.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8B7355', marginBottom: 12, marginTop: pastPapers.length > 0 ? 20 : 8 }}>
            📋 往期数据摘要 ({pastJournals.length} 篇)
          </div>
          {pastJournals.map((j) => (
            <div key={j.id} style={{
              background: 'rgba(196,119,107,0.03)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 10,
              border: '1px solid rgba(139,115,85,0.05)',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#C4776B', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>📋 {j.date.slice(5)}</span>
                <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 10 }}>
                  {j.feedCount}次投喂 · 到访{j.landmarksVisited.length}地
                  {j.pickedNote ? ' · 捡到纸条' : ''}
                </span>
              </div>
              {j.pigeonReply && (
                <div style={{
                  marginTop: 6, padding: '6px 10px',
                  background: 'rgba(196,119,107,0.06)',
                  borderRadius: 10,
                  fontSize: '0.85em', opacity: 0.85,
                  lineHeight: 1.6,
                  border: '1px solid rgba(196,119,107,0.1)',
                }}>
                  🕊️ 鸽子回复：「{j.pigeonReply}」
                </div>
              )}
            </div>
          ))}
          <div style={{ height: 40 }} />
        </div>
      )}
    </div>
  );
}

// 往期报纸卡片（简化版）
function PastNewspaperCard({ np }: { np: DailyNewspaperType }) {
  return (
    <div style={{
      background: 'rgba(196,119,107,0.04)',
      borderRadius: 16,
      padding: '16px 18px',
      marginBottom: 12,
      border: '1px solid rgba(139,115,85,0.08)',
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: '#C4776B', marginBottom: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>📰 {np.headline || `${np.date.slice(5)} 校园鸽报`}</span>
        <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>
          {np.locationEmoji} {np.locationName}
          {np.interactionCount > 0 ? ` · ${np.interactionCount}人互动` : ''}
        </span>
      </div>

      {np.votingResult && (
        <div style={{
          fontSize: 'clamp(10px, 0.8vw, 12px)',
          color: '#8B7355',
          marginBottom: 8,
          padding: '6px 10px',
          background: 'rgba(255,248,231,0.6)',
          borderRadius: 8,
          lineHeight: 1.6,
        }}>
          💬 话题："{np.votingResult.question}"<br />
          🏆 {np.votingResult.winnerEmoji} "{np.votingResult.winnerText}" 胜出 {np.votingResult.resultMood}
          <span style={{ marginLeft: 8, opacity: 0.5 }}>
            ({np.votingResult.voteDistribution.map((p, i) => `选项${i + 1}:${p}%`).join(' ')})
          </span>
        </div>
      )}

      {np.rumorContent && (
        <div style={{
          fontSize: 'clamp(10px, 0.8vw, 12px)',
          color: '#8B7355',
          marginBottom: 8,
          padding: '6px 10px',
          background: 'rgba(240,248,255,0.5)',
          borderRadius: 8,
          fontStyle: 'italic',
        }}>
          🫧 传闻：{np.rumorContent}
        </div>
      )}

      {np.content && (
        <div style={{
          fontSize: 'clamp(11px, 0.9vw, 13px)',
          color: '#4A3728',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
        }}>
          {np.content}
        </div>
      )}
    </div>
  );
}

function NewspaperContent({ np }: { np: NonNullable<ReturnType<typeof usePigeonStore.getState>['dailyNewspaper']> }) {
  const sectionStyle = {
    background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '16px 18px', marginBottom: 10,
    border: '1px solid rgba(139,115,85,0.06)',
  };
  const headerStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#C4776B', marginBottom: 8 };
  const textStyle: React.CSSProperties = { fontSize: 'clamp(12px, 1vw, 15px)', color: '#4A3728', lineHeight: 1.8 };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 16, padding: '20px 16px', background: 'linear-gradient(135deg, rgba(196,119,107,0.08), rgba(139,115,85,0.04))', borderRadius: 20, border: '2px solid rgba(196,119,107,0.1)' }}>
        <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 6 }}>🕊️</div>
        <div style={{ fontSize: 'clamp(16px, 2vw, 24px)', fontWeight: 800, color: '#4A3728', letterSpacing: 3 }}>校园鸽报</div>
        {np.headline ? (
          <div style={{ fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 600, color: '#C4776B', marginTop: 6, lineHeight: 1.5 }}>{np.headline}</div>
        ) : null}
        <div style={{ fontSize: 12, color: '#8B7355', opacity: 0.6, marginTop: 4 }}>
          {np.date} · 第 {np.date.slice(5).replace('-', '.')} 期
          {np.interactionCount > 0 ? ` · 今日互动 ${np.interactionCount} 次` : ''}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headerStyle}>📍 今日驻留</div>
        <div style={textStyle}>{np.locationEmoji} <strong>{np.locationName}</strong></div>
      </div>

      <div style={sectionStyle}>
        <div style={headerStyle}>🕊️ 今日行程</div>
        <div style={textStyle}>{np.itinerary.length > 0 ? np.itinerary.map((loc, i) => <span key={i}>{i > 0 && ' → '}{loc}</span>) : `一直待在 ${np.locationName}`}</div>
      </div>

      {np.votingResult && (
        <div style={sectionStyle}>
          <div style={headerStyle}>💬 今日话题 + 🏆 投票结果</div>
          <div style={{ ...textStyle, marginBottom: 12, fontStyle: 'italic' }}>"{np.votingResult.question}"</div>
          <div style={textStyle}>{np.votingResult.winnerEmoji} "{np.votingResult.winnerText}" 胜出 {np.votingResult.resultMood}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, fontSize: 11, color: '#8B7355' }}>
            {np.votingResult.voteDistribution.map((pct, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', background: pct === Math.max(...np.votingResult!.voteDistribution) ? 'rgba(196,119,107,0.1)' : 'rgba(139,115,85,0.04)', borderRadius: 8, padding: '4px 8px' }}>
                选项{i + 1}: {pct}%
              </div>
            ))}
          </div>
        </div>
      )}

      {np.collectedItems.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>🎒 新收集品</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {np.collectedItems.map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,248,231,0.8)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontSize: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{item.emoji}</div>
                <div style={{ fontWeight: 600, color: '#4A3728' }}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={sectionStyle}><RumorBoard embedded /></div>

      {np.content && (
        <div style={{ ...sectionStyle, background: 'linear-gradient(135deg, rgba(196,119,107,0.06), rgba(255,248,231,0.5))' }}>
          <div style={headerStyle}>🕊️ 鸽子的话</div>
          <div style={{ ...textStyle, whiteSpace: 'pre-line' }}>{np.content}</div>
        </div>
      )}
    </div>
  );
}
