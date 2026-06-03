export const MCCS_BLOQUEADOS = ["5933","7995","6010","6011","5813","5921"];
export const UMBRAL_COMPRA_MENOR = 10000;

export interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  mcc: string;
  ciudad: string;
  provincia: string;
  certificaciones: string[];
  estadoRPE: 'Activo' | 'Pendiente' | 'Suspendido';
  aceptaTarjeta: boolean;
  nivelIII: boolean;
  categorias: string[];
  calificacion: number;
  ingresos: number;
  ordenesCompletadas: number;
  registradoDesde: string;
  polizaSeguro: string;
  tamano: string;
  contacto: { nombre: string; correo: string; telefono: string };
}

export const MOCK_PROVEEDORES: Proveedor[] = [
  {
    id: 'PROV-001',
    nombre: 'TechPanamá Solutions S.A.',
    ruc: '155674321-2-2023',
    mcc: '7372',
    ciudad: 'Ciudad de Panamá',
    provincia: 'Panamá',
    certificaciones: ['MYPE', 'Empresa Digital'],
    estadoRPE: 'Activo',
    aceptaTarjeta: true,
    nivelIII: true,
    categorias: ['Servicios de TI', 'Desarrollo de Software'],
    calificacion: 4.7,
    ingresos: 1240000,
    ordenesCompletadas: 34,
    registradoDesde: '2022-03-15',
    polizaSeguro: 'B/.500K / B/.1M',
    tamano: 'Pequeña',
    contacto: { nombre: 'Carlos Herrera', correo: 'c.herrera@techpanama.pa', telefono: '(507) 6200-1234' },
  },
  {
    id: 'PROV-002',
    nombre: 'Distribuidora Colonial del Istmo S.A.',
    ruc: '478823109-2-2021',
    mcc: '5112',
    ciudad: 'Colón',
    provincia: 'Colón',
    certificaciones: ['Empresa Afropanameña'],
    estadoRPE: 'Activo',
    aceptaTarjeta: true,
    nivelIII: false,
    categorias: ['Útiles de Oficina', 'Mobiliario'],
    calificacion: 4.2,
    ingresos: 887000,
    ordenesCompletadas: 58,
    registradoDesde: '2021-07-08',
    polizaSeguro: 'B/.500K / B/.1M',
    tamano: 'Pequeña',
    contacto: { nombre: 'Daniela Samuels', correo: 'd.samuels@colonistmo.pa', telefono: '(507) 441-7788' },
  },
  {
    id: 'PROV-003',
    nombre: 'Suministros Tech Istmo S.A.',
    ruc: '235891047-2-2020',
    mcc: '5045',
    ciudad: 'Ciudad de Panamá',
    provincia: 'Panamá',
    certificaciones: ['Empresa Femenina'],
    estadoRPE: 'Activo',
    aceptaTarjeta: true,
    nivelIII: true,
    categorias: ['Electrónica', 'Hardware de Cómputo', 'Equipos de TI'],
    calificacion: 4.9,
    ingresos: 2145000,
    ordenesCompletadas: 92,
    registradoDesde: '2020-11-22',
    polizaSeguro: 'B/.1M / B/.2M',
    tamano: 'Pequeña',
    contacto: { nombre: 'Jennifer Morales', correo: 'j.morales@suminstmos.pa', telefono: '(507) 6700-5561' },
  },
  {
    id: 'PROV-004',
    nombre: 'Servicios de Limpieza Chitré S.A.',
    ruc: '612047835-2-2023',
    mcc: '7349',
    ciudad: 'Chitré',
    provincia: 'Herrera',
    certificaciones: ['MYPE', 'Empresa Indígena'],
    estadoRPE: 'Activo',
    aceptaTarjeta: true,
    nivelIII: false,
    categorias: ['Servicios de Limpieza', 'Mantenimiento de Instalaciones'],
    calificacion: 4.5,
    ingresos: 560000,
    ordenesCompletadas: 41,
    registradoDesde: '2023-01-10',
    polizaSeguro: 'B/.500K / B/.1M',
    tamano: 'Micro',
    contacto: { nombre: 'Marcos Mireya', correo: 'm.mireya@cleanchitre.pa', telefono: '(507) 996-4488' },
  },
  {
    id: 'PROV-005',
    nombre: 'Seguridad Pacífico Corp S.A.',
    ruc: '789034512-2-2021',
    mcc: '7382',
    ciudad: 'David',
    provincia: 'Chiriquí',
    certificaciones: ['Empresa de Veterano'],
    estadoRPE: 'Activo',
    aceptaTarjeta: true,
    nivelIII: true,
    categorias: ['Servicios de Seguridad', 'Control de Acceso'],
    calificacion: 4.6,
    ingresos: 1780000,
    ordenesCompletadas: 65,
    registradoDesde: '2021-09-14',
    polizaSeguro: 'B/.1M / B/.2M',
    tamano: 'Pequeña',
    contacto: { nombre: 'Rodrigo Pittí', correo: 'r.pitti@segpac.pa', telefono: '(507) 730-1177' },
  },
  {
    id: 'PROV-006',
    nombre: 'Imprenta Nacional Veragüense S.A.',
    ruc: '341098276-2-2024',
    mcc: '2759',
    ciudad: 'Santiago',
    provincia: 'Veraguas',
    certificaciones: ['Empresa Femenina', 'MYPE'],
    estadoRPE: 'Pendiente',
    aceptaTarjeta: false,
    nivelIII: false,
    categorias: ['Imprenta', 'Señalización', 'Publicaciones'],
    calificacion: 3.8,
    ingresos: 320000,
    ordenesCompletadas: 19,
    registradoDesde: '2024-02-01',
    polizaSeguro: 'B/.250K / B/.500K',
    tamano: 'Micro',
    contacto: { nombre: 'Ángela Torrero', correo: 'a.torrero@impnac.pa', telefono: '(507) 998-0593' },
  },
];

