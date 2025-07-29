
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BackRedirectProps {
  redirectTo: string;
}

const BackRedirect: React.FC<BackRedirectProps> = ({ redirectTo }) => {
  const router = useRouter();

  useEffect(() => {
    // A URL atual (por exemplo, /buy)
    const currentUrl = window.location.pathname;

    // Adiciona uma nova entrada no histórico com a mesma URL.
    // Isso faz com que, ao clicar em "voltar", o usuário primeiro volte para
    // esta entrada que acabamos de adicionar, em vez de voltar para a página anterior.
    window.history.pushState(null, '', currentUrl);

    // Agora, monitoramos o evento 'popstate', que é disparado quando
    // o usuário clica em voltar (acionando a volta para a entrada que criamos).
    const handlePopState = (event: PopStateEvent) => {
      // Impede o comportamento padrão de "voltar"
      event.preventDefault();
      // Redireciona para a URL de upsell
      router.push(redirectTo);
    };

    window.addEventListener('popstate', handlePopState);

    // Limpa o listener quando o componente for desmontado para evitar memory leaks.
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, redirectTo]);

  return null; // Este componente não renderiza nada na tela.
};

export default BackRedirect;

    