"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Order } from "@/lib/types";
import { Printer, X } from "lucide-react";
import { HoDonForm, orderToHoDonLines } from "@/components/orders/hoadon-form";

interface PrintInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintInvoiceModal({ order, isOpen, onClose }: PrintInvoiceModalProps) {
  if (!order || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[94dvh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden bg-slate-100 p-0 sm:max-w-[min(96vw,1400px)] print:fixed print:left-0 print:top-0 print:h-auto print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:overflow-visible print:border-0 print:bg-white print:p-0 print:shadow-none"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-white px-4 py-2 print:hidden">
          <DialogTitle className="text-sm font-semibold text-slate-800">
            Xem hóa đơn đặt hàng
          </DialogTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Printer className="h-4 w-4" /> In hóa đơn
            </button>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="rounded p-2 text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 print:overflow-visible print:p-0">
          <div className="mx-auto w-full max-w-none print:max-w-none">
            <HoDonForm
              invoiceNo={order.invoice_no}
              invoiceDate={order.invoice_date}
              salesName={order.sales_user?.name || "Kinh doanh"}
              customerName={order.customer_name}
              customerPhone={order.customer_phone}
              customerAddress={order.customer_address}
              note={order.note}
              items={orderToHoDonLines(order)}
              totalAmount={order.total_amount || 0}
              paidAmount={order.paid_amount || 0}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
