import { ProfilePicture } from '../common/ProfilePicture';
import { Username } from '../common/Username';
import { useLanguage } from '@/i18n';
import type { GiftMessage } from '@/types';

interface GiftCardProps {
  gift: GiftMessage;
  isPending?: boolean;
  timestamp?: Date;
}

export function GiftCard({ gift, isPending = false, timestamp = new Date() }: GiftCardProps) {
  const totalCost = gift.diamondCount * gift.repeatCount;
  const { t } = useLanguage();
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start gap-2 py-2 px-3 bg-slate-700/50 rounded-lg animate-slide-up">
      <ProfilePicture src={gift.profilePictureUrl} size="sm" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-sm truncate">
            <Username uniqueId={gift.uniqueId} nickname={gift.nickname} />
          </div>
          <span className="text-[10px] text-slate-500 flex-shrink-0">{timeString}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <img 
            src={gift.giftPictureUrl} 
            alt={gift.giftName}
            className="w-8 h-8 object-contain"
          />
          
          <div className="text-xs">
            <div className="text-white truncate">
              <span className="text-slate-400">{t.chat.giftName}</span>{' '}
              <span className="font-bold">{gift.giftName}</span>
            </div>
            <div>
              <span className="text-slate-400">{t.chat.giftRepeat}</span>{' '}
              <span className={`font-bold ${isPending ? 'text-tiktok-red animate-pulse-soft' : 'text-white'}`}>
                x{gift.repeatCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">{t.chat.giftCost}</span>{' '}
              <span className="font-bold text-yellow-400">
                💎 {totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
