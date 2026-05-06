import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { AppStep, FormData } from '../../types';
import { MANAGEMENT_DURATION, FISCAL_CLOSING_DATE, PackageName } from '../../constants';

type PageView = 'main' | 'privacy' | 'terms' | 'refund' | 'login';

const getLocalStorageKey = (userId: string | null): string => {
    if (userId) {
        return `sbs_form_v7_user_${userId}`;
    }
    return 'sbs_form_v7_guest';
};

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

export const useWizardState = () => {
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
            setCurrentStep(AppStep.Landing);
            setPage('main');
        }
    }, [isAuthenticated, page]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated && currentStep === AppStep.Dashboard) {
            setPage('login');
            setCurrentStep(AppStep.Landing);
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
    };

    const handleStepLogin = () => {
        setStep(AppStep.PostPaymentWelcome);
    };

    const handleStandaloneLogin = () => {
        // No-op: auth state change handled by onAuthStateChanged
    };

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
    };

    const handleFinalSubmit = () => {
        try {
            const userId = user?.uid || null;
            const storageKey = getLocalStorageKey(userId);
            localStorage.removeItem(storageKey);
            setStep(AppStep.Success);
        } catch (error) {
            console.error("ERROR AL FINALIZAR LA SOLICITUD:", error);
        }
    };

    const isPaymentVerified = formData.paymentStatus === 'paid' || formData.paymentStatus === 'pending_confirmation';

    const dummyStart = () => handleStartFlow('Essential 360');

    return {
        currentStep,
        highestStepReached,
        formData,
        updateFormData,
        page, setPage,
        user,
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
        handleLogout,
        handleFinalSubmit,
        dummyStart,
    };
};
