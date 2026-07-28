/**
 * Feature flags — TCI 2.0 modules.
 *
 * All default to ON. Set the matching NEXT_PUBLIC_* env var to "false" to turn a
 * module off; with all three off the app renders exactly as it did before TCI 2.0.
 */
export const features = {
  /** Misiones module — /misiones list + detail, dashboard tiles, txn mission column */
  missions: process.env.NEXT_PUBLIC_FEATURE_MISSIONS !== 'false',
  /** Policy Controls panel — mission wizard step 2, mission detail, card "Política" tab */
  policyControls: process.env.NEXT_PUBLIC_FEATURE_POLICY_CONTROLS !== 'false',
  /** Entidades module — /entidades tree + detail */
  entityHierarchy: process.env.NEXT_PUBLIC_FEATURE_ENTITY_HIERARCHY !== 'false',
} as const;
