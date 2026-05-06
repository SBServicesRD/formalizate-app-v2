import React, { lazy, Suspense } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import LandingPage from './components/LandingPage';
import StepProgressBar from './design/components/StepProgressBar';
import StepTypeSelection from './components/StepTypeSelection';
import StepA from './components/StepA';
import PostPaymentWelcome from './design/components/PostPaymentWelcome';
import SignupPostPaymentPage from './components/SignupPostPaymentPage';
import PostPaymentForm from './components/PostPaymentForm';
import SuccessPage from './design/components/SuccessPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Footer from './design/components/Footer';
import WhatsAppWidget from './components/WhatsAppWidget';
import SummaryPage from './components/SummaryPage';
import { AppStep } from './types';
import StepB from './components/StepB';
import StepC from './components/StepC';
import { useWizardState } from './core/hooks/useWizardState';

const PaymentPage = lazy(() => import('./components/PaymentPage'));
const TermsOfServicePage = lazy(() => import('./design/pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./design/pages/PrivacyPolicyPage'));
const RefundPolicyPage = lazy(() => import('./design/pages/RefundPolicyPage'));

const LoadingFallback = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg">
        <Loader2 className="w-8 h-8 text-sbs-blue animate-spin" />
        <p className="mt-4 text-text-secondary text-sm">Cargando...</p>
    </div>
);

const DashboardPlaceholder = () => (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h1>Próximamente</h1>
        <p>Tu panel de cliente estará disponible aquí.</p>
        <a href="/">← Volver al inicio</a>
    </div>
);

const App: React.FC = () => {
    const {
        currentStep,
        highestStepReached,
        formData,
        updateFormData,
        page, setPage,
        authLoading,
        isAuthenticated,
        isPaymentVerified,
        setStep,
        goToNextStep,
        goToPrevStep,
        goToStep,
        handleStartFlow,
        handlePaymentSuccess,
        handleStepLogin,
        handleStandaloneLogin,
        handleFinalSubmit,
        dummyStart,
    } = useWizardState();

    const renderFormStep = () => {
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
                return <SignupPostPaymentPage onSignupComplete={handleStepLogin} />;
            case AppStep.PostPaymentWelcome:
                return <PostPaymentWelcome onStartForm={goToNextStep} />;
            case AppStep.PostPaymentForm:
                return <PostPaymentForm formData={formData} updateFormData={updateFormData} onComplete={handleFinalSubmit} />;
            case AppStep.Success:
                return <SuccessPage formData={formData} startOver={() => setStep(AppStep.Landing)} />;
            case AppStep.Dashboard:
                return <DashboardPlaceholder />;
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
                    setStep(AppStep.Landing);
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
                    return <DashboardPlaceholder />;
                }
                return (
                    <div className="min-h-screen flex flex-col items-center pt-32 pb-24 relative bg-premium-bg">
                        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-premium-surface-subtle to-transparent pointer-events-none z-0" />

                        <main className="w-full max-w-5xl bg-white shadow-premium border border-premium-border p-8 sm:p-16 rounded-[2.5rem] relative z-10 mx-4 animate-fade-in-up">
                             {currentStep >= AppStep.StepTypeSelection && (
                                <nav className="mb-8 flex" aria-label="Breadcrumb">
                                    <ol className="inline-flex items-center space-x-1 md:space-x-3 text-xs font-medium text-gray-400">
                                        <li className="inline-flex items-center">
                                            <a href="#" onClick={(e) => {e.preventDefault(); setStep(AppStep.Landing)}} className="hover:text-sbs-blue transition-colors">
                                                Inicio
                                            </a>
                                        </li>
                                        <li>
                                            <div className="flex items-center">
                                                <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
                                                <a href="#" onClick={(e) => {e.preventDefault(); setStep(AppStep.StepTypeSelection)}} className="ml-1 hover:text-sbs-blue transition-colors">
                                                    Planes
                                                </a>
                                            </div>
                                        </li>
                                        <li aria-current="page">
                                            <div className="flex items-center">
                                                <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
                                                <span className="ml-1 text-sbs-blue font-bold">
                                                    {currentStep === AppStep.Summary ? 'Revisión' : 'Configuración'}
                                                </span>
                                            </div>
                                        </li>
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
