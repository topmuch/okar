'use client';

import { motion, Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Droplets, 
  Disc, 
  Wrench, 
  Zap, 
  Battery, 
  Thermometer, 
  Settings,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BadgeCheck
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TIMELINE VIVANTE - Timeline avec animations fluides
// ═══════════════════════════════════════════════════════════════════════════════

interface TimelineItem {
  id: string;
  type: 'oil' | 'brakes' | 'timing' | 'battery' | 'cooling' | 'electrical' | 'general' | 'paper';
  title: string;
  description?: string;
  date: string;
  mileage?: number;
  cost?: number;
  status: 'validated' | 'pending' | 'paper_archived';
  garageName?: string;
  isVerified?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  onItemClick?: (item: TimelineItem) => void;
}

// Icônes et couleurs par type
const typeConfig = {
  oil: { 
    icon: Droplets, 
    gradient: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-100 to-orange-100'
  },
  brakes: { 
    icon: Disc, 
    gradient: 'from-red-400 to-rose-500',
    bgGradient: 'from-red-100 to-rose-100'
  },
  timing: { 
    icon: Settings, 
    gradient: 'from-purple-400 to-violet-500',
    bgGradient: 'from-purple-100 to-violet-100'
  },
  battery: { 
    icon: Battery, 
    gradient: 'from-green-400 to-emerald-500',
    bgGradient: 'from-green-100 to-emerald-100'
  },
  cooling: { 
    icon: Thermometer, 
    gradient: 'from-cyan-400 to-blue-500',
    bgGradient: 'from-cyan-100 to-blue-100'
  },
  electrical: { 
    icon: Zap, 
    gradient: 'from-yellow-400 to-amber-500',
    bgGradient: 'from-yellow-100 to-amber-100'
  },
  general: { 
    icon: Wrench, 
    gradient: 'from-slate-400 to-gray-500',
    bgGradient: 'from-slate-100 to-gray-100'
  },
  paper: { 
    icon: FileText, 
    gradient: 'from-stone-400 to-stone-500',
    bgGradient: 'from-stone-100 to-stone-200'
  },
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
};

const lineVariants: Variants = {
  hidden: { height: 0 },
  visible: (i: number) => ({
    height: '100%',
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut'
    }
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 TIMELINE ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TimelineItemComponent: React.FC<{
  item: TimelineItem;
  index: number;
  isLast: boolean;
  onClick?: () => void;
}> = ({ item, index, isLast, onClick }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  const config = typeConfig[item.type];
  const IconComponent = config.icon;

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-4"
      variants={itemVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Left: Timeline line and dot */}
      <div className="flex flex-col items-center">
        {/* Dot with icon */}
        <motion.div
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${config.gradient} shadow-lg z-10`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconComponent className="w-6 h-6 text-white" />
          
          {/* Pulse effect for pending */}
          {item.status === 'pending' && (
            <motion.div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient}`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
        
        {/* Connecting line */}
        {!isLast && (
          <motion.div
            className={`w-1 flex-1 bg-gradient-to-b ${config.gradient} rounded-full`}
            variants={lineVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            custom={index}
          />
        )}
      </div>

      {/* Right: Content card */}
      <motion.div
        className={`flex-1 mb-6 p-5 rounded-2xl bg-gradient-to-br ${config.bgGradient} border border-white/50 shadow-sm cursor-pointer`}
        onClick={onClick}
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
            {item.garageName && (
              <p className="text-sm text-gray-500">{item.garageName}</p>
            )}
          </div>
          
          {/* Status badge */}
          <div className="flex items-center gap-1.5">
            {item.status === 'validated' && (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Certifié
              </span>
            )}
            {item.status === 'pending' && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                En attente
              </span>
            )}
            {item.status === 'paper_archived' && (
              <span className="px-3 py-1 rounded-full bg-stone-500/20 text-stone-600 text-xs font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Archives
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        {item.description && (
          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {item.date}
          </span>
          
          <div className="flex items-center gap-3">
            {item.mileage && (
              <span className="text-gray-500">
                {item.mileage.toLocaleString()} km
              </span>
            )}
            {item.cost && (
              <span className="font-bold text-gray-800">
                {item.cost.toLocaleString()} XOF
              </span>
            )}
          </div>
        </div>
        
        {/* Paper archive warning */}
        {item.status === 'paper_archived' && (
          <div className="mt-3 p-2 rounded-lg bg-stone-200/50 border border-stone-300/50">
            <p className="text-xs text-stone-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Intervention déclarée par le propriétaire, non certifiée numériquement
            </p>
          </div>
        )}
        
        {/* Verified badge */}
        {item.isVerified && item.status === 'paper_archived' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <BadgeCheck className="w-4 h-4" />
            Vérifié visuellement
          </div>
        )}
        
        {/* Arrow */}
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TIMELINE MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const VividTimeline: React.FC<TimelineProps> = ({ items, onItemClick }) => {
  return (
    <div className="relative py-4">
      {/* Timeline header */}
      <div className="mb-6 px-4">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF0080] bg-clip-text text-transparent">
            Historique
          </span>
          <span className="text-lg font-normal text-gray-400">
            ({items.length})
          </span>
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Toutes les interventions de votre véhicule
        </p>
      </div>
      
      {/* Timeline items */}
      <motion.div
        className="space-y-2 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((item, index) => (
          <TimelineItemComponent
            key={item.id}
            item={item}
            index={index}
            isLast={index === items.length - 1}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </motion.div>
      
      {/* Empty state */}
      {items.length === 0 && (
        <motion.div
          className="text-center py-16 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
            <Wrench className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Aucune intervention
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            L'historique de votre véhicule apparaîtra ici après la première intervention certifiée.
          </p>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 QUICK STATS CARDS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface QuickStatsProps {
  stats: QuickStat[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-orange-500">
              {stat.icon}
            </div>
            {stat.trend && (
              <span className={`text-xs font-semibold ${
                stat.trend === 'up' ? 'text-green-500' :
                stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {stat.trendValue}
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-gray-800">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default VividTimeline;
