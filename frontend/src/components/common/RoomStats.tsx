import { useLanguage } from '@/i18n';

interface RoomStatsProps {
  viewerCount: number;
  likeCount: number;
  diamondsCount: number;
  roomId?: string | null;
}

export function RoomStats({ viewerCount, likeCount, diamondsCount, roomId }: RoomStatsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {roomId && (
        <span className="text-slate-400">
          {t.roomStats.room}: <span className="text-white font-mono">{roomId}</span>
        </span>
      )}
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">👀 {t.roomStats.viewers}:</span>
          <span className="text-white font-bold">{viewerCount.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400">❤️ {t.roomStats.likes}:</span>
          <span className="text-white font-bold">{likeCount.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400">💎 {t.roomStats.diamonds}:</span>
          <span className="text-white font-bold">{diamondsCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
