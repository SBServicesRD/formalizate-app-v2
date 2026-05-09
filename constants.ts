
// Clave para almacenar ventas huérfanas (pagos realizados antes del login)
export const ORPHAN_SALE_KEY = 'sbs_orphan_sale_id';

export const SHARE_VALUE = 100;
export const MANAGEMENT_DURATION = 6;
export const FISCAL_CLOSING_DATE = '31 de Diciembre';
export const TAX_EXEMPTION_LIMIT = 100000;
export const TAX_RATE_PER_BLOCK = 1000;

export const ALLOWED_FILE_TYPES = "image/jpeg, image/png, application/pdf";

export type PackageName = 'Starter Pro' | 'Essential 360' | 'Unlimitech';

export const NCF_OPTIONS = [
    { value: 'B01', label: 'Crédito Fiscal' },
    { value: 'B02', label: 'Consumidor Final' },
    { value: 'B14', label: 'Regímenes Especiales' },
    { value: 'B15', label: 'Gubernamental' },
];

export const PROVINCES = [
    "Distrito Nacional", "Santo Domingo", "Santiago", "La Altagracia", 
    "La Vega", "Puerto Plata", "San Cristóbal", "San Pedro de Macorís", 
    "La Romana", "Duarte", "Espaillat", "Azua", "Barahona", "Dajabón", 
    "Elías Piña", "El Seibo", "Hato Mayor", "Hermanas Mirabal", "Independencia", 
    "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", 
    "Pedernales", "Peravia", "Samaná", "San Juan", "San José de Ocoa", 
    "Sánchez Ramírez", "Santiago Rodríguez", "Valverde", "Bahoruco"
];

export const COUNTRIES = [
    "República Dominicana", "Estados Unidos", "España", "Venezuela", "Colombia", "México", 
    "Canadá", "Francia", "Italia", "Alemania", "Argentina", "Chile", "Brasil", 
    "Puerto Rico", "Haití", "Cuba", "Panamá", "Costa Rica", "Perú", "Ecuador", "Otro"
];

// Configuración de Códigos Postales por País (Diáspora)
export const POSTAL_CODE_CONFIG: Record<string, { 
    label: string; 
    placeholder: string; 
    maxLength: number; 
    regionLabel: string;
}> = {
    "Estados Unidos": { label: "Zip Code", placeholder: "12345", maxLength: 10, regionLabel: "Estado" },
    "Puerto Rico": { label: "Zip Code", placeholder: "00901", maxLength: 10, regionLabel: "Municipio" },
    "España": { label: "Código Postal", placeholder: "28001", maxLength: 5, regionLabel: "Comunidad Autónoma" },
    "Italia": { label: "CAP", placeholder: "00100", maxLength: 5, regionLabel: "Región" },
    "Chile": { label: "Código Postal", placeholder: "8320000", maxLength: 7, regionLabel: "Región" },
    "Canadá": { label: "Postal Code", placeholder: "A1A 1A1", maxLength: 7, regionLabel: "Provincia" },
};

