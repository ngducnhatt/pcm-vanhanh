/**
 * Dong bo catalog tu web ban hang (pcmarket.vn) vao bang products cua PCM Van Hanh.
 * Dung khi ban la chu web nguon. Chay lich su, co delay, upsert theo sku.
 *
 *   npx tsx scripts/scrape-pcmarket.ts --cats=cpu --pages=1
 *   npx tsx scripts/scrape-pcmarket.ts --cats=cpu,mainboard,vga,ram,case,psu,hdd,ssd,cooling,monitor --pages=3 --stock=10
 *   npx tsx scripts/scrape-pcmarket.ts --cats=cpu --pages=1 --dry-run
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { closeDb, getDb } from '../lib/db';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PCM-VanHanh-Sync/1.0';

const CATS: Record<string, { url: string; label: string }> = {
  cpu: { url: 'https://pcmarket.vn/cpu-bo-vi-xu-ly.html', label: 'CPU' },
  'cpu-intel': { url: 'https://pcmarket.vn/cpu-bo-vi-xu-ly-cpu-intel.html', label: 'CPU' },
  'cpu-ultra': { url: 'https://pcmarket.vn/cpu-intel-core-ultra', label: 'CPU' },
  i3: { url: 'https://pcmarket.vn/intel-core-i3.html', label: 'CPU' },
  i5: { url: 'https://pcmarket.vn/intel-core-i5.html', label: 'CPU' },
  i7: { url: 'https://pcmarket.vn/intel-core-i7.html', label: 'CPU' },
  i9: { url: 'https://pcmarket.vn/intel-core-i9.html', label: 'CPU' },
  xeon: { url: 'https://pcmarket.vn/intel-xeon.html', label: 'CPU' },
  'cpu-amd': { url: 'https://pcmarket.vn/cpu-bo-vi-xu-ly-cpu-amd.html', label: 'CPU' },
  r3: { url: 'https://pcmarket.vn/amd-ryzen-3.html', label: 'CPU' },
  r5: { url: 'https://pcmarket.vn/amd-ryzen-5.html', label: 'CPU' },
  r7: { url: 'https://pcmarket.vn/amd-ryzen-7.html', label: 'CPU' },
  r9: { url: 'https://pcmarket.vn/cpu-vi-xu-ly-amd-ryzen-9.html', label: 'CPU' },
  mainboard: { url: 'https://pcmarket.vn/mainboard-bo-mach-chu.html', label: 'Mainboard' },
  'mb-intel': { url: 'https://pcmarket.vn/mainboard-cho-cpu-intel.html', label: 'Mainboard' },
  b760: { url: 'https://pcmarket.vn/mainboard-intel-b760.html', label: 'Mainboard' },
  z790: { url: 'https://pcmarket.vn/mainboard-intel-z790.html', label: 'Mainboard' },
  h610: { url: 'https://pcmarket.vn/mainboard-intel-h610.html', label: 'Mainboard' },
  b660: { url: 'https://pcmarket.vn/main-intel-b-series.html', label: 'Mainboard' },
  z890: { url: 'https://pcmarket.vn/mainboard-intel-z890', label: 'Mainboard' },
  b860: { url: 'https://pcmarket.vn/mainboard-intel-b860', label: 'Mainboard' },
  'mb-amd': { url: 'https://pcmarket.vn/mainboard-cho-cpu-amd.html', label: 'Mainboard' },
  b650: { url: 'https://pcmarket.vn/mainboard-amd-b650', label: 'Mainboard' },
  x870: { url: 'https://pcmarket.vn/mainboard-amd-x870', label: 'Mainboard' },
  b850: { url: 'https://pcmarket.vn/mainboard-amd-b850', label: 'Mainboard' },
  b550: { url: 'https://pcmarket.vn/mainboard-amd-b550.html', label: 'Mainboard' },
  a620: { url: 'https://pcmarket.vn/mainboard-a620', label: 'Mainboard' },
  'mb-asus': { url: 'https://pcmarket.vn/main-asus.html', label: 'Mainboard' },
  'mb-msi': { url: 'https://pcmarket.vn/main-msi.html', label: 'Mainboard' },
  'mb-giga': { url: 'https://pcmarket.vn/main-gigabyte.html', label: 'Mainboard' },
  vga: { url: 'https://pcmarket.vn/vga-card-man-hinh.html', label: 'VGA' },
  rtx50: { url: 'https://pcmarket.vn/vga-nvidia-rtx-5000-series', label: 'VGA' },
  rtx5070: { url: 'https://pcmarket.vn/vga-rtx-5070', label: 'VGA' },
  rtx5060: { url: 'https://pcmarket.vn/vga-rtx-5060', label: 'VGA' },
  rtx4060: { url: 'https://pcmarket.vn/vga-rtx-4060.html', label: 'VGA' },
  rtx4070: { url: 'https://pcmarket.vn/vga-rtx-4070.html', label: 'VGA' },
  rtx3060: { url: 'https://pcmarket.vn/rtx-3060.html', label: 'VGA' },
  rtx3050: { url: 'https://pcmarket.vn/vga-rtx-3050.html', label: 'VGA' },
  rx9070: { url: 'https://pcmarket.vn/rx-9070', label: 'VGA' },
  'vga-asus': { url: 'https://pcmarket.vn/vga-asus.html', label: 'VGA' },
  'vga-msi': { url: 'https://pcmarket.vn/vga-msi.html', label: 'VGA' },
  'vga-giga': { url: 'https://pcmarket.vn/vga-gigabyte.html', label: 'VGA' },
  ram: { url: 'https://pcmarket.vn/ram-bo-nho-trong.html', label: 'RAM' },
  ddr4: { url: 'https://pcmarket.vn/ram-bo-nho-trong-ddr4.html', label: 'RAM' },
  ddr5: { url: 'https://pcmarket.vn/ram-bo-nho-trong-ddr5.html', label: 'RAM' },
  ram16: { url: 'https://pcmarket.vn/ram-bo-nho-trong-16gb.html', label: 'RAM' },
  ram32: { url: 'https://pcmarket.vn/ram-bo-nho-trong-32gb.html', label: 'RAM' },
  'ram-corsair': { url: 'https://pcmarket.vn/ram-corsair.html', label: 'RAM' },
  'ram-gskill': { url: 'https://pcmarket.vn/ram-gskill.html', label: 'RAM' },
  'ram-kingston': { url: 'https://pcmarket.vn/ram-kingston.html', label: 'RAM' },
  case: { url: 'https://pcmarket.vn/case-vo-may-tinh.html', label: 'Case' },
  psu: { url: 'https://pcmarket.vn/psu-nguon-may-tinh.html', label: 'PSU' },
  psu650: { url: 'https://pcmarket.vn/nguon-tu-650w-800w.html', label: 'PSU' },
  psu550: { url: 'https://pcmarket.vn/nguon-tu-550w-650w.html', label: 'PSU' },
  hdd: { url: 'https://pcmarket.vn/o-cung-hdd.html', label: 'HDD' },
  hdd1tb: { url: 'https://pcmarket.vn/o-cung-desktop-1tb.html', label: 'HDD' },
  hdd2tb: { url: 'https://pcmarket.vn/o-cung-desktop-2tb.html', label: 'HDD' },
  ssd: { url: 'https://pcmarket.vn/o-cung-ssd.html', label: 'SSD' },
  ssd500: { url: 'https://pcmarket.vn/o-cung-ssd-500gb.html', label: 'SSD' },
  ssd1tb: { url: 'https://pcmarket.vn/o-cung-ssd-1tb.html', label: 'SSD' },
  ssd2tb: { url: 'https://pcmarket.vn/o-cung-ssd-2tb.html', label: 'SSD' },
  nvme: { url: 'https://pcmarket.vn/o-cung-ssd-m2-nvme.html', label: 'SSD' },
  cooling: { url: 'https://pcmarket.vn/tan-nhiet-cooling.html', label: 'Tản nhiệt' },
  air: { url: 'https://pcmarket.vn/tan-nhiet-khi.html', label: 'Tản nhiệt' },
  aio: { url: 'https://pcmarket.vn/tan-nhiet-nuoc-aio.html', label: 'Tản nhiệt' },
  monitor: { url: 'https://pcmarket.vn/monitor-man-hinh.html', label: 'Màn hình' },
  'mon-asus': { url: 'https://pcmarket.vn/man-hinh-asus.html', label: 'Màn hình' },
  'mon-lg': { url: 'https://pcmarket.vn/man-hinh-lg.html', label: 'Màn hình' },
  'mon-dell': { url: 'https://pcmarket.vn/man-hinh-dell.html', label: 'Màn hình' },
  'mon-ss': { url: 'https://pcmarket.vn/man-hinh-samsung.html', label: 'Màn hình' },
  mon24: { url: 'https://pcmarket.vn/man-hinh-24-inch.html', label: 'Màn hình' },
  mon27: { url: 'https://pcmarket.vn/man-hinh-27-inch.html', label: 'Màn hình' },
};

interface Scraped {
  sku: string;
  name: string;
  unit_price: number;
  category: string;
}

function parseArgs() {
  const args: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    if (m) args[m[1]] = m[3] ?? '1';
  }
  return {
    cats: (args.cats || 'cpu').split(',').map((s) => s.trim()).filter(Boolean),
    pages: Math.min(Math.max(Number(args.pages) || 1, 1), 50),
    stock: Math.max(Number(args.stock) || 0, 0),
    dryRun: 'dry-run' in args || 'dryRun' in args,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function parsePrice(s: string): number {
  const digits = s.replace(/[^0-9]/g, '');
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function parseList(html: string, category: string): Scraped[] {
  const out: Scraped[] = [];
  const blocks = html.split('p-item');
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i].slice(0, 3000);
    const nameM = b.match(/class="p-name"[^>]*>([^<]+)<\/a>/);
    const hrefM = b.match(/<a href="(\/[a-z0-9\-\/]+)" class="p-(img|name)"/);
    const priceM = b.match(/class="p-price"[^>]*>([^<]*VNĐ[^<]*)</);
    if (!nameM || !hrefM) continue;
    const name = nameM[1].trim().slice(0, 200);
    const slug = hrefM[1].replace(/^\//, '').replace(/\//g, '-').slice(0, 50);
    if (!slug || !name) continue;
    const price = priceM ? parsePrice(priceM[1]) : 0;
    if (price <= 0) continue;
    out.push({ sku: slug.toUpperCase(), name, unit_price: price, category });
  }
  return out;
}

async function scrapeCategory(key: string, pages: number): Promise<Scraped[]> {
  const cat = CATS[key];
  if (!cat) throw new Error(`Category khong biet: ${key} (${Object.keys(CATS).join(',')})`);
  const all = new Map<string, Scraped>();
  for (let p = 1; p <= pages; p++) {
    const url = p === 1 ? cat.url : `${cat.url}?p=${p}`;
    console.log(`  [${key}] trang ${p}: ${url}`);
    const html = await fetchHtml(url);
    const items = parseList(html, cat.label);
    console.log(`    -> ${items.length} san pham`);
    if (items.length === 0) break;
    let isNew = false;
    for (const it of items) {
      if (!all.has(it.sku)) {
        all.set(it.sku, it);
        isNew = true;
      }
    }
    if (!isNew) break; // lap trang
    await sleep(800);
  }
  return [...all.values()];
}

async function main() {
  const { cats, pages, stock, dryRun } = parseArgs();
  console.log(`Scrape ${cats.join(',')} x ${pages} trang${dryRun ? ' (dry-run)' : ''}...`);

  const merged = new Map<string, Scraped>();
  for (const c of cats) {
    const items = await scrapeCategory(c, pages);
    for (const it of items) merged.set(it.sku, it);
    await sleep(500);
  }
  const list = [...merged.values()];
  console.log(`Tong: ${list.length} san pham.`);

  if (dryRun || list.length === 0) {
    for (const it of list.slice(0, 10)) console.log(` - ${it.sku} | ${it.unit_price.toLocaleString('vi-VN')}đ | ${it.name}`);
    return;
  }

  const db = getDb();
  await db.prepare('SELECT 1').first();
  let inserted = 0;
  let updated = 0;
  for (const it of list) {
    const existing = await db.prepare('SELECT id FROM products WHERE sku = ?').bind(it.sku).first<{ id: string }>();
    if (existing) {
      await db
        .prepare('UPDATE products SET name = ?, unit_price = ?, category = ? WHERE sku = ?')
        .bind(it.name, it.unit_price, it.category, it.sku)
        .run();
      updated++;
    } else {
      await db
        .prepare('INSERT INTO products (id, sku, name, unit_price, stock_qty, category) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(`prd_${randomUUID().slice(0, 8)}`, it.sku, it.name, it.unit_price, stock, it.category)
        .run();
      inserted++;
    }
  }
  console.log(`Xong: them moi ${inserted}, cap nhat gia/ten ${updated}. Ton kho mac dinh ${stock}.`);
  console.log('Luu y: doi gia web theo tay neu can, kiem tra lai truoc khi ban.');
  await closeDb();
}

main().catch((e) => {
  console.error('Scrape that bai:', e);
  process.exitCode = 1;
});
