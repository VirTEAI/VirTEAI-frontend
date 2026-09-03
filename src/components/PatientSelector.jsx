import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SafeImage from './SafeImage';
import { patients } from '../data/patients';
import { dropdownPop } from '../lib/motion';

function ChevronDown({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PatientSelector({ selectedId, onSelect, className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = patients.find((p) => p.id === selectedId) ?? patients[0];

  return (
    <div className={`relative rounded-2xl border border-hairline-soft bg-surface p-4 ${className}`}>
      <p className="mb-3 text-[14px] text-ink-secondary">Paciente Selecionado:</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <SafeImage src={selected.avatar} alt={selected.name} className="h-[38px] w-[38px]" rounded />
          <div className="text-left">
            <p className="text-[14px] font-medium text-ink">{selected.name}</p>
            <p className="text-[10px] text-ink-tertiary">{selected.note}</p>
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 shrink-0 text-ink-secondary" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Fechar lista de pacientes"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10"
            />
            <motion.div
              variants={dropdownPop}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-hairline-soft bg-white/95 p-2 shadow-elevated backdrop-blur-xl"
            >
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    onSelect(patient.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-200 hover:bg-surface ${
                    patient.id === selected.id ? 'bg-surface' : ''
                  }`}
                >
                  <SafeImage src={patient.avatar} alt={patient.name} className="h-[32px] w-[32px]" rounded />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{patient.name}</p>
                    <p className="truncate text-[10px] text-ink-tertiary">{patient.note}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
