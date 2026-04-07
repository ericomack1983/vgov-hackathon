'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Wifi, ChevronDown, ShieldCheck, ToggleLeft, ToggleRight, CreditCard, ShieldOff, Shield } from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { v4 as uuidv4 } from 'uuid';
import {
  vcnService,
  vpaService,
  vpcService,
  buildSPVRule,
  buildBlockRule,
  buildAmountRule,
} from '@/lib/visa-sdk';

interface SDKIssuancePayload {
  holderName: string;
  purpose: string;
  spendLimit: string;
  mccCode: string;
  allowOnline: boolean;
  expiryDate: string;
}

type Brand = 'Visa' | 'Mastercard' | 'Amex';
type CardType = 'credit' | 'debit';
type UsageType = 'single-use' | 'multi-use';
type IssueStep = 'validating' | 'contacting' | 'generating' | 'vpa' | 'vpc' | 'issued';

const BRAND_BG: Record<Brand, string> = {
  Visa:       'from-[#1434CB] to-[#0a1f8f]',
  Mastercard: 'from-[#EB001B] to-[#a80013]',
  Amex:       'from-[#007BC1] to-[#005a8e]',
};

const BRAND_LABEL: Record<Brand, string> = {
  Visa: 'VISA', Mastercard: 'MC', Amex: 'AMEX',
};

const MCC_CATEGORIES = [
  { code: '5065', label: 'Electrical Parts & Equipment' },
  { code: '5045', label: 'Computers & Peripherals' },
  { code: '5047', label: 'Medical & Dental Equipment' },
  { code: '5084', label: 'Industrial Machinery' },
  { code: '7389', label: 'Business Services' },
  { code: '7372', label: 'Software & IT Services' },
  { code: '5199', label: 'Raw Materials & Supplies' },
  { code: '5085', label: 'Industrial & Commercial Supplies' },
];

const ISSUE_STEPS: { key: IssueStep; label: string; duration: number; visaLogo?: boolean }[] = [
  { key: 'validating',  label: 'Validating VCN request…',                        duration: 900  },
  { key: 'contacting',  label: 'Contacting issuer network…',                     duration: 1400 },
  { key: 'generating',  label: 'Generating virtual card credentials…',           duration: 1100 },
  { key: 'vpa',         label: 'Creating VPA (Pseudo Accounts)…',                duration: 1200, visaLogo: true },
  { key: 'vpc',         label: 'Applying Visa Payment Controls…',                duration: 1000, visaLogo: true },
  { key: 'issued',      label: 'VCN issued successfully!',                       duration: 0    },
];

function randomLast4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

interface IssuedCard {
  holderName: string;
  brand: Brand;
  type: CardType;
  usageType: UsageType;
  supplierName: string;
  last4: string;
  expiry: string;
  spendLimit?: string;
  cardAcceptorId?: string;
  mccCode?: string;
  mccLabel?: string;
  expiryDate?: string;
  allowOnline: boolean;
  allowIntl: boolean;
  allowRecurring: boolean;
  blocked?: boolean;
}

// Live card preview
function CardPreview({ holderName, brand, type, usageType, flipped, issuedLast4, blocked }: {
  holderName: string;
  brand: Brand;
  type: CardType;
  usageType: UsageType;
  flipped: boolean;
  issuedLast4?: string;
  blocked?: boolean;
}) {
  const displayName = holderName.trim() || 'CARD HOLDER';
  const now = new Date();
  const expiry = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear() + 3).slice(-2)}`;

  return (
    <motion.div
      animate={{ rotateY: flipped ? 0 : 0, scale: flipped ? 1.03 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative w-full max-w-sm mx-auto h-48 rounded-2xl bg-gradient-to-br ${BRAND_BG[brand]} overflow-hidden shadow-2xl select-none`}
      style={blocked ? { filter: 'saturate(0.18) brightness(0.72)' } : undefined}
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 w-48 h-48 rounded-full bg-white/5" />

      {/* VCN badge */}
      <div className="absolute top-3 left-6">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 backdrop-blur-sm text-[9px] font-bold text-white/80 uppercase tracking-wider">
          <CreditCard size={8} />
          {usageType === 'single-use' ? 'Single-Use VCN' : 'Multi-Use VCN'}
        </span>
      </div>

      {/* Chip */}
      <div className="absolute top-10 left-6 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner grid grid-cols-2 gap-px p-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-sm bg-yellow-600/40" />
        ))}
      </div>

      {/* Wifi / contactless */}
      <div className="absolute top-10 left-16">
        <Wifi size={14} className="text-white/60 rotate-90" />
      </div>

      {/* Brand label */}
      <div className="absolute top-5 right-5">
        <span className="text-white font-black tracking-widest text-sm">{BRAND_LABEL[brand]}</span>
      </div>

      {/* Card number */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2">
        <p className="font-mono text-white text-lg tracking-[0.22em]">
          {issuedLast4
            ? `•••• •••• •••• ${issuedLast4}`
            : '•••• •••• •••• ••••'}
        </p>
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Card Holder</p>
          <p className="text-white text-xs font-semibold tracking-wide uppercase truncate max-w-[160px]">
            {displayName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Expires</p>
          <p className="text-white text-xs font-semibold">{expiry}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Type</p>
          <p className="text-white text-xs font-semibold capitalize">{type}</p>
        </div>
      </div>

      {/* Blocked overlay — animates in */}
      <AnimatePresence>
        {blocked && (
          <motion.div
            key="blocked-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 100%)',
              backdropFilter: 'blur(1.5px)',
            }}
          >
            {/* Diagonal stripe texture */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 10px)',
              }}
            />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.22)' }}
              >
                <ShieldOff size={18} className="text-white" strokeWidth={1.8} />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                Blocked
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Hex data floaters for card build animation ───────────────────────────────
const HEX_DATA = [
  { text: 'A3 F7 2C 91', pos: { top:  8, left: 12 }, opacity: 0.55, delay: 0.2, gap: 1.8 },
  { text: '4E B0 7D C5', pos: { top: 14, left: 12 }, opacity: 0.35, delay: 0.9, gap: 2.3 },
  { text: '0x1434CB',    pos: { top:  8, right: 16 }, opacity: 0.50, delay: 0.5, gap: 1.6 },
  { text: 'VCN_ISSUE',   pos: { top: 16, right: 16 }, opacity: 0.30, delay: 1.1, gap: 2.5 },
  { text: 'F2 9A 3E 11', pos: { bottom: 6, left: 12 }, opacity: 0.40, delay: 1.4, gap: 2.0 },
  { text: '0x00FF7B',    pos: { bottom: 6, right: 16 }, opacity: 0.35, delay: 0.7, gap: 2.2 },
];

