"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SECTION_SUBTITLE,
  SECTION_TITLE,
  chip,
  type Tone,
} from "@/lib/ui";
import {
  CheckCircle2,
  Filter,
  Hash,
  PackagePlus,
  Search,
  Tag,
  Warehouse,
} from "lucide-react";

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  serial?: string;
  location: string;
  status: "Sẵn sàng" | "Đang dùng" | "Sắp hết";
}

interface InventoryCategory {
  id: string;
  name: string;
  items: InventoryItem[];
}

const inventoryCategories: InventoryCategory[] = [
  {
    id: "cpu",
    name: "CPU",
    items: [
      { id: "cpu-1", code: "CPU-I5-12400F", name: "Intel Core i5-12400F", quantity: 18, serial: "CPU12400F-0018", location: "Kệ A-01", status: "Sẵn sàng" },
      { id: "cpu-2", code: "CPU-R5-5600", name: "AMD Ryzen 5 5600", quantity: 7, location: "Kệ A-01", status: "Sắp hết" },
    ],
  },
  {
    id: "main",
    name: "MAIN",
    items: [
      { id: "main-1", code: "MAIN-B660M", name: "MSI PRO B660M-A WIFI", quantity: 12, serial: "MSIB660-0012", location: "Kệ A-02", status: "Sẵn sàng" },
      { id: "main-2", code: "MAIN-B550M", name: "ASUS TUF GAMING B550M", quantity: 5, location: "Kệ A-02", status: "Sắp hết" },
    ],
  },
  {
    id: "ram",
    name: "RAM",
    items: [
      { id: "ram-1", code: "RAM-DDR4-16", name: "Kingston Fury 16GB DDR4", quantity: 36, location: "Kệ B-01", status: "Sẵn sàng" },
      { id: "ram-2", code: "RAM-DDR5-32", name: "Corsair Vengeance 32GB DDR5", quantity: 9, serial: "CORDDR5-0009", location: "Kệ B-01", status: "Sẵn sàng" },
    ],
  },
  {
    id: "vga",
    name: "VGA",
    items: [
      { id: "vga-1", code: "VGA-RTX4060", name: "ASUS Dual RTX 4060 8GB", quantity: 8, serial: "RTX4060-0008", location: "Kệ B-02", status: "Sẵn sàng" },
      { id: "vga-2", code: "VGA-RX7600", name: "Sapphire RX 7600 8GB", quantity: 3, serial: "RX7600-0003", location: "Kệ B-02", status: "Sắp hết" },
    ],
  },
  {
    id: "arm",
    name: "ARM",
    items: [{ id: "arm-1", code: "ARM-MON-01", name: "Arm màn hình đôi NB F160", quantity: 14, location: "Kệ C-01", status: "Sẵn sàng" }],
  },
  {
    id: "disk",
    name: "DISK",
    items: [
      { id: "disk-1", code: "SSD-NVME-1T", name: "WD Blue SN580 1TB NVMe", quantity: 21, serial: "WDSN580-0021", location: "Kệ C-02", status: "Sẵn sàng" },
      { id: "disk-2", code: "SSD-SATA-480", name: "Kingston A400 480GB", quantity: 6, location: "Kệ C-02", status: "Sắp hết" },
    ],
  },
  {
    id: "cooling",
    name: "COOLING",
    items: [{ id: "cooling-1", code: "COOL-PA120", name: "Thermalright Peerless Assassin 120", quantity: 11, location: "Kệ D-01", status: "Sẵn sàng" }],
  },
  {
    id: "case",
    name: "CASE",
    items: [{ id: "case-1", code: "CASE-MESH-01", name: "Montech Air 100 ARGB", quantity: 16, location: "Kệ D-02", status: "Sẵn sàng" }],
  },
  {
    id: "psu",
    name: "PSU",
    items: [{ id: "psu-1", code: "PSU-650W-BZ", name: "Cooler Master MWE 650 Bronze", quantity: 10, location: "Kệ D-03", status: "Sẵn sàng" }],
  },
  {
    id: "fan",
    name: "FAN",
    items: [{ id: "fan-1", code: "FAN-120-ARGB", name: "Cooler Master SickleFlow 120 ARGB", quantity: 28, location: "Kệ D-04", status: "Sẵn sàng" }],
  },
  {
    id: "display",
    name: "DISPLAY",
    items: [{ id: "display-1", code: "LCD-24-IPS", name: "LG 24MP400-B 24 inch", quantity: 13, serial: "LG24MP-0013", location: "Kệ E-01", status: "Sẵn sàng" }],
  },
  {
    id: "mouse",
    name: "MOUSE",
    items: [{ id: "mouse-1", code: "MOUSE-G102", name: "Logitech G102 Lightsync", quantity: 24, location: "Kệ E-02", status: "Sẵn sàng" }],
  },
  {
    id: "keyboard",
    name: "KEYBOARD",
    items: [{ id: "keyboard-1", code: "KEY-K2-V2", name: "Keychron K2 V2", quantity: 8, serial: "K2V2-0008", location: "Kệ E-02", status: "Sẵn sàng" }],
  },
  {
    id: "pad",
    name: "PAD",
    items: [{ id: "pad-1", code: "PAD-XXL-01", name: "Deskmat Extended XXL", quantity: 31, location: "Kệ E-03", status: "Sẵn sàng" }],
  },
  {
    id: "wifi",
    name: "CARD WIFI",
    items: [{ id: "wifi-1", code: "WIFI-AX200", name: "Intel Wi-Fi 6 AX200", quantity: 4, serial: "AX200-0004", location: "Kệ E-04", status: "Sắp hết" }],
  },
];