export const PROVEEDOR_ACTUAL = MOCK_PROVEEDORES[2]; // PROV-003

export interface Venta {
  id: string;
  entidad: { nombre: string; dependencia: string };
  articulos: string;
  monto: number;
  metodoPago: string;
  estado: 'Liquidado' | 'En Proceso' | 'Pendiente';
  fechaLiquidacion: string | null;
  fecha: string;
}

export const VENTAS_PROVEEDOR: Venta[] = [
  { id: 'VTA-10041', entidad: { nombre: 'Ministerio de Educación', dependencia: 'MEDUCA — Depto. de TI' }, articulos: '12× Hub USB-C, 8× Teclados Inalámbricos', monto: 1847.00, metodoPago: 'TPI Visa ****4821', estado: 'Liquidado', fechaLiquidacion: '2024-11-12', fecha: '2024-11-10' },
  { id: 'VTA-10038', entidad: { nombre: 'Alcaldía de Panamá', dependencia: 'Obras Municipales' }, articulos: '2× Docking Stations, 24× Cables de Monitor', monto: 3210.50, metodoPago: 'MC Inst. ****7743', estado: 'Liquidado', fechaLiquidacion: '2024-11-08', fecha: '2024-11-06' },
  { id: 'VTA-10035', entidad: { nombre: 'Ministerio de Salud', dependencia: 'MINSA — Oficina Central' }, articulos: '5× Almacenamiento NAS', monto: 8750.00, metodoPago: 'TPI Visa ****2198', estado: 'Liquidado', fechaLiquidacion: '2024-10-30', fecha: '2024-10-28' },
  { id: 'VTA-10032', entidad: { nombre: 'Caja de Seguro Social', dependencia: 'CSS — Tecnología' }, articulos: '40× Ratones Inalámbricos, 40× Teclados', monto: 2340.00, metodoPago: 'TPI Visa ****4821', estado: 'En Proceso', fechaLiquidacion: null, fecha: '2024-11-14' },
  { id: 'VTA-10029', entidad: { nombre: 'Autoridad Nacional de Aduanas', dependencia: 'ANA — Operaciones' }, articulos: '1× Switch 48 puertos, 6× Módulos SFP', monto: 5620.00, metodoPago: 'MC Inst. ****3912', estado: 'Liquidado', fechaLiquidacion: '2024-10-22', fecha: '2024-10-20' },
  { id: 'VTA-10026', entidad: { nombre: 'Ministerio de Obras Públicas', dependencia: 'MOP — Parques' }, articulos: '3× Soportes iPad, 8× Estaciones de Carga', monto: 1190.00, metodoPago: 'TPI Visa ****4821', estado: 'Pendiente', fechaLiquidacion: null, fecha: '2024-11-15' },
  { id: 'VTA-10022', entidad: { nombre: 'Alcaldía de Panamá', dependencia: 'RRHH Municipal' }, articulos: '10× Webcams, 10× Audífonos', monto: 2890.00, metodoPago: 'TPI Visa ****2198', estado: 'Liquidado', fechaLiquidacion: '2024-10-15', fecha: '2024-10-12' },
];

export interface CompraConTarjeta {
  id: string;
  entidad: string;
  descripcion: string;
  monto: number;
  tarjetaMask: string;
  tipoTarjeta: 'debito' | 'tpi';
  estado: 'Liquidado' | 'En Proceso' | 'Pendiente';
  fecha: string;
}

