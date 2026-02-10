interface UsernameProps {
  uniqueId: string;
  className?: string;
}

export function Username({ uniqueId, className = '' }: UsernameProps) {
  return (
    <a
      href={`https://www.tiktok.com/@${uniqueId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-tiktok-cyan hover:underline font-medium ${className}`}
    >
      @{uniqueId}
    </a>
  );
}
