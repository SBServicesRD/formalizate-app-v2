import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import LandingPage from './components/LandingPage';
import StepProgressBar from './components/StepProgressBar';
import StepTypeSelection from './components/StepTypeSelection';
import StepA from './components/StepA';
import PostPaymentWelcome from './components/PostPaymentWelcome';
import SignupPostPaymentPage from './components/SignupPostPaymentPage';
import PostPaymentForm from './components/PostPaymentForm';
import SuccessPage from './components/SuccessPage';
import DashboardPage from './components/DashboardPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppWidget from './components/WhatsAppWidget';
import SummaryPage from './components/SummaryPage';
import { AppStep, FormData } from './types';
import { MANAGEMENT_DURATION, FISCAL_CLOSING_DATE, PackageName } from './constants';
import StepB from './components/StepB';
import StepC from './components/StepC';

const PaymentPage = lazy(() => import('./components/PaymentPage'));
const SecureDashboard = lazy(() => import('./components/SecureDashboard'));
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const RefundPolicyPage = lazy(() => import('./components/RefundPolicyPage'));

type PageView = 'main' | 'privacy' | 'terms' | 'refund' | 'login';

const LoadingFallback = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg">
        <Loader2 className="w-8 h-8 text-sbs-blue animate-spin" />
        <p className="mt-4 text-text-secondary text-sm">Cargando...</p>
    </div>
);

// SECURITY: Version bump to invalidate potential corrupted old states
const getLocalStorageKey = (userId: string | null): string => {
    if (userId) {
        return `sbs_form_v7_user_${userId}`;
    }
    return 'sbs_form_v7_guest';
};

