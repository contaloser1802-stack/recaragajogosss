
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BackRedirectProps {
  redirectTo: string;
}

const BackRedirect: React.FC<BackRedirectProps> = ({ redirectTo }) => {
  const router = useRouter();

  useEffect(() => {
    // Garante que este código só rode no navegador
    if (typeof window === 'undefined') {
      return;
    }

    const currentPath = window.location.pathname;

    // Esta função será chamada quando o usuário tentar voltar
    const handlePopState = () => {
        // Redireciona imediatamente para a página de destino (upsell)
        router.push(redirectTo);
    };

    // 1. Substitui o estado atual no histórico por um estado "neutro".
    //    Isso limpa qualquer estado anterior que possa interferir.
    window.history.replaceState({ page: 'neutral' }, '', currentPath);

    // 2. Adiciona um novo estado ao histórico. Este é o estado que vamos "capturar".
    //    Quando o usuário clicar em "voltar", o navegador tentará voltar para o estado
    //    "neutral" que definimos acima, e isso disparará nosso evento 'popstate'.
    window.history.pushState({ page: 'redirect' }, '', currentPath);

    // 3. Adiciona o listener para o evento 'popstate'.
    window.addEventListener('popstate', handlePopState);

    // 4. Limpa o listener quando o componente for desmontado para evitar memory leaks.
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, redirectTo]);

  return null; // Este componente não renderiza nada na tela.
};

export default BackRedirect;
