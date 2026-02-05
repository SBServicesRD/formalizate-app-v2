import React, { useState } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    style?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    onLoad?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className = '',
    fill = false,
    priority = false,
    style,
    width,
    height,
    onLoad
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
        if (onLoad) {
            onLoad();
        }
    };

    const handleError = () => {
        setHasError(true);
    };

    // Configuración de atributos según priority
    const loadingAttr = priority ? 'eager' : 'lazy';
    const fetchPriorityAttr = priority ? 'high' : undefined;
    const decodingAttr = priority ? undefined : 'async';

    // Si fill es true, la imagen debe ocupar el contenedor
    const fillClasses = fill ? 'absolute inset-0 w-full h-full' : '';
    const opacityTransition = 'transition-opacity duration-500 ease-in-out';
    const opacityClass = isLoaded ? 'opacity-100' : 'opacity-0';

    // Clases combinadas
    const combinedClassName = `${className} ${fillClasses} ${opacityTransition} ${opacityClass}`.trim();

    // Si hay error, mostrar placeholder o imagen rota
    if (hasError) {
        return (
            <div 
                className={`${fillClasses} bg-gray-200 flex items-center justify-center ${className}`}
                style={style}
            >
                <span className="text-gray-400 text-xs">Error al cargar imagen</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={combinedClassName}
            style={style}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            loading={loadingAttr}
            fetchPriority={fetchPriorityAttr}
            decoding={decodingAttr}
            onLoad={handleLoad}
            onError={handleError}
        />
    );
};

export default OptimizedImage;



