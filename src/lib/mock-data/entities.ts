import { Entity } from './types';

/**
 * Jerarquía institucional — Tesorería Nacional → ministerios → programas.
 * `spentGTQ` es el gasto ejecutado fuera de misiones; el gasto de misiones se
 * suma en vivo desde el estado de misiones.
 */
export const MOCK_ENTITIES: Entity[] = [
  {
    id: 'ent-tesoreria',
    name: 'Tesorería Nacional',
    acronym: 'TN',
    type: 'agencia',
    budgetGTQ: 240_000_000,
    spentGTQ: 96_400_000,
    activeCards: 24,
    activeMissions: 0,
    approvalChain: ['Tesorería Nacional'],
  },
  {
    id: 'ent-minex',
    name: 'Ministerio de Relaciones Exteriores',
    acronym: 'MINEX',
    type: 'ministerio',
    parentId: 'ent-tesoreria',
    budgetGTQ: 48_000_000,
    spentGTQ: 21_350_000,
    activeCards: 9,
    activeMissions: 0,
    approvalChain: ['Gestor de Viajes', 'Dirección Administrativa', 'Tesorería Nacional'],
  },
  {
    id: 'ent-minfin',
    name: 'Ministerio de Finanzas Públicas',
    acronym: 'MINFIN',
    type: 'ministerio',
    parentId: 'ent-tesoreria',
    budgetGTQ: 62_000_000,
    spentGTQ: 30_180_000,
    activeCards: 7,
    activeMissions: 0,
    approvalChain: ['Gestor de Viajes', 'Tesorería Nacional'],
  },
  {
    id: 'ent-mspas',
    name: 'Ministerio de Salud Pública y Asistencia Social',
    acronym: 'MSPAS',
    type: 'ministerio',
    parentId: 'ent-tesoreria',
    budgetGTQ: 84_000_000,
    spentGTQ: 44_720_000,
    activeCards: 6,
    activeMissions: 0,
    approvalChain: ['Gestor de Viajes', 'Tesorería Nacional'],
  },
  {
    id: 'ent-prog-misiones',
    name: 'Programa de Misiones Diplomáticas',
    acronym: 'PMD',
    type: 'programa',
    parentId: 'ent-minex',
    budgetGTQ: 12_500_000,
    spentGTQ: 4_180_000,
    activeCards: 4,
    activeMissions: 0,
    approvalChain: ['Coordinador del Programa', 'Gestor de Viajes', 'Tesorería Nacional'],
  },
];
