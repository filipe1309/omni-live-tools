import { useState } from 'react';

const FONT_SIZE_OPTIONS = [
  { value: '1em', label: 'Pequeno (1em)' },
  { value: '1.3em', label: 'Médio (1.3em)' },
  { value: '1.6em', label: 'Grande (1.6em)' },
  { value: '2em', label: 'Extra Grande (2em)' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function OverlayPage() {
  const [username, setUsername] = useState('jamesbonfim');
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

  const baseUrl = window.location.origin;
  
  const generateUrl = () => {
    if (!username.trim()) return '';
    
    const params = new URLSearchParams();
    params.set('username', username);
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

  const copyToClipboard = () => {
    if (overlayUrl) {
      navigator.clipboard.writeText(overlayUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="card mb-6">
        <h2 className="text-2xl font-bold mb-6">🎬 Gerar URL do Overlay</h2>
        <p className="text-slate-400 mb-6">
          Crie uma URL de overlay personalizada para usar no OBS, Streamlabs ou outros softwares de streaming.
          O overlay conectará automaticamente e exibirá os eventos da LIVE do TikTok especificada.
        </p>

        <div className="space-y-6">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Usuário do TikTok
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite o @usuário"
              className="input-field w-full"
            />
          </div>

          {/* Settings Toggles */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Exibir Eventos
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'showChats', label: '💬 Mensagens', checked: settings.showChats },
                { key: 'showGifts', label: '🎁 Presentes', checked: settings.showGifts },
                { key: 'showLikes', label: '❤️ Curtidas', checked: settings.showLikes },
                { key: 'showJoins', label: '👋 Entradas', checked: settings.showJoins },
                { key: 'showFollows', label: '➕ Seguidores', checked: settings.showFollows },
                { key: 'showShares', label: '🔗 Compartilhamentos', checked: settings.showShares },
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
              Aparência
            </label>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Background Color */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Cor de Fundo
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
                    Cor da Fonte
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
                  Tamanho da Fonte
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
              Pré-visualização
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
                  <strong>usuario</strong>: Mensagem de exemplo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0" />
                <span style={{ color: '#ff005e' }}>
                  <strong>seguidor</strong>: seguiu o host
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated URL */}
      {username && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">📋 Sua URL do Overlay</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={overlayUrl}
              readOnly
              className="input-field flex-1 font-mono text-sm"
            />
            <button onClick={copyToClipboard} className="btn-secondary">
              {copied ? '✅ Copiado!' : '📋 Copiar'}
            </button>
            <button 
              onClick={() => window.open(overlayUrl, '_blank')}
              className="btn-primary"
            >
              🚀 Abrir
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h4 className="font-bold text-white mb-2">Como usar:</h4>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Copie a URL acima</li>
              <li>No OBS, adicione uma nova <strong>Fonte de Navegador</strong></li>
              <li>Cole a URL e defina as dimensões (ex: 400x600)</li>
              <li>Ative <strong>Desligar fonte quando não visível</strong></li>
              <li>O overlay conectará automaticamente quando a fonte estiver ativa</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
