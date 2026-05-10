import React, { useState } from 'react';
import { LogIn, X, Menu } from 'lucide-react';

type PageView = 'main' | 'privacy' | 'terms' | 'refund';

interface HeaderProps {
    showSaveExit?: boolean;
    isDashboard?: boolean;
    isLegal?: boolean;
    setPage: (page: PageView) => void;
    onExit?: () => void;
}

const Logo: React.FC = () => (
    <svg width="220" height="50" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 sm:w-[200px] h-auto">
        <text x="2" y="33" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="700" fill="#1D3557" letterSpacing="-0.02em">
            Formalízate<tspan fill="#E63A47" dx="2">•</tspan><tspan dx="2">app</tspan>
        </text>
    </svg>
);

const Header: React.FC<HeaderProps> = ({ showSaveExit = false, isDashboard = false, isLegal = false, setPage, onExit }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleExit = () => {
        if (onExit) {
            onExit();
        } else {
            window.location.reload();
        }
    }

    const handleLogoClick = () => {
        if (isLegal) {
            setPage('main');
        } else {
            handleExit();
        }
    }

    const shouldShowSaveExit = showSaveExit && !isDashboard;
    const canShowMobileMenu = shouldShowSaveExit || isLegal;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm py-3 transition-all duration-500">
            <div className="w-full max-w-[95%] xl:max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity z-50">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleLogoClick(); }} aria-label="Volver al inicio">
                            <Logo />
                        </a>
                    </div>

                    <div className="hidden md:block">
                        {isLegal ? (
                            <button onClick={() => setPage('main')} className="text-text-secondary hover:text-sbs-blue font-medium flex items-center px-4 py-2 rounded-full transition-colors text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200">
                                <X className="w-4 h-4 mr-2" />
                                Cerrar
                            </button>
                        ) : shouldShowSaveExit && (
                            <button onClick={handleExit} className="text-text-secondary hover:text-sbs-blue hover:border-sbs-blue/30 font-medium flex items-center border border-premium-border px-6 py-2.5 rounded-full transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md">
                                <LogIn className="w-4 h-4 mr-2 rotate-180" />
                                Salir
                            </button>
                        )}
                    </div>

                    <div className="md:hidden relative z-50">
                        {canShowMobileMenu && (
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="focus:outline-none p-2 rounded-md transition-colors text-text-secondary hover:bg-gray-100">
                                {isMenuOpen ? (
                                    <X className="h-8 w-8" />
                                ) : (
                                    <Menu className="h-8 w-8" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isMenuOpen && canShowMobileMenu && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-premium-border shadow-xl absolute w-full top-full left-0 animate-fade-in-up">
                    <div className="px-6 py-8 space-y-4 flex flex-col items-center">
                        {isLegal ? (
                            <button
                                onClick={() => { setIsMenuOpen(false); setPage('main'); }}
                                className="w-full text-center font-medium py-3 px-8 rounded-full bg-gray-100 text-text-secondary hover:text-sbs-blue hover:bg-gray-200 transition-colors"
                            >
                                Cerrar
                            </button>
                        ) : shouldShowSaveExit && (
                            <button
                                onClick={() => { setIsMenuOpen(false); handleExit(); }}
                                className="w-full text-center font-medium py-3 px-8 rounded-full bg-white border border-gray-200 shadow-sm text-text-secondary hover:text-sbs-blue hover:bg-gray-50 transition-colors"
                            >
                                Salir
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
