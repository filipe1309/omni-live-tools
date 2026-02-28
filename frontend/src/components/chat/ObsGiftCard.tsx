import type { GiftMessage } from '@/types';

interface ObsGiftCardProps {
  gift: GiftMessage;
  isPending?: boolean;
  fontColor?: string;
}

/**
 * Compact gift card component for OBS overlay
 * Matches the style from public/app.js addGiftItem function
 */
export function ObsGiftCard({ gift, isPending = false, fontColor }: ObsGiftCardProps) {
  const totalCost = gift.diamondCount * gift.repeatCount;
  
  // Display nickname if available, otherwise fall back to uniqueId
  const displayName = gift.nickname || gift.uniqueId;

  return (
    <div className="flex items-start gap-2">
      <img
        src={gift.profilePictureUrl}
        alt=""
        className="w-5 h-5 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div>
          <a
            href={`https://www.tiktok.com/@${gift.uniqueId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[rgb(102,143,217)] font-bold hover:underline"
          >
            {displayName}
          </a>
          <span>: {gift.describe}</span>
        </div>
        <div className="flex items-start gap-2 mt-1">
          <img
            src={gift.giftPictureUrl}
            alt={gift.giftName}
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div className="text-sm">
            <div>
              Name: <strong>{gift.giftName}</strong>
              <span className="opacity-60 ml-1">(ID:{gift.giftId})</span>
            </div>
            <div>
              Repeat:{' '}
              <strong
                style={{
                  color: isPending ? '#ff0000' : fontColor || 'inherit',
                }}
              >
                x{gift.repeatCount.toLocaleString()}
              </strong>
            </div>
            <div>
              Cost: <strong>{totalCost.toLocaleString()} Diamonds</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
