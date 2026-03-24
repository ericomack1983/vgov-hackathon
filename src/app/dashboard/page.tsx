'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Wallet, ShoppingCart, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { usePayment } from '@/context/PaymentContext';
import { useProcurement } from '@/context/ProcurementContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { AreaChart } from '@/components/dashboard/AreaChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { computeDonutSegments } from '@/lib/chart-utils';

export default function DashboardPage() {
  const { role } = useUI();
  const { transactions } = usePayment();
  const { rfps } = useProcurement();

  if (role !== 'gov') {
    return null;
  }

  const metrics = useMemo(() => {
    const settled = transactions.filter((t) => t.status === 'Settled');
    const usdSpent = settled
      .filter((t) => t.method === 'USD')
      .reduce((s, t) => s + t.amount, 0);
    const usdcSpent = settled
      .filter((t) => t.method === 'USDC')
      .reduce((s, t) => s + t.amount, 0);
    const totalSpent = usdSpent + usdcSpent;
    const activeOrders = transactions.filter((t) => t.status !== 'Settled').length;
    const completedOrders = settled.length;

    // AI savings: sum of (budgetCeiling - winning bid amount) for Awarded/Paid RFPs
    const aiSavings = rfps
      .filter((r) => r.status === 'Awarded' || r.status === 'Paid')
      .reduce((sum, rfp) => {
        const winningBid = rfp.bids?.find((b) => b.supplierId === rfp.selectedWinnerId);
        return sum + (winningBid ? rfp.budgetCeiling - winningBid.amount : 0);
      }, 0);

    return {
      usdBalance: 10_000_000 - usdSpent,
      usdcBalance: 500_000 - usdcSpent,
      totalSpent,
      usdSpent,
      usdcSpent,
      activeOrders,
      completedOrders,
      aiSavings,
    };
  }, [transactions, rfps]);

  const donutSegments = useMemo(
    () => computeDonutSegments(metrics.usdSpent, metrics.usdcSpent),
    [metrics.usdSpent, metrics.usdcSpent]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-slate-900">Financial Dashboard</h1>
      <p className="text-sm text-slate-500">
        Overview of payment activity and procurement savings
      </p>

      {/* Row 1: Core stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          label="USD Balance"
          value={`$${metrics.usdBalance.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="USDC Balance"
          value={`$${metrics.usdcBalance.toLocaleString()}`}
          icon={<Wallet size={18} />}
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

      {/* Row 2: Spend + Savings */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <StatCard
          label="Total Spend"
          value={`$${metrics.totalSpent.toLocaleString()}`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="AI Savings"
          value={`$${metrics.aiSavings.toLocaleString()}`}
          icon={<Sparkles size={18} />}
          trend="Optimized by AI"
          trendUp={true}
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Payment Breakdown</h2>
          <DonutChart segments={donutSegments} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Cumulative Spend</h2>
          <AreaChart transactions={transactions} />
        </div>
      </div>

      {/* Row 4: Recent Transactions */}
      <div className="mt-6">
        <RecentTransactions transactions={transactions} limit={5} />
      </div>
    </motion.div>
  );
}
