import { motion } from "framer-motion";

export default function Card({ children, centered = true }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full h-full rounded-2xl p-4 bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 flex flex-col overflow-y-auto ${centered ? 'justify-center' : 'justify-start'}`}
    >
      {children}
    </motion.div>
  );
}