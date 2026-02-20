import { useState } from 'react';
import { useLanguage } from '@/i18n';
import { PlatformSelector } from '@/components';
import { useConnectionContext } from '@/hooks';
import { PlatformType } from '@/types';

function hexToRgb (hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : { r: 0, g: 0, b: 0 };
}

export function OverlayPage () {
  const { t } = useLanguage();
  const { tiktok, twitch, selectedPlatforms: connectedPlatforms } = useConnectionContext();

  // Pre-fill with connected values, but allow user to modify
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(() =>
    connectedPlatforms.length > 0 ? connectedPlatforms : [PlatformType.TIKTOK]
  );
  const [tiktokUsername, setTiktokUsername] = useState(() => tiktok.username || 'jamesbonfim');
  const [twitchChannel, setTwitchChannel] = useState(() => twitch.channelName || '');
  const [settings, setSettings] = useState({
    showChats: true,
    showGifts: true,
    showLikes: true,
    showJoins: true,
    showFollows: true,
    showShares: false,
  });
  const [bgColor, setBgColor] = useState('#18171c');
  const [fontColor, setFontColor] = useState('#e3e5eb');
  const [fontSize, setFontSize] = useState('1.3em');
  const [copied, setCopied] = useState(false);

  const showTikTok = selectedPlatforms.includes(PlatformType.TIKTOK);
  const showTwitch = selectedPlatforms.includes(PlatformType.TWITCH);

  const FONT_SIZE_OPTIONS = [
    { value: '1em', label: `${t.overlay.fontSizes.small} (1em)` },
    { value: '1.3em', label: `${t.overlay.fontSizes.medium} (1.3em)` },
    { value: '1.6em', label: `${t.overlay.fontSizes.large} (1.6em)` },
    { value: '2em', label: `${t.overlay.fontSizes.extraLarge} (2em)` },
  ];

  const baseUrl = window.location.origin;

  const generateUrl = () => {
    // Require at least one platform with a valid identifier
    const hasTikTok = showTikTok && tiktokUsername.trim();
    const hasTwitch = showTwitch && twitchChannel.trim();

    if (!hasTikTok && !hasTwitch) return '';

    const params = new URLSearchParams();

    // Platform selection
    params.set('platforms', selectedPlatforms.join(','));

    if (hasTikTok) {
      params.set('username', tiktokUsername);
    }
    if (hasTwitch) {
      params.set('channel', twitchChannel);
    }

    params.set('showChats', settings.showChats ? '1' : '0');
    params.set('showGifts', settings.showGifts ? '1' : '0');
    params.set('showLikes', settings.showLikes ? '1' : '0');
    params.set('showJoins', settings.showJoins ? '1' : '0');
    params.set('showFollows', settings.showFollows ? '1' : '0');
    params.set('showShares', settings.showShares ? '1' : '0');

    // Convert hex colors to rgb format for OBS compatibility
    const bgRgb = hexToRgb(bgColor);
    const fontRgb = hexToRgb(fontColor);
    params.set('bgColor', `rgb(${bgRgb.r},${bgRgb.g},${bgRgb.b})`);
    params.set('fontColor', `rgb(${fontRgb.r},${fontRgb.g},${fontRgb.b})`);
    params.set('fontSize', fontSize);

    return `${baseUrl}/obs?${params.toString()}`;
  };

  const overlayUrl = generateUrl();
  const hasValidInput = (showTikTok && tiktokUsername.trim()) || (showTwitch && twitchChannel.trim());

  const copyToClipboard = () => {
    if (overlayUrl) {
      navigator.clipboard.writeText(overlayUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-overlay-gradient">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-6">🎬 {t.overlay.title}</h2>
          <p className="text-slate-400 mb-6">
            {t.overlay.description}
          </p>

          <div className="space-y-6">
            {/* Platform Selector */}
            <div>
              <PlatformSelector
                selectedPlatforms={selectedPlatforms}
                onChange={setSelectedPlatforms}
              />
            </div>

            {/* TikTok Username Input */}
            {showTikTok && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.connection.tiktokUser}
                </label>
                <input
                  type="text"
                  value={tiktokUsername}
                  onChange={(e) => setTiktokUsername(e.target.value)}
                  placeholder={t.connection.userPlaceholder}
                  className="input-field w-full"
                />
              </div>
            )}

            {/* Twitch Channel Input */}
            {showTwitch && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.connection.twitchChannel}
                </label>
                <input
                  type="text"
                  value={twitchChannel}
                  onChange={(e) => setTwitchChannel(e.target.value)}
                  placeholder={t.connection.channelPlaceholder}
                  className="input-field w-full"
                />
              </div>
            )}

            {/* Settings Toggles */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t.overlay.displayEvents}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'showChats', label: `💬 ${t.overlay.events.messages}`, checked: settings.showChats },
                  { key: 'showGifts', label: `🎁 ${t.overlay.events.gifts}`, checked: settings.showGifts },
                  { key: 'showLikes', label: `❤️ ${t.overlay.events.likes}`, checked: settings.showLikes },
                  { key: 'showJoins', label: `👋 ${t.overlay.events.joins}`, checked: settings.showJoins },
                  { key: 'showFollows', label: `➕ ${t.overlay.events.follows}`, checked: settings.showFollows },
                  { key: 'showShares', label: `🔗 ${t.overlay.events.shares}`, checked: settings.showShares },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-tiktok-cyan focus:ring-tiktok-cyan"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="border-t border-slate-700 pt-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t.overlay.appearance}
              </label>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Background Color */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      {t.overlay.backgroundColor}
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-14 h-14 rounded-lg border border-slate-600 cursor-pointer bg-transparent p-1"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="input-field flex-1 text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Font Color */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      {t.overlay.fontColor}
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-14 h-14 rounded-lg border border-slate-600 cursor-pointer bg-transparent p-1"
                      />
                      <input
                        type="text"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="input-field flex-1 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    {t.overlay.fontSize}
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="input-field w-full sm:w-auto sm:min-w-[200px]"
                  >
                    {FONT_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border-t border-slate-700 pt-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t.overlay.preview}
              </label>
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: bgColor,
                  color: fontColor,
                  fontSize: fontSize
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0" />
                  <span>
                    <strong>user</strong>: {t.overlay.previewMessage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0" />
                  <span style={{ color: '#ff005e' }}>
                    <strong>follower</strong>: {t.overlay.previewFollow}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generated URL */}
        {hasValidInput && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">📋 {t.overlay.yourOverlayUrl}</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={overlayUrl}
                readOnly
                className="input-field flex-1 font-mono text-sm"
              />
              <button onClick={copyToClipboard} className="btn-secondary">
                {copied ? `✅ ${t.common.copied}` : `📋 ${t.common.copy}`}
              </button>
              <button
                onClick={() => window.open(overlayUrl, '_blank')}
                className="btn-primary"
              >
                🚀 {t.common.open}
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-bold text-white mb-2">{t.overlay.howToUse}</h4>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li>{t.overlay.steps.step1}</li>
                <li>{t.overlay.steps.step2} <strong>{t.overlay.steps.browserSource}</strong></li>
                <li>{t.overlay.steps.step3}</li>
                <li>{t.overlay.steps.step4} <strong>{t.overlay.steps.turnOffWhenNotVisible}</strong></li>
                <li>{t.overlay.steps.step5}</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
