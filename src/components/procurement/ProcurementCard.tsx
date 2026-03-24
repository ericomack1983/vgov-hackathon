import { RFP } from '@/lib/mock-data/types';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Tag, Settings, ChevronRight } from 'lucide-react';

interface ProcurementCardProps {
  rfp: RFP;
  onClick?: () => void;
}

export function ProcurementCard({ rfp, onClick }: ProcurementCardProps) {
  const getStatusColor = (status: RFP['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Evaluating':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Awarded':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Paid':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const statusColor = getStatusColor(rfp.status);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md cursor-pointer group`}
    >
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {rfp.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" /> {rfp.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-full">{rfp.id}</span>
            </span>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}
        >
          {rfp.status}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-6 line-clamp-2">
        {rfp.description}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Budget</p>
              <p className="text-sm font-semibold text-slate-900">
                ${rfp.budgetCeiling.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Deadline</p>
              <p className="text-sm font-semibold text-slate-900">
                {new Date(rfp.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bids</p>
              <p className="text-sm font-semibold text-slate-900">
                {rfp.bids.length} Submitted
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
          View Details <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </motion.div>
  );
}
