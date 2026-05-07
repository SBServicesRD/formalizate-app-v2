import { useState, useEffect } from 'react';

export const useHeaderScroll = (isLanding: boolean) => {
    const [isScrolled, setIsScrolled] = useState(false);
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

    return { isScrolled, activeSection };
};
