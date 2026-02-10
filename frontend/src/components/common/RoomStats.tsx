interface RoomStatsProps {
  viewerCount: number;
  likeCount: number;
  diamondsCount: number;
  roomId?: string | null;
}

export function RoomStats({ viewerCount, likeCount, diamondsCount, roomId }: RoomStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {roomId && (
        <span className="text-slate-400">
          Room: <span className="text-white font-mono">{roomId}</span>
        </span>
      )}
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">👀 Viewers:</span>
          <span className="text-white font-bold">{viewerCount.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400">❤️ Likes:</span>
          <span className="text-white font-bold">{likeCount.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400">💎 Diamonds:</span>
          <span className="text-white font-bold">{diamondsCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
