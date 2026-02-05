
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
        const prompt = `Reformula la siguiente descripción de actividad comercial para que sea un "objeto social" formal, amplio y jurídicamente apropiado para una empresa de Responsabilidad Limitada (S.R.L.) en la República Dominicana. El resultado debe ser un único párrafo, sin introducciones ni despedidas, solo el texto del objeto social, y NO DEBE EXCEDER los 500 caracteres. Actividad del usuario: "${userInput}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                maxOutputTokens: 200, // Safe limit for ~500 characters
                thinkingConfig: { thinkingBudget: 50 },
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