// ── Card build animation — replaces globe ────────────────────────────────────
function CardBuildAnimation({ currentIdx, done }: { currentIdx: number; done: boolean }) {
  const [scanPct, setScanPct] = useState(0);
  const rafRef   = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const SCAN_DURATION = 5200;

  useEffect(() => {
    let cancelled = false;
    const animate = (ts: number) => {
      if (cancelled) return;
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / SCAN_DURATION, 1);
      setScanPct(Math.round(p * 100));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => { if (done) setScanPct(100); }, [done]);

  const CARD_W = 248;
  const CARD_H = 156;
  const chipVisible   = scanPct > 18;
  const wifiVisible   = scanPct > 24;
  const logoVisible   = scanPct >  8;
  const numVisible    = scanPct > 46;
  const bottomVisible = scanPct > 68;
  const beamY = (scanPct / 100) * CARD_H;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 200 }}>
      {/* Circuit grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(74,123,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(74,123,255,0.045) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 80% at 50% 46%, rgba(20,52,203,0.22) 0%, transparent 70%)',
      }} />

      {/* Floating hex labels */}
      {HEX_DATA.map((item, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, item.opacity, 0] }}
          transition={{ delay: item.delay, duration: 2, repeat: Infinity, repeatDelay: item.gap }}
          className="absolute font-mono select-none pointer-events-none"
          style={{ ...(item.pos as React.CSSProperties), fontSize: 8, color: 'rgba(74,123,255,0.7)', letterSpacing: 1 }}
        >
          {item.text}
        </motion.span>
      ))}

      {/* Card */}
      <div className="absolute" style={{
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: CARD_W, height: CARD_H,
      }}>
        {/* Blueprint shell */}
        <div className="absolute inset-0 rounded-2xl" style={{
          border: '1px solid rgba(74,123,255,0.2)',
          background: 'rgba(7,16,46,0.75)',
        }}>
          {/* Corner markers */}
          {[
            { top: 0, left: 0 },   { top: 0, right: 0 },
            { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
          ].map((pos, i) => (
            <div key={i} className="absolute w-3 h-3 pointer-events-none" style={{
              ...pos,
              borderTop:    pos.top    !== undefined ? '1.5px solid rgba(74,123,255,0.4)' : 'none',
              borderBottom: pos.bottom !== undefined ? '1.5px solid rgba(74,123,255,0.4)' : 'none',
              borderLeft:   pos.left   !== undefined ? '1.5px solid rgba(74,123,255,0.4)' : 'none',
              borderRight:  pos.right  !== undefined ? '1.5px solid rgba(74,123,255,0.4)' : 'none',
              borderTopLeftRadius:     (pos.top !== undefined && pos.left  !== undefined) ? 8 : 0,
              borderTopRightRadius:    (pos.top !== undefined && pos.right !== undefined) ? 8 : 0,
              borderBottomLeftRadius:  (pos.bottom !== undefined && pos.left  !== undefined) ? 8 : 0,
              borderBottomRightRadius: (pos.bottom !== undefined && pos.right !== undefined) ? 8 : 0,
            }} />
          ))}
        </div>

        {/* Revealed gradient layer — clipped by scan */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
          clipPath: `inset(0 0 ${100 - scanPct}% 0 round 16px)`,
          background: 'linear-gradient(135deg, #1434CB 0%, #1e44e8 55%, #0a1f8f 100%)',
        }}>
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-white/5" />

          {/* Chip */}
          {chipVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              className="absolute" style={{ top: 28, left: 18 }}>
              <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner grid grid-cols-2 gap-px p-1">
                {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm bg-yellow-600/40" />)}
              </div>
            </motion.div>
          )}

          {/* Contactless */}
          {wifiVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              className="absolute" style={{ top: 28, left: 68 }}>
              <Wifi size={13} className="text-white/60 rotate-90" />
            </motion.div>
          )}

          {/* Visa logo */}
          {logoVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              className="absolute" style={{ top: 12, right: 16 }}>
              <svg viewBox="0 0 72 24" style={{ height: 14, width: 'auto' }}>
                <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
              </svg>
            </motion.div>
          )}

          {/* Card number */}
          {numVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              className="absolute" style={{ top: '50%', left: 18, transform: 'translateY(-50%) translateY(5px)' }}>
              <p className="font-mono text-white tracking-[0.2em]" style={{ fontSize: 13 }}>
                •••• •••• •••• ••••
              </p>
            </motion.div>
          )}

          {/* Bottom row */}
          {bottomVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              className="absolute" style={{ bottom: 12, left: 18, right: 18 }}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="uppercase tracking-widest text-white/40" style={{ fontSize: 7, marginBottom: 2 }}>Card Holder</p>
                  <p className="text-white font-semibold tracking-wide uppercase" style={{ fontSize: 9 }}>GOV PROCUREMENT</p>
                </div>
                <div className="text-right">
                  <p className="uppercase tracking-widest text-white/40" style={{ fontSize: 7, marginBottom: 2 }}>Expires</p>
                  <p className="text-white font-semibold" style={{ fontSize: 9 }}>••/••</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scan beam */}
        {scanPct > 0 && scanPct < 100 && (
          <div className="absolute inset-x-0 pointer-events-none rounded-sm" style={{
            top: beamY - 1,
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.7) 15%, #93c5fd 50%, rgba(96,165,250,0.7) 85%, transparent 100%)',
            boxShadow: '0 0 10px rgba(147,197,253,0.9), 0 0 3px rgba(147,197,253,1)',
          }} />
        )}

        {/* Feather above beam — dark to transparent */}
        {scanPct > 0 && scanPct < 100 && (
          <div className="absolute inset-x-0 pointer-events-none" style={{
            top: 0,
            height: beamY,
            background: 'linear-gradient(to bottom, rgba(7,16,46,0.55) 0%, transparent 100%)',
            borderRadius: '16px 16px 0 0',
          }} />
        )}

        {/* Done glow pulse */}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.95, 1.04, 1] }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
            className="absolute -inset-4 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.35) 0%, transparent 70%)' }}
          />
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #07102e)' }} />
    </div>
  );
}

