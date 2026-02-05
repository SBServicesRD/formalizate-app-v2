import React, { useState, useEffect } from 'react';
import { PACKAGES, PackageName, TESTIMONIALS } from '../constants';
import { Check, X, ArrowRight, HelpCircle, Clock, DollarSign, CheckCircle, ChevronDown, Lock, Star, ArrowDown, IdCard, FileSignature, Building2, BadgeCheck, FileText, Landmark } from 'lucide-react';

interface LandingPageProps {
    onStart: (selectedPackage: PackageName) => void;
}

const CheckIcon = () => (
    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mx-auto" strokeWidth={3} />
);

const CrossIcon = () => (
    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mx-auto" />
);

const TextVal = ({ text }: { text: string }) => (
    <span className="text-sm font-bold text-sbs-blue">{text}</span>
);

const ArrowRightIcon = () => (
    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
);

const PricingTooltip = ({ title, items, align = "center" }: { title: string, items: string[], align?: "center" | "left" }) => (
    <div className="group relative inline-flex items-center ml-1">
        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-sbs-blue transition-colors" />
        <div className={`absolute bottom-full mb-2 hidden group-hover:block w-64 bg-sbs-blue text-white text-xs rounded-xl p-4 shadow-xl z-50 text-left border border-white/10 ${align === 'left' ? 'left-0' : 'left-1/2 transform -translate-x-1/2'}`}>
            <p className="font-bold mb-2 border-b border-white/20 pb-1 text-center">{title}</p>
            <ul className="space-y-1.5 list-disc pl-3">
                {items.map((item, idx) => (
                    <li key={idx} className="leading-tight">{item}</li>
                ))}
            </ul>
            <div className={`absolute top-full w-3 h-3 bg-sbs-blue rotate-45 ${align === 'left' ? 'left-4' : 'left-1/2 transform -translate-x-1/2'}`}></div>
        </div>
    </div>
);

const HeroSection: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <section id="inicio" className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
        <div className="absolute inset-0 z-0">
            {/* Hero principal: estructura responsive con picture/srcset para optimizar LCP en móviles */}
            <picture>
                <source 
                    media="(max-width: 768px)" 
                    srcSet="https://storage.googleapis.com/pics_html/formalizateapp-heropic-mobile.webp"
                    type="image/webp"
                />
                <img 
                    src="https://storage.googleapis.com/pics_html/formalizateapp-heropic.webp" 
                    alt="Equipo profesional legal de Formalizate.app trabajando en una oficina moderna" 
                    className="w-full h-full object-cover object-[25%] md:object-center"
                    fetchPriority="high"
                    loading="eager"
                    width="1920"
                    height="1080"
                    decoding="async"
                />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-b from-sbs-blue/80 via-sbs-blue/40 to-black/80 backdrop-blur-[1px]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-8 md:mb-10 leading-[1.1] tracking-tight drop-shadow-2xl max-w-4xl">
                <span className="md:hidden block">Formaliza tu empresa en RD 100% online.</span>
                <span className="hidden md:block">
                    Formaliza tu empresa<br className="hidden md:block" /> en RD 100% online.
                </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-2xl text-gray-100 max-w-3xl mx-auto mb-4 leading-relaxed font-normal drop-shadow-lg bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/5">
                <span className="md:hidden block">Un proceso claro y respaldado legalmente para operar en RD, sin trámites presenciales ni pérdida de tiempo.</span>
                <span className="hidden md:inline">Un proceso claro y respaldado legalmente para operar en RD, sin trámites presenciales ni pérdida de tiempo.</span>
            </p>
            <p className="text-sm sm:text-base text-gray-100 max-w-3xl mx-auto mb-12 leading-relaxed font-normal drop-shadow bg-black/10 backdrop-blur-sm px-6">
                <span className="md:hidden block">Diseñado para personas ocupadas que quieren hacerlo bien desde el inicio.</span>
                <span className="hidden md:inline">Diseñado para personas ocupadas que quieren hacerlo bien desde el inicio.</span>
            </p>
            
            <div className="flex flex-col items-center gap-6 w-full">
                <button
                    onClick={onStart}
                    className="group bg-red-gradient text-white font-bold py-5 px-10 md:py-6 md:px-14 rounded-full text-lg md:text-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-red shadow-2xl flex items-center ring-4 ring-white/10 active:scale-95"
                >
                    Formalízate Ahora!
                    <ArrowRightIcon />
                </button>
            </div>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce text-white/30 hidden md:block">
            <ArrowDown className="w-6 h-6" />
        </div>
    </section>
);

