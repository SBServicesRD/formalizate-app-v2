import React from 'react';
import { Facebook, Instagram, Linkedin, Lock } from 'lucide-react';

type PageView = 'main' | 'privacy' | 'terms' | 'refund';

interface FooterProps {
    setPage: (page: PageView) => void;
}

const SocialIcon: React.FC<{ href: string; children: React.ReactNode; 'aria-label': string }> = ({ href, children, 'aria-label': ariaLabel }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sbs-gray-400 hover:text-sbs-red transition-colors" aria-label={ariaLabel}>
        {children}
    </a>
);

const Footer: React.FC<FooterProps> = ({ setPage }) => {
    return (
        <footer className="bg-sbs-blue text-white pt-16 pb-8" id="contacto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-center md:text-left">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold flex items-center justify-center md:justify-start">Formalizate<tspan fill="#E63A47" dx="2">•</tspan><tspan dx="2">app</tspan></h3>
                        <p className="text-sbs-gray-300 text-sm leading-relaxed">Simplificamos la formalización de tu empresa en República Dominicana. Profesionales en cumplimiento legal, fiscal y contable.</p>
                        
                        <div className="space-y-3 text-sbs-gray-200 text-sm">
                            <p className="flex items-center justify-center md:justify-start"><span className="font-bold w-20 flex-shrink-0 text-left">Dirección:</span> <span>Calle A #2, La Agustina, D.N.</span></p>
                            <p className="flex items-center justify-center md:justify-start"><span className="font-bold w-20 flex-shrink-0 text-left">Email:</span> <a href="mailto:soporte@formalizate.app" className="hover:text-sbs-red transition-colors">soporte@formalizate.app</a></p>
                            <p className="flex items-center justify-center md:justify-start"><span className="font-bold w-20 flex-shrink-0 text-left">Teléfono:</span> <a href="tel:8296487176" className="hover:text-sbs-red transition-colors">(829) 648-7176</a></p>
                        </div>
                    </div>

                    <div className="md:col-start-3">
                        <h4 className="font-bold tracking-wider uppercase text-sm mb-6 text-sbs-gray-400">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('privacy'); }} className="text-sbs-gray-300 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">Política de Privacidad</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('terms'); }} className="text-sbs-gray-300 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">Términos y Condiciones</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('refund'); }} className="text-sbs-gray-300 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">Política de Reembolso</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold tracking-wider uppercase text-sm mb-6 text-sbs-gray-400">Horario & Redes</h4>
                        <div className="text-sbs-gray-300 text-sm mb-6">
                            <p>Lunes - Viernes: 8:00 AM - 5:00 PM</p>
                            <p>Sábados: 9:00 AM - 12:00 PM</p>
                        </div>
                        <div className="flex space-x-6 justify-center md:justify-start">
                            <SocialIcon href="https://web.facebook.com/sbservicesrd/?_rdc=1&_rdr#" aria-label="Facebook">
                                <Facebook className="h-6 w-6" />
                            </SocialIcon>
                            <SocialIcon href="https://instagram.com/sbservicesrd" aria-label="Instagram">
                                <Instagram className="h-6 w-6" />
                            </SocialIcon>
                            <SocialIcon href="https://www.linkedin.com/company/sbservicesrd/?viewAsMember=true" aria-label="LinkedIn">
                                <Linkedin className="h-6 w-6" />
                            </SocialIcon>
                            <SocialIcon href="https://x.com/sbservicesrd" aria-label="X (Twitter)">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </SocialIcon>
                        </div>
                    </div>
                </div>

                <div className="border-t border-sbs-blue-light/20 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-xs text-sbs-gray-400 uppercase tracking-widest mb-3">Pagos Seguros</span>
                        <div className="flex items-center space-x-4">
                            <img src="https://storage.googleapis.com/pics_html/Visa_Inc._logo.svg" alt="Visa" className="h-5 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
                            <img src="https://storage.googleapis.com/pics_html/Mastercard-logo.svg" alt="MasterCard" className="h-5 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
                            <img src="https://storage.googleapis.com/pics_html/PayPal.svg" alt="PayPal" className="h-5 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
                            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                                <svg className="h-6 w-6 text-white mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Transferencia Bancaria">
                                    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                                </svg>
                                <span className="text-xs font-bold text-white leading-none">Transferencias</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <span className="text-xs text-sbs-gray-400 uppercase tracking-widest mb-3">Protección de Datos</span>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                                <img src="https://storage.googleapis.com/pics_html/Visa_Inc._logo.svg" alt="Visa" className="h-4 w-auto brightness-0 invert mr-1.5" />
                                <span className="text-xs font-bold text-white leading-none">Secure</span>
                            </div>
                            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                                <img src="https://storage.googleapis.com/pics_html/Mastercard-logo.svg" alt="MasterCard" className="h-4 w-auto brightness-0 invert mr-1.5" />
                                <span className="text-xs font-bold text-white leading-none">ID Check</span>
                            </div>
                            <div className="flex items-center text-sbs-gray-300 opacity-80 hover:opacity-100 transition-opacity">
                                <Lock className="h-5 w-5 mr-1" />
                                <span className="text-xs">SSL 256-bit</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-sbs-blue-light/10 flex flex-col md:flex-row justify-between items-center text-sbs-gray-500 text-xs gap-4 text-center md:text-left">
                    <p>&copy; {new Date().getFullYear()} Formalizate.app / Smart Biz Services S.R.L. Todos los derechos reservados. RNC: 1-31-68858-6</p>
                    <div className="flex items-center justify-center space-x-2">
                        <span>Powered by</span>
                        <img src="https://storage.googleapis.com/pics_html/logo_sbs_forms.png" alt="Smart Biz Services" className="h-5 brightness-0 invert" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

