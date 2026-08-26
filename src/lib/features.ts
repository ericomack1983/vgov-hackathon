/**
 * Feature flags — TCI 2.0 modules.
 *
 * Missions and Policy Controls are parked while their requirements are worked
 * out, so they default to OFF and opt in with NEXT_PUBLIC_* = "true". The code
 * behind them is untouched — flipping the flag back on restores the module.
 * Entidades still defaults ON and opts out with "false".
 */
export const features = {
  /** Misiones module — /misiones list + detail, dashboard tiles, txn mission column, card mission link */
  missions: process.env.NEXT_PUBLIC_FEATURE_MISSIONS === 'true',
  /** Policy Controls panel — mission wizard step 2, mission detail, card "Política" tab */
  policyControls: process.env.NEXT_PUBLIC_FEATURE_POLICY_CONTROLS === 'true',
  /** Entidades module — /entidades tree + detail */
  entityHierarchy: process.env.NEXT_PUBLIC_FEATURE_ENTITY_HIERARCHY !== 'false',
} as const;