// ── Step badge config ────────────────────────────────────────────────────────
const STEP_BADGE: Record<IssueStep, { tag: string; color: string; bg: string; border: string }> = {
  validating: { tag: 'VCN',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  contacting: { tag: 'NET',     color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)'  },
  generating: { tag: 'GEN',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  vpa:        { tag: 'VPA',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
  vpc:        { tag: 'CTRL',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  issued:     { tag: 'ISSUED',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
};


// ── Issuance overlay — dark terminal style ───────────────────────────────────
function IssuanceOverlay({ brand, onDone, sdkPayload }: {
  brand: Brand;
  onDone: (last4: string) => void;
  sdkPayload: SDKIssuancePayload;
}) {
  const [completedSteps, setCompletedSteps] = useState<IssueStep[]>([]);
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [done, setDone]                     = useState(false);
  const [displayLast4, setDisplayLast4]     = useState('••••');
  const sdkLast4Ref                         = useRef<string | null>(null);
  const sdkFiredRef                         = useRef(false);
  const expiry = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getFullYear() + 3).slice(-2)}`;

  // Fire real SDK calls concurrently with the animation (sandbox resolves instantly)
  useEffect(() => {
    if (sdkFiredRef.current) return;
    sdkFiredRef.current = true;

    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = sdkPayload.expiryDate
      ? sdkPayload.expiryDate
      : `${today.getFullYear() + 1}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const spendLimitAmount = sdkPayload.spendLimit ? parseFloat(sdkPayload.spendLimit) : 50_000;
    const rules = [
      buildSPVRule({ spendLimitAmount, maxAuth: 10, currencyCode: '840', rangeType: 'monthly' }),
      buildAmountRule('PUR', spendLimitAmount, '840'),
      buildBlockRule('ATM'),
      ...(!sdkPayload.allowOnline ? [buildBlockRule('ECOM')] : []),
    ];

    (async () => {
      try {
        const clientId = 'B2BWS_1_1_9999';

        // 0 — VPA: onboard buyer → funding account → proxy pool → supplier
        const buyer = await vpaService.Buyer.createBuyer({
          clientId,
          buyerName: sdkPayload.holderName || 'Gov Procurement Agency',
          currencyCode: '840',
        });
        await vpaService.FundingAccount.addFundingAccount({
          clientId,
          buyerId: buyer.buyerId,
          accountNumber: '4111111111111111',
        });
        const pool = await vpaService.ProxyPool.createProxyPool({
          clientId,
          proxyPoolId: `POOL-${buyer.buyerId}`,
          size: 50,
        });
        await vpaService.Supplier.createSupplier({
          clientId,
          supplierName: 'Procurement Supplier',
          accountNumber: '4111111111110000',
        });

        // 1 — VCN: issue the virtual card
        const vcnResp = await vcnService.requestVirtualCard({
          clientId,
          buyerId: buyer.buyerId,
          messageId: Date.now().toString(),
          action: 'A',
          numberOfCards: '1',
          proxyPoolId: pool.proxyPoolId,
          requisitionDetails: { startDate, endDate, timeZone: 'UTC-5', rules },
        });
        const card = vcnResp.accounts[0];
        const resolvedLast4 = card.accountNumber.slice(-4);
        sdkLast4Ref.current = resolvedLast4;
        setDisplayLast4(resolvedLast4);

        // 2 — VPC: enrol the card
        const vpcAcct = await vpcService.AccountManagement.createAccount({
          accountNumber: card.accountNumber,
          contacts: [{ name: sdkPayload.holderName, email: 'proc@agency.gov', notifyOn: ['transaction_declined', 'account_blocked'] }],
        });

        // 3 — IPC: translate purpose/MCC into rules and apply
        const prompt = sdkPayload.purpose || (sdkPayload.mccCode ? `MCC ${sdkPayload.mccCode}` : 'government procurement');
        const { suggestions } = await vpcService.IPC.getSuggestedRules({ prompt, currencyCode: '840' });
        await vpcService.IPC.setSuggestedRules(suggestions[0].ruleSetId, vpcAcct.accountId);
      } catch {
        // Non-blocking — SDK failure falls back to random last4
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function runStep(idx: number) {
      if (idx >= ISSUE_STEPS.length) return;
      const step = ISSUE_STEPS[idx];
      if (step.key === 'issued') {
        setCompletedSteps((p) => [...p, step.key]);
        setCurrentIdx(idx);
        setTimeout(() => setDone(true), 500);
        // Use real SDK last4 if available, else fall back to random
        setTimeout(() => onDone(sdkLast4Ref.current ?? randomLast4()), 2200);
        return;
      }
      timeout = setTimeout(() => {
        setCompletedSteps((p) => [...p, step.key]);
        setCurrentIdx(idx + 1);
        runStep(idx + 1);
      }, step.duration);
    }
    runStep(0);
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[520px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 60%, #0a1628 100%)',
          boxShadow: '0 0 0 1px rgba(99,130,255,0.15), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-white/6">
          <div className="w-8 h-8 rounded-lg bg-[#1434CB] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 72 24" className="h-3.5 w-auto">
              <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold leading-tight">Visa Virtual Card Network</p>
            <p className="text-white/30 text-[10px] font-mono mt-0.5">api.visa.com · vcn/v2/issue</p>
          </div>
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.span key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-[9px] font-bold text-[#60a5fa] font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
                Issuing
              </motion.span>
            ) : (
              <motion.span key="done" initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Complete
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ── Card build animation ── */}
        <CardBuildAnimation currentIdx={currentIdx} done={done} />

        {/* ── Log feed ── */}
        <div className="px-5 pb-4 space-y-2">
          {ISSUE_STEPS.map((step, i) => {
            const isVisible = i < currentIdx || completedSteps.includes(step.key);
            const isActive  = i === currentIdx && !completedSteps.includes(step.key);
            const badge     = STEP_BADGE[step.key];
            if (!isVisible && !isActive) return null;
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center gap-2.5 font-mono"
              >
                <span className="text-white/20 text-[10px] select-none">›</span>
                {/* Badge tag */}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                  {badge.tag}
                </span>
                {/* Visa API pill for VPA/VPC steps */}
                {step.visaLogo && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0"
                    style={{ color: '#93bbff', background: 'rgba(20,52,203,0.25)', border: '1px solid rgba(74,123,255,0.3)' }}>
                    <svg viewBox="0 0 72 24" className="h-2 w-auto shrink-0">
                      <path fill="currentColor" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
                    </svg>
                    API
                  </span>
                )}
                <span className="text-[11px] truncate"
                  style={{ color: isActive ? 'rgba(200,215,255,0.9)' : 'rgba(148,180,255,0.55)' }}>
                  {step.label}
                </span>
                {isActive && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-[2px] h-[11px] bg-[#60a5fa] ml-0.5 align-middle shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── Issued card summary ── */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mx-4 mb-4 rounded-xl overflow-hidden">
                {/* Mini card preview */}
                <div className={`relative h-24 bg-gradient-to-br ${BRAND_BG[brand]} overflow-hidden`}>
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/5" />
                  {/* Scan beam done flash */}
                  <motion.div
                    className="absolute inset-0 bg-emerald-400/20"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                      <CheckCircle size={13} className="text-white" strokeWidth={2.5} />
                    </motion.div>
                    <span className="text-white/70 text-[9px] font-bold font-mono uppercase tracking-widest">VCN Issued</span>
                  </div>
                  <div className="absolute top-3 right-4">
                    <svg viewBox="0 0 72 24" className="h-4 w-auto opacity-90">
                      <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-[7px] text-white/40 uppercase tracking-widest mb-0.5">Card Holder</p>
                      <p className="text-white text-[10px] font-bold tracking-wide uppercase">VCN HOLDER</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/80 font-mono text-[11px] tracking-[0.15em]">•••• {displayLast4}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] text-white/40 uppercase tracking-widest mb-0.5">Expires</p>
                      <p className="text-white text-[10px] font-bold">{expiry}</p>
                    </div>
                  </div>
                </div>
                {/* Summary row */}
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <ShieldCheck size={13} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Card issued successfully</p>
                      <p className="text-emerald-400/70 text-[9px] font-mono mt-0.5">Visa VCN · Payment controls applied</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-sm font-black">100%</p>
                    <p className="text-emerald-400/50 text-[8px] font-mono">complete</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── IPC Panel ────────────────────────────────────────────────────────────────
const ANALYZE_STEPS = [
  'Parsing intent parameters…',
  'Resolving MCC constraints…',
  'Evaluating risk policy engine…',
  'Generating VPCRule[]…',
];

function buildRules(
  mccCode: string, spendLimit: string,
  allowOnline: boolean, allowIntl: boolean, allowRecurring: boolean,
  usageType: UsageType,
) {
  const mccLabel = MCC_CATEGORIES.find(m => m.code === mccCode)?.label;
  const rules: { tag: string; label: string; color: string; bg: string }[] = [];
  if (spendLimit) rules.push({ tag: 'SPV',   label: `Spend cap $${Number(spendLimit).toLocaleString()} · monthly`,  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  });
  if (mccCode)    rules.push({ tag: 'MCC',   label: `${mccCode} — ${mccLabel}`,                                      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' });
  rules.push(      { tag: 'BLOCK', label: 'ATM withdrawals blocked',                                                 color: '#f87171', bg: 'rgba(248,113,113,0.12)' });
  rules.push(      { tag: 'ECOM',  label: allowOnline ? 'Online payments allowed' : 'ECOM channel blocked',          color: allowOnline ? '#34d399' : '#f87171', bg: allowOnline ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)' });
  rules.push(      { tag: 'GEO',   label: allowIntl   ? 'International enabled'   : 'Domestic-only geo fence',       color: allowIntl   ? '#34d399' : '#fbbf24', bg: allowIntl   ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)'  });
  if (usageType === 'multi-use') rules.push({ tag: 'RECUR', label: allowRecurring ? 'Recurring charges on' : 'Recurring blocked', color: allowRecurring ? '#34d399' : '#f87171', bg: allowRecurring ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)' });
  return rules;
}

function buildRationale(purpose: string, mccCode: string, spendLimit: string, allowOnline: boolean, allowIntl: boolean, usageType: UsageType) {
  const mccLabel = MCC_CATEGORIES.find(m => m.code === mccCode)?.label;
  const parts: string[] = [];
  if (purpose)    parts.push(`intent "${purpose.slice(0, 44)}${purpose.length > 44 ? '…' : ''}"`);
  if (mccLabel)   parts.push(`MCC restriction to ${mccLabel}`);
  if (spendLimit) parts.push(`spend cap of $${Number(spendLimit).toLocaleString()}`);
  if (!allowOnline) parts.push('ECOM channel blocked');
  if (!allowIntl)   parts.push('domestic-only geo fence applied');
  const summary = parts.length ? `Translated ${parts.join(', ')}. ` : '';
  return `${summary}ATM access blocked by default for security. ${usageType === 'single-use' ? 'Single-use' : 'Multi-use'} VPCRule[] is ready to apply — awaiting card issuance.`;
}

function IPCPanel({ purpose, mccCode, spendLimit, allowOnline, allowIntl, allowRecurring, usageType }: {
  purpose: string; mccCode: string; spendLimit: string;
  allowOnline: boolean; allowIntl: boolean; allowRecurring: boolean;
  usageType: UsageType;
}) {
  const [phase, setPhase]                     = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [analyzeStep, setAnalyzeStep]         = useState(0);
  const [displayedRationale, setDisplayedRationale] = useState('');
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasInput = !!(purpose || mccCode || spendLimit);
  const rules      = buildRules(mccCode, spendLimit, allowOnline, allowIntl, allowRecurring, usageType);
  const rationale  = buildRationale(purpose, mccCode, spendLimit, allowOnline, allowIntl, usageType);
  const confidence = Math.min(95, 70 + (purpose ? 8 : 0) + (mccCode ? 8 : 0) + (spendLimit ? 5 : 0) + (!allowIntl ? 2 : 0) + (!allowOnline ? 2 : 0));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (typeRef.current)     clearTimeout(typeRef.current);
    if (stepRef.current)     clearInterval(stepRef.current);

    if (!hasInput) { setPhase('idle'); return; }

    setPhase('analyzing');
    setAnalyzeStep(0);
    setDisplayedRationale('');

    let step = 0;
    stepRef.current = setInterval(() => {
      step = Math.min(step + 1, ANALYZE_STEPS.length - 1);
      setAnalyzeStep(step);
    }, 280);

    debounceRef.current = setTimeout(() => {
      if (stepRef.current) clearInterval(stepRef.current);
      setPhase('done');
      // typewriter
      let i = 0;
      const tick = () => {
        if (i >= rationale.length) return;
        i++;
        setDisplayedRationale(rationale.slice(0, i));
        typeRef.current = setTimeout(tick, 14);
      };
      tick();
    }, 1350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (typeRef.current)     clearTimeout(typeRef.current);
      if (stepRef.current)     clearInterval(stepRef.current);
    };
  }, [purpose, mccCode, spendLimit, allowOnline, allowIntl, allowRecurring, hasInput, rationale]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 65%, #0a1628 100%)',
        boxShadow: '0 0 0 1px rgba(99,130,255,0.15), 0 8px 24px rgba(0,0,0,0.28)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/6">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8h3l2-5 2 10 2-5h3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold leading-tight">Intelligent Payment Controls</p>
          <p className="text-white/25 text-[9px] font-mono mt-0.5">ai.visa.com/ipc/v1/translate-intent</p>
        </div>
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[9px] font-bold font-mono text-white/25 uppercase tracking-widest">
              Standby
            </motion.span>
          )}
          {phase === 'analyzing' && (
            <motion.span key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[9px] font-bold text-[#60a5fa] font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
              Analyzing
            </motion.span>
          )}
          {phase === 'done' && (
            <motion.span key="done" initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Idle state */}
        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2 space-y-2">
            <p className="text-white/35 text-[11px] font-mono">
              <span className="text-white/20 mr-1.5">›</span>
              IPC ready — awaiting parameters
            </p>
            <p className="text-white/20 text-[10px] leading-relaxed pl-4">
              Fill in a purpose or configure controls.<br />
              IPC will translate your intent into VPCRule[].
            </p>
            {/* Subtle pulse dots */}
            <div className="flex items-center gap-1.5 pl-4 pt-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#1434CB]/40"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Analyzing state */}
        {phase === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 py-1">
            {ANALYZE_STEPS.slice(0, analyzeStep + 1).map((label, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 font-mono"
              >
                <span className="text-white/20 text-[10px]">›</span>
                <span className="text-[10px]" style={{ color: i === analyzeStep ? 'rgba(200,215,255,0.85)' : 'rgba(148,180,255,0.4)' }}>
                  {label}
                </span>
                {i === analyzeStep && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-[2px] h-[10px] bg-[#60a5fa] shrink-0"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Done state — rules + confidence + rationale */}
        {phase === 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-2.5">
            {/* Rule list */}
            <div className="space-y-1">
              {rules.map((rule, i) => (
                <motion.div
                  key={rule.tag + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-center gap-2 font-mono"
                >
                  <span className="text-white/20 text-[10px] shrink-0">›</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ color: rule.color, background: rule.bg, border: `1px solid ${rule.color}40` }}
                  >
                    {rule.tag}
                  </span>
                  <span className="text-[10px] text-[#94b4ff]/70 truncate">{rule.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Confidence bar */}
            <div className="pt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider font-mono">Confidence</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-bold font-mono"
                  style={{ color: confidence >= 88 ? '#34d399' : confidence >= 75 ? '#fbbf24' : '#f87171' }}
                >
                  {confidence}%
                </motion.span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  style={{ background: confidence >= 88 ? 'linear-gradient(to right,#10b981,#34d399)' : 'linear-gradient(to right,#f59e0b,#fbbf24)' }}
                />
              </div>
            </div>

            {/* Rationale */}
            {displayedRationale && (
              <div className="border-t border-white/6 pt-2.5">
                <p className="text-[9px] font-semibold text-white/25 uppercase tracking-wider font-mono mb-1.5">
                  AI Rationale
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(148,180,255,0.6)' }}>
                  {displayedRationale}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-[2px] h-[9px] bg-[#60a5fa]/60 ml-0.5 align-middle"
                  />
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center gap-1.5">
        <svg viewBox="0 0 72 24" className="h-2.5 w-auto opacity-20">
          <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
        </svg>
        <span className="text-[8px] text-white/15 font-mono">IPC · Intent → VPCRule[] · Gen-AI model</span>
      </div>
    </motion.div>
  );
}

export default function CardsPage() {
  const { suppliers, addCardToSupplier } = useProcurement();

  const [holderName, setHolderName]         = useState('');
  const [brand, setBrand]                   = useState<Brand>('Visa');
  const [cardType, setCardType]             = useState<CardType>('credit');
  const [usageType, setUsageType]           = useState<UsageType>('single-use');
  const [supplierId, setSupplierId]         = useState('');
  const [purpose, setPurpose]               = useState('');
  const [spendLimit, setSpendLimit]         = useState('');
  const [cardAcceptorId, setCardAcceptorId] = useState('');
  const [mccCode, setMccCode]               = useState('');
  const [expiryDate, setExpiryDate]         = useState('');
  const [allowOnline, setAllowOnline]       = useState(true);
  const [allowIntl, setAllowIntl]           = useState(false);
  const [allowRecurring, setAllowRecurring] = useState(false);

  const [isRequesting, setIsRequesting]       = useState(false);
  const [issuedCard, setIssuedCard]           = useState<IssuedCard | null>(null);
  const [sdkIssuancePayload, setSdkIssuancePayload] = useState<SDKIssuancePayload | null>(null);
  const [isBlocking, setIsBlocking]           = useState(false);

  // Listen for card events fired from the AI chat widget
  useEffect(() => {
    const blockHandler = () => {
      setIssuedCard(prev => prev ? { ...prev, blocked: true } : prev);
    };
    const unblockHandler = () => {
      setIssuedCard(prev => prev ? { ...prev, blocked: false } : prev);
    };
    const issuedHandler = (e: Event) => {
      const { data, params } = (e as CustomEvent<{
        data: { accounts: { accountNumber: string; expiryDate: string }[]; responseCode: string };
        params: { supplierName?: string; amount?: number; startDate?: string; endDate?: string };
      }>).detail;
      const account = data?.accounts?.[0];
      if (!account) return;
      const last4 = account.accountNumber.slice(-4);
      const expiry = account.expiryDate ?? '';
      const supplierName = String(params?.supplierName ?? 'Supplier');
      setIssuedCard({
        holderName: supplierName,
        brand: 'Visa',
        type: 'credit',
        usageType: 'single-use',
        supplierName,
        last4,
        expiry,
        spendLimit: params?.amount ? String(params.amount) : undefined,
        allowOnline: false,
        allowIntl: false,
        allowRecurring: false,
      });
    };
    window.addEventListener('vgov:card-blocked', blockHandler);
    window.addEventListener('vgov:card-unblocked', unblockHandler);
    window.addEventListener('vgov:card-issued', issuedHandler);
    return () => {
      window.removeEventListener('vgov:card-blocked', blockHandler);
      window.removeEventListener('vgov:card-unblocked', unblockHandler);
      window.removeEventListener('vgov:card-issued', issuedHandler);
    };
  }, []);

  const inputClass = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB] bg-white text-slate-800 placeholder:text-slate-400 transition';

  // single-use VCNs shouldn't allow recurring charges
  useEffect(() => {
    if (usageType === 'single-use') setAllowRecurring(false);
  }, [usageType]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!holderName.trim() || !supplierId) return;
    setSdkIssuancePayload({ holderName: holderName.trim(), purpose, spendLimit, mccCode, allowOnline, expiryDate });
    setIsRequesting(true);
  }

  function handleIssuanceDone(last4: string) {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const now = new Date();
    const mcc = MCC_CATEGORIES.find((m) => m.code === mccCode);
    const expiry = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear() + 3).slice(-2)}`;

    // Persist VCN into the supplier's card list so the payment page can use it
    addCardToSupplier(supplierId, {
      id: 'vcn-' + uuidv4().slice(0, 8),
      type: cardType,
      brand,
      last4,
      expiry,
      holderName: holderName.trim(),
      status: 'active',
      usageType,
    });

    setIssuedCard({
      holderName: holderName.trim(),
      brand,
      type: cardType,
      usageType,
      supplierName: supplier?.name ?? '',
      last4,
      expiry,
      spendLimit: spendLimit || undefined,
      cardAcceptorId: cardAcceptorId.trim() || undefined,
      mccCode: mcc?.code,
      mccLabel: mcc?.label,
      expiryDate: expiryDate || undefined,
      allowOnline,
      allowIntl,
      allowRecurring,
    });
    setIsRequesting(false);
  }

  function resetForm() {
    setHolderName('');
    setBrand('Visa');
    setCardType('credit');
    setUsageType('single-use');
    setSupplierId('');
    setPurpose('');
    setSpendLimit('');
    setCardAcceptorId('');
    setMccCode('');
    setExpiryDate('');
    setAllowOnline(true);
    setAllowIntl(false);
    setAllowRecurring(false);
    setIssuedCard(null);
    setIsBlocking(false);
  }

  async function handleBlockCard() {
    if (!issuedCard || isBlocking) return;
    setIsBlocking(true);
    try {
      await vpcService.Rules.blockAccount('VPC-ACCT-' + issuedCard.last4);
    } catch {
      // sandbox — continue regardless
    }
    setIssuedCard(prev => prev ? { ...prev, blocked: true } : prev);
    setIsBlocking(false);
  }

  return (
    <>
      <AnimatePresence>
        {isRequesting && sdkIssuancePayload && (
          <IssuanceOverlay brand={brand} onDone={handleIssuanceDone} sdkPayload={sdkIssuancePayload} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Virtual Card Issuance</h1>
            <p className="mt-1 text-sm text-slate-500">
              Issue a VCN — a single-use or limited-use credential tied to a specific supplier, amount, and time window.
            </p>
          </div>
          <div className="flex gap-2 mt-0.5 shrink-0">
            {[
              { label: 'Supplier-locked', color: 'bg-[#EEF1FD] text-[#1434CB]' },
              { label: 'Amount-bound',    color: 'bg-violet-50 text-violet-600' },
              { label: 'Time-bound',      color: 'bg-sky-50 text-sky-600'       },
              { label: 'MCC-controlled',  color: 'bg-emerald-50 text-emerald-600' },
            ].map(({ label, color }) => (
              <span key={label} className={`hidden lg:inline-flex text-[10px] font-semibold px-2 py-1 rounded-full ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left — Live card preview */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start">Preview</p>
            <AnimatePresence mode="wait">
              {issuedCard ? (
                <motion.div
                  key="issued"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-full"
                  style={{ perspective: 1000 }}
                >
                  <CardPreview
                    holderName={issuedCard.holderName}
                    brand={issuedCard.brand}
                    type={issuedCard.type}
                    usageType={issuedCard.usageType}
                    flipped
                    issuedLast4={issuedCard.last4}
                    blocked={issuedCard.blocked}
                  />
                  {/* Issued details */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3"
                  >
                    {[
                      { label: 'VCN Type',    value: issuedCard.usageType === 'single-use' ? 'Single-Use' : 'Multi-Use' },
                      { label: 'Supplier',    value: issuedCard.supplierName },
                      { label: 'Card Type',   value: issuedCard.type.charAt(0).toUpperCase() + issuedCard.type.slice(1) },
                      { label: 'Network',     value: issuedCard.brand },
                      { label: 'Card Number', value: `•••• •••• •••• ${issuedCard.last4}` },
                      { label: 'Expiry',      value: issuedCard.expiry },
                      ...(issuedCard.spendLimit   ? [{ label: 'Spend Limit',     value: `$${Number(issuedCard.spendLimit).toLocaleString()}` }] : []),
                      ...(issuedCard.expiryDate   ? [{ label: 'Valid Until',      value: issuedCard.expiryDate }] : []),
                      ...(issuedCard.mccLabel     ? [{ label: 'MCC Category',     value: `${issuedCard.mccCode} · ${issuedCard.mccLabel}` }] : []),
                      ...(issuedCard.cardAcceptorId ? [{ label: 'Acceptor ID',    value: issuedCard.cardAcceptorId }] : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="font-semibold text-slate-800 font-mono text-right max-w-[60%] truncate">{row.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Controls</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Online',         on: issuedCard.allowOnline    },
                          { label: 'International',  on: issuedCard.allowIntl      },
                          { label: 'Recurring',      on: issuedCard.allowRecurring },
                        ].map(({ label, on }) => (
                          <span key={label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {on ? '✓' : '✕'} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                      <button
                        onClick={resetForm}
                        className="flex-1 text-sm text-[#1434CB] hover:text-[#0B1E8A] font-semibold transition-colors text-left"
                      >
                        Issue another VCN
                      </button>
                      {!issuedCard.blocked ? (
                        <button
                          onClick={handleBlockCard}
                          disabled={isBlocking}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50"
                        >
                          {isBlocking ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                          {isBlocking ? 'Blocking…' : 'Block card'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setIssuedCard(prev => prev ? { ...prev, blocked: false } : prev)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition-colors"
                        >
                          <Shield size={12} />
                          Unblock
                        </button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="preview" className="w-full" style={{ perspective: 1000 }}>
                  <CardPreview
                    holderName={holderName}
                    brand={brand}
                    type={cardType}
                    usageType={usageType}
                    flipped={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* IPC panel — visible only before issuance */}
            {!issuedCard && (
              <IPCPanel
                purpose={purpose}
                mccCode={mccCode}
                spendLimit={spendLimit}
                allowOnline={allowOnline}
                allowIntl={allowIntl}
                allowRecurring={allowRecurring}
                usageType={usageType}
              />
            )}
          </div>

          {/* Right — Form */}
          {!issuedCard && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
            >
              {/* ── Section: Card Identity ── */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Card Identity</p>

                {/* Usage type — full width */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {([
                    { value: 'single-use', label: 'Single-Use',  sub: 'One transaction only' },
                    { value: 'multi-use',  label: 'Multi-Use',   sub: 'Limited period / amount' },
                  ] as { value: UsageType; label: string; sub: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUsageType(opt.value)}
                      className={`py-2 px-3 rounded-xl text-left border transition-all ${
                        usageType === opt.value
                          ? 'bg-[#1434CB] text-white border-transparent shadow'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className={`text-xs font-bold ${usageType === opt.value ? 'text-white' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className={`text-[10px] mt-0.5 ${usageType === opt.value ? 'text-[#A5B8F3]' : 'text-slate-400'}`}>{opt.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Holder name + Supplier — 2 col */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Card Holder Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="John Harrington"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign to Supplier</label>
                    <div className="relative">
                      <select
                        className={inputClass + ' appearance-none pr-8'}
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        required
                      >
                        <option value="">Select supplier…</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Network + Card Type — 2 col */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Network</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Visa', 'Mastercard', 'Amex'] as Brand[]).map((b) => {
                        const disabled = b !== 'Visa';
                        return (
                          <button
                            key={b}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && setBrand(b)}
                            title={disabled ? 'Not available in this system' : undefined}
                            className={`relative py-2 rounded-lg text-xs font-bold border transition-all ${
                              brand === b
                                ? `bg-gradient-to-br ${BRAND_BG[b]} text-white border-transparent shadow`
                                : disabled
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {BRAND_LABEL[b]}
                            {disabled && (
                              <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold bg-slate-200 text-slate-400 rounded-full px-1 py-0.5 leading-none">N/A</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Card Type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['credit', 'debit'] as CardType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCardType(t)}
                          className={`py-2 rounded-lg text-xs font-semibold border capitalize transition-all ${
                            cardType === t
                              ? 'bg-[#1434CB] text-white border-transparent shadow'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section: Purpose ── */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Purpose <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Invoice #4821 — Q1 Supply Order"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              {/* ── Section: Limits & Controls ── */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <ShieldCheck size={12} /> Limits &amp; Controls
                </p>

                {/* Spend limit + Valid Until — 2 col */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Spend Limit ($) <span className="text-slate-400 font-normal">opt.</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className={inputClass}
                      placeholder="e.g. 12450"
                      value={spendLimit}
                      onChange={(e) => setSpendLimit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Valid Until <span className="text-slate-400 font-normal">opt.</span>
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* MCC + Acceptor ID — 2 col */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      MCC Category <span className="text-slate-400 font-normal">opt.</span>
                    </label>
                    <div className="relative">
                      <select
                        className={inputClass + ' appearance-none pr-8'}
                        value={mccCode}
                        onChange={(e) => setMccCode(e.target.value)}
                      >
                        <option value="">Any category…</option>
                        {MCC_CATEGORIES.map((m) => (
                          <option key={m.code} value={m.code}>{m.code} — {m.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Acceptor ID <span className="text-slate-400 font-normal">(POS)</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. POS-00482-TX"
                      value={cardAcceptorId}
                      onChange={(e) => setCardAcceptorId(e.target.value)}
                      maxLength={24}
                    />
                  </div>
                </div>

                {/* Toggles — compact 3-col */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Online',        sub: 'e-commerce',     value: allowOnline,    set: setAllowOnline,    disabled: false },
                    { label: 'International', sub: 'cross-border',   value: allowIntl,      set: setAllowIntl,      disabled: false },
                    { label: 'Recurring',     sub: 'auto-billing',   value: allowRecurring, set: setAllowRecurring, disabled: usageType === 'single-use' },
                  ].map(({ label, sub, value, set, disabled }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => !disabled && set(!value)}
                      disabled={disabled}
                      className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border text-left transition-all disabled:cursor-not-allowed ${
                        disabled
                          ? 'bg-slate-50/50 border-slate-100 opacity-40'
                          : value
                          ? 'bg-[#EEF1FD] border-[#dde3fc]'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-semibold ${value && !disabled ? 'text-[#1434CB]' : 'text-slate-600'}`}>{label}</span>
                        {value && !disabled
                          ? <ToggleRight size={18} className="text-[#1434CB] shrink-0" />
                          : <ToggleLeft  size={18} className="text-slate-300 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!holderName.trim() || !supplierId}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#1434CB] hover:bg-[#0F27B0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Issue Virtual Card Number
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </>
  );
}
