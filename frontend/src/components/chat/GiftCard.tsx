import { ProfilePicture } from '../common/ProfilePicture';
import { Username } from '../common/Username';
import type { GiftMessage } from '@/types';

interface GiftCardProps {
  gift: GiftMessage;
  isPending?: boolean;
}

export function GiftCard({ gift, isPending = false }: GiftCardProps) {
  const totalCost = gift.diamondCount * gift.repeatCount;

  return (
    <div className="flex items-start gap-3 py-3 px-4 bg-slate-700/50 rounded-lg animate-slide-up">
      <ProfilePicture src={gift.profilePictureUrl} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="font-medium mb-1">
          <Username uniqueId={gift.uniqueId} />
        </div>
        <p className="text-slate-300 text-sm mb-2">{gift.describe}</p>
        
        <div className="flex items-center gap-3">
          <img 
            src={gift.giftPictureUrl} 
            alt={gift.giftName}
            className="w-12 h-12 object-contain"
          />
          
          <div className="text-sm">
            <div className="text-white">
              <span className="text-slate-400">Name:</span>{' '}
              <span className="font-bold">{gift.giftName}</span>
              <span className="text-slate-500 ml-1">(ID:{gift.giftId})</span>
            </div>
            <div>
              <span className="text-slate-400">Repeat:</span>{' '}
              <span className={`font-bold ${isPending ? 'text-tiktok-red animate-pulse-soft' : 'text-white'}`}>
                x{gift.repeatCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Cost:</span>{' '}
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