const App: React.FC = () => {
    const initialFormState: FormData = {
        companyType: 'SRL',
        
        hasRegisteredName: 'No',
        nameOwnership: 'Un solo socio',

        companyName: '',
        socialObject: '',
        
        companyStreet: '',
        companyStreetNumber: '',
        companySector: '',
        companyCity: '',
        companyProvince: '',

        applicant: {
            names: '',
            surnames: '',
            email: '',
            phone: '',
            isTitular: false
        },
        
        titulars: [],

        fiscalClosing: FISCAL_CLOSING_DATE,
        socialCapital: 100000,
        partners: [],
        manager: { type: 'Socio', name: '', idNumber: '', nationality: 'República Dominicana' },
        managementDuration: MANAGEMENT_DURATION,
        packageName: 'Essential 360',
        paymentStatus: 'unpaid',
        paymentMethod: 'other',
        
        ncfTypes: [],
    };

    const loadSavedState = (userId: string | null) => {
        try {
            const storageKey = getLocalStorageKey(userId);
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                
                if (parsed.formData) {
                    if (parsed.formData.titulars) {
                        parsed.formData.titulars = parsed.formData.titulars.map((t: any) => ({
                            ...t,
                            idFront: null,
                            idBack: null
                        }));
                    }
                    
                    if (parsed.formData.partners) {
                        parsed.formData.partners = parsed.formData.partners.map((p: any) => ({
                            ...p,
                            idFront: null,
                            idBack: null
                        }));
                    }

                    parsed.formData.onapiCertificate = null;
                    parsed.formData.logoFile = null;
                    parsed.formData.paymentReceipt = null;
                }

                return parsed;
            }
        } catch (e) {
        }
        return null;
    };

    const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Landing);
    const [highestStepReached, setHighestStepReached] = useState<AppStep>(AppStep.Landing);
    const [formData, setFormData] = useState<FormData>(initialFormState);
    
    const [page, setPage] = useState<PageView>('main');
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            console.error('Firebase Auth no está disponible');
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const isAuthenticated = !!user;

    useEffect(() => {
        if (isAuthenticated && page === 'login') {
            setStep(AppStep.Dashboard);
            setPage('main');
        }
    }, [isAuthenticated, page]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated && currentStep === AppStep.Dashboard) {
            setPage('login');
            setStep(AppStep.Landing);
        }
    }, [isAuthenticated, authLoading, currentStep]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    useEffect(() => {
        if (!authLoading) {
            const userId = user?.uid || null;
            const storageKey = getLocalStorageKey(userId);
            const stateToSave = {
                formData,
                currentStep,
                highestStepReached
            };
            localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        }
    }, [formData, currentStep, highestStepReached, user, authLoading]);

    const updateFormData = (data: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const setStep = (step: AppStep) => {
        setCurrentStep(step);
        window.scrollTo(0, 0);
        if (step > highestStepReached) {
            setHighestStepReached(step);
        }
    };
    
    const handleStartFlow = (selectedPackage: PackageName) => {
        updateFormData({ packageName: selectedPackage });
        setStep(AppStep.StepTypeSelection);
    };

    const goToNextStep = () => {
        if (currentStep === AppStep.StepA) {
            setStep(AppStep.StepB);
            return;
        }

        if (currentStep === AppStep.StepB) {
             setStep(AppStep.Summary);
             return;
        }

        if (currentStep === AppStep.Summary) {
            setStep(AppStep.Payment);
            return;
        }

        if (currentStep < AppStep.Success) {
            let nextStep = currentStep + 1;
            if (nextStep === AppStep.StepC) {
                nextStep = AppStep.Summary;
            }
            setStep(nextStep);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > AppStep.Landing) {
            if (currentStep === AppStep.Payment) {
                setStep(AppStep.Summary);
                return;
            }
            if (currentStep === AppStep.Summary) {
                setStep(AppStep.StepB);
                return;
            }
            if (currentStep === AppStep.StepB) {
                setStep(AppStep.StepA);
                return;
            }
            const prevStep = currentStep - 1;
            setStep(prevStep);
        }
    };
    
    const goToStep = (step: AppStep) => {
        if (step <= highestStepReached) {
            if (step === AppStep.StepC) return;
            setCurrentStep(step);
        }
    };

    const handlePaymentSuccess = () => {
        setStep(AppStep.Login);
    }

    const handleStepLogin = () => {
        setStep(AppStep.PostPaymentWelcome);
    }

    const handleStandaloneLogin = () => {
    }

    const handleLogout = async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
            setStep(AppStep.Landing);
            setPage('main');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    const handleFinalSubmit = () => {
        try {
            const userId = user?.uid || null;
            const storageKey = getLocalStorageKey(userId);
            localStorage.removeItem(storageKey);
            setStep(AppStep.Success);
        } catch (error) {
            console.error("ERROR AL FINALIZAR LA SOLICITUD:", error);
        }
    }
    
    const goToDashboard = () => {
        if (!isAuthenticated) {
            setPage('login');
            return;
        }
        setStep(AppStep.Dashboard);
    }

    // SECURITY: Payment Guard to prevent access bypass
    const isPaymentVerified = formData.paymentStatus === 'paid' || formData.paymentStatus === 'pending_confirmation';

    const renderFormStep = () => {
        if (currentStep === AppStep.Dashboard) {
            if (!isAuthenticated) {
                setPage('login');
                return null;
            }
        }

        if ([AppStep.Login, AppStep.PostPaymentWelcome, AppStep.PostPaymentForm, AppStep.Success, AppStep.Dashboard].includes(currentStep)) {
            if (!isPaymentVerified) {
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <PaymentPage formData={formData} updateFormData={updateFormData} onPaymentSuccess={handlePaymentSuccess} prevStep={goToPrevStep} />
                    </Suspense>
                );
            }
        }

        switch (currentStep) {
            case AppStep.Landing:
                return <LandingPage onStart={handleStartFlow} />;
            case AppStep.StepTypeSelection:
                return <StepTypeSelection formData={formData} updateFormData={updateFormData} nextStep={goToNextStep} />;
            case AppStep.StepA:
                return <StepA formData={formData} updateFormData={updateFormData} nextStep={goToNextStep} prevStep={goToPrevStep} />;
            case AppStep.StepB:
                 return <StepB formData={formData} updateFormData={updateFormData} nextStep={goToNextStep} prevStep={goToPrevStep} />;
            case AppStep.StepC:
                 return <StepC formData={formData} updateFormData={updateFormData} nextStep={goToNextStep} prevStep={goToPrevStep} />;
            case AppStep.Summary:
                 return <SummaryPage formData={formData} nextStep={goToNextStep} prevStep={goToPrevStep} />;
            case AppStep.Payment:
                 return (
                     <Suspense fallback={<LoadingFallback />}>
                         <PaymentPage formData={formData} updateFormData={updateFormData} onPaymentSuccess={handlePaymentSuccess} prevStep={goToPrevStep} />
                     </Suspense>
                 );
            case AppStep.Login:
                // Post-pago: SOLO signup, nunca login
                return <SignupPostPaymentPage onSignupComplete={handleStepLogin} />;
            case AppStep.PostPaymentWelcome:
                return <PostPaymentWelcome onStartForm={goToNextStep} />;
            case AppStep.PostPaymentForm:
                return <PostPaymentForm formData={formData} updateFormData={updateFormData} onComplete={handleFinalSubmit} />;
            case AppStep.Success:
                return <SuccessPage formData={formData} startOver={goToDashboard} />;
            case AppStep.Dashboard:
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <SecureDashboard
                            user={user}
                            formData={formData}
                            onExit={handleLogout}
                            setStep={setStep}
                        >
                            <DashboardPage formData={formData} onExit={handleLogout} />
                        </SecureDashboard>
                    </Suspense>
                );
            default:
                return <LandingPage onStart={handleStartFlow} />;
        }
    };

    const renderPageContent = () => {
        if (authLoading) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg">
                    <Loader2 className="w-8 h-8 text-sbs-blue animate-spin" />
                    <p className="mt-4 text-text-secondary text-sm">Verificando sesión...</p>
                </div>
            );
        }

        switch (page) {
            case 'privacy': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <PrivacyPolicyPage />
                    </Suspense>
                );
            case 'terms': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <TermsOfServicePage />
                    </Suspense>
                );
            case 'refund': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <RefundPolicyPage />
                    </Suspense>
                );
            case 'login': 
                if (isAuthenticated) {
                    setStep(AppStep.Dashboard);
                    setPage('main');
                    return null;
                }
                return (
                    <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg pt-20 pb-20">
                        <LoginPage onLogin={handleStandaloneLogin} />
                    </div>
                );
            case 'main':
            default:
                if (currentStep === AppStep.Landing) {
                    return <LandingPage onStart={handleStartFlow} />;
                }
                if (currentStep === AppStep.Dashboard) {
                    if (!isAuthenticated) {
                        setPage('login');
                        return null;
                    }
                    if (!isPaymentVerified) {
                        setStep(AppStep.Payment);
                        return null; 
                    }
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <SecureDashboard
                                user={user}
                                formData={formData}
                                onExit={handleLogout}
                                setStep={setStep}
                            >
                                <DashboardPage formData={formData} onExit={handleLogout} />
                            </SecureDashboard>
                        </Suspense>
                    );
                }
                return (
                    <div className="min-h-screen flex flex-col items-center pt-32 pb-24 relative bg-premium-bg">
                        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-premium-surface-subtle to-transparent pointer-events-none z-0" />
                        
                        <main className="w-full max-w-5xl bg-white shadow-premium border border-premium-border p-8 sm:p-16 rounded-[2.5rem] relative z-10 mx-4 animate-fade-in-up">
                             {currentStep >= AppStep.StepTypeSelection && (
                                <nav className="mb-8 flex" aria-label="Breadcrumb">
                                    <ol className="inline-flex items-center space-x-1 md:space-x-3 text-xs font-medium text-gray-400">
                                        <li className="inline-flex items-center">
                                            <a href="#" onClick={(e) => {e.preventDefault(); setStep(AppStep.Landing); setTimeout(() => window.scrollTo(0,0), 100); }} className="hover:text-sbs-blue transition-colors">
                                                Inicio
                                            </a>
                                        </li>
                                        <li>
                                            <div className="flex items-center">
                                                <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
                                                <a href="#" onClick={(e) => {e.preventDefault(); setStep(AppStep.Landing); setTimeout(() => { const el = document.getElementById('servicios'); if(el) el.scrollIntoView(); }, 100); }} className="ml-1 hover:text-sbs-blue transition-colors">
                                                    Planes
                                                </a>
                                            </div>
                                        </li>
                                        {currentStep >= AppStep.StepTypeSelection && (
                                            <li>
                                                <div className="flex items-center">
                                                    <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
                                                    <a href="#" onClick={(e) => {e.preventDefault(); setStep(AppStep.StepTypeSelection);}} className={`ml-1 transition-colors ${currentStep === AppStep.StepTypeSelection ? 'text-sbs-blue font-bold' : 'hover:text-sbs-blue'}`}>
                                                        Estructura
                                                    </a>
                                                </div>
                                            </li>
                                        )}
                                        {currentStep >= AppStep.StepA && (
                                            <li>
                                                <div className="flex items-center">
                                                    <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
                                                    <a href="#" onClick={(e) => {e.preventDefault(); if(currentStep > AppStep.StepA) setStep(AppStep.StepA);}} className={`ml-1 transition-colors ${currentStep >= AppStep.StepA && currentStep < AppStep.Summary ? 'text-sbs-blue font-bold' : 'hover:text-sbs-blue'}`}>
                                                        Configuración
                                                    </a>
                                                </div>
                                            </li>
                                        )}
                                        {currentStep >= AppStep.Summary && (
                                            <li aria-current="page">
                                                <div className="flex items-center">
                                                    <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
                                                    <span className={`ml-1 transition-colors ${currentStep === AppStep.Summary ? 'text-sbs-blue font-bold' : 'hover:text-sbs-blue'}`}>
                                                        Revisión
                                                    </span>
                                                </div>
                                            </li>
                                        )}
                                    </ol>
                                </nav>
                             )}

                            {currentStep >= AppStep.StepTypeSelection && currentStep < AppStep.Login && 
                                <StepProgressBar currentStep={currentStep} highestStepReached={highestStepReached} goToStep={goToStep} />
                            }
                            {renderFormStep()}
                        </main>
                    </div>
                );
        }
    }

    const dummyStart = () => handleStartFlow('Essential 360');
    
    const isLandingPage = currentStep === AppStep.Landing && page === 'main';
    const isDashboard = currentStep === AppStep.Dashboard;
    const isLegalPage = page !== 'main';

    return (
        <div className="bg-premium-bg min-h-screen text-text-primary font-sans selection:bg-sbs-blue selection:text-white">
            <Header 
                isLanding={isLandingPage} 
                showSaveExit={!isLandingPage && !isDashboard && !isLegalPage}
                isDashboard={isDashboard}
                isLegal={isLegalPage}
                onStart={dummyStart} 
                setPage={setPage} 
                onExit={() => setStep(AppStep.Landing)}
            />
            <div className={`${isLandingPage ? '' : 'pt-0'}`}>
                {renderPageContent()}
            </div>
            <WhatsAppWidget />
            <Footer setPage={setPage} />
        </div>
    );
};

export default App;

