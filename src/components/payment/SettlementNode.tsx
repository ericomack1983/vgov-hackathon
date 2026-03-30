'use client';

interface SettlementNodeProps {
  label: string;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  x: number;
}

const ICON_SYMBOLS: Record<string, string> = {
  Building: 'B',
  CreditCard: '$',
  Wallet: 'W',
  Globe: 'P',
};

export function SettlementNode({ label, icon, isActive, isCompleted, x }: SettlementNodeProps) {
  const fill = isCompleted ? '#10b981' : isActive ? '#1434CB' : '#f1f5f9';
  const stroke = isCompleted ? '#10b981' : isActive ? '#1434CB' : '#cbd5e1';
  const textFill = isCompleted || isActive ? '#ffffff' : '#64748b';

  return (
    <g>
      <circle
        cx={x}
        cy={100}
        r={30}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
      <text
        x={x}
        y={106}
        textAnchor="middle"
        fill={textFill}
        fontSize={14}
        fontWeight="bold"
      >
        {ICON_SYMBOLS[icon] || icon[0]}
      </text>
      <text
        x={x}
        y={150}
        textAnchor="middle"
        className="text-xs"
        fill="#475569"
      >
        {label}
      </text>
    </g>
  );
}