const statusTones: Record<InventoryItem["status"], Tone> = {
  "Sẵn sàng": "success",
  "Đang dùng": "warning",
  "Sắp hết": "warning",
};

export function PipelineSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleCategories = useMemo(() => {
    const categories = activeCategory === "all" ? inventoryCategories : inventoryCategories.filter((category) => category.id === activeCategory);
    return categories
      .map((category) => ({ ...category, items: category.items.filter((item) => `${item.code} ${item.name} ${item.serial ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase())) }))
      .filter((category) => category.items.length > 0);
  }, [activeCategory, searchQuery]);

  const visibleItems = visibleCategories.flatMap((category) => category.items.map((item) => ({ ...item, category: category.name })));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={SECTION_SUBTITLE}>Danh sách linh kiện và thiết bị trong kho</p>
          <h1 className={SECTION_TITLE}>Kho hàng</h1>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><PackagePlus className="mr-2 h-4 w-4" />Nhập sản phẩm</Button>
      </div>

      <Card className="border-0 bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo mã, tên hoặc serial..." className="border-border bg-secondary pl-9" /></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4" />{visibleItems.length} sản phẩm</div>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-4">
            <Button size="sm" variant="ghost" onClick={() => setActiveCategory("all")} className={activeCategory === "all" ? "bg-accent text-accent-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}>Tất cả</Button>
            {inventoryCategories.map((category) => <Button key={category.id} size="sm" variant="ghost" onClick={() => setActiveCategory(category.id)} className={activeCategory === category.id ? "bg-accent text-accent-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}>{category.name}</Button>)}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-card">
        <div className="flex items-center justify-between px-4 py-3"><div><h2 className="font-semibold text-foreground">Danh sách sản phẩm</h2><p className={SECTION_SUBTITLE}>Chọn nhóm phía trên để lọc nhanh</p></div><Tag className="h-4 w-4 text-muted-foreground" /></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">Nhóm</th><th className="px-4 py-3 font-medium">Mã sản phẩm</th><th className="px-4 py-3 font-medium">Serial</th><th className="px-4 py-3 font-medium">Số lượng</th><th className="px-4 py-3 font-medium">Vị trí</th><th className="px-4 py-3 font-medium">Trạng thái</th></tr></thead><tbody className="divide-y divide-border/50">{visibleItems.map((item) => <tr key={item.id} className="transition-colors hover:bg-secondary/30"><td className="px-4 py-3 font-medium text-foreground">{item.name}</td><td className="px-4 py-3 text-muted-foreground">{item.category}</td><td className="px-4 py-3 font-mono text-xs text-accent">{item.code}</td><td className="px-4 py-3">{item.serial ? <span className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-success" />{item.serial}</span> : <span className="text-xs text-muted-foreground">Không có serial</span>}</td><td className="px-4 py-3 font-semibold text-foreground">{item.quantity}</td><td className="px-4 py-3 text-muted-foreground">{item.location}</td><td className="px-4 py-3"><span className={chip(statusTones[item.status])}>{item.status}</span></td></tr>)}</tbody></table></div>
        {visibleItems.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</div>}
      </Card>
    </div>
  );
}
