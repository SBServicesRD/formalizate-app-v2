
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Lazy initialization to allow app to load even if key is missing/invalid initially
const getAiClient = () => {
    if (!API_KEY) {
        throw new Error("API Key no configurada. Por favor verifica las variables de entorno.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const improveSocialObject = async (userInput: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `Eres un asistente jurídico-comercial especializado en la redacción de objetos sociales para sociedades comerciales y Empresas Individuales de Responsabilidad Limitada (EIRL) en la República Dominicana, conforme a la Ley 479-08 y la práctica registral de las Cámaras de Comercio.

REGLAS FUNDAMENTALES:
- Solo utiliza las actividades declaradas por el usuario. Puedes agruparlas, ordenarlas y elevar su lenguaje jurídico, pero no puedes agregar sectores nuevos.
- Incluye todas las actividades relevantes que el usuario declare. Nunca omitas actividades.
- No agregues automáticamente importación/exportación, construcción, inmobiliaria, consultoría, tecnología, transporte, franquicias, representación comercial, venta de alcohol o manufactura industrial, salvo que el usuario lo haya indicado expresamente.
- El objeto debe permitir crecimiento natural y expansión operativa razonable.

ESTRUCTURA OBLIGATORIA:
1. Apertura: usar "La sociedad tiene como objeto social principal…" o "La empresa tendrá como objeto social principal…"
2. Núcleo operativo: usar verbos como explotación, comercialización, fabricación, elaboración, distribución, prestación de servicios, operación, suministro, desarrollo.
3. Alcance comercial: incluir referencias a venta al público, venta a empresas, distribución o servicios asociados cuando aplique.
4. Cierre obligatorio: terminar siempre con "…y demás actividades relacionadas directa o indirectamente con su actividad comercial." o "…y cualquier otra actividad conexa que contribuya al desarrollo de su objeto social dentro del marco legal vigente."

REGLAS DE ESTILO:
- Redactar en prosa continua, nunca en viñetas ni listados.
- Lenguaje jurídico-comercial claro y profesional.
- Evitar redundancias, frases excesivamente largas y tecnicismos innecesarios.
- Evitar palabras restrictivas como "exclusivamente", "únicamente" o "de forma limitativa".

EJEMPLOS DE REFERENCIA:
Restaurante: "La sociedad tiene como objeto social principal la explotación de establecimientos dedicados a la preparación, comercialización y expendio de alimentos y bebidas mediante servicios de restaurante, venta directa al público y suministro a empresas, pudiendo desarrollar actividades relacionadas con la distribución y comercialización de productos vinculados a su operación comercial, así como cualquier otra actividad conexa que contribuya al desarrollo de su objeto social dentro del marco legal vigente."
Joyería: "La sociedad tiene como objeto social principal el diseño, elaboración, fabricación y comercialización de joyas artesanales y piezas de joyería de autor, así como la impartición de talleres formativos en técnicas de joyería y actividades relacionadas con su promoción y distribución, pudiendo realizar cualquier otra actividad conexa que contribuya al desarrollo de su objeto social dentro del marco legal vigente."

TAREA: Redacta el objeto social para una empresa cuya actividad es: "${userInput}"

Responde ÚNICAMENTE con el texto del objeto social, sin introducciones, títulos ni explicaciones. El resultado debe poder insertarse directamente en los Estatutos Sociales.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                maxOutputTokens: 600,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        const text = response.text;
        
        if (!text) {
             throw new Error('La respuesta de la IA estaba vacía.');
        }

        return text.trim();

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback or rethrow friendly error
        if ((error as Error).message.includes("API Key")) {
            return userInput; // Return original if API fails so user isn't blocked
        }
        throw new Error("No se pudo mejorar el objeto social. Por favor, inténtalo de nuevo.");
    }
};

const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const verifyPaymentReceipt = async (file: File, expectedAmount: number): Promise<{ isValid: boolean, foundAmount?: number, message?: string }> => {
    try {
        const ai = getAiClient();
        const imagePart = await fileToGenerativePart(file);
        
        // PROMPT OPTIMIZADO: Tolerancia alta para evitar bloqueos por calidad de imagen.
        // Se prioriza identificar si es un documento financiero válido sobre la lectura exacta del monto.
        const prompt = `Analiza la imagen adjunta. Actúa como un validador de pagos preliminar para un servicio legal.
        
        Monto Esperado: ${expectedAmount} DOP (aproximado).
        
        Instrucciones:
        1. Identifica si la imagen parece ser un comprobante de transferencia, depósito o recibo bancario.
        2. SÉ FLEXIBLE: Si el documento PARECE un comprobante bancario legítimo, marca "isValid": true, INCLUSO si el texto está borroso, es una foto de pantalla o no puedes leer el monto exacto. Asumiremos que es correcto para no bloquear al cliente; un humano verificará después.
        3. Solo marca "isValid": false si la imagen es claramente IRRELEVANTE (ej. una selfie, paisaje, mascota, documento en blanco) o si es explícitamente un error obvio.
        
        Responde estrictamente en formato JSON:
        {
            "isValid": boolean,
            "reason": "Explicación muy breve"
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No se recibió respuesta de la IA.");
        
        // Limpieza robusta para eliminar bloques de código Markdown si la IA los incluye
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const result = JSON.parse(cleanJson);
        return {
            isValid: result.isValid,
            // foundAmount opcional ya que la IA puede no leerlo
            message: result.reason
        };

    } catch (error) {
        console.error("Error verifying receipt:", error);
        // Mensaje genérico técnico para no confundir al usuario culpando a la imagen
        return { isValid: false, message: "Error técnico momentáneo al verificar. Por favor intenta nuevamente o contacta a soporte." };
    }
};