export const COMPRAS_TARJETA: CompraConTarjeta[] = [
  { id: 'CT-4082', entidad: 'MEDUCA — TI', descripcion: 'Cable USB-A a USB-C (paquete 10)', monto: 28.99, tarjetaMask: '****4821', tipoTarjeta: 'tpi', estado: 'Liquidado', fecha: '2024-11-13' },
  { id: 'CT-4079', entidad: 'Alcaldía de Panamá — Parques', descripcion: 'Kit de Limpieza de Pantallas', monto: 15.49, tarjetaMask: '****2341', tipoTarjeta: 'debito', estado: 'Liquidado', fecha: '2024-11-12' },
  { id: 'CT-4075', entidad: 'ANA — Tránsito', descripcion: 'Cable HDMI 1.8m (paquete 3)', monto: 34.99, tarjetaMask: '****7743', tipoTarjeta: 'debito', estado: 'En Proceso', fecha: '2024-11-14' },
  { id: 'CT-4071', entidad: 'CSS — Tecnología', descripcion: 'Filtro de Privacidad para Laptop', monto: 49.99, tarjetaMask: '****4821', tipoTarjeta: 'tpi', estado: 'Liquidado', fecha: '2024-11-10' },
  { id: 'CT-4068', entidad: 'MEDUCA — Administración', descripcion: 'Baterías AA (paquete 48)', monto: 22.75, tarjetaMask: '****2341', tipoTarjeta: 'debito', estado: 'Liquidado', fecha: '2024-11-09' },
  { id: 'CT-4063', entidad: 'Alcaldía de Panamá — RRHH', descripcion: 'Protectores de Cámara Web (20 u.)', monto: 18.00, tarjetaMask: '****4821', tipoTarjeta: 'tpi', estado: 'Pendiente', fecha: '2024-11-15' },
  { id: 'CT-4058', entidad: 'MINSA — TI', descripcion: 'Kit de Gestión de Cables de Escritorio', monto: 67.50, tarjetaMask: '****7743', tipoTarjeta: 'debito', estado: 'Liquidado', fecha: '2024-11-07' },
];

export interface RequisitoLicitacion { etiqueta: string; cumple: boolean }

export interface Licitacion {
  id: string;
  titulo: string;
  entidad: string;
  categoria: string;
  presupuesto: number;
  fechaPublicacion: string;
  fechaCierre: string;
  estado: 'Abierta' | 'Por Cerrar' | 'Cerrada';
  descripcion: string;
  puntajeCoincidencia: number;
  requisitos: RequisitoLicitacion[];
}

