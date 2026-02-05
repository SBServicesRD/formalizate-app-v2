
import React from 'react';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.071l.217.324-1.123 4.104 4.13-1.082.333.215z"/>
    </svg>
);


const WhatsAppButton: React.FC = () => {
    const phoneNumber = "18090000000"; // Placeholder number
    const message = "Hola, necesito ayuda con el proceso de constitución de mi empresa.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-16 h-16 bg-green-500 rounded-full text-white shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:bg-green-600 z-40 group"
            aria-label="Abrir conversación en WhatsApp"
            title="Abrir conversación en WhatsApp"
        >
            <WhatsAppIcon />
            <div className="absolute bottom-1/2 translate-y-1/2 right-full mr-3 px-3 py-1.5 bg-sbs-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Chat por WhatsApp
                <div className="absolute left-full top-1/2 -translate-y-1/2 w-2 h-2 bg-sbs-gray-800 rotate-45"></div>
            </div>
        </a>
    );
};

export default WhatsAppButton;
