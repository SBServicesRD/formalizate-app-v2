import React from 'react';
import { Lock } from 'lucide-react';

type PageView = 'main' | 'privacy' | 'terms' | 'refund';

interface FooterProps {
    setPage: (page: PageView) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
    return (
        <footer className="bg-sbs-blue text-white py-8">
            <div className="max-w-5xl mx-auto px-6 sm:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                    <div className="text-sm text-sbs-gray-200 space-y-1 text-center md:text-left">
                        <p>
                            <a href="mailto:soporte@formalizate.app" className="hover:text-white transition-colors">
                                soporte@formalizate.app
                            </a>
                        </p>
                        <p>
                            <a href="https://wa.me/18296487176" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                WhatsApp: (829) 648-7176
                            </a>
                        </p>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sbs-gray-300">
                        <a href="#" onClick={(e) => { e.preventDefault(); setPage('privacy'); }} className="hover:text-white transition-colors">
                            Política de Privacidad
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setPage('terms'); }} className="hover:text-white transition-colors">
                            Términos y Condiciones
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setPage('refund'); }} className="hover:text-white transition-colors">
                            Política de Reembolso
                        </a>
                    </nav>
                </div>

                <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-sbs-gray-500">
                    <p className="text-center sm:text-left">
                        &copy; {new Date().getFullYear()} Smart Biz Services S.R.L. &mdash; RNC: 1-31-68858-6. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center text-sbs-gray-400">
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        <span>SSL 256-bit</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