export const LICITACIONES: Licitacion[] = [
  {
    id: 'LIC-2024-MEDUCA-041',
    titulo: 'Suministro de Hardware y Periféricos — Acuerdo Marco Anual',
    entidad: 'Ministerio de Educación (MEDUCA)',
    categoria: 'Hardware de Cómputo',
    presupuesto: 250000,
    fechaPublicacion: '2024-11-01',
    fechaCierre: '2024-12-01',
    estado: 'Abierta',
    puntajeCoincidencia: 97,
    descripcion: 'El Ministerio de Educación busca un proveedor calificado para suministrar hardware de cómputo, periféricos y equipos de TI para oficinas ministeriales bajo un acuerdo marco anual. Los artículos incluyen monitores, teclados, ratones, docking stations, switches de red y cableado. Todo el equipo debe cumplir con las directrices de ciberseguridad NIST. El proveedor debe aceptar Tarjetas de Pago Institucional (TPI) y admitir datos de Nivel III.',
    requisitos: [
      { etiqueta: 'Registro de Proveedores del Estado (RPE) Activo', cumple: true },
      { etiqueta: 'Certificación Empresa Femenina', cumple: true },
      { etiqueta: 'MCC 5045 (Computadoras/Periféricos)', cumple: true },
      { etiqueta: 'Datos de Tarjeta Nivel III', cumple: true },
      { etiqueta: 'Aceptación TPI / Tarjeta Institucional', cumple: true },
      { etiqueta: 'RUC Verificado — DGI', cumple: true },
    ],
  },
  {
    id: 'LIC-2024-CSS-018',
    titulo: 'Renovación Tecnológica — Equipos de Cómputo para Policlínicas',
    entidad: 'Caja de Seguro Social (CSS)',
    categoria: 'Electrónica',
    presupuesto: 85000,
    fechaPublicacion: '2024-10-28',
    fechaCierre: '2024-11-25',
    estado: 'Por Cerrar',
    puntajeCoincidencia: 89,
    descripcion: 'La Caja de Seguro Social requiere un proveedor para suministrar y entregar paneles de visualización interactivos, cámaras documentales y equipos de cómputo para 42 consultorios en 6 policlínicas. El equipo debe ser compatible con el sistema de historiales médicos SEIS-MINSA. El proveedor debe ofrecer garantía de 3 años y aceptar pagos con tarjeta institucional.',
    requisitos: [
      { etiqueta: 'Registro de Proveedores del Estado (RPE) Activo', cumple: true },
      { etiqueta: 'Certificación Empresa Femenina', cumple: true },
      { etiqueta: 'MCC 5045 (Computadoras/Periféricos)', cumple: true },
      { etiqueta: 'Datos de Tarjeta Nivel III', cumple: true },
      { etiqueta: 'Aceptación TPI / Tarjeta Institucional', cumple: true },
      { etiqueta: 'En Registro Panama Compra (preferido)', cumple: false },
    ],
  },
  {
    id: 'LIC-2024-MOP-007',
    titulo: 'Actualización de Infraestructura de Red — Cableado e Inalámbrico',
    entidad: 'Ministerio de Obras Públicas (MOP)',
    categoria: 'Equipos de TI',
    presupuesto: 120000,
    fechaPublicacion: '2024-11-05',
    fechaCierre: '2024-12-10',
    estado: 'Abierta',
    puntajeCoincidencia: 82,
    descripcion: 'El Departamento de TI del MOP requiere equipos de red empresarial incluyendo switches administrados, puntos de acceso inalámbrico, bandejas de fibra óptica e infraestructura de rack para el edificio central y 3 sedes regionales. El proveedor debe ofrecer visita técnica previa, soporte de instalación y garantía de 24 meses.',
    requisitos: [
      { etiqueta: 'Registro de Proveedores del Estado (RPE) Activo', cumple: true },
      { etiqueta: 'Certificación Empresa Femenina', cumple: true },
      { etiqueta: 'MCC 5045 (Computadoras/Periféricos)', cumple: true },
      { etiqueta: 'Datos de Tarjeta Nivel III', cumple: true },
      { etiqueta: 'Aceptación TPI / Tarjeta Institucional', cumple: true },
      { etiqueta: 'Certificación ISO 9001', cumple: false },
    ],
  },
  {
    id: 'LIC-2024-ANA-033',
    titulo: 'Sistemas de Videovigilancia e Infraestructura de Almacenamiento',
    entidad: 'Autoridad Nacional de Aduanas (ANA)',
    categoria: 'Equipos de Seguridad',
    presupuesto: 340000,
    fechaPublicacion: '2024-10-15',
    fechaCierre: '2024-11-15',
    estado: 'Cerrada',
    puntajeCoincidencia: 61,
    descripcion: 'La ANA requiere sistemas de videovigilancia para personal de seguridad aduanera, incluyendo cámaras, almacenamiento en la nube de nivel forense e integración con los sistemas CAD/despacho existentes. Debe cumplir con los requisitos de la Dirección de Investigación Judicial (DIJ) de Panamá.',
    requisitos: [
      { etiqueta: 'Registro de Proveedores del Estado (RPE) Activo', cumple: true },
      { etiqueta: 'Certificación Empresa Femenina', cumple: true },
      { etiqueta: 'MCC 5045 (Computadoras/Periféricos)', cumple: true },
      { etiqueta: 'Datos de Tarjeta Nivel III', cumple: true },
      { etiqueta: 'Habilitación DIJ / SENAFRONT', cumple: false },
      { etiqueta: 'Certificación de Seguridad Nacional', cumple: false },
    ],
  },
  {
    id: 'LIC-2024-MINSA-012',
    titulo: 'Equipamiento TI — Renovación 200 Puestos Administrativos',
    entidad: 'Ministerio de Salud (MINSA)',
    categoria: 'Hardware de Cómputo',
    presupuesto: 95000,
    fechaPublicacion: '2024-11-08',
    fechaCierre: '2024-12-05',
    estado: 'Abierta',
    puntajeCoincidencia: 94,
    descripcion: 'El MINSA renueva el equipamiento de TI para 200 estaciones de trabajo administrativas. Los requisitos incluyen configuración de doble monitor, teclados y ratones de tamaño completo, kits de gestión de cables y hubs USB. Todos los artículos deben contar con garantía mínima de 3 años del fabricante. El proveedor debe aceptar tarjetas de pago institucional y proporcionar datos de transacción de Nivel III desglosados.',
    requisitos: [
      { etiqueta: 'Registro de Proveedores del Estado (RPE) Activo', cumple: true },
      { etiqueta: 'Certificación Empresa Femenina', cumple: true },
      { etiqueta: 'Productos Libres de Restricciones de Importación', cumple: true },
      { etiqueta: 'Datos de Tarjeta Nivel III', cumple: true },
      { etiqueta: 'Aceptación TPI / Tarjeta Institucional', cumple: true },
      { etiqueta: 'RUC Verificado — DGI', cumple: true },
    ],
  },
];
