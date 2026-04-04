'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Wallet, ShoppingCart, CheckCircle,
  TrendingUp, Sparkles, Download, ArrowUpRight,
} from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { usePayment } from '@/context/PaymentContext';
import { useProcurement } from '@/context/ProcurementContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { AreaChart } from '@/components/dashboard/AreaChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetTracker } from '@/components/dashboard/BudgetTracker';
import { RecurringContracts } from '@/components/dashboard/RecurringContracts';
import { computeDonutSegments } from '@/lib/chart-utils';

const TABS = ['Overview', 'Analytics', 'Reports'] as const;
type Tab = typeof TABS[number];

const USD_BUDGET   = 10_000_000;
const USDC_BUDGET  = 500_000;

export default function DashboardPage() {
  const { role } = useUI();
  const { transactions } = usePayment();
  const { rfps } = useProcurement();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  if (role !== 'gov') return null;

  const metrics = useMemo(() => {
    const settled = transactions.filter((t) => t.status === 'Settled');
    const usdSpent  = settled.filter((t) => t.method === 'USD').reduce((s, t) => s + t.amount, 0);
    const usdcSpent = settled.filter((t) => t.method === 'USDC').reduce((s, t) => s + t.amount, 0);
    const totalSpent = usdSpent + usdcSpent;
    const activeOrders    = transactions.filter((t) => t.status !== 'Settled').length;
    const completedOrders = settled.length;

    const aiSavings = rfps
      .filter((r) => r.status === 'Awarded' || r.status === 'Paid')
      .reduce((sum, rfp) => {
        const w = rfp.bids?.find((b) => b.supplierId === rfp.selectedWinnerId);
        return sum + (w ? rfp.budgetCeiling - w.amount : 0);
      }, 0);

    const budgetUsedPct = Math.round((totalSpent / (USD_BUDGET + USDC_BUDGET)) * 100);
    const rfpAwardRate  = rfps.length
      ? Math.round((rfps.filter((r) => r.status === 'Awarded' || r.status === 'Paid').length / rfps.length) * 100)
      : 0;

    return {
      usdBalance: USD_BUDGET - usdSpent,
      usdcBalance: USDC_BUDGET - usdcSpent,
      totalSpent, usdSpent, usdcSpent,
      activeOrders, completedOrders, aiSavings,
      budgetUsedPct, rfpAwardRate,
    };
  }, [transactions, rfps]);

  const donutSegments = useMemo(
    () => computeDonutSegments(metrics.usdSpent, metrics.usdcSpent),
    [metrics.usdSpent, metrics.usdcSpent],
  );

  // Progress ring
  const RING_R = 22;
  const circumference = 2 * Math.PI * RING_R;
  const ringOffset = circumference - (circumference * metrics.budgetUsedPct) / 100;

  const tabIndex = TABS.indexOf(activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Financial Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of payment activity and procurement savings</p>
        </div>

        {/* Budget utilisation ring */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Used</p>
            <p className="text-xs text-slate-400">{metrics.budgetUsedPct}% of total</p>
          </div>
          <div className="relative">
            <svg width="64" height="64">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#1434CB" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r={RING_R} fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="32" cy="32" r={RING_R}
                fill="none" stroke="url(#ringGrad)" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={ringOffset}
                className="transition-all duration-700 -rotate-90 origin-center"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700">{metrics.budgetUsedPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="relative border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors relative z-10 ${
                activeTab === tab
                  ? 'text-[#1434CB]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* sliding underline */}
        <div
          className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-in-out"
          style={{
            background: 'linear-gradient(to right, #1434CB, #6366f1)',
            left:  `${tabIndex * 108}px`,
            width: '108px',
          }}
        />
      </div>

      {/* ── Tab panels ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── OVERVIEW ── */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              {/* row 1 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="USD Balance"
                  value={`$${metrics.usdBalance.toLocaleString()}`}
                  icon={<DollarSign size={18} />}
                  progress={Math.round((metrics.usdBalance / USD_BUDGET) * 100)}
                  gradientColors={['#1434CB', '#6366f1']}
                />
                <StatCard
                  label="USDC Balance"
                  value={`$${metrics.usdcBalance.toLocaleString()}`}
                  icon={<Wallet size={18} />}
                  progress={Math.round((metrics.usdcBalance / USDC_BUDGET) * 100)}
                  gradientColors={['#0ea5e9', '#6366f1']}
                />
                <StatCard
                  label="Active Orders"
                  value={`${metrics.activeOrders}`}
                  icon={<ShoppingCart size={18} />}
                />
                <StatCard
                  label="Completed Orders"
                  value={`${metrics.completedOrders}`}
                  icon={<CheckCircle size={18} />}
                />
              </div>

              {/* row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Spend"
                  value={`$${metrics.totalSpent.toLocaleString()}`}
                  icon={<TrendingUp size={18} />}
                  progress={metrics.budgetUsedPct}
                  gradientColors={['#f59e0b', '#ef4444']}
                />
                <StatCard
                  label="AI Savings"
                  value={`$${metrics.aiSavings.toLocaleString()}`}
                  icon={<Sparkles size={18} />}
                  trend="Optimized by AI"
                  trendUp={true}
                  progress={metrics.rfpAwardRate}
                  gradientColors={['#10b981', '#1434CB']}
                />
              </div>

              {/* budget tracker */}
              <BudgetTracker transactions={transactions} annualBudget={USD_BUDGET + USDC_BUDGET} />

              {/* recurring contracts */}
              <RecurringContracts rfps={rfps} />

            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === 'Analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Payment Breakdown</h2>
                  <DonutChart segments={donutSegments} />
                </div>
                <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Cumulative Spend</h2>
                  <AreaChart transactions={transactions} />
                </div>
              </div>

              {/* analytics metrics list */}
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h2>
                <div className="space-y-0">
                  {[
                    { color: 'bg-[#1434CB]', label: 'Total Transactions', value: transactions.length },
                    { color: 'bg-violet-500',  label: 'Settled',           value: transactions.filter(t => t.status === 'Settled').length },
                    { color: 'bg-emerald-500', label: 'Active RFPs',        value: rfps.filter(r => r.status === 'Open' || r.status === 'Evaluating').length },
                    { color: 'bg-amber-500',   label: 'Awarded Contracts',  value: rfps.filter(r => r.status === 'Awarded' || r.status === 'Paid').length },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-sm text-slate-600">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'Reports' && (
            <div className="space-y-4">
              {/* summary card */}
              <div className="rounded-xl p-5 border border-slate-100 bg-gradient-to-r from-[#EEF1FD] to-[#f0f4ff]">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Procurement Summary</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {rfps.filter(r => r.status === 'Awarded' || r.status === 'Paid').length} contracts awarded out of {rfps.length} RFPs.
                  AI-assisted evaluation saved <span className="font-semibold text-[#1434CB]">${metrics.aiSavings.toLocaleString()}</span> against
                  budget ceilings. Procurement efficiency rate: <span className="font-semibold text-[#1434CB]">{metrics.rfpAwardRate}%</span>.
                </p>
              </div>

              {/* insights */}
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Key Insights</h3>
                <ul className="space-y-2.5">
                  {[
                    `USD spend: $${metrics.usdSpent.toLocaleString()} of $${USD_BUDGET.toLocaleString()} budget`,
                    `USDC spend: $${metrics.usdcSpent.toLocaleString()} of $${USDC_BUDGET.toLocaleString()} budget`,
                    `${metrics.completedOrders} orders fully settled`,
                    `${metrics.activeOrders} orders currently active / processing`,
                    `AI saved $${metrics.aiSavings.toLocaleString()} vs. original budget ceilings`,
                  ].map((insight) => (
                    <li key={insight} className="flex items-start gap-2">
                      <ArrowUpRight size={13} className="mt-0.5 text-[#1434CB] shrink-0" />
                      <span className="text-xs text-slate-600">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* full transactions */}
              <RecentTransactions transactions={transactions} limit={10} />

              {/* export cta */}
              <div className="flex gap-3 pt-1">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}>
                  <Download size={14} />
                  Export Report
                </button>
                <button className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                  Schedule
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