// Datos de Regiones Internacionales para Lógica Condicional
export const INTERNATIONAL_REGIONS: Record<string, string[]> = {
    "Estados Unidos": [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
        "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
        "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
        "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
        "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ],
    "Puerto Rico": [
        "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo", "Arroyo",
        "Barceloneta", "Barranquitas", "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas", "Carolina",
        "Cataño", "Cayey", "Ceiba", "Ciales", "Cidra", "Coamo", "Comerío", "Corozal", "Culebra",
        "Dorado", "Fajardo", "Florida", "Guánica", "Guayama", "Guayanilla", "Guaynabo", "Gurabo",
        "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos", "Lajas",
        "Lares", "Las Marías", "Las Piedras", "Loíza", "Luquillo", "Manatí", "Maricao", "Maunabo",
        "Mayagüez", "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis", "Patillas", "Peñuelas",
        "Ponce", "Quebradillas", "Rincón", "Río Grande", "Sabana Grande", "Salinas", "San Germán",
        "San Juan", "San Lorenzo", "San Sebastián", "Santa Isabel", "Toa Alta", "Toa Baja", "Trujillo Alto",
        "Utuado", "Vega Alta", "Vega Baja", "Vieques", "Villalba", "Yabucoa", "Yauco"
    ],
    "España": [
        "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha", "Castilla y León", 
        "Cataluña", "Comunidad Valenciana", "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia", "Navarra", "País Vasco"
    ],
    "Italia": [
        "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", 
        "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
    ],
    "Chile": [
        "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", 
        "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
    ],
    "Canadá": [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", 
        "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"
    ]
};

export const MUNICIPALITIES: Record<string, string[]> = {
    "Distrito Nacional": ["Santo Domingo de Guzmán"],
    "Santo Domingo": ["Santo Domingo Este", "Santo Domingo Oeste", "Santo Domingo Norte", "Boca Chica", "San Antonio de Guerra", "Los Alcarrizos", "Pedro Brand"],
    "Santiago": ["Santiago de los Caballeros", "Bisonó", "Jánico", "Licey al Medio", "Puñal", "Sabana Iglesia", "Tamboril", "Villa González"],
    "La Altagracia": ["Higüey", "San Rafael del Yuma"],
    "La Vega": ["La Vega", "Constanza", "Jarabacoa", "Jima Abajo"],
    "Puerto Plata": ["Puerto Plata", "Altamira", "Guananico", "Imbert", "Los Hidalgos", "Luperón", "Sosúa", "Villa Isabela", "Villa Montellano"],
    "San Cristóbal": ["San Cristóbal", "Bajos de Haina", "Cambita Garabitos", "Los Cacaos", "Sabana Grande de Palenque", "San Gregorio de Nigua", "Villa Altagracia", "Yaguate"],
    "San Pedro de Macorís": ["San Pedro de Macorís", "Consuelo", "Guayacanes", "Quisqueya", "Ramón Santana", "San José de Los Llanos"],
    "La Romana": ["La Romana", "Guaymate", "Villa Hermosa"],
    "Duarte": ["San Francisco de Macorís", "Arenoso", "Castillo", "Eugenio María de Hostos", "Las Guáranas", "Pimentel", "Villa Riva"],
    "Espaillat": ["Moca", "Cayetano Germosén", "Gaspar Hernández", "Jamao al Norte"],
    "Azua": ["Azua de Compostela", "Estebanía", "Guayabal", "Las Charcas", "Las Yayas de Viajama", "Padre Las Casas", "Peralta", "Pueblo Viejo", "Sabana Yegua", "Tábara Arriba"],
    "Barahona": ["Barahona", "Cabral", "El Peñón", "Enriquillo", "Fundación", "Jaquimeyes", "La Ciénaga", "Las Salinas", "Paraíso", "Polo", "Vicente Noble"],
    "Dajabón": ["Dajabón", "El Pino", "Loma de Cabrera", "Partido", "Restauración"],
    "Elías Piña": ["Comendador", "Bánica", "El Llano", "Hondo Valle", "Juan Santiago", "Pedro Santana"],
    "El Seibo": ["El Seibo", "Miches"],
    "Hato Mayor": ["Hato Mayor del Rey", "El Valle", "Sabana de la Mar"],
    "Hermanas Mirabal": ["Salcedo", "Tenares", "Villa Tapia"],
    "Independencia": ["Jimaní", "Cristóbal", "Duvergé", "La Descubierta", "Mella", "Postrer Río"],
    "María Trinidad Sánchez": ["Nagua", "Cabrera", "El Factor", "Río San Juan"],
    "Monseñor Nouel": ["Bonao", "Maimón", "Piedra Blanca"],
    "Monte Cristi": ["Monte Cristi", "Castañuelas", "Guayubín", "Las Matas de Santa Cruz", "Pepillo Salcedo", "Villa Vásquez"],
    "Monte Plata": ["Monte Plata", "Bayaguana", "Peralvillo", "Sabana Grande de Boyá", "Yamasá"],
    "Pedernales": ["Pedernales", "Oviedo"],
    "Peravia": ["Baní", "Nizao"],
    "Samaná": ["Samaná", "Las Terrenas", "Sánchez"],
    "San Juan": ["San Juan de la Maguana", "Bohechío", "El Cercado", "Juan de Herrera", "Las Matas de Farfán", "Vallejuelo"],
    "San José de Ocoa": ["San José de Ocoa", "Rancho Arriba", "Sabana Larga"],
    "Sánchez Ramírez": ["Cotuí", "Cevicos", "Fantino", "La Mata"],
    "Santiago Rodríguez": ["San Ignacio de Sabaneta", "Los Almácigos", "Monción"],
    "Valverde": ["Mao", "Esperanza", "Laguna Salada"],
    "Bahoruco": ["Neiba", "Galván", "Los Ríos", "Tamayo", "Villa Jaragua"]
};

export const PACKAGES: Record<PackageName, { 
    price: number; 
    formattedPrice: string;
    features: string[];
    bonuses?: string[];
    includesBankLetter?: boolean;
}> = {
    'Starter Pro': {
        price: 27900,
        formattedPrice: 'RD$ 27,900',
        features: [
            "Firma Digital para F.E. (1 año)",
            "Nombre Comercial",
            "Documentos Constitutivos",
            "Registro Mercantil",
            "RNC",
            "Oficina Virtual DGII",
            "Comprobantes Fiscales",
            "Plantillas Básicas",
            "Soporte Básico"
        ],
        includesBankLetter: false
    },
    'Essential 360': {
        price: 41900,
        formattedPrice: 'RD$ 41,900',
        features: [
            "Firma Digital para F.E. (2 años)",
            "Registros Laborales (TSS, MIT)",
            "Dominio Web (1 año)",
            "3 Correos Institucionales",
            "Plantillas Premium",
            "1 mes Cumplimiento Fiscal",
            "Soporte Estándar"
        ],
        bonuses: [
            "Sello Gomígrafo (Pre-tintado)",
            "Plantilla Personalizada de Facturas",
            "Acceso a SIRLA y SUIR"
        ],
        includesBankLetter: true
    },
    'Unlimitech': {
        price: 64900,
        formattedPrice: 'RD$ 64,900',
        features: [
            "Firma Digital para F.E. (3 años)",
            "Página Web Informativa (1 año)",
            "Registro Import/Export en DGA",
            "Registro Proveedor del Estado",
            "Plantillas Pro",
            "2 meses Cumplimiento Fiscal",
            "Soporte Prioritario"
        ],
        bonuses: [
            "Sello Gomígrafo (Pre-tintado)",
            "Dominio Web (2 años)",
            "5 Correos Institucionales",
            "Asesoría Fiscal Inicial"
        ],
        includesBankLetter: true
    }
};