const TrustIndicatorsSection = () => (
    <section className="bg-white border-b border-gray-100 py-5 relative z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="flex items-start justify-start md:justify-start px-4 py-2 group gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-sbs-blue flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sbs-blue font-bold text-base">Obtención de RNC sin gestiones presenciales</p>
                        <p className="text-gray-500 text-sm">Sin filas ni burocracia</p>
                    </div>
                </div>

                <div className="flex items-start justify-start md:justify-center px-4 py-2 group gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-sbs-blue flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sbs-blue font-bold text-base">Proceso guiado y estructurado</p>
                        <p className="text-gray-500 text-sm">Impuestos incluidos</p>
                    </div>
                </div>

                <div className="flex items-start justify-start md:justify-end px-4 py-2 group gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-sbs-blue flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sbs-blue font-bold text-base">Cumplimiento legal desde el inicio</p>
                        <p className="text-gray-500 text-sm">Gestión experta</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

interface GoogleReview {
    author_name: string;
    profile_photo_url: string | null;
    rating: number;
    text: string;
    relative_time_description: string;
}

const BentoGridSection = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const steps = [
        { 
            title: "Protección y validación del nombre comercial", 
            desc: (
                <>
                    <span className="md:hidden block">Nombre protegido y listo para uso exclusivo.</span>
                    <span className="hidden md:inline">Validamos y protegemos tu nombre comercial para asegurar su disponibilidad y uso exclusivo desde el inicio del proceso.</span>
                </>
            ), 
            Icon: IdCard 
        },
        { 
            title: "Constitución y registro legal de la empresa", 
            desc: (
                <>
                    <span className="md:hidden block">Constitución registrada conforme a la ley.</span>
                    <span className="hidden md:inline">Estructuramos y registramos legalmente tu empresa conforme a la normativa vigente, asegurando una constitución correcta desde el primer momento.</span>
                </>
            ), 
            Icon: FileSignature 
        },
        { 
            title: "Activación fiscal y alta ante la DGII", 
            desc: (
                <>
                    <span className="md:hidden block">RNC y alta fiscal listos para operar.</span>
                    <span className="hidden md:inline">Gestionamos la obtención del RNC y el alta fiscal para que tu empresa pueda operar legalmente y cumplir con sus obligaciones tributarias.</span>
                </>
            ), 
            Icon: BadgeCheck 
        },
        { 
            title: "Empresa formalizada y lista para operar", 
            desc: (
                <>
                    <span className="md:hidden block">Documentos y control listos para operar.</span>
                    <span className="hidden md:inline">Recibes tu empresa completamente formalizada, con acceso a tu documentación y visibilidad total del proceso.</span>
                </>
            ), 
            Icon: Building2 
        }
    ];

    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/reviews');
                const data = await response.json();
                
                if (data.reviews && data.reviews.length > 0) {
                    setReviews(data.reviews);
                }
            } catch {
                // Silently fall back to static testimonials
            } finally {
                setIsLoadingReviews(false);
            }
        };

        fetchReviews();
    }, []);

    const displayReviews = reviews.length > 0 
        ? reviews.map(r => ({
            name: r.author_name,
            text: r.text,
            rating: r.rating,
            date: r.relative_time_description,
            photo: r.profile_photo_url
        }))
        : TESTIMONIALS.map(t => ({
            name: t.name,
            text: t.text,
            rating: t.rating,
            date: t.date,
            photo: null
        }));

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev + 1) % steps.length);
        }, 3500);

        const reviewInterval = setInterval(() => {
            setCurrentReviewIndex((prev) => (prev + 1) % displayReviews.length);
        }, 6000); // Ligeramente más lento para leer reseñas

        return () => {
            clearInterval(stepInterval);
            clearInterval(reviewInterval);
        };
    }, [displayReviews.length]);

    return (
        <section id="proceso" className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-5xl font-bold text-sbs-blue mb-6 tracking-tight leading-tight">
                        <span className="md:hidden block">Ingeniería legal para formalizar tu empresa sin perder tiempo ni cometer errores</span>
                        <span className="hidden md:block">Ingeniería legal, diseñada para hacer las cosas bien desde el inicio.</span>
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto text-xl font-light">
                        <span className="md:hidden block">Una plataforma legal diseñada para hacer las cosas bien desde el inicio.</span>
                        <span className="hidden md:inline">Una plataforma que combina tecnología y respaldo legal para que tu empresa quede correctamente formalizada, con control y visibilidad durante todo el proceso.</span>
                    </p>
                    <p className="text-sm text-text-secondary mt-3 md:hidden">Con acompañamiento profesional real, desde la validación inicial hasta la empresa lista para operar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[300px] gap-6">
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-[2rem] p-10 border border-premium-border/60 hover:border-sbs-blue/20 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative shadow-premium-card hover:shadow-premium-hover">
                        <div className="absolute top-6 right-6 flex space-x-2">
                            {steps.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'bg-sbs-blue w-4' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>

                        <div className="relative h-full flex flex-col z-10">
                            <div key={currentStepIndex} className="animate-fade-in-up">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-gray-100 mb-6 text-sbs-blue group-hover:scale-110 transition-transform duration-300">
                                    {React.createElement(steps[currentStepIndex].Icon, { className: "w-6 h-6", strokeWidth: 1.5 })}
                                </div>
                                <h3 className="text-3xl font-bold text-sbs-blue mb-3 tracking-tight">{steps[currentStepIndex].title}</h3>
                                <p className="text-text-secondary leading-relaxed text-lg font-light">{steps[currentStepIndex].desc}</p>
                            </div>
                        </div>

                    </div>

                    <div className="col-span-1 row-span-1 md:row-span-2 relative rounded-[2rem] overflow-hidden group cursor-pointer shadow-premium-card hover:shadow-2xl transition-all duration-500">
                        <img 
                            src="https://storage.googleapis.com/pics_html/formalizateapp-docspic.webp" 
                            alt="Edificio corporativo moderno con fachada de cristal" 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                            width="1080"
                            height="1920"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <h3 className="text-2xl font-bold mb-2">No es hacerlo tú mismo. No es un gestor tradicional. Es un sistema.</h3>
                            <p className="text-sm text-gray-300">formalizate.app elimina la fricción, los errores comunes y la pérdida de tiempo asociados a los procesos tradicionales de formalización, ofreciendo una experiencia estructurada, digital y respaldada por profesionales.</p>
                        </div>
                    </div>

                    <div className="col-span-1 bg-[#0F172A] rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl border border-slate-800 flex flex-col justify-center">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                         <div className="relative z-10 mb-6">
                             <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5">
                                 <span className="relative flex h-2 w-2">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                 </span>
                                 <span className="text-[10px] font-bold text-white tracking-widest uppercase">Sistema Activo</span>
                             </div>
                         </div>

                         <div className="absolute top-12 right-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none transform rotate-12">
                             <svg width="140" height="140" viewBox="0 0 160 160" fill="none">
                                 <circle cx="80" cy="80" r="78" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                                 <circle cx="80" cy="80" r="50" stroke="white" strokeWidth="0.5" />
                                 <path d="M80 80L80 30" stroke="white" strokeWidth="1" strokeLinecap="round" />
                                 <circle cx="80" cy="80" r="3" fill="white" />
                             </svg>
                         </div>
                         
                         <div className="relative z-10">
                             <h4 className="text-white text-2xl font-bold leading-tight mb-4 tracking-tight">
                                 Respaldo profesional real
                             </h4>
                             
                             <div className="w-12 h-1 bg-gradient-to-r from-sbs-red to-orange-500 rounded-full"></div>
                             <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-3">Equipo legal y operativo acompañando cada paso</p>
                         </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-2 relative rounded-[2rem] overflow-hidden group shadow-premium-card">
                    {/* Fondo desenfocado: preparado para versión WebP sin romper el JPG actual */}
                    <picture>
                        {/* Cuando subas la versión optimizada, usa exactamente esta ruta WebP */}
                        <source 
                            srcSet="https://storage.googleapis.com/pics_html/hero-bg.webp"
                            type="image/webp"
                        />
                        <img 
                            src="https://storage.googleapis.com/pics_html/hero-bg.jpg" 
                            alt="Profesionales en reunión de negocios en Santo Domingo" 
                            className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 brightness-75"
                            loading="lazy"
                            decoding="async"
                            width="1920"
                            height="1080"
                        />
                    </picture>
                        
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-lg relative min-h-[220px] flex flex-col justify-center">
                                <div className="absolute top-6 right-6 opacity-80 bg-white p-1 rounded-full shadow-sm">
                                     <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                </div>

                                {displayReviews.length > 0 && displayReviews[currentReviewIndex] && (
                                    <div key={currentReviewIndex} className="animate-fade-in-up">
                                        <div className="flex items-center mb-4">
                                            <div className="flex text-yellow-400 space-x-1">
                                                {[...Array(displayReviews[currentReviewIndex].rating)].map((_, i) => (
                                                    <Star key={i} className="w-5 h-5 fill-current" />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400 ml-2 font-medium">{displayReviews[currentReviewIndex].date}</span>
                                        </div>
                                        
                                        <p className="text-text-primary text-lg font-medium italic mb-4 leading-relaxed line-clamp-3">
                                            "{displayReviews[currentReviewIndex].text}"
                                        </p>
                                        
                                        <div className="flex items-center">
                                            {displayReviews[currentReviewIndex].photo ? (
                                                <img 
                                                    src={displayReviews[currentReviewIndex].photo!} 
                                                    alt={displayReviews[currentReviewIndex].name}
                                                    className="w-8 h-8 rounded-full mr-3 shadow-md object-cover"
                                                    width="32"
                                                    height="32"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-sbs-blue text-white flex items-center justify-center text-xs font-bold mr-3 shadow-md">
                                                    {displayReviews[currentReviewIndex].name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-bold text-sbs-blue uppercase tracking-wide">{displayReviews[currentReviewIndex].name}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center">
                                                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                                                    Verificado en Google
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                     <div className="col-span-1 bg-white rounded-[2rem] p-8 shadow-premium-card hover:shadow-premium-hover transition-all duration-500 group border border-premium-border/60">
                        <div className="h-full flex flex-col justify-between">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-sbs-blue mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Lock className="w-6 h-6" />
                            </div>
                            
                            <div>
                                 <h4 className="text-sbs-blue text-lg font-bold leading-snug mb-2">Tu información está protegida conforme a la Ley 172-13 de Datos Personales y principios modernos de seguridad digital.</h4>
                                 <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Privacidad garantizada</p>
                            </div>
                        </div>
                     </div>

                </div>
            </div>
        </section>
    );
};

const docImages = {
    onapi: "https://storage.googleapis.com/pics_html/reg-onapi.webp",
    estatutos: "https://storage.googleapis.com/pics_html/estatutos-soc.webp",
    mercantil: "https://storage.googleapis.com/pics_html/reg-mercantil.webp",
    rnc: "https://storage.googleapis.com/pics_html/acta-rnc%20copy.webp",
    rpe: "https://storage.googleapis.com/pics_html/reg-proovedor.webp"
};

const AbstractDocument = ({ type }: { type: 'onapi' | 'estatutos' | 'mercantil' | 'rnc' | 'rpe' }) => {
    const paperClass = "w-[300px] h-[400px] bg-white relative flex flex-col shadow-xl rounded overflow-hidden";
    
    return (
        <div className={paperClass}>
            <img
                src={docImages[type]}
                alt={`Documento ${type}`}
                width={300}
                height={400}
                className="w-full h-full object-cover rounded-[inherit]"
                loading="lazy"
            />
        </div>
    );
};

const LegalDocCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const docs: ('onapi' | 'estatutos' | 'mercantil' | 'rnc' | 'rpe')[] = ['onapi', 'estatutos', 'mercantil', 'rnc', 'rpe'];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % docs.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Background paper stack */}
            <div className="absolute w-[300px] h-[400px] bg-white rounded shadow-lg border border-gray-100 transform rotate-6 opacity-30"></div>
            <div className="absolute w-[300px] h-[400px] bg-white rounded shadow-lg border border-gray-100 transform -rotate-3 opacity-50"></div>

            {/* Carousel */}
            <div className="relative w-[300px] h-[400px] z-10"> 
                {docs.map((doc, idx) => (
                    <div 
                        key={doc}
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                            idx === activeIndex 
                                ? 'opacity-100 translate-x-0 scale-100 z-20' 
                                : 'opacity-0 translate-x-10 scale-95 z-0'
                        }`}
                    >
                        <AbstractDocument type={doc} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const LegalidadSection = () => (
    <section id="legalidad" className="py-32 bg-premium-surface-subtle relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="absolute top-1/2 right-0 w-1/3 h-1/3 bg-sbs-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Content */}
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-sbs-blue mb-6 tracking-tight leading-tight">
                        Cumplimiento <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sbs-blue to-sbs-blue-light">Normativo sin estrés</span>
                    </h2>
                    <p className="text-lg text-text-secondary mb-10 font-light leading-relaxed max-w-lg">
                        <span className="md:hidden block">Nos aseguramos de que tu empresa quede correctamente constituida y respaldada, cumpliendo desde el inicio con cada requisito legal y fiscal aplicable.</span>
                        <span className="hidden md:inline">
                            Nos aseguramos de que tu empresa quede correctamente constituida y respaldada, cumpliendo desde el inicio con cada requisito legal y fiscal aplicable.
                            <br/><br/>
                            Cada documento, registro y certificación se gestiona de forma correcta y verificable, para que tu empresa opere con tranquilidad y sin riesgos legales.
                        </span>
                    </p>
                    <p className="text-sm text-text-secondary md:hidden">Cada documento, registro y certificación se gestiona de forma correcta y verificable, para que tu empresa opere con tranquilidad y sin riesgos legales.</p>

                    <div className="space-y-4 hidden md:block"></div>
                </div>

                <div className="relative h-[500px] w-full flex items-center justify-center">
                    <LegalDocCarousel />
                </div>
            </div>
        </div>
    </section>
);

const PricingTable: React.FC<{ onSelect: (pkg: PackageName) => void }> = ({ onSelect }) => {
    const featuresList = [
        "Firma Digital para F.E.",
        "Nombre Comercial",
        "Documentos Constitutivos",
        "Registro Mercantil",
        "RNC",
        "Sello Automático",
        "Oficina Virtual DGII",
        "Comprobantes Fiscales",
        "Registros Laborales",
        "Dominio Web",
        "Correos Institucionales",
        "Página Web Informativa",
        "Registro Import/Export en DGA",
        "Registro Proveedor del Estado",
        "Certificación MiPyme",
        "Plantillas Empresariales",
        "Plan de cumplimiento tributario",
        "Soporte"
    ];

    const matrix: Record<string, Record<PackageName, React.ReactNode>> = {
        "Firma Digital para F.E.": { "Starter Pro": <TextVal text="1 año" />, "Essential 360": <TextVal text="2 años" />, "Unlimitech": <TextVal text="3 años" /> },
        "Nombre Comercial": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "Documentos Constitutivos": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "Registro Mercantil": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "RNC": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "Sello Automático": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "Oficina Virtual DGII": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "Comprobantes Fiscales": { "Starter Pro": true, "Essential 360": true, "Unlimitech": true },
        "Registros Laborales": { "Starter Pro": false, "Essential 360": true, "Unlimitech": true },
        "Dominio Web": { "Starter Pro": false, "Essential 360": <TextVal text="1 año" />, "Unlimitech": <TextVal text="2 años" /> },
        "Correos Institucionales": { "Starter Pro": false, "Essential 360": <TextVal text="3 cuentas" />, "Unlimitech": <TextVal text="5 cuentas" /> },
        "Página Web Informativa": { "Starter Pro": false, "Essential 360": false, "Unlimitech": <TextVal text="1 año" /> },
        "Registro Import/Export en DGA": { "Starter Pro": false, "Essential 360": false, "Unlimitech": true },
        "Registro Proveedor del Estado": { "Starter Pro": false, "Essential 360": false, "Unlimitech": true },
        "Certificación MiPyme": { "Starter Pro": false, "Essential 360": false, "Unlimitech": true },
        
        "Plantillas Empresariales": { 
            "Starter Pro": <TextVal text="Básicas" />, 
            "Essential 360": <TextVal text="Premium" />, 
            "Unlimitech": <TextVal text="Pro" /> 
        },
        
        "Plan de cumplimiento tributario": { "Starter Pro": false, "Essential 360": <TextVal text="1 mes" />, "Unlimitech": <TextVal text="2 meses" /> },
        
        "Soporte": { 
            "Starter Pro": <TextVal text="Básico" />, 
            "Essential 360": <TextVal text="Estándar" />, 
            "Unlimitech": <TextVal text="Prioritario" /> 
        },
    };

    const renderCell = (val: React.ReactNode) => {
        if (typeof val === 'boolean') {
            return val ? <CheckIcon /> : <CrossIcon />;
        }
        return val;
    };

    const renderFeatureName = (feature: string) => {
        if (feature === "Firma Digital para F.E.") {
            return (
                <div className="flex items-center">
                    {feature}
                    <PricingTooltip 
                        title="Facturación Electrónica" 
                        items={[
                            "Requisito obligatorio para facturar electrónicamente.",
                            "Mandatorio a partir del 15 de mayo de 2026."
                        ]} 
                    />
                </div>
            );
        }
        if (feature === "Documentos Constitutivos") {
            return (
                <div className="flex items-center">
                    {feature}
                    <PricingTooltip 
                        title="Documentos Legales" 
                        items={[
                            "Estatutos Sociales",
                            "Acta de Asamblea Constitutiva",
                            "Nómina de Socios"
                        ]} 
                    />
                </div>
            );
        }
        if (feature === "Registros Laborales") {
            return (
                <div className="flex items-center">
                    {feature}
                    <PricingTooltip 
                        title="Gestión Laboral" 
                        items={[
                            "Registro en la TSS",
                            "Registro en el SIRLA",
                            "Acceso a la plataforma SUIR"
                        ]} 
                    />
                </div>
            );
        }
        if (feature === "Plantillas Empresariales") {
            return (
                <div className="flex items-center">
                    {feature}
                    <PricingTooltip 
                        title="Herramientas de Gestión" 
                        items={[
                            "Básicas: Cartas de Banco y Facturas",
                            "Premium: + Contratos Laborales y NDAs",
                            "Pro: + Contratos Servicios y Actas"
                        ]} 
                    />
                </div>
            );
        }
        if (feature === "Soporte") {
             return (
                <div className="flex items-center">
                    {feature}
                    <PricingTooltip 
                        title="Niveles de Soporte" 
                        align="left"
                        items={[
                            "Básico: Email (24-48h)",
                            "Estándar: Email + Chat",
                            "Prioritario: WhatsApp Directo"
                        ]} 
                    />
                </div>
            );
        }
        return feature;
    }

    return (
        <section id="servicios" className="py-32 relative bg-white">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-5xl font-bold text-sbs-blue mb-6 tracking-tight leading-tight">
                        Planes Transparentes. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sbs-blue to-sbs-blue-light">Resultados Reales.</span>
                    </h2>
                    <p className="text-lg text-text-secondary font-light">
                        <span className="md:hidden block">Elige el nivel de acompañamiento que necesitas.</span>
                        <span className="hidden md:inline">Planes diseñados según el nivel de acompañamiento que tu empresa necesita.</span>
                    </p>
                    <p className="text-sm text-text-secondary font-light mt-2 md:hidden">Elige el nivel de acompañamiento que tu empresa necesita, sin letras pequeñas ni sorpresas.</p>
                    <p className="text-sm text-text-secondary font-light mt-2 hidden md:block">Todos los planes incluyen respaldo legal y un proceso 100% online.</p>
                </div>

                <div className="overflow-x-auto pb-12 pt-24 px-4 -mx-4 md:mx-0">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-3 w-1/4"></th>
                                <th className="p-3 text-center w-1/4">
                                    {/* Increased font sizes by ~15% */}
                                    <div className="text-lg font-bold text-text-secondary mb-2">Starter Pro</div>
                                    <div className="text-2xl font-bold text-text-primary mb-6">{PACKAGES['Starter Pro'].formattedPrice}</div>
                                    <button onClick={() => onSelect('Starter Pro')} className="w-full py-3 rounded-xl border border-gray-200 font-bold text-sm hover:bg-gray-50 transition-colors">Elegir Starter</button>
                                </th>
                                <th className="p-3 pt-12 text-center w-1/4 relative">
                                    <div className="absolute top-0 left-0 right-0 h-full bg-transparent border-x-2 border-t-2 border-gray-300 rounded-t-[2rem] -z-10"></div>
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sbs-blue text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest z-10">Más Popular</div>
                                    {/* Increased font sizes by ~15% */}
                                    <div className="text-lg font-bold text-sbs-blue mb-2 mt-4">Essential 360</div>
                                    <div className="text-2xl font-bold text-text-primary mb-6">{PACKAGES['Essential 360'].formattedPrice}</div>
                                    <button onClick={() => onSelect('Essential 360')} className="w-full py-3 rounded-xl bg-red-gradient text-white font-bold text-sm hover:shadow-glow-red transition-all hover:-translate-y-0.5 active:scale-95">Elegir Essential</button>
                                </th>
                                <th className="p-3 text-center w-1/4">
                                    {/* Increased font sizes by ~15% */}
                                    <div className="text-lg font-bold text-text-secondary mb-2">Unlimitech</div>
                                    <div className="text-2xl font-bold text-text-primary mb-6">{PACKAGES['Unlimitech'].formattedPrice}</div>
                                    <button onClick={() => onSelect('Unlimitech')} className="w-full py-3 rounded-xl border border-gray-200 font-bold text-sm hover:bg-gray-50 transition-colors">Elegir Unlimitech</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {featuresList.map((feature, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                                    <td className="p-3 pl-8 text-base font-medium text-text-secondary border-b border-gray-100">
                                        {renderFeatureName(feature)}
                                    </td>
                                    <td className="p-3 text-center border-b border-gray-100">
                                        {renderCell(matrix[feature]['Starter Pro'])}
                                    </td>
                                    <td className="p-3 text-center border-x-2 border-gray-300 bg-transparent relative">
                                        {renderCell(matrix[feature]['Essential 360'])}
                                    </td>
                                    <td className="p-3 text-center border-b border-gray-100">
                                        {renderCell(matrix[feature]['Unlimitech'])}
                                    </td>
                                </tr>
                            ))}
                             <tr>
                                <td className="p-3"></td>
                                <td className="p-3 text-center"></td>
                                <td className="p-0 relative">
                                    <div className="h-8 w-full bg-transparent border-x-2 border-b-2 border-gray-300 rounded-b-[2rem] absolute top-0 left-0"></div>
                                </td>
                                <td className="p-3 text-center"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

const PaymentTrustSection = () => (
    <section className="bg-white pb-12">
        <div className="max-w-7xl mx-auto px-4 border-t border-gray-100 pt-12">
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="mb-4 md:mb-0">
                    <h4 className="text-sm font-bold text-sbs-blue uppercase tracking-widest mb-1">Respaldo y credibilidad</h4>
                    <p className="text-xs text-text-secondary hidden md:block">formalizate.app opera con el respaldo de Smart Biz Services, firma especializada <br className="hidden md:block"/>en formalización, cumplimiento y contabilidad empresarial en República Dominicana.</p>
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-4 md:space-x-6">
                    <div className="flex space-x-4 items-center opacity-80 hover:opacity-100 transition-opacity justify-center">
                         <div className="flex items-center">
                             <svg className="h-6 w-6 text-gray-700 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Transferencia Bancaria">
                                 <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                             </svg>
                             <span className="text-xs font-bold text-gray-700 leading-none">Transferencias</span>
                         </div>
                         <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 w-auto" width="48" height="24" loading="lazy" decoding="async" />
                         <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="h-6 w-auto" width="48" height="24" loading="lazy" decoding="async" />
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-4 hidden md:block"></div>
                    <div className="flex space-x-4 items-center justify-center">
                         <img src="https://storage.googleapis.com/pics_html/visa-secure_blu_2021%20-%20Copy%20-%20Cop1.png" alt="Visa Secure" className="h-6 w-auto" width="48" height="24" loading="lazy" decoding="async" />
                         <div className="flex items-center space-x-1">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="ID Check" className="h-6 w-auto" width="48" height="24" loading="lazy" decoding="async" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">ID Check</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const FaqSection = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const faqs = [
        { q: "¿Son el portal del gobierno (formalizate.gob.do)?", a: "No. Formalizate.app es una plataforma privada operada por Smart Biz Services. El portal del gobierno es una herramienta de auto-servicio; nosotros somos un servicio gestor Premium que incluye asesoría experta, redacción de estatutos, corrección de errores y garantía de resultado. Con nosotros, no haces filas ni gestionas rechazos." },
        { q: "¿Este proceso es 100% legal y válido?", a: "Absolutamente. Operamos bajo la Ley 479-08 de Sociedades y la Ley 126-02 de Comercio Electrónico. Tus documentos son procesados ante las instituciones oficiales, garantizando la misma validez jurídica que un trámite presencial." },
        { q: "¿Qué sucede después del pago?", a: "Se activa tu Oficina Digital. Recibes acceso inmediato a tu Dashboard donde podrás subir documentos, ver el progreso en tiempo real y descargar tus certificados. Sin esperas." },
        { q: "¿Debo ir físicamente a alguna oficina?", a: "Para constituir la empresa: No. Todo el proceso es 100% remoto. Solo tendrás que visitar el banco al final (si aplica), pero irás con el expediente que nosotros te preparamos." },
        { q: "¿Cuáles son los tiempos reales?", a: "El estándar es de 10 a 15 días laborables. Nuestra tecnología agiliza la preparación, aunque dependemos de los tiempos oficiales de ONAPI, Cámaras de comercio y demás instituciones involucradas en el proceso. Te notificamos cada avance." },
        { q: "¿Qué pasa si hay algún problema?", a: "Estás cubierto por nuestra Garantía de Cero Rechazos. Si una institución objeta tu expediente, nuestro equipo legal gestiona las correcciones y re-sometimientos sin costo adicional." }
    ];
    
    return (
        <section id="faq" className="py-32 bg-premium-surface-subtle/30">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl font-bold text-sbs-blue tracking-tight">Preguntas Frecuentes</h2>
                </div>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-2xl border border-transparent hover:border-premium-border hover:shadow-premium-hover transition-all duration-300 overflow-hidden">
                            <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full flex justify-between items-center text-left p-8 font-medium text-text-primary text-lg">
                                <span>{faq.q}</span>
                                <span className={`transform transition-transform duration-300 text-sbs-blue ${openFaq === index ? 'rotate-180' : ''}`}>
                                     <ChevronDown className="w-6 h-6" />
                                </span>
                            </button>
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-8 pt-0 text-text-secondary leading-relaxed border-t border-gray-50">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const scrollToPlans = () => {
        document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="overflow-hidden font-sans bg-white">
            <HeroSection onStart={scrollToPlans} />
            <TrustIndicatorsSection />
            <BentoGridSection />
            <LegalidadSection />
            <PricingTable onSelect={onStart} />
            <PaymentTrustSection />
            <FaqSection />
        </div>
    );
};

export default LandingPage;
