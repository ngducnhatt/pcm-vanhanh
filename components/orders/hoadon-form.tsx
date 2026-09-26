"use client";

import React, { ReactNode } from "react";
import { Order } from "@/lib/types";

export interface HoDonLine {
  id: string;
  name: string;
  sku?: string;
  serial_number?: string | null;
  quantity: number;
  unit_price: number;
  warranty_months: number;
}

interface HoDonFormProps {
  isEditable?: boolean;
  invoiceNo: string;
  invoiceDate: string;
  salesName: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  note?: string | null;
  items: HoDonLine[];
  totalAmount: number;
  paidAmount: number;
  productPicker?: ReactNode;
  onCustomerNameChange?: (value: string) => void;
  onCustomerPhoneChange?: (value: string) => void;
  onCustomerAddressChange?: (value: string) => void;
  onNoteChange?: (value: string) => void;
  onQuantityChange?: (itemId: string, value: number) => void;
  onWarrantyChange?: (itemId: string, value: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

function formatDate(value: string): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN").format(parsed);
}

function numberToVietnameseWords(value: number): string {
  const normalized = Math.floor(Math.max(0, value));
  if (normalized === 0) return "Không đồng";

  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const readGroup = (group: number, full: boolean) => {
    const hundred = Math.floor(group / 100);
    const ten = Math.floor((group % 100) / 10);
    const unit = group % 10;
    const words: string[] = [];

    if (hundred || full) words.push(`${digits[hundred]} trăm`);
    if (ten > 1) {
      words.push(`${digits[ten]} mươi`);
      if (unit === 1) words.push("mốt");
      else if (unit === 4) words.push("tư");
      else if (unit === 5) words.push("lăm");
      else if (unit) words.push(digits[unit]);
    } else if (ten === 1) {
      words.push("mười");
      if (unit === 5) words.push("lăm");
      else if (unit) words.push(digits[unit]);
    } else if (unit) {
      if (hundred || full) words.push("lẻ");
      words.push(digits[unit]);
    }

    return words.join(" ");
  };

  const groups: number[] = [];
  let remainder = normalized;
  while (remainder > 0) {
    groups.push(remainder % 1000);
    remainder = Math.floor(remainder / 1000);
  }

  const highest = groups.length - 1;
  const words = groups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => group > 0)
    .reverse()
    .map(({ group, index }) =>
      [readGroup(group, index !== highest && group < 100), units[index]]
        .filter(Boolean)
        .join(" ")
    );

  const phrase = words.join(" ").replace(/\s+/g, " ").trim();
  return `${phrase.charAt(0).toLocaleUpperCase("vi-VN")}${phrase.slice(1)} đồng`;
}

function textOrInput(
  value: string,
  label: string,
  editable: boolean,
  onChange?: (value: string) => void,
  multiline = false
) {
  if (!editable) return <span>{value || "—"}</span>;
  const className = "min-w-0 flex-1 border-b border-dotted border-slate-500 bg-transparent px-1 py-0.5 outline-none focus:border-blue-600";
  return multiline ? (
    <textarea
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      aria-label={label}
      rows={2}
      className={`${className} resize-y`}
    />
  ) : (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      aria-label={label}
      className={className}
    />
  );
}

export function orderToHoDonLines(order: Order): HoDonLine[] {
  return (order.items || []).map((item) => ({
    id: item.id,
    name: item.product?.name || "Linh kiện",
    sku: item.product?.sku || "",
    serial_number: item.serial_number,
    quantity: item.quantity,
    unit_price: item.unit_price,
    warranty_months: item.warranty_months ?? 36,
  }));
}

