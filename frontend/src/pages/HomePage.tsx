import { Link } from 'react-router-dom';

interface MenuCard {
  to: string;
  icon: string;
  title: string;
  description: string;
}

const menuCards: MenuCard[] = [
  {
    to: '/chat',
    icon: '💬',
    title: 'Leitor de Chat',
    description: 'Visualize mensagens do chat, presentes e eventos em tempo real',
  },
  {
    to: '/overlay',
    icon: '🎬',
    title: 'URL de Overlay',
    description: 'Gere uma URL de overlay para OBS ou software de streaming',
  },
  {
    to: '/poll',
    icon: '🗳️',
    title: 'Enquete ao Vivo',
    description: 'Crie enquetes interativas para sua audiência ao vivo',
  },
];

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-tiktok-red to-tiktok-cyan bg-clip-text text-transparent mb-4">
          Ferramentas TikTok LIVE
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Uma coleção de ferramentas para{' '}
          <a href="https://www.tiktok.com/live" className="text-tiktok-cyan hover:underline">
            TikTok LIVE
          </a>{' '}
          utilizando{' '}
          <a href="https://github.com/zerodytrash/TikTok-Live-Connector" className="text-tiktok-cyan hover:underline">
            TikTok-Live-Connector
          </a>{' '}
          e{' '}
          <a href="https://socket.io/" className="text-tiktok-cyan hover:underline">
            Socket.IO
          </a>.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {menuCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group card hover:scale-105 hover:shadow-xl hover:shadow-tiktok-red/10 transition-all duration-300"
          >
            <div className="text-5xl mb-4">{card.icon}</div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-tiktok-cyan transition-colors">
              {card.title}
            </h2>
            <p className="text-slate-400 text-sm">{card.description}</p>
          </Link>
        ))}
      </div>

      <footer className="text-center mt-16 text-slate-500 text-sm">
        <p>
          Source:{' '}
          <a
            href="https://github.com/filipe1309/tiktok-chat-reader-jb"
            className="text-tiktok-cyan hover:underline"
          >
            https://github.com/filipe1309/tiktok-chat-reader-jb
          </a>
        </p>
      </footer>
    </div>
  );
}
