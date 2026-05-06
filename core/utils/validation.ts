export const validateRequired = (value: string): boolean => {
    return value && value.trim() !== '';
};

// Valida el formato de Cédula de Identidad y Electoral de la República Dominicana
// Formato: XXX-XXXXXXX-X
export const validateCedula = (cedula: string): boolean => {
    // Regex estricto para validar el formato final (11 dígitos, guiones opcionales o formateados)
    // Acepta 001-0000000-0 o 00100000000
    const cleanCedula = cedula.replace(/-/g, '');
    return /^\d{11}$/.test(cleanCedula);
};

// Aplica formato XXX-XXXXXXX-X automáticamente y fuerza SOLO NÚMEROS (Strict)
export const formatCedula = (value: string): string => {
    // 1. Lógica Estricta: Eliminar cualquier carácter que NO sea dígito inmediatamente.
    const digits = value.replace(/\D/g, '');
    
    // 2. Limitar longitud máxima a 11 dígitos
    const truncated = digits.slice(0, 11);
    
    // 3. Aplicar máscara visual XXX-XXXXXXX-X
    if (truncated.length <= 3) return truncated;
    if (truncated.length <= 10) return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    return `${truncated.slice(0, 3)}-${truncated.slice(3, 10)}-${truncated.slice(10)}`;
};

// Valida el formato de un correo electrónico
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Valida un número de teléfono (Soporte Internacional)
// Acepta: +1 (809) ..., 809-..., 001..., y longitudes variables (min 8, max 16)
export const validatePhoneNumber = (phone: string): boolean => {
    // Eliminamos espacios, guiones y paréntesis para contar dígitos
    const cleanNumber = phone.replace(/[\s\-\(\)]/g, '');
    // Debe contener solo números y opcionalmente un '+' al inicio
    const validChars = /^\+?\d+$/.test(cleanNumber);
    // Longitud razonable para un teléfono internacional (entre 8 y 16 dígitos)
    const validLength = cleanNumber.length >= 8 && cleanNumber.length <= 16;
    
    return validChars && validLength;
};

// Aplica formato inteligente
// Si parece un número local (10 dígitos, empieza con 8), aplica máscara DO.
// Si no, devuelve el input sanitizado para permitir formatos internacionales.
export const formatPhoneNumber = (value: string): string => {
    // Permitir +, espacios, guiones, paréntesis y números durante la escritura
    const rawValue = value.replace(/[^0-9+\-\s()]/g, '');
    
    // Intentar detectar si es un número local estándar para aplicar máscara
    const digitsOnly = rawValue.replace(/\D/g, '');
    
    // Si tiene 10 dígitos y empieza con 8 (ej. 809, 829, 849), aplicamos máscara local
    if (digitsOnly.length <= 10 && (digitsOnly.startsWith('8') || digitsOnly === '')) {
        const truncated = digitsOnly.slice(0, 10);
        if (truncated.length <= 3) return truncated;
        if (truncated.length <= 6) return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
        return `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`;
    }

    // Si es internacional o tiene otra longitud, devolvemos el valor crudo permitido
    return rawValue;
};

// Enmascarar fecha formato DD/MM/AAAA
export const formatDateMask = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const truncated = digits.slice(0, 8); // Max 8 digits (2 dia, 2 mes, 4 año)
    
    if (truncated.length <= 2) return truncated;
    if (truncated.length <= 4) return `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
    return `${truncated.slice(0, 2)}/${truncated.slice(2, 4)}/${truncated.slice(4)}`;
};

// Validar fecha real
export const validateDate = (dateString: string): boolean => {
    // Espera formato DD/MM/AAAA
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const parts = dateString.match(regex);
    if (!parts) return false;

    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);

    // Validar rangos básicos
    if (year < 1900 || year > 2100) return false;
    if (month == 0 || month > 12) return false;

    const monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
    // Ajuste bisiesto
    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    return day > 0 && day <= monthLength[month - 1];
};

/**
 * Valida fecha de nacimiento en formato DD/MM/AAAA (con barras)
 * También valida que la persona tenga al menos 18 años
 */
export const validateBirthDate = (dateString: string): boolean => {
    // Espera formato DD/MM/AAAA (con barras)
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const parts = dateString.match(regex);
    if (!parts) return false;

    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);

    // Validar rangos básicos
    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month == 0 || month > 12) return false;

    const monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
    // Ajuste bisiesto
    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    if (day <= 0 || day > monthLength[month - 1]) return false;

    // Validar que tenga al menos 18 años
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
    }
    return age >= 18;
};

/**
 * SANITIZACIÓN DE DATOS (SECURITY HARDENING)
 * Elimina emojis, scripts, tags HTML y caracteres especiales peligrosos.
 * Previene XSS almacenado.
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    
    // 1. Eliminar Emojis y símbolos gráficos extendidos (Unicode ranges)
    let clean = input.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    
    // 2. Eliminar tags HTML (XSS prevention) - Agresivo: elimina cualquier cosa entre < y >
    // También elimina caracteres peligrosos sueltos que puedan usarse para inyecciones SQL o scripts
    clean = clean.replace(/[<>]/g, ''); 
    
    // 3. Eliminar caracteres de control invisibles (excepto espacios básicos)
    clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // 4. Trim whitespace
    return clean.trim();
};

export const sanitizeCompanyName = (name: string): string => {
    if (!name) return '';
    // Usamos la sanitización base primero
    let clean = sanitizeInput(name);
    // Remover caracteres que no sean alfanuméricos o puntuación básica de nombres corporativos
    // Permitimos: Letras, números, espacios, puntos, comas, guiones y &
    clean = clean.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,&-]/g, '');
    return clean;
};