import { useLanguage } from '@/i18n';

interface CountdownOverlayProps {
  countdown: number;
}

export function CountdownOverlay ({ countdown }: CountdownOverlayProps) {
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 overflow-hidden rounded-xl">
      <div className="text-center animate-pulse">
        {countdown === 0 ? (
          <div className="text-7xl font-black text-green-400 animate-bounce drop-shadow-[0_0_30px_rgba(74,222,128,0.8)]">
            {t.poll.go}
          </div>
        ) : (
          <>
            <div className="text-xl text-slate-300 mb-3">{t.poll.startingIn}</div>
            <div className="text-[8rem] font-black text-yellow-400 leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-bounce">
              {countdown}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
