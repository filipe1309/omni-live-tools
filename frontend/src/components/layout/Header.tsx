import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-tiktok-red to-tiktok-cyan rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ferramentas Omni LIVE</h1>
              <p className="text-xs text-slate-400">Chat e eventos em tempo real</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/chat" 
              className="text-slate-300 hover:text-white transition-colors"
            >
              Leitor de Chat
            </Link>
            <Link 
              to="/overlay" 
              className="text-slate-300 hover:text-white transition-colors"
            >
              Overlay
            </Link>
            <Link 
              to="/poll" 
              className="text-slate-300 hover:text-white transition-colors"
            >
              Enquete ao Vivo
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
