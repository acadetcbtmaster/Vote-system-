import React, { useRef } from 'react';
import { PaymentReceipt } from '../types';
import { Save30Logo } from './Save30Logo';
import { CheckCircle2, Printer, X, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0F1622] border border-[#00A86B]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1019]">
          <div className="flex items-center gap-2">
            <Save30Logo size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Content */}
        <div ref={receiptRef} className="p-6 space-y-6 overflow-y-auto print:p-0 print:text-black">
          {/* Success Banner */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#00875A]/20 border border-[#00A86B]/40 flex items-center justify-center text-[#00A86B] shadow-lg shadow-[#00875A]/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white print:text-black">Payment Successful</h2>
            <p className="text-xs text-zinc-400 print:text-zinc-600">Official Save30 Contribution Receipt</p>
          </div>

          {/* Amount Hero */}
          <div className="text-center py-4 px-3 rounded-2xl bg-[#080C13] border border-white/10 print:border-zinc-300">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              Amount Paid
            </span>
            <div className="text-3xl font-black text-[#00A86B] font-mono">
              ₦{Number(receipt.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00875A]/20 text-[#00A86B] border border-[#00875A]/30">
              Status: Successful
            </span>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="divide-y divide-white/10 text-xs print:divide-zinc-200">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">User ID</span>
              <span className="font-mono font-bold text-white print:text-black text-sm">
                {receipt.save30_id}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">Contributor Name</span>
              <span className="font-bold text-white print:text-black">
                {receipt.user_name}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">Contribution Day</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#00A86B]/15 text-[#00A86B] font-extrabold">
                Day {receipt.day_number}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">Active Plan</span>
              <span className="font-semibold text-zinc-200 print:text-black">
                {receipt.plan_name}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">Transaction Reference</span>
              <span className="font-mono text-[11px] font-bold text-zinc-300 print:text-black break-all text-right max-w-[200px]">
                {receipt.reference}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">Date &amp; Time</span>
              <span className="font-medium text-zinc-300 print:text-black">
                {new Date(receipt.date).toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-400 print:text-zinc-600 font-medium">Payment Provider</span>
              <span className="font-medium text-zinc-300 print:text-black capitalize">
                {receipt.payment_channel || 'Paystack Verified'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-[11px] text-zinc-300 print:text-zinc-600">
            <ShieldCheck className="w-4 h-4 text-[#00A86B] shrink-0" />
            <span>
              This receipt confirms that your Day {receipt.day_number} contribution has been immutably credited to your Save30 plan.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0B1019] flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-zinc-300" />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