export function HoDonForm({
  isEditable = false,
  invoiceNo,
  invoiceDate,
  salesName,
  customerName,
  customerPhone,
  customerAddress,
  note,
  items,
  totalAmount,
  paidAmount,
  productPicker,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerAddressChange,
  onNoteChange,
  onQuantityChange,
  onWarrantyChange,
  onRemoveItem,
}: HoDonFormProps) {
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  return (
    <article className="mx-auto w-full border border-black bg-white p-4 text-[13px] leading-snug text-black shadow-sm sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-black/60 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5 text-xs sm:text-[13px]">
          <h2 className="font-bold uppercase tracking-wide">
            CÔNG TY TNHH ĐẦU TƯ VÀ THƯƠNG MẠI PCM
          </h2>
          <p>Địa chỉ: 85 - 85 Thái Hà, Phường Đống Đa, Thành phố Hà Nội</p>
          <p>Hotline: 087.997.9997</p>
          <p>Website: http://pcmarket.vn</p>
        </div>
      </header>

      <div className="py-3 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide sm:text-2xl">
          HÓA ĐƠN ĐẶT HÀNG
        </h1>
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <span>Ngày: {formatDate(invoiceDate)}</span>
          <span>Số hóa đơn: <strong>{invoiceNo || "Cấp khi lưu đơn"}</strong></span>
        </div>
      </div>

      <section className="grid gap-x-6 gap-y-2 border-b border-black/40 pb-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <strong className="shrink-0">Khách hàng:</strong>
            {textOrInput(customerName, "Tên khách hàng", isEditable, onCustomerNameChange)}
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="shrink-0">Địa chỉ:</strong>
            {textOrInput(customerAddress || "", "Địa chỉ khách hàng", isEditable, onCustomerAddressChange)}
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="shrink-0">SĐT:</strong>
            {textOrInput(customerPhone, "Số điện thoại khách hàng", isEditable, onCustomerPhoneChange)}
          </div>
        </div>
        <div className="sm:min-w-44 sm:pb-1 sm:text-right">
          <strong>Kinh doanh: </strong>
          <span>{salesName || "—"}</span>
        </div>
      </section>

      <div className="min-h-12 border-b border-black/40 py-2">
        <div className="flex items-start gap-1">
          <strong className="shrink-0">Chi tiết:</strong>
          {isEditable ? (
            textOrInput(note || "", "Chi tiết đơn hàng", true, onNoteChange, true)
          ) : (
            <span className="whitespace-pre-wrap font-medium">{note || "—"}</span>
          )}
        </div>
      </div>

      {productPicker}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse border border-black text-xs sm:text-[13px]">
          <thead>
            <tr>
              <th className="w-10 border border-black px-2 py-2 text-center">STT</th>
              <th className="border border-black px-2 py-2 text-left">Tên hàng hóa</th>
              <th className="w-16 border border-black px-2 py-2 text-center">SL</th>
              <th className="w-32 border border-black px-2 py-2 text-right">Đơn giá</th>
              <th className="w-36 border border-black px-2 py-2 text-right">Thành tiền</th>
              <th className="w-24 border border-black px-2 py-2 text-center">BH</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                <td className="border border-black px-2 py-2">
                  <div className="font-medium">{item.name}</div>
                  {(item.sku || item.serial_number || isEditable) && (
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600">
                      <span>
                      {[item.sku, item.serial_number && `S/N: ${item.serial_number}`]
                        .filter(Boolean)
                        .join(" · ")}
                      </span>
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem?.(item.id)}
                          aria-label={`Xóa ${item.name}`}
                          className="shrink-0 px-1 text-sm font-bold text-slate-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="border border-black px-2 py-2 text-center">
                  {isEditable ? (
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      aria-label={`Số lượng ${item.name}`}
                      onChange={(event) => onQuantityChange?.(item.id, Math.max(1, Number(event.target.value) || 1))}
                      className="w-14 border-b border-dotted border-slate-500 bg-transparent text-center outline-none"
                    />
                  ) : item.quantity}
                </td>
                <td className="border border-black px-2 py-2 text-right">
                  {item.unit_price.toLocaleString("vi-VN")}
                </td>
                <td className="border border-black px-2 py-2 text-right">
                  {(item.quantity * item.unit_price).toLocaleString("vi-VN")}
                </td>
                <td className="border border-black px-2 py-2 text-center">
                  {isEditable ? (
                    <input
                      type="number"
                      min="0"
                      value={item.warranty_months}
                      aria-label={`Bảo hành ${item.name} theo tháng`}
                      onChange={(event) => onWarrantyChange?.(item.id, Math.max(0, Number(event.target.value) || 0))}
                      className="w-14 border-b border-dotted border-slate-500 bg-transparent text-center outline-none"
                    />
                  ) : item.warranty_months ? `${item.warranty_months} tháng` : "Không"}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td
                  colSpan={6}
                  className="border border-black px-2 py-8 text-center text-slate-500"
                >
                  {isEditable ? "Chưa có hàng hóa trong đơn." : "Không có sản phẩm."}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="border border-black px-2 py-1 text-right">
                Tổng tiền hàng
              </td>
              <td className="border border-black px-2 py-1 text-right font-bold">
                {balanceDue.toLocaleString("vi-VN")}
              </td>
              <td className="border border-black" />
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-2 py-1 text-right">
                Chiết khấu hóa đơn
              </td>
              <td className="border border-black px-2 py-1 text-right">0</td>
              <td className="border border-black" />
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-2 py-1 text-right">
                Khách đưa hàng
              </td>
              <td className="border border-black px-2 py-1 text-right font-semibold">
                {paidAmount.toLocaleString("vi-VN")}
              </td>
              <td className="border border-black" />
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-2 py-1 text-right font-bold">
                Tổng thanh toán
              </td>
              <td className="border border-black px-2 py-1 text-right font-bold">
                {totalAmount.toLocaleString("vi-VN")}
              </td>
              <td className="border border-black" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-b border-black py-1 text-xs italic">
        Số tiền viết bằng chữ: <strong>{numberToVietnameseWords(balanceDue)} chẵn</strong>
      </div>

      <footer className="grid grid-cols-2 gap-6 pt-4 text-center text-xs sm:gap-12">
        <div>
          <div className="font-bold">Khách hàng</div>
          <div className="italic">(Ký, họ tên)</div>
          <div className="h-14 sm:h-16" />
          {!isEditable && <div className="font-medium">{customerName}</div>}
        </div>
        <div>
          <div className="font-bold">Người lập phiếu</div>
          <div className="italic">(Ký, họ tên)</div>
          <div className="h-14 sm:h-16" />
          <div className="font-medium">{salesName || " "}</div>
        </div>
      </footer>
    </article>
  );
}
