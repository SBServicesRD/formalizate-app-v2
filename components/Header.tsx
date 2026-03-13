import React, { useState, useEffect } from 'react';
import { LogIn, X, Menu } from 'lucide-react';

type PageView = 'main' | 'privacy' | 'terms' | 'refund';

interface HeaderProps {
    isLanding: boolean;
    showSaveExit?: boolean;
    isDashboard?: boolean;
    isLegal?: boolean;
    onStart: () => void;
    setPage: (page: PageView) => void;
    onExit?: () => void;
}

const Logo: React.FC<{ lightMode: boolean }> = ({ lightMode }) => (
    <svg width="220" height="50" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 sm:w-[200px] h-auto">
        <text x="2" y="33" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="700" fill={lightMode ? "#FFFFFF" : "#1D3557"} letterSpacing="-0.02em">
            Formalízate<tspan fill="#E63A47" dx="2">•</tspan><tspan dx="2">app</tspan>
        </text>
    </svg>
);

const NavLink: React.FC<{ 
    name: string; 
    id: string; 
    isActive: boolean; 
    lightMode: boolean; 
    onClick: (id: string) => void 
}> = ({ name, id, isActive, lightMode, onClick }) => (
    <a 
        href={`#${id}`} 
        onClick={(e) => { e.preventDefault(); onClick(id); }}
        className={`text-sm font-medium transition-all duration-300 px-4 py-2 rounded-full
            ${isActive 
                ? (lightMode ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-sbs-blue/10 text-sbs-blue') 
                : (lightMode ? 'text-gray-100 hover:text-white hover:bg-white/10' : 'text-text-secondary hover:text-sbs-blue hover:bg-gray-50')
            }
        `}
    >
        {name}
    </a>
);

const Header: React.FC<HeaderProps> = ({ isLanding, showSaveExit = false, isDashboard = false, isLegal = false, onStart, setPage, onExit }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('inicio');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);

            if (isLanding) {
                const sections = ['inicio', 'resultados', 'servicios', 'proceso', 'legalidad', 'faq'];
                let current = '';
                
                for (const section of sections) {
                    const element = document.getElementById(section);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        if (rect.top <= 150) {
                            current = section;
                        }
                    }
                }
                
                if (current) {
                    setActiveSection(current);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLanding]);

    const scrollToSection = (sectionId: string) => {
        setPage('main');
        setIsMenuOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
    const handleExit = () => {
        if (confirm("¿Estás seguro de que quieres guardar y salir?")) {
            if (onExit) {
                onExit();
            } else {
                window.location.reload();
            }
        }
    }

    const handleLogoClick = () => {
        if (isLegal) {
            setPage('main');
        } else if (isLanding) {
            scrollToSection('inicio');
        } else {
            handleExit();
        }
    }

    const navLinks = [
        { name: 'Inicio', id: 'inicio' },
        { name: 'Resultados', id: 'resultados' },
        { name: 'Planes', id: 'servicios' },
        { name: 'Proceso', id: 'proceso' },
        { name: 'Legalidad', id: 'legalidad' },
        { name: 'FAQ', id: 'faq' },
    ];

    const useLightMode = isLanding && !isScrolled;
    const isTransparent = isLanding && !isScrolled;
    const shouldShowSaveExit = showSaveExit && !isDashboard;
    const canShowMobileMenu = isLanding || shouldShowSaveExit || isLegal;

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isTransparent ? 'bg-transparent border-b border-transparent py-6' : 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm py-3'}`}>
            <div className="w-full max-w-[95%] xl:max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity z-50">
                         <a href="#" onClick={(e) => {e.preventDefault(); handleLogoClick()}} aria-label="Volver al inicio">
                            <Logo lightMode={useLightMode} />
                        </a>
                    </div>

                    {isLanding ? (
                        <div className="hidden md:flex items-center">
                            <nav className="flex space-x-1">
                               {navLinks.map(link => (
                                   <NavLink 
                                       key={link.id} 
                                       name={link.name} 
                                       id={link.id} 
                                       isActive={activeSection === link.id}
                                       lightMode={useLightMode}
                                       onClick={scrollToSection}
                                   />
                               ))}
                            </nav>
                        </div>
                    ) : (
                        <div className="hidden md:block">
                            {isLegal ? (
                                <button onClick={() => setPage('main')} className="text-text-secondary hover:text-sbs-blue font-medium flex items-center px-4 py-2 rounded-full transition-colors text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200">
                                    <X className="w-4 h-4 mr-2" />
                                    Cerrar
                                </button>
                            ) : shouldShowSaveExit && (
                                <button onClick={handleExit} className="text-text-secondary hover:text-sbs-blue hover:border-sbs-blue/30 font-medium flex items-center border border-premium-border px-6 py-2.5 rounded-full transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md">
                                    <LogIn className="w-4 h-4 mr-2 rotate-180" />
                                    Guardar y Salir
                                </button>
                            )}
                        </div>
                    )}

                    <div className="md:hidden relative z-50">
                         {canShowMobileMenu && (
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`focus:outline-none p-2 rounded-md transition-colors ${useLightMode ? 'text-white hover:bg-white/10' : 'text-text-secondary hover:bg-gray-100'}`}>
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
                         {isLanding && navLinks.map(link => (
                             <a 
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}
                                className={`text-lg font-medium py-3 px-8 rounded-full w-full text-center transition-all duration-500 ease-in-out
                                    ${activeSection === link.id ? 'bg-sbs-blue text-white shadow-md' : 'bg-transparent text-text-secondary hover:text-sbs-blue hover:bg-gray-50'}`}
                            >
                                {link.name}
                            </a>
                         ))}
                         
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
                                Guardar y Salir
                            </button>
                         )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;

