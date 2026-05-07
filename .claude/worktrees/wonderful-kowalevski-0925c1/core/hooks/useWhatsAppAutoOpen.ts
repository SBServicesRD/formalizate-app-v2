import { useState, useRef, useEffect } from 'react';

export const useWhatsAppAutoOpen = () => {
    const [isOpen, setIsOpen] = useState(false);
    const hasOpenedRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!hasOpenedRef.current) {
                setIsOpen(true);

                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});

                hasOpenedRef.current = true;
            }
        }, 13000);
        return () => clearTimeout(timer);
    }, []);

    return { isOpen, setIsOpen };
};
