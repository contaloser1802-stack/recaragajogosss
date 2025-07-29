export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-[#EFEFEF] text-gray-600">
        <div className="container mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-center gap-3 p-4 text-center text-xs md:items-start max-md:pb-5">
                <div className="flex flex-col items-center gap-3 leading-none md:w-full md:flex-row md:justify-between">
                    <div className="md:text-start">© {currentYear} Garena Online. Todos os direitos reservados.</div>
                    <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1">
                        <a href="#" className="transition-opacity hover:opacity-70">FAQ</a>
                        <div className="h-3 w-px bg-gray-300"></div>
                        <a href="https://content.garena.com/legal/tos/tos_pt.html" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70">Termos e Condições</a>
                        <div className="h-3 w-px bg-gray-300"></div>
                        <a href="https://content.garena.com/legal/pp/pp_pt.html" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70">Política de Privacidade</a>
                    </div>
                </div>
            </div>
        </div>
    </footer>
  );
}
