import { useRef, useState } from 'react';

export default function DataManager() {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDataRef = useRef<string | null>(null);

  const handleExport = () => {
    try {
      const raw = localStorage.getItem('sjtu-campus-pigeon');
      if (!raw) {
        setStatusMsg('没有数据可以导出');
        setTimeout(() => setStatusMsg(null), 3000);
        return;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `校园鸽数据备份-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg('✅ 数据已导出');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg('❌ 导出失败');
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        JSON.parse(text); // Validate JSON
        pendingDataRef.current = text;
        setShowConfirm(true);
      } catch {
        setStatusMsg('❌ 文件格式错误，不是有效的 JSON');
        setTimeout(() => setStatusMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingDataRef.current) return;
    try {
      const imported = JSON.parse(pendingDataRef.current);
      const currentRaw = localStorage.getItem('sjtu-campus-pigeon');
      const current = currentRaw ? JSON.parse(currentRaw) : {};

      // Smart merge: use max for cumulative values
      const merged = { ...current };

      // Merge numeric fields with max
      const numericFields = ['totalFlights', 'todayFeedCount', 'todayFeedCount'];
      for (const key of numericFields) {
        if (imported.state?.[key] !== undefined) {
          merged.state = merged.state || {};
          merged.state[key] = Math.max(
            merged.state[key] || 0,
            imported.state[key] || 0
          );
        }
      }

      // Merge record fields by summing
      const recordFields = ['feedTotals', 'todayFeedTotals', 'landmarkStayDurations',
                            'characterTraces', 'moodStreaks'];
      for (const key of recordFields) {
        if (imported.state?.[key]) {
          merged.state = merged.state || {};
          merged.state[key] = merged.state[key] || {};
          for (const [k, v] of Object.entries(imported.state[key] as Record<string, number>)) {
            merged.state[key][k] = Math.max(merged.state[key][k] || 0, v as number);
          }
        }
      }

      // Merge arrays: combine and deduplicate by id
      const arrayFields = ['journalEntries', 'dailyPhotos', 'photos', 'messages',
                           'rememberedCharacters', 'flightTrails', 'recentFeeds'];
      for (const key of arrayFields) {
        if (imported.state?.[key]) {
          merged.state = merged.state || {};
          merged.state[key] = merged.state[key] || [];
          const existing = new Set(merged.state[key].map((item: { id?: string }) => item.id));
          for (const item of imported.state[key]) {
            if (item.id && !existing.has(item.id)) {
              merged.state[key].push(item);
              existing.add(item.id);
            }
          }
          // Keep slice limits
          const limits: Record<string, number> = {
            journalEntries: 30, dailyPhotos: 60, photos: 80,
            messages: 100, flightTrails: 3, recentFeeds: 20,
            rememberedCharacters: 100,
          };
          const limit = limits[key] || 100;
          merged.state[key] = merged.state[key].slice(-limit);
        }
      }

      // Simply use the more complete data by default
      // This is a best-effort merge — for full safety, the user keeps both files
      localStorage.setItem('sjtu-campus-pigeon', JSON.stringify(merged));
      setShowConfirm(false);
      pendingDataRef.current = null;
      setStatusMsg('✅ 数据已合并，刷新页面后生效');
      setTimeout(() => setStatusMsg(null), 4000);

      // Reload the store by refreshing
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setStatusMsg('❌ 导入失败，请检查文件');
      setTimeout(() => setStatusMsg(null), 3000);
      setShowConfirm(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 'clamp(12px, 1vw, 14px)',
        fontWeight: 600, color: '#4A3728', marginBottom: 10,
      }}>
        数据管理
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onPointerDown={handleExport}
          style={{
            flex: 1, border: '1px solid rgba(139,0,0,0.15)',
            borderRadius: 14, padding: '12px 16px',
            background: 'rgba(139,0,0,0.03)',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 1vw, 15px)',
            fontWeight: 600, color: '#4A3728',
            transition: 'all 0.2s ease',
          }}
        >
          📥 导出数据
        </button>
        <button
          onPointerDown={() => fileInputRef.current?.click()}
          style={{
            flex: 1, border: '1px solid rgba(139,0,0,0.15)',
            borderRadius: 14, padding: '12px 16px',
            background: 'rgba(139,0,0,0.03)',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 1vw, 15px)',
            fontWeight: 600, color: '#4A3728',
            transition: 'all 0.2s ease',
          }}
        >
          📤 导入数据
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          marginTop: 10, textAlign: 'center',
          fontSize: 'clamp(10px, 0.8vw, 13px)',
          color: '#4A3728', fontWeight: 500,
          padding: '8px 12px',
          background: 'rgba(139,0,0,0.04)',
          borderRadius: 10,
          animation: 'fadeInUp 0.3s ease',
        }}>
          {statusMsg}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div style={{
          marginTop: 12,
          padding: '16px',
          background: 'rgba(139,0,0,0.05)',
          borderRadius: 14,
          border: '1px solid rgba(139,0,0,0.1)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{
            fontSize: 'clamp(11px, 0.9vw, 14px)',
            color: '#4A3728', fontWeight: 600, marginBottom: 8,
          }}>
            ⚠️ 确认导入
          </div>
          <div style={{
            fontSize: 'clamp(10px, 0.8vw, 12px)',
            color: '#8B7355', lineHeight: 1.6, marginBottom: 12,
          }}>
            导入将与当前数据智能合并（不会丢失已有的记录）。导入后页面将自动刷新。
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onPointerDown={() => { setShowConfirm(false); pendingDataRef.current = null; }}
              style={{
                flex: 1, border: '1px solid rgba(139,0,0,0.15)',
                borderRadius: 10, padding: '8px',
                background: 'transparent', cursor: 'pointer',
                fontSize: 'clamp(11px, 0.9vw, 14px)',
                color: '#8B7355',
              }}
            >
              取消
            </button>
            <button
              onPointerDown={handleConfirmImport}
              style={{
                flex: 1, border: 'none',
                borderRadius: 10, padding: '8px',
                background: 'linear-gradient(135deg, #8B0000, #C41E3A)',
                cursor: 'pointer', color: 'white',
                fontSize: 'clamp(11px, 0.9vw, 14px)',
                fontWeight: 600,
              }}
            >
              确认导入
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 10,
        fontSize: 'clamp(9px, 0.7vw, 11px)',
        color: '#8B7355', opacity: 0.5, textAlign: 'center',
        lineHeight: 1.6,
      }}>
        建议定期导出备份。清除浏览器缓存会导致数据丢失。
      </div>
    </div>
  );
}
