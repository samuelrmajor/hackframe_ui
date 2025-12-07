import { motion } from "framer-motion";

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full rounded-2xl p-4 bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 flex flex-col justify-center overflow-y-auto"
    >
      {children}
    </motion.div>
  );
}