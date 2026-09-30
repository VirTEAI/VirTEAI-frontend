import { motion } from 'framer-motion';
import SafeImage from './SafeImage';
import { HeartIcon, ThumbsUpIcon, EyeIcon } from './icons';
import { staggerItem } from '../lib/motion';

export default function WorldCard({ world, onSelect }) {
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      onClick={() => onSelect(world)}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="flex w-full max-w-[328px] shrink-0 flex-col gap-2 text-left"
    >
      <motion.div
        whileHover={{
          scale: 1.03,
          boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08), 0 32px 64px -16px rgba(0,0,0,0.22)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="overflow-hidden rounded-2xl shadow-soft"
      >
        <SafeImage src={world.thumbnail} alt={world.title} className="aspect-[372/227] w-full" />
      </motion.div>
      <div className="flex w-full items-center justify-between">
        <p className="text-[16px] font-medium text-ink">{world.title}</p>
        <div className="flex items-center gap-2">
          <HeartIcon className="h-4 w-4 text-ink-secondary opacity-70" />
          <span className="flex items-center gap-1 text-[13px] text-ink-secondary">
            <ThumbsUpIcon className="h-[13px] w-[13px] opacity-70" />
            {world.likes}
          </span>
          <span className="flex items-center gap-1 text-[13px] text-ink-secondary">
            <EyeIcon className="h-[13px] w-[13px] opacity-70" />
            {world.views}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
