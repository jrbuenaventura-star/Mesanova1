export interface DepartmentData {
  name: string
  cities: string[]
}

export const COLOMBIA_DEPARTMENTS: DepartmentData[] = [
  {
    name: "Amazonas",
    cities: ["Leticia", "Puerto Nariño"],
  },
  {
    name: "Antioquia",
    cities: [
      "Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Turbo",
      "Rionegro", "Caucasia", "Sabaneta", "La Estrella", "Copacabana",
      "Caldas", "Marinilla", "El Carmen de Viboral", "La Ceja",
    ],
  },
  {
    name: "Arauca",
    cities: ["Arauca", "Tame", "Saravena", "Fortul"],
  },
  {
    name: "Atlántico",
    cities: [
      "Barranquilla", "Soledad", "Malambo", "Sabanalarga",
      "Galapa", "Baranoa", "Puerto Colombia",
    ],
  },
  {
    name: "Bogotá D.C.",
    cities: ["Bogotá"],
  },
  {
    name: "Bolívar",
    cities: [
      "Cartagena", "Magangué", "Turbaco", "Arjona",
      "El Carmen de Bolívar", "San Juan Nepomuceno",
    ],
  },
  {
    name: "Boyacá",
    cities: [
      "Tunja", "Duitama", "Sogamoso", "Chiquinquirá",
      "Paipa", "Puerto Boyacá", "Villa de Leyva",
    ],
  },
  {
    name: "Caldas",
    cities: [
      "Manizales", "La Dorada", "Villamaría", "Chinchiná",
      "Anserma", "Riosucio",
    ],
  },
  {
    name: "Caquetá",
    cities: ["Florencia", "San Vicente del Caguán", "Puerto Rico", "El Doncello"],
  },
  {
    name: "Casanare",
    cities: ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Paz de Ariporo"],
  },
  {
    name: "Cauca",
    cities: [
      "Popayán", "Santander de Quilichao", "Puerto Tejada",
      "Piendamó", "El Tambo", "Guapi",
    ],
  },
  {
    name: "Cesar",
    cities: [
      "Valledupar", "Aguachica", "Codazzi", "Bosconia",
      "La Jagua de Ibirico", "Chimichagua",
    ],
  },
  {
    name: "Chocó",
    cities: ["Quibdó", "Istmina", "Tadó", "Condoto", "Bahía Solano"],
  },
  {
    name: "Córdoba",
    cities: [
      "Montería", "Cereté", "Lorica", "Sahagún",
      "Montelíbano", "Planeta Rica", "Tierralta",
    ],
  },
  {
    name: "Cundinamarca",
    cities: [
      "Soacha", "Zipaquirá", "Facatativá", "Chía", "Fusagasugá",
      "Girardot", "Madrid", "Mosquera", "Funza", "Cajicá",
      "Cota", "La Calera", "Sopó", "Tocancipá", "Tabio",
      "Tenjo", "Sibaté", "Villeta",
    ],
  },
  {
    name: "Guainía",
    cities: ["Inírida"],
  },
  {
    name: "Guaviare",
    cities: ["San José del Guaviare"],
  },
  {
    name: "Huila",
    cities: [
      "Neiva", "Pitalito", "Garzón", "La Plata",
      "Campoalegre", "San Agustín",
    ],
  },
  {
    name: "La Guajira",
    cities: ["Riohacha", "Maicao", "Uribia", "Manaure", "San Juan del Cesar"],
  },
  {
    name: "Magdalena",
    cities: [
      "Santa Marta", "Ciénaga", "Fundación", "Plato",
      "El Banco", "Aracataca",
    ],
  },
  {
    name: "Meta",
    cities: [
      "Villavicencio", "Acacías", "Granada", "Puerto López",
      "San Martín", "Restrepo",
    ],
  },
  {
    name: "Nariño",
    cities: [
      "Pasto", "Tumaco", "Ipiales", "Túquerres",
      "La Unión", "Samaniego",
    ],
  },
  {
    name: "Norte de Santander",
    cities: [
      "Cúcuta", "Ocaña", "Pamplona", "Los Patios",
      "Villa del Rosario", "El Zulia",
    ],
  },
  {
    name: "Putumayo",
    cities: ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez"],
  },
  {
    name: "Quindío",
    cities: [
      "Armenia", "Calarcá", "La Tebaida", "Montenegro",
      "Quimbaya", "Circasia",
    ],
  },
  {
    name: "Risaralda",
    cities: [
      "Pereira", "Dosquebradas", "Santa Rosa de Cabal",
      "La Virginia", "Marsella",
    ],
  },
  {
    name: "San Andrés y Providencia",
    cities: ["San Andrés", "Providencia"],
  },
  {
    name: "Santander",
    cities: [
      "Bucaramanga", "Floridablanca", "Girón", "Piedecuesta",
      "Barrancabermeja", "San Gil", "Socorro",
    ],
  },
  {
    name: "Sucre",
    cities: ["Sincelejo", "Corozal", "San Marcos", "Tolú", "Sampués"],
  },
  {
    name: "Tolima",
    cities: [
      "Ibagué", "Espinal", "Melgar", "Honda",
      "Mariquita", "Líbano", "Chaparral",
    ],
  },
  {
    name: "Valle del Cauca",
    cities: [
      "Cali", "Buenaventura", "Palmira", "Tuluá", "Buga",
      "Cartago", "Jamundí", "Yumbo", "Candelaria",
    ],
  },
  {
    name: "Vaupés",
    cities: ["Mitú"],
  },
  {
    name: "Vichada",
    cities: ["Puerto Carreño"],
  },
]

export const BUSINESS_TYPES = [
  "Persona natural",
  "HoReCa o Institución",
  "Tienda",
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]

export function getDepartmentNames(): string[] {
  return COLOMBIA_DEPARTMENTS.map((d) => d.name)
}

export function getCitiesByDepartment(department: string): string[] {
  const dept = COLOMBIA_DEPARTMENTS.find((d) => d.name === department)
  return dept?.cities || []
}
