import { MCCCategory, PolicyProfile } from './types';

/** Catálogo MCC disponible para armar perfiles de política. */
export const MCC_CATALOG: MCCCategory[] = [
  { code: '7011', label: 'Hoteles y alojamiento' },
  { code: '5812', label: 'Restaurantes' },
  { code: '5814', label: 'Comida rápida' },
  { code: '4121', label: 'Taxis y transporte terrestre' },
  { code: '4511', label: 'Aerolíneas' },
  { code: '4111', label: 'Transporte público' },
  { code: '5111', label: 'Papelería y útiles de oficina' },
  { code: '5045', label: 'Computadoras y periféricos' },
  { code: '7389', label: 'Servicios empresariales' },
  { code: '5541', label: 'Estaciones de servicio' },
  { code: '5732', label: 'Tiendas de electrónica' },
  { code: '5944', label: 'Joyerías' },
  { code: '7995', label: 'Casinos y apuestas' },
  { code: '5813', label: 'Bares y cantinas' },
  { code: '7297', label: 'Spa y servicios personales' },
];

export function mccByCode(code: string): MCCCategory {
  return MCC_CATALOG.find((m) => m.code === code) ?? { code, label: 'Categoría desconocida' };
}

/** Países habilitables — cualquier país no seleccionado queda bloqueado. */
export const COUNTRY_CATALOG: { code: string; name: string }[] = [
  { code: 'GT', name: 'Guatemala' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'PA', name: 'Panamá' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'HN', name: 'Honduras' },
  { code: 'CO', name: 'Colombia' },
  { code: 'ES', name: 'España' },
  { code: 'BE', name: 'Bélgica' },
];

export function countryName(code: string): string {
  return COUNTRY_CATALOG.find((c) => c.code === code)?.name ?? code;
}

export const MOCK_POLICY_PROFILES: PolicyProfile[] = [
  {
    id: 'pol-intl-us',
    name: 'Viático Internacional — EE.UU.',
    txnLimitGTQ: 8_000,
    dailyLimitGTQ: 10_000,
    allowedCountries: ['US'],
    allowedMCCs: [mccByCode('7011'), mccByCode('5812'), mccByCode('4121'), mccByCode('4511')],
    blockedMCCs: [mccByCode('5732'), mccByCode('5944'), mccByCode('7995')],
    atmWithdrawal: 'bloqueado',
    validity: { start: '2026-01-01', end: '2026-12-31' },
    autoReleaseUnused: true,
    emergencyOverride: false,
  },
  {
    id: 'pol-nacional',
    name: 'Viático Nacional',
    txnLimitGTQ: 2_000,
    dailyLimitGTQ: 3_500,
    allowedCountries: ['GT'],
    allowedMCCs: [mccByCode('7011'), mccByCode('5812'), mccByCode('4121'), mccByCode('5541')],
    blockedMCCs: [mccByCode('5944'), mccByCode('7995'), mccByCode('5813')],
    atmWithdrawal: 'limitado',
    atmDailyCapGTQ: 500,
    validity: { start: '2026-01-01', end: '2026-12-31' },
    autoReleaseUnused: true,
    emergencyOverride: false,
  },
  {
    id: 'pol-bajo-valor',
    name: 'Compra de Bajo Valor (<Q25,000)',
    txnLimitGTQ: 25_000,
    dailyLimitGTQ: 25_000,
    allowedCountries: ['GT'],
    allowedMCCs: [mccByCode('5111'), mccByCode('5045'), mccByCode('7389')],
    blockedMCCs: [mccByCode('5944'), mccByCode('7995'), mccByCode('7297')],
    atmWithdrawal: 'bloqueado',
    validity: { start: '2026-01-01', end: '2026-12-31' },
    autoReleaseUnused: false,
    emergencyOverride: true,
  },
];
