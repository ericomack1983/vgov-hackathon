'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useCards, IssuedCard } from '@/context/CardsContext';
import { authenticateWithBiometrics } from '@/lib/biometricAuth';
import { usePayment } from '@/context/PaymentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShoppingCart, Minus, Plus, CreditCard, CheckCircle2, Package, Zap, Clock, AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import { VisaLogo } from '@visa/nova-react';
import { wasPageRefreshed } from '@/lib/playOnRefresh';

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = 'IT Peripherals' | 'Office Supplies' | 'Batteries & Power' | 'Printing' | 'Storage';

interface Spec { label: string; value: string }

interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  unit: string;
  sku: string;
  specs: Spec[];
  thumbVariant: string; // drives the SVG illustration
}

// ── Product catalog ───────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  // IT Peripherals
  { id: 'p01', name: 'USB-C Cable 2m',             category: 'IT Peripherals', price: 18.99,  unit: 'each', sku: 'USB-C-2M',    thumbVariant: 'cable',    specs: [{ label: 'Connector', value: 'USB-C to USB-C' }, { label: 'Length', value: '2 m' }, { label: 'Max Wattage', value: '100 W' }, { label: 'Data Speed', value: 'USB 3.2 Gen2 (10 Gb/s)' }, { label: 'Braided Nylon', value: 'Yes' }] },
  { id: 'p02', name: 'HDMI Cable 3m',              category: 'IT Peripherals', price: 24.99,  unit: 'each', sku: 'HDMI-3M',     thumbVariant: 'cable',    specs: [{ label: 'Standard', value: 'HDMI 2.1' }, { label: 'Length', value: '3 m' }, { label: 'Max Resolution', value: '8K @ 60 Hz' }, { label: 'HDR', value: 'Yes' }, { label: 'Gold Connectors', value: 'Yes' }] },
  { id: 'p03', name: 'Cat6 Ethernet Cable 5m',     category: 'IT Peripherals', price: 14.50,  unit: 'each', sku: 'ETH-CAT6-5M', thumbVariant: 'cable',    specs: [{ label: 'Category', value: 'Cat 6' }, { label: 'Length', value: '5 m' }, { label: 'Max Speed', value: '1 Gb/s' }, { label: 'Shielding', value: 'UTP' }, { label: 'Color', value: 'Blue' }] },
  { id: 'p04', name: 'Wireless Keyboard',          category: 'IT Peripherals', price: 79.00,  unit: 'each', sku: 'KB-WL-01',    thumbVariant: 'keyboard', specs: [{ label: 'Layout', value: 'Full-size QWERTY' }, { label: 'Connectivity', value: 'Bluetooth 5.0 / 2.4 GHz' }, { label: 'Battery Life', value: 'Up to 12 months' }, { label: 'Key Travel', value: '2.0 mm' }, { label: 'OS', value: 'Win / Mac / Linux' }] },
  { id: 'p05', name: 'Wireless Mouse',             category: 'IT Peripherals', price: 45.00,  unit: 'each', sku: 'MS-WL-01',    thumbVariant: 'mouse',    specs: [{ label: 'DPI', value: '400–4000 (adjustable)' }, { label: 'Connectivity', value: 'Bluetooth 5.0 / 2.4 GHz' }, { label: 'Buttons', value: '6' }, { label: 'Battery', value: '1× AA (18 months)' }, { label: 'Hand Orientation', value: 'Right' }] },
  { id: 'p06', name: 'HD Webcam 1080p',            category: 'IT Peripherals', price: 89.99,  unit: 'each', sku: 'CAM-1080',    thumbVariant: 'webcam',   specs: [{ label: 'Resolution', value: '1920 × 1080 @ 30 fps' }, { label: 'FOV', value: '90°' }, { label: 'Microphone', value: 'Dual stereo' }, { label: 'Focus', value: 'Auto-focus' }, { label: 'Connection', value: 'USB-A' }] },
  { id: 'p07', name: 'USB Headset with Mic',       category: 'IT Peripherals', price: 59.99,  unit: 'each', sku: 'HS-USB-01',   thumbVariant: 'headset',  specs: [{ label: 'Driver Size', value: '40 mm' }, { label: 'Frequency', value: '20 Hz–20 kHz' }, { label: 'Mic Type', value: 'Noise-cancelling boom' }, { label: 'Connection', value: 'USB-A' }, { label: 'Cable Length', value: '2.1 m' }] },
  { id: 'p08', name: 'USB-A Hub 7-Port',           category: 'IT Peripherals', price: 34.99,  unit: 'each', sku: 'HUB-7P',      thumbVariant: 'hub',      specs: [{ label: 'Ports', value: '7 × USB-A 3.0' }, { label: 'Transfer Speed', value: '5 Gb/s' }, { label: 'Power Delivery', value: '5 V / 4 A adapter' }, { label: 'Cable Length', value: '1.2 m' }, { label: 'LED Indicator', value: 'Yes' }] },
  { id: 'p09', name: '24" LED Monitor',            category: 'IT Peripherals', price: 249.00, unit: 'each', sku: 'MON-24',      thumbVariant: 'monitor',  specs: [{ label: 'Panel', value: 'IPS 23.8"' }, { label: 'Resolution', value: '1920 × 1080 FHD' }, { label: 'Refresh Rate', value: '75 Hz' }, { label: 'Response Time', value: '5 ms (GTG)' }, { label: 'Inputs', value: 'HDMI, DisplayPort, VGA' }] },
  { id: 'p10', name: 'USB-C Docking Station',      category: 'IT Peripherals', price: 189.00, unit: 'each', sku: 'DOCK-USBC',   thumbVariant: 'hub',      specs: [{ label: 'Host Connection', value: 'USB-C Thunderbolt 3' }, { label: 'Video Out', value: '2 × HDMI 2.0 (4K @ 60 Hz)' }, { label: 'USB Ports', value: '4 × USB-A, 1 × USB-C' }, { label: 'Power Delivery', value: '100 W' }, { label: 'Ethernet', value: 'Gigabit' }] },
  { id: 'p11', name: 'Power Strip 6-Outlet',       category: 'IT Peripherals', price: 29.99,  unit: 'each', sku: 'PS-6OUT',     thumbVariant: 'power',    specs: [{ label: 'Outlets', value: '6 × AC' }, { label: 'USB Ports', value: '2 × USB-A (2.4 A)' }, { label: 'Cord Length', value: '1.8 m' }, { label: 'Max Load', value: '1875 W / 15 A' }, { label: 'Surge Protection', value: 'No' }] },
  { id: 'p12', name: 'Surge Protector 8-Outlet',   category: 'IT Peripherals', price: 44.99,  unit: 'each', sku: 'SP-8OUT',     thumbVariant: 'power',    specs: [{ label: 'Outlets', value: '8 × AC' }, { label: 'USB Ports', value: '2 × USB-A (3.1 A total)' }, { label: 'Surge Energy', value: '4320 J' }, { label: 'Cord Length', value: '2 m' }, { label: 'LED Indicator', value: 'Protected / Grounded' }] },
  { id: 'p13', name: 'Laptop Stand Adjustable',    category: 'IT Peripherals', price: 39.99,  unit: 'each', sku: 'LS-ADJ',      thumbVariant: 'stand',    specs: [{ label: 'Material', value: 'Aluminium alloy' }, { label: 'Height Levels', value: '6' }, { label: 'Compatible Sizes', value: '10"–17"' }, { label: 'Max Load', value: '8 kg' }, { label: 'Foldable', value: 'Yes' }] },
  { id: 'p14', name: 'Wired Keyboard Numeric',     category: 'IT Peripherals', price: 29.00,  unit: 'each', sku: 'KB-NUM-01',   thumbVariant: 'keyboard', specs: [{ label: 'Layout', value: 'Full-size with numpad' }, { label: 'Connectivity', value: 'USB-A' }, { label: 'Key Type', value: 'Membrane' }, { label: 'Key Travel', value: '3.5 mm' }, { label: 'OS', value: 'Windows / Linux' }] },
  { id: 'p15', name: 'Monitor Privacy Filter 24"', category: 'IT Peripherals', price: 64.99,  unit: 'each', sku: 'PF-24',       thumbVariant: 'monitor',  specs: [{ label: 'Screen Size', value: '23.8"' }, { label: 'Aspect Ratio', value: '16:9' }, { label: 'Viewing Angle', value: '60° (30° each side)' }, { label: 'Blue Light Filter', value: 'Yes' }, { label: 'Attachment', value: 'Adhesive strips / Tabs' }] },
  // Office Supplies
  { id: 'p16', name: 'Ballpoint Pens (Box 50)',    category: 'Office Supplies', price: 12.99, unit: 'box',  sku: 'PEN-50PK',    thumbVariant: 'pen',      specs: [{ label: 'Ink Color', value: 'Black' }, { label: 'Point Size', value: '0.7 mm medium' }, { label: 'Barrel', value: 'Retractable, rubber grip' }, { label: 'Ink Type', value: 'Oil-based' }, { label: 'Quantity', value: '50 pens / box' }] },
  { id: 'p17', name: 'Pencils HB (Box 72)',        category: 'Office Supplies', price: 9.99,  unit: 'box',  sku: 'PENCIL-72',   thumbVariant: 'pen',      specs: [{ label: 'Hardness', value: 'HB (#2)' }, { label: 'Wood', value: 'Cedar wood' }, { label: 'Core Diameter', value: '2.0 mm' }, { label: 'Pre-sharpened', value: 'Yes' }, { label: 'Quantity', value: '72 pencils / box' }] },
  { id: 'p18', name: 'Dry-Erase Markers (8-Pack)', category: 'Office Supplies', price: 14.99, unit: 'pack', sku: 'MARKER-8PK',  thumbVariant: 'marker',   specs: [{ label: 'Colors', value: 'Black, Blue, Red, Green × 2 each' }, { label: 'Tip', value: 'Chisel 3 mm' }, { label: 'Surface', value: 'Whiteboards, glass' }, { label: 'Odor', value: 'Low-odor formula' }, { label: 'Quantity', value: '8 markers / pack' }] },
  { id: 'p19', name: 'Stapler Heavy Duty',         category: 'Office Supplies', price: 22.99, unit: 'each', sku: 'STP-HD',      thumbVariant: 'stapler',  specs: [{ label: 'Sheet Capacity', value: 'Up to 70 sheets' }, { label: 'Staple Size', value: '26/6 & 24/6' }, { label: 'Throat Depth', value: '95 mm' }, { label: 'Jam-resistant', value: 'Yes' }, { label: 'Material', value: 'Metal chassis' }] },
  { id: 'p20', name: 'Staples Refill 5000-Pack',   category: 'Office Supplies', price: 7.49,  unit: 'box',  sku: 'STP-5K',      thumbVariant: 'stapler',  specs: [{ label: 'Size', value: '26/6' }, { label: 'Leg Length', value: '6 mm' }, { label: 'Wire Gauge', value: '26' }, { label: 'Finish', value: 'Galvanised steel' }, { label: 'Quantity', value: '5,000 staples / box' }] },
  { id: 'p21', name: 'Copy Paper A4 (5 Reams)',    category: 'Office Supplies', price: 39.99, unit: 'case', sku: 'PAPER-A4-5R', thumbVariant: 'paper',    specs: [{ label: 'Size', value: 'A4 (210 × 297 mm)' }, { label: 'Weight', value: '80 g/m²' }, { label: 'Brightness', value: '94 ISO' }, { label: 'Sheets', value: '500 / ream · 2,500 total' }, { label: 'Acid Free', value: 'Yes' }] },
  { id: 'p22', name: 'Manila Folders (100-Pack)',  category: 'Office Supplies', price: 18.99, unit: 'pack', sku: 'FOLD-MAN-100', thumbVariant: 'folder',   specs: [{ label: 'Size', value: 'Letter (8.5 × 11")' }, { label: 'Tab Cut', value: '1/3' }, { label: 'Stock Weight', value: '11 pt' }, { label: 'Color', value: 'Manila (yellow)' }, { label: 'Quantity', value: '100 folders / pack' }] },
  { id: 'p23', name: 'Ring Binders 2" (6-Pack)',   category: 'Office Supplies', price: 24.99, unit: 'pack', sku: 'BIND-2IN-6',  thumbVariant: 'folder',   specs: [{ label: 'Ring Diameter', value: '2" (holds ~480 sheets)' }, { label: 'Cover', value: 'Clear overlay front' }, { label: 'Ring Type', value: 'D-Ring' }, { label: 'Color', value: 'White' }, { label: 'Quantity', value: '6 binders / pack' }] },
  { id: 'p24', name: 'Sticky Notes 3×3 (12-Pack)', category: 'Office Supplies', price: 11.99, unit: 'pack', sku: 'POST-3X3-12', thumbVariant: 'notes',    specs: [{ label: 'Size', value: '3" × 3"' }, { label: 'Colors', value: 'Canary yellow' }, { label: 'Sheets / Pad', value: '100' }, { label: 'Adhesive', value: 'Repositionable' }, { label: 'Quantity', value: '12 pads / pack' }] },
  { id: 'p25', name: 'Scissors Stainless 8"',      category: 'Office Supplies', price: 8.99,  unit: 'each', sku: 'SCI-8IN',     thumbVariant: 'scissors', specs: [{ label: 'Blade Length', value: '8" (203 mm)' }, { label: 'Material', value: 'Stainless steel' }, { label: 'Handle', value: 'Soft-grip ambidextrous' }, { label: 'Use', value: 'Multi-purpose office' }, { label: 'Micro-serrated', value: 'Yes' }] },
  { id: 'p26', name: 'Clear Tape Rolls (12-Pack)', category: 'Office Supplies', price: 13.49, unit: 'pack', sku: 'TAPE-CLR-12', thumbVariant: 'tape',     specs: [{ label: 'Width', value: '19 mm (¾")' }, { label: 'Length / Roll', value: '33 m' }, { label: 'Finish', value: 'Matte writable' }, { label: 'Adhesive', value: 'Acrylic permanent' }, { label: 'Quantity', value: '12 rolls / pack' }] },
  { id: 'p27', name: 'Whiteboard Eraser Felt',     category: 'Office Supplies', price: 4.99,  unit: 'each', sku: 'WBE-FELT',    thumbVariant: 'eraser',   specs: [{ label: 'Face Material', value: 'Felt' }, { label: 'Size', value: '130 × 55 mm' }, { label: 'Handle', value: 'Plastic' }, { label: 'Magnetic', value: 'No' }, { label: 'Use', value: 'Dry-erase boards' }] },
  { id: 'p28', name: 'Ruler Stainless 30cm',       category: 'Office Supplies', price: 5.49,  unit: 'each', sku: 'RULER-30CM',  thumbVariant: 'ruler',    specs: [{ label: 'Length', value: '30 cm / 12"' }, { label: 'Material', value: 'Stainless steel' }, { label: 'Markings', value: 'Metric + Imperial' }, { label: 'Thickness', value: '1 mm' }, { label: 'Anti-slip back', value: 'Yes' }] },
  { id: 'p29', name: 'Desktop Calculator 12-Digit',category: 'Office Supplies', price: 19.99, unit: 'each', sku: 'CALC-12D',    thumbVariant: 'calc',     specs: [{ label: 'Display', value: '12-digit LCD' }, { label: 'Power', value: 'Solar + battery backup' }, { label: 'Keys', value: '44-key layout' }, { label: 'Memory', value: 'M+, M−, MR, MC' }, { label: 'Tax/Markup', value: 'Built-in' }] },
  { id: 'p30', name: 'Notepad A5 (10-Pack)',       category: 'Office Supplies', price: 15.99, unit: 'pack', sku: 'NP-A5-10',    thumbVariant: 'notes',    specs: [{ label: 'Size', value: 'A5 (148 × 210 mm)' }, { label: 'Ruling', value: 'Ruled 8 mm' }, { label: 'Sheets / Pad', value: '80' }, { label: 'Cover', value: 'Card stock' }, { label: 'Quantity', value: '10 pads / pack' }] },
  { id: 'p31', name: 'Paper Clips (1000-Pack)',    category: 'Office Supplies', price: 6.49,  unit: 'box',  sku: 'PCLIP-1K',    thumbVariant: 'clip',     specs: [{ label: 'Size', value: '33 mm medium' }, { label: 'Material', value: 'Galvanised steel' }, { label: 'Finish', value: 'Silver' }, { label: 'Hold Capacity', value: 'Up to 10 sheets' }, { label: 'Quantity', value: '1,000 / box' }] },
  { id: 'p32', name: 'Highlighters Assorted (20)', category: 'Office Supplies', price: 16.99, unit: 'pack', sku: 'HL-20PK',     thumbVariant: 'marker',   specs: [{ label: 'Colors', value: 'Yellow, Green, Pink, Blue, Orange × 4 each' }, { label: 'Tip', value: 'Chisel 1–4 mm' }, { label: 'Ink', value: 'Water-based, non-toxic' }, { label: 'Cap-off Time', value: 'Up to 4 h' }, { label: 'Quantity', value: '20 / pack' }] },
  // Batteries & Power
  { id: 'p33', name: 'AA Batteries (48-Pack)',      category: 'Batteries & Power', price: 24.99, unit: 'pack', sku: 'BAT-AA-48',   thumbVariant: 'battery',  specs: [{ label: 'Type', value: 'AA / LR6 Alkaline' }, { label: 'Voltage', value: '1.5 V' }, { label: 'Capacity', value: '2850 mAh' }, { label: 'Shelf Life', value: '10 years' }, { label: 'Quantity', value: '48 / pack' }] },
  { id: 'p34', name: 'AAA Batteries (36-Pack)',     category: 'Batteries & Power', price: 19.99, unit: 'pack', sku: 'BAT-AAA-36',  thumbVariant: 'battery',  specs: [{ label: 'Type', value: 'AAA / LR03 Alkaline' }, { label: 'Voltage', value: '1.5 V' }, { label: 'Capacity', value: '1200 mAh' }, { label: 'Shelf Life', value: '10 years' }, { label: 'Quantity', value: '36 / pack' }] },
  { id: 'p35', name: 'USB Power Bank 20000mAh',    category: 'Batteries & Power', price: 54.99, unit: 'each', sku: 'PB-20K',      thumbVariant: 'powerbank',specs: [{ label: 'Capacity', value: '20,000 mAh' }, { label: 'Output', value: '2 × USB-A (18 W) + 1 × USB-C (20 W)' }, { label: 'Input', value: 'USB-C 18 W' }, { label: 'Display', value: 'LED charge indicator' }, { label: 'Weight', value: '432 g' }] },
  { id: 'p36', name: 'Universal Laptop Charger 90W',category: 'Batteries & Power', price: 69.99, unit: 'each', sku: 'CHG-90W',     thumbVariant: 'charger',  specs: [{ label: 'Wattage', value: '90 W' }, { label: 'Tips', value: '12 interchangeable' }, { label: 'Voltages', value: '15–20 V auto-detect' }, { label: 'Cord Length', value: '1.8 m' }, { label: 'Certifications', value: 'UL, CE, FCC' }] },
  { id: 'p37', name: 'USB-C Charger 65W GaN',      category: 'Batteries & Power', price: 49.99, unit: 'each', sku: 'CHG-GAN-65W', thumbVariant: 'charger',  specs: [{ label: 'Technology', value: 'GaN III' }, { label: 'Wattage', value: '65 W (single port)' }, { label: 'Ports', value: '1 × USB-C (PD 3.0) + 1 × USB-A (12 W)' }, { label: 'Compatibility', value: 'MacBook, iPad, laptops' }, { label: 'Form factor', value: 'Foldable prongs' }] },
  // Printing
  { id: 'p38', name: 'Black Ink Cartridge HP 64XL', category: 'Printing', price: 34.99, unit: 'each', sku: 'INK-HP64XL-K', thumbVariant: 'ink',     specs: [{ label: 'Compatible With', value: 'HP Envy 6000/7000 series' }, { label: 'Color', value: 'Black' }, { label: 'Page Yield', value: '600 pages @ 5%' }, { label: 'Ink Type', value: 'Pigment-based' }, { label: 'OEM Part', value: 'HP N9J92AN' }] },
  { id: 'p39', name: 'Color Ink Cartridge HP 64XL', category: 'Printing', price: 39.99, unit: 'each', sku: 'INK-HP64XL-C', thumbVariant: 'ink',     specs: [{ label: 'Compatible With', value: 'HP Envy 6000/7000 series' }, { label: 'Color', value: 'Tri-color (CMY)' }, { label: 'Page Yield', value: '415 pages @ 5%' }, { label: 'Ink Type', value: 'Dye-based' }, { label: 'OEM Part', value: 'HP N9J89AN' }] },
  { id: 'p40', name: 'Black Toner Cartridge Canon', category: 'Printing', price: 89.99, unit: 'each', sku: 'TNR-CAN-K',    thumbVariant: 'toner',   specs: [{ label: 'Compatible With', value: 'Canon imageCLASS MF445/MF455' }, { label: 'Color', value: 'Black' }, { label: 'Page Yield', value: '2,200 pages @ 5%' }, { label: 'Toner Type', value: 'Dry powder' }, { label: 'OEM Part', value: 'Canon 069H BK' }] },
  { id: 'p41', name: 'Photo Paper 4×6 (100-Pack)', category: 'Printing', price: 18.99, unit: 'pack', sku: 'PPR-4X6-100', thumbVariant: 'paper',   specs: [{ label: 'Size', value: '4" × 6" (102 × 152 mm)' }, { label: 'Finish', value: 'Glossy' }, { label: 'Weight', value: '265 g/m²' }, { label: 'Compatible With', value: 'Inkjet printers' }, { label: 'Quantity', value: '100 sheets / pack' }] },
  { id: 'p42', name: 'Label Tape 12mm TZ231',      category: 'Printing', price: 12.99, unit: 'each', sku: 'LBL-TZ231',   thumbVariant: 'tape',    specs: [{ label: 'Width', value: '12 mm' }, { label: 'Print Color', value: 'Black on white' }, { label: 'Length', value: '8 m' }, { label: 'Compatible With', value: 'Brother P-touch TZ/TZe' }, { label: 'Laminated', value: 'Yes' }] },
  { id: 'p43', name: 'Glossy Presentation Paper',  category: 'Printing', price: 22.99, unit: 'pack', sku: 'PPR-GLOSS-A4', thumbVariant: 'paper',   specs: [{ label: 'Size', value: 'A4 (210 × 297 mm)' }, { label: 'Finish', value: 'Glossy coated' }, { label: 'Weight', value: '200 g/m²' }, { label: 'Compatible With', value: 'Inkjet' }, { label: 'Sheets / Pack', value: '100' }] },
  // Storage
  { id: 'p44', name: 'USB Flash Drive 128GB',      category: 'Storage', price: 22.99, unit: 'each', sku: 'USB-128G',    thumbVariant: 'usb',     specs: [{ label: 'Capacity', value: '128 GB' }, { label: 'Interface', value: 'USB 3.2 Gen1' }, { label: 'Read Speed', value: '130 MB/s' }, { label: 'Write Speed', value: '30 MB/s' }, { label: 'Form Factor', value: 'Retractable cap-less' }] },
  { id: 'p45', name: 'USB Flash Drive 256GB',      category: 'Storage', price: 39.99, unit: 'each', sku: 'USB-256G',    thumbVariant: 'usb',     specs: [{ label: 'Capacity', value: '256 GB' }, { label: 'Interface', value: 'USB 3.2 Gen1' }, { label: 'Read Speed', value: '130 MB/s' }, { label: 'Write Speed', value: '40 MB/s' }, { label: 'Form Factor', value: 'Retractable cap-less' }] },
  { id: 'p46', name: 'MicroSD Card 128GB Class 10',category: 'Storage', price: 18.99, unit: 'each', sku: 'SD-128G',     thumbVariant: 'sdcard',  specs: [{ label: 'Capacity', value: '128 GB' }, { label: 'Speed Class', value: 'Class 10 / UHS-I U3' }, { label: 'Read Speed', value: '100 MB/s' }, { label: 'Write Speed', value: '60 MB/s' }, { label: 'Adapter', value: 'SD adapter included' }] },
  { id: 'p47', name: 'MicroSD Card 256GB Class 10',category: 'Storage', price: 34.99, unit: 'each', sku: 'SD-256G',     thumbVariant: 'sdcard',  specs: [{ label: 'Capacity', value: '256 GB' }, { label: 'Speed Class', value: 'Class 10 / UHS-I U3' }, { label: 'Read Speed', value: '100 MB/s' }, { label: 'Write Speed', value: '85 MB/s' }, { label: 'Adapter', value: 'SD adapter included' }] },
  { id: 'p48', name: 'External HDD 1TB USB 3.0',  category: 'Storage', price: 64.99, unit: 'each', sku: 'HDD-1TB',     thumbVariant: 'hdd',     specs: [{ label: 'Capacity', value: '1 TB' }, { label: 'Interface', value: 'USB 3.0 (USB-A)' }, { label: 'Speed', value: '5400 RPM' }, { label: 'Transfer Rate', value: 'Up to 130 MB/s' }, { label: 'Bus-powered', value: 'Yes (no AC adapter)' }] },
  { id: 'p49', name: 'External SSD 500GB USB-C',  category: 'Storage', price: 89.99, unit: 'each', sku: 'SSD-500G',    thumbVariant: 'ssd',     specs: [{ label: 'Capacity', value: '500 GB' }, { label: 'Interface', value: 'USB-C 3.2 Gen2' }, { label: 'Read Speed', value: '1050 MB/s' }, { label: 'Write Speed', value: '1000 MB/s' }, { label: 'Shock Resistant', value: '1500 G / 0.5 ms' }] },
  { id: 'p50', name: 'NAS Drive 2TB Enterprise',  category: 'Storage', price: 149.99,unit: 'each', sku: 'NAS-2TB',     thumbVariant: 'hdd',     specs: [{ label: 'Capacity', value: '2 TB' }, { label: 'Form Factor', value: '3.5" HDD' }, { label: 'Interface', value: 'SATA 6 Gb/s' }, { label: 'Rated Load', value: '24/7 NAS workloads' }, { label: 'MTBF', value: '1,000,000 h' }] },
];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; grad: string }> = {
  'IT Peripherals':    { bg: '#e8eeff', text: '#1434CB', grad: 'linear-gradient(135deg,#dce8ff,#c7d7ff)' },
  'Office Supplies':   { bg: '#f0fdf4', text: '#166534', grad: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
  'Batteries & Power': { bg: '#fefce8', text: '#854d0e', grad: 'linear-gradient(135deg,#fef9c3,#fde68a)' },
  'Printing':          { bg: '#fdf4ff', text: '#7e22ce', grad: 'linear-gradient(135deg,#f3e8ff,#e9d5ff)' },
  'Storage':           { bg: '#fff1f2', text: '#9f1239', grad: 'linear-gradient(135deg,#ffe4e6,#fecdd3)' },
};

const CATEGORIES: Category[] = ['IT Peripherals', 'Office Supplies', 'Batteries & Power', 'Printing', 'Storage'];
const POLICY_THRESHOLD = 5000;

// ── Product thumbnail SVGs ────────────────────────────────────────────────────

function ProductThumbnail({ variant, category }: { variant: string; category: Category }) {
  const colors = CATEGORY_COLORS[category];

  const svgMap: Record<string, React.ReactElement> = {
    keyboard: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="10" y="18" width="100" height="44" rx="5" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        {[15,25,35,45,55,65,75,85,95].map((x, i) => <rect key={i} x={x} y="26" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity=".3"/>)}
        {[12,24,36,48,60,72,84,96].map((x, i) => <rect key={i} x={x} y="37" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity=".25"/>)}
        {[18,31,44,57,70,83].map((x, i) => <rect key={i} x={x} y="48" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity=".2"/>)}
        <rect x="36" y="59" width="48" height="7" rx="2" fill="currentColor" fillOpacity=".25"/>
      </svg>
    ),
    mouse: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <ellipse cx="60" cy="45" rx="24" ry="32" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M60 14 L60 45" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".4"/>
        <ellipse cx="60" cy="38" rx="4" ry="6" fill="currentColor" fillOpacity=".3"/>
        <ellipse cx="60" cy="13" rx="3" ry="3" fill="currentColor" fillOpacity=".2"/>
      </svg>
    ),
    monitor: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="10" y="10" width="100" height="52" rx="4" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="15" y="14" width="90" height="44" rx="2" fill="currentColor" fillOpacity=".12"/>
        <rect x="20" y="17" width="80" height="38" rx="1.5" fill="currentColor" fillOpacity=".08"/>
        <rect x="52" y="62" width="16" height="8" rx="1" fill="currentColor" fillOpacity=".3"/>
        <rect x="40" y="70" width="40" height="3" rx="1.5" fill="currentColor" fillOpacity=".25"/>
      </svg>
    ),
    cable: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="8" y="32" width="16" height="16" rx="3" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="96" y="32" width="16" height="16" rx="3" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M24 40 Q52 18 60 40 Q68 62 96 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity=".5"/>
        <path d="M24 40 Q52 18 60 40 Q68 62 96 40" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" strokeDasharray="3 4" strokeOpacity=".6"/>
      </svg>
    ),
    webcam: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <circle cx="60" cy="34" r="22" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="60" cy="34" r="13" fill="currentColor" fillOpacity=".15"/>
        <circle cx="60" cy="34" r="7" fill="currentColor" fillOpacity=".3"/>
        <circle cx="60" cy="34" r="3" fill="currentColor" fillOpacity=".6"/>
        <circle cx="65" cy="29" r="1.5" fill="white" fillOpacity=".7"/>
        <rect x="54" y="56" width="12" height="5" rx="2" fill="currentColor" fillOpacity=".3"/>
        <rect x="40" y="61" width="40" height="4" rx="2" fill="currentColor" fillOpacity=".2"/>
      </svg>
    ),
    headset: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <path d="M35 48 Q35 18 60 18 Q85 18 85 48" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity=".5"/>
        <rect x="26" y="46" width="14" height="20" rx="7" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="80" y="46" width="14" height="20" rx="7" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M74 66 Q74 76 64 76" stroke="currentColor" strokeWidth="2" strokeOpacity=".4" fill="none" strokeLinecap="round"/>
        <circle cx="64" cy="76" r="2" fill="currentColor" fillOpacity=".4"/>
      </svg>
    ),
    hub: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="20" y="28" width="80" height="24" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        {[32,46,60,74,88].map((x, i) => <rect key={i} x={x} y="36" width="6" height="8" rx="1" fill="currentColor" fillOpacity=".35"/>)}
        <rect x="6" y="37" width="14" height="6" rx="2" fill="currentColor" fillOpacity=".25"/>
        <circle cx="104" cy="40" r="4" fill="currentColor" fillOpacity=".3"/>
        <circle cx="104" cy="40" r="2" fill="currentColor" fillOpacity=".5"/>
      </svg>
    ),
    power: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="10" y="28" width="100" height="24" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        {[22,38,54,70,86,102].map((x, i) => <circle key={i} cx={x} cy="40" r="6" fill="currentColor" fillOpacity=".25"/>)}
        {[22,38,54,70,86,102].map((x, i) => <circle key={i} cx={x} cy="40" r="2.5" fill="currentColor" fillOpacity=".4"/>)}
      </svg>
    ),
    stand: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="20" y="12" width="80" height="28" rx="4" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M60 40 L46 68" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".4" strokeLinecap="round"/>
        <path d="M60 40 L74 68" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".4" strokeLinecap="round"/>
        <rect x="32" y="66" width="56" height="6" rx="3" fill="currentColor" fillOpacity=".3"/>
      </svg>
    ),
    pen: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="20" y="36" width="70" height="8" rx="4" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M90 40 L108 36 L110 44 Z" fill="currentColor" fillOpacity=".4"/>
        <rect x="14" y="37" width="8" height="6" rx="1" fill="currentColor" fillOpacity=".3"/>
        <rect x="42" y="25" width="8" height="8" rx="2" fill="white" fillOpacity=".7" stroke="currentColor" strokeWidth="1"/>
        <rect x="60" y="25" width="8" height="8" rx="2" fill="white" fillOpacity=".7" stroke="currentColor" strokeWidth="1"/>
        <rect x="26" y="47" width="8" height="8" rx="2" fill="white" fillOpacity=".7" stroke="currentColor" strokeWidth="1"/>
        <rect x="60" y="47" width="8" height="8" rx="2" fill="white" fillOpacity=".7" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    marker: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        {[15,35,55,75,95].map((x, i) => (
          <g key={i}>
            <rect x={x} y="24" width="12" height="36" rx="4" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.2" strokeOpacity={0.3 + i * 0.1}/>
            <rect x={x+2} y="55" width="8" height="5" rx="1" fill="currentColor" fillOpacity=".3"/>
          </g>
        ))}
      </svg>
    ),
    stapler: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="15" y="36" width="90" height="24" rx="8" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="20" y="28" width="60" height="12" rx="4" fill="white" fillOpacity=".7" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="96" y="48" width="8" height="8" rx="2" fill="currentColor" fillOpacity=".3"/>
        <rect x="28" y="50" width="70" height="3" rx="1.5" fill="currentColor" fillOpacity=".15"/>
      </svg>
    ),
    paper: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        {[4,2,0].map((offset, i) => (
          <rect key={i} x={24+offset} y={14+offset} width="72" height="58" rx="2" fill="white" fillOpacity=".9" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/>
        ))}
        <line x1="34" y1="32" x2="88" y2="32" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/>
        <line x1="34" y1="40" x2="88" y2="40" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/>
        <line x1="34" y1="48" x2="88" y2="48" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/>
        <line x1="34" y1="56" x2="70" y2="56" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/>
      </svg>
    ),
    folder: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <path d="M10 30 Q10 24 16 24 L44 24 L52 18 L104 18 Q110 18 110 24 L110 66 Q110 72 104 72 L16 72 Q10 72 10 66 Z" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="30" y1="42" x2="90" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity=".25"/>
        <line x1="30" y1="52" x2="90" y2="52" stroke="currentColor" strokeWidth="1" strokeOpacity=".25"/>
        <line x1="30" y1="62" x2="70" y2="62" stroke="currentColor" strokeWidth="1" strokeOpacity=".25"/>
      </svg>
    ),
    notes: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="22" y="12" width="76" height="60" rx="4" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="22" y="12" width="76" height="10" rx="4" fill="currentColor" fillOpacity=".15"/>
        <line x1="32" y1="36" x2="88" y2="36" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".3"/>
        <line x1="32" y1="46" x2="88" y2="46" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".3"/>
        <line x1="32" y1="56" x2="72" y2="56" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".3"/>
      </svg>
    ),
    scissors: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <circle cx="34" cy="54" r="12" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="34" cy="54" r="5" fill="currentColor" fillOpacity=".2"/>
        <circle cx="72" cy="54" r="12" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="72" cy="54" r="5" fill="currentColor" fillOpacity=".2"/>
        <path d="M42 48 L96 16" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".5" strokeLinecap="round"/>
        <path d="M80 48 L96 16" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".5" strokeLinecap="round"/>
        <circle cx="96" cy="16" r="3" fill="currentColor" fillOpacity=".4"/>
      </svg>
    ),
    tape: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <circle cx="60" cy="40" r="28" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="60" cy="40" r="18" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1" strokeOpacity=".2"/>
        <circle cx="60" cy="40" r="8" fill="white" fillOpacity=".9" stroke="currentColor" strokeWidth="1" strokeOpacity=".3"/>
        <path d="M82 26 L96 14 L102 22 L88 34 Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    eraser: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="22" y="26" width="76" height="28" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="22" y="42" width="76" height="12" rx="0" fill="currentColor" fillOpacity=".1"/>
        <rect x="22" y="42" width="76" height="3" rx="0" fill="currentColor" fillOpacity=".15"/>
        <rect x="26" y="54" width="68" height="6" rx="2" fill="currentColor" fillOpacity=".2"/>
      </svg>
    ),
    ruler: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="10" y="32" width="100" height="16" rx="2" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        {[18,28,38,48,58,68,78,88,98].map((x, i) => (
          <line key={i} x1={x} y1="32" x2={x} y2={i % 2 === 0 ? "40" : "38"} stroke="currentColor" strokeWidth="1" strokeOpacity=".4"/>
        ))}
        {[18,38,58,78,98].map((x, i) => (
          <text key={i} x={x-2} y="46" fontSize="5" fill="currentColor" fillOpacity=".4">{(i+1)*5}</text>
        ))}
      </svg>
    ),
    calc: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="30" y="8" width="60" height="66" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="36" y="14" width="48" height="16" rx="3" fill="currentColor" fillOpacity=".15"/>
        <text x="68" y="26" textAnchor="end" fontSize="10" fill="currentColor" fillOpacity=".4" fontFamily="monospace">1,234</text>
        {[0,1,2,3].map(row => [0,1,2].map(col => (
          <rect key={`${row}-${col}`} x={37+col*16} y={36+row*13} width="11" height="9" rx="2" fill="currentColor" fillOpacity=".2"/>
        )))}
      </svg>
    ),
    clip: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        {[20,42,64,86].map((x, i) => (
          <path key={i} d={`M${x} 60 L${x} 28 Q${x} 18 ${x+7} 18 Q${x+14} 18 ${x+14} 28 L${x+14} 56 Q${x+14} 64 ${x+7} 64 Q${x+2} 64 ${x+2} 58 L${x+2} 30 Q${x+2} 24 ${x+7} 24 Q${x+10} 24 ${x+10} 30 L${x+10} 60`}
            stroke="currentColor" strokeWidth="2" strokeOpacity=".45" fill="none" strokeLinecap="round"/>
        ))}
      </svg>
    ),
    battery: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="12" y="24" width="88" height="32" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="100" y="33" width="8" height="14" rx="2" fill="currentColor" fillOpacity=".3"/>
        <rect x="18" y="30" width="22" height="20" rx="3" fill="currentColor" fillOpacity=".25"/>
        <rect x="44" y="30" width="22" height="20" rx="3" fill="currentColor" fillOpacity=".2"/>
        <rect x="70" y="30" width="12" height="20" rx="3" fill="currentColor" fillOpacity=".12"/>
      </svg>
    ),
    powerbank: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="28" y="10" width="64" height="60" rx="8" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="36" y="18" width="48" height="10" rx="3" fill="currentColor" fillOpacity=".15"/>
        <path d="M54 30 L58 40 L52 40 L62 54 L58 44 L64 44 Z" fill="currentColor" fillOpacity=".4"/>
        <rect x="38" y="60" width="12" height="4" rx="2" fill="currentColor" fillOpacity=".25"/>
        <rect x="54" y="60" width="12" height="4" rx="2" fill="currentColor" fillOpacity=".25"/>
      </svg>
    ),
    charger: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="34" y="16" width="52" height="44" rx="8" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="46" y="60" width="8" height="10" rx="2" fill="currentColor" fillOpacity=".25"/>
        <rect x="66" y="60" width="8" height="10" rx="2" fill="currentColor" fillOpacity=".25"/>
        <path d="M52 24 L56 36 L50 36 L60 50 L56 38 L62 38 Z" fill="currentColor" fillOpacity=".4"/>
      </svg>
    ),
    ink: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="24" y="16" width="72" height="54" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="30" y="22" width="60" height="30" rx="4" fill="currentColor" fillOpacity=".12"/>
        <path d="M54 28 L58 40 L52 40 L62 58 L58 46 L64 46 Z" fill="currentColor" fillOpacity=".35"/>
        <rect x="36" y="58" width="14" height="5" rx="2" fill="currentColor" fillOpacity=".2"/>
        <rect x="54" y="58" width="14" height="5" rx="2" fill="currentColor" fillOpacity=".2"/>
        <rect x="72" y="58" width="14" height="5" rx="2" fill="currentColor" fillOpacity=".2"/>
      </svg>
    ),
    toner: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="18" y="20" width="84" height="44" rx="8" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="60" cy="42" rx="30" ry="16" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1" strokeOpacity=".2"/>
        <rect x="30" y="36" width="60" height="12" rx="3" fill="currentColor" fillOpacity=".15"/>
        <rect x="26" y="58" width="10" height="6" rx="2" fill="currentColor" fillOpacity=".25"/>
        <rect x="84" y="58" width="10" height="6" rx="2" fill="currentColor" fillOpacity=".25"/>
      </svg>
    ),
    usb: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="24" y="26" width="72" height="28" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="96" y="30" width="8" height="20" rx="2" fill="currentColor" fillOpacity=".3"/>
        <rect x="100" y="34" width="4" height="12" rx="1" fill="currentColor" fillOpacity=".15"/>
        <rect x="32" y="32" width="50" height="16" rx="3" fill="currentColor" fillOpacity=".1"/>
        <text x="57" y="44" textAnchor="middle" fontSize="7" fill="currentColor" fillOpacity=".4" fontFamily="sans-serif" fontWeight="700">USB</text>
      </svg>
    ),
    sdcard: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <path d="M38 16 L82 16 L82 64 L38 64 L38 16 Z" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M38 16 L38 28 L50 16 Z" fill="currentColor" fillOpacity=".2"/>
        {[46,52,58,64,70,76].map((x, i) => (
          <line key={i} x1={x} y1="48" x2={x} y2="64" stroke="currentColor" strokeWidth="2" strokeOpacity=".3"/>
        ))}
        <text x="60" y="40" textAnchor="middle" fontSize="7" fill="currentColor" fillOpacity=".4" fontFamily="sans-serif" fontWeight="700">SD</text>
      </svg>
    ),
    hdd: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="14" y="18" width="92" height="44" rx="8" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="60" cy="40" r="16" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1" strokeOpacity=".25"/>
        <circle cx="60" cy="40" r="8" fill="currentColor" fillOpacity=".15"/>
        <circle cx="60" cy="40" r="3" fill="currentColor" fillOpacity=".4"/>
        <rect x="84" y="28" width="14" height="6" rx="2" fill="currentColor" fillOpacity=".2"/>
        <rect x="84" y="38" width="14" height="6" rx="2" fill="currentColor" fillOpacity=".2"/>
      </svg>
    ),
    ssd: (
      <svg viewBox="0 0 120 80" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="18" y="20" width="84" height="40" rx="6" fill="white" fillOpacity=".85" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="26" y="28" width="60" height="24" rx="3" fill="currentColor" fillOpacity=".08"/>
        {[30,42,54,66,78].map((x, i) => <rect key={i} x={x} y="32" width="8" height="16" rx="2" fill="currentColor" fillOpacity=".2"/>)}
        <rect x="92" y="24" width="6" height="10" rx="2" fill="currentColor" fillOpacity=".3"/>
        <rect x="92" y="46" width="6" height="8" rx="2" fill="currentColor" fillOpacity=".25"/>
      </svg>
    ),
  };

  const svg = svgMap[variant] ?? svgMap['paper'];
  const col = colors;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: col.grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: col.text,
    }}>
      {svg}
    </div>
  );
}

// ── Product lightbox ──────────────────────────────────────────────────────────

function ProductLightbox({
  product, inCart, onClose, onAddToCart,
}: {
  product: Product;
  inCart: number;
  onClose: () => void;
  onAddToCart: () => void;
}) {
  const catStyle = CATEGORY_COLORS[product.category];

  return (
    <motion.div
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 12, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 20,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 540,
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
          <ProductThumbnail variant={product.thumbVariant} category={product.category} />
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.25)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <X size={14} color="white" />
          </button>
          {/* SKU badge */}
          <span style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
            color: 'white', fontSize: 9, fontWeight: 700,
            padding: '3px 8px', borderRadius: 99, fontFamily: 'monospace', letterSpacing: '0.08em',
          }}>
            {product.sku}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                background: catStyle.bg, color: catStyle.text,
                display: 'inline-block', marginBottom: 6,
              }}>
                {product.category}
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#000', lineHeight: 1.2 }}>
                {product.name}
              </h2>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#1434CB' }}>
                ${product.price.toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: '#aaa' }}>per {product.unit}</p>
            </div>
          </div>

          {/* Policy badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(20,52,203,0.06)', borderRadius: 8,
            padding: '7px 12px', marginBottom: 16,
          }}>
            <CheckCircle2 size={13} color="#1434CB" />
            <span style={{ fontSize: 11, color: '#1434CB', fontWeight: 600 }}>
              Policy compliant · Under ${POLICY_THRESHOLD.toLocaleString()} threshold
            </span>
          </div>

          {/* Specs */}
          <div style={{
            border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 18,
          }}>
            {product.specs.map((spec, i) => (
              <div
                key={spec.label}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '9px 14px',
                  background: i % 2 === 0 ? '#fafafa' : 'white',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <span style={{ fontSize: 12, color: '#4a4a4a', fontWeight: 500, flex: '0 0 42%' }}>
                  {spec.label}
                </span>
                <span style={{ fontSize: 12, color: '#000', fontWeight: 600, flex: 1 }}>
                  {spec.value}
                </span>
              </div>
            ))}
          </div>

          {/* Add to cart */}
          <motion.button
            onClick={() => { onAddToCart(); onClose(); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '13px 0',
              background: '#1434CB', color: 'white',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <ShoppingCart size={16} />
            {inCart > 0 ? `Add Another (${inCart} in cart)` : 'Add to Cart'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Policy animation overlay ──────────────────────────────────────────────────

function PolicyOverlay({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      key="policy-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
      }}
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.9, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: -8, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 60%, #0a1628 100%)',
          border: '1px solid rgba(99,130,255,0.2)',
          borderRadius: 20,
          padding: '28px 32px',
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(20,52,203,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1434CB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 71 23" fill="none" style={{ width: 24, height: 'auto' }}>
              <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
            </svg>
          </div>
          <div>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>Visa Card Policy Check</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>spend-controls/v1 · real-time</p>
          </div>
        </div>

        <div style={{ background: 'rgba(20,52,203,0.15)', border: '1px solid rgba(99,130,255,0.25)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(99,130,255,0.15)', color: '#93bbff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', letterSpacing: '0.1em' }}>POLICY</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}>GOV-PC-001 · Active</span>
          </div>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Petty Cash Threshold Enforcement</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>
            Visa Commercial Card · Max transaction: <span style={{ color: '#f7b600', fontWeight: 700 }}>${POLICY_THRESHOLD.toLocaleString()} USD</span>
          </p>
        </div>

        {[
          { tag: 'BIND',   color: '#60a5fa', label: 'Checking cardholder spend controls' },
          { tag: 'MCC',    color: '#a78bfa', label: 'Resolving eligible merchant categories' },
          { tag: 'FILTER', color: '#34d399', label: `Applying $${POLICY_THRESHOLD.toLocaleString()} per-item threshold` },
          { tag: 'OK',     color: '#f7b600', label: 'All displayed products policy-compliant' },
        ].map((step, i) => (
          <motion.div key={step.tag} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.18, duration: 0.25 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontFamily: 'monospace' }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>›</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: step.color, background: `${step.color}18`, border: `1px solid ${step.color}30` }}>{step.tag}</span>
            <span style={{ color: i === 3 ? 'white' : 'rgba(255,255,255,0.45)', fontSize: 11 }}>{step.label}</span>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.3 }}
          style={{ marginTop: 16, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,52,203,0.08))', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle2 size={18} color="#34d399" strokeWidth={2} />
          <div>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Policy applied successfully</p>
            <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>All items within $5,000 USD threshold</p>
          </div>
          <motion.button onClick={onDone} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{ marginLeft: 'auto', background: '#1434CB', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Cart drawer ────────────────────────────────────────────────────────────────

interface CartItem { product: Product; qty: number }
type CheckoutState = 'idle' | 'verify' | 'processing' | 'done';
type PaymentMethod = 'card' | 'erp';

const ERP_THRESHOLD = 10000;

const BRAND_GRADIENT: Record<string, string> = {
  Visa:       'linear-gradient(135deg, #1434CB 0%, #0a1f8f 100%)',
  Mastercard: 'linear-gradient(135deg, #EB001B 0%, #a80013 100%)',
  Amex:       'linear-gradient(135deg, #007BC1 0%, #005a8e 100%)',
};

function CardChip({ card }: { card: IssuedCard }) {
  return (
    <div style={{
      borderRadius: 12, padding: '12px 14px',
      background: BRAND_GRADIENT[card.brand] ?? BRAND_GRADIENT.Visa,
      color: 'white', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -18, right: -18, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', top: 10, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {card.label ?? card.brand}
        </span>
        <svg viewBox="0 0 71 23" fill="white" style={{ width: 28, height: 'auto', opacity: 0.9 }}>
          <path fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', marginBottom: 8 }}>
        •••• •••• •••• {card.last4}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.06em', marginBottom: 1 }}>CARD HOLDER</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>{card.holderName.toUpperCase()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.06em', marginBottom: 1 }}>EXPIRES</div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>{card.expiry}</div>
        </div>
      </div>
    </div>
  );
}

function PaymentReceipt({ card, items, total, txId, onClose }: {
  card: IssuedCard;
  items: CartItem[];
  total: number;
  txId: string;
  onClose: () => void;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
    >
      {/* Success header */}
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.1 }}
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}
        >
          <CheckCircle2 size={26} color="white" strokeWidth={2.5} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0a0a23', margin: 0 }}>Payment Approved</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{dateStr} · {timeStr}</p>
        </motion.div>
      </div>

      {/* Card used */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Card Used</p>
        <CardChip card={card} />
      </motion.div>

      {/* Items */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Items</p>
        {items.map((item, i) => (
          <motion.div key={item.product.id}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 + i * 0.05 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < items.length - 1 ? 6 : 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>×{item.qty} · ${item.product.price.toFixed(2)} each</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1434CB', marginLeft: 8, flexShrink: 0 }}>${(item.product.price * item.qty).toFixed(2)}</span>
          </motion.div>
        ))}
        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Total Charged</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>${total.toFixed(2)} USD</span>
        </div>
      </motion.div>

      {/* Tx details */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>TRANSACTION ID</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#374151', fontWeight: 700 }}>{txId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>NETWORK</span>
          <span style={{ fontSize: 10, color: '#374151', fontWeight: 700 }}>Visa Commercial Network</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>SETTLEMENT</span>
          <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>1–2 Business Days</span>
        </div>
      </motion.div>

      {/* No reconciliation badge */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
        style={{ background: 'linear-gradient(135deg, rgba(20,52,203,0.06), rgba(99,102,241,0.06))', border: '1px solid rgba(20,52,203,0.15)', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <CheckCircle2 size={14} color="#1434CB" strokeWidth={2.5} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#1434CB', margin: 0 }}>No Reconciliation Required</p>
          <p style={{ fontSize: 10, color: '#4a5568', margin: 0 }}>Petty cash · Spend controls auto-applied</p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={onClose}
        style={{ width: '100%', padding: '12px 0', background: '#0a0a23', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
      >
        Done
      </motion.button>
    </motion.div>
  );
}

function CartDrawer({ items, onClose, onQtyChange, onRemove }: {
  items: CartItem[];
  onClose: () => void;
  onQtyChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const { cards } = useCards();
  const { addTransaction, addNotification } = usePayment();
  const [checkout, setCheckout]       = useState<CheckoutState>('idle');
  const [method, setMethod]           = useState<PaymentMethod>('card');
  const [selectedCard, setSelectedCard] = useState<IssuedCard | null>(null);
  const [txId, setTxId]               = useState('');
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cardEligible = total <= ERP_THRESHOLD;
  const activeCards = cards.filter((c) => !c.blocked);

  // Auto-select first card when cards load
  useEffect(() => {
    if (!selectedCard && activeCards.length > 0) setSelectedCard(activeCards[0]);
  }, [activeCards.length]);

  const handleFingerprintSuccess = useCallback(() => {
    const id = `VGS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    setTxId(id);
    setCheckout('processing');
    setTimeout(() => {
      // Push to PaymentContext so dashboard picks it up
      addTransaction({
        id,
        rfpId: 'petty-cash',
        supplierId: 'agency',
        supplierName: 'Agency Petty Cash',
        amount: total,
        method: 'Card',
        status: 'Settled',
        orderId: `PC-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        settledAt: new Date().toISOString(),
      });
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'payment',
        title: 'Petty Cash Payment Settled',
        message: `$${total.toFixed(2)} charged to card ····${selectedCard?.last4 ?? ''}`,
        timestamp: new Date().toISOString(),
        read: false,
        amount: total,
        cardLast4: selectedCard?.last4,
        cardBrand: selectedCard?.brand,
        cardHolder: selectedCard?.holderName,
      });
      setCheckout('done');
    }, 2200);
  }, [total, selectedCard, addTransaction, addNotification]);

  // Run the native biometric prompt (Touch ID / Windows Hello). The payment
  // flow only proceeds once the user actually authenticates.
  const handleVerify = useCallback(async () => {
    const ok = await authenticateWithBiometrics(`Petty Cash · $${total.toFixed(2)}`);
    if (ok) handleFingerprintSuccess();
  }, [total, handleFingerprintSuccess]);

  return (
    <>
    <motion.div
      key="cart-drawer"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      style={{ position: 'fixed', top: '4rem', right: 0, bottom: 0, width: 390, background: 'white', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', borderLeft: '1px solid rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <ShoppingCart size={18} color="#1434CB" />
        <span style={{ fontWeight: 700, fontSize: 15, color: '#000', flex: 1 }}>Cart</span>
        {checkout !== 'done' && (
          <span style={{ background: '#e8eeff', color: '#1434CB', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{items.reduce((s, i) => s + i.qty, 0)} items</span>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a4a', display: 'flex' }}><X size={16} /></button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <AnimatePresence mode="wait">
          {checkout === 'done' && method === 'card' && selectedCard ? (
            <motion.div key="receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentReceipt card={selectedCard} items={items} total={total} txId={txId} onClose={onClose} />
            </motion.div>
          ) : checkout === 'done' && method === 'erp' ? (
            <motion.div key="erp-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 16, textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={26} color="#059669" strokeWidth={2.5} />
              </motion.div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0a0a23', margin: '0 0 4px' }}>PO Submitted</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>ERP ref #PO-{Date.now().toString().slice(-6)}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 6 }}>Estimated approval: ~45 business days</p>
              </div>
              <button onClick={onClose}
                style={{ padding: '10px 32px', background: '#0a0a23', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                Done
              </button>
            </motion.div>
          ) : (
            <motion.div key="cart-items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                  <Package size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                  <p style={{ fontSize: 13 }}>Your cart is empty</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((item) => (
                    <motion.div key={item.product.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                      style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#000', lineHeight: 1.35, flex: 1, paddingRight: 8 }}>{item.product.name}</p>
                        <button onClick={() => onRemove(item.product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', flexShrink: 0 }}><X size={13} /></button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => onQtyChange(item.product.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => onQtyChange(item.product.id, +1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1434CB' }}>${(item.product.price * item.qty).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checkout footer */}
      {items.length > 0 && checkout !== 'done' && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#4a4a4a', fontWeight: 500 }}>Total</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#000' }}>${total.toFixed(2)}</span>
          </div>

          <AnimatePresence>
            {checkout === 'idle' && (
              <motion.div key="method-selector"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
                style={{ marginBottom: 12 }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a4a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Method</p>

                {/* Card option */}
                <button onClick={() => setMethod('card')} style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: method === 'card' ? 'rgba(20,52,203,0.05)' : '#fafafa',
                  border: method === 'card' ? '1.5px solid #1434CB' : '1.5px solid rgba(0,0,0,0.1)',
                  borderRadius: 12, padding: '11px 14px', marginBottom: 8, transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1434CB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg viewBox="0 0 71 23" fill="none" style={{ width: 18, height: 'auto' }}>
                        <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>Visa Card Payment</span>
                        {cardEligible && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: '#d1fae5', color: '#065f46' }}>RECOMMENDED</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Zap size={10} color="#059669" />
                        <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Settles in 1–2 days · No reconciliation</span>
                      </div>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: method === 'card' ? '5px solid #1434CB' : '2px solid rgba(0,0,0,0.2)', transition: 'all 0.15s' }} />
                  </div>
                </button>

                {/* Card selector */}
                <AnimatePresence>
                  {method === 'card' && activeCards.length > 0 && (
                    <motion.div key="card-selector"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                      style={{ marginBottom: 8, overflow: 'hidden' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, marginTop: 2 }}>Select Card</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {activeCards.map((card) => {
                          const sel = selectedCard?.id === card.id;
                          return (
                            <motion.button key={card.id} onClick={() => setSelectedCard(card)}
                              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                              style={{
                                width: '100%', textAlign: 'left', cursor: 'pointer', padding: '10px 12px',
                                background: sel ? 'rgba(20,52,203,0.05)' : '#fafafa',
                                border: sel ? '1.5px solid #1434CB' : '1.5px solid rgba(0,0,0,0.09)',
                                borderRadius: 10, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                              }}>
                              <div style={{ width: 36, height: 24, borderRadius: 5, background: BRAND_GRADIENT[card.brand] ?? BRAND_GRADIENT.Visa, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg viewBox="0 0 71 23" fill="white" style={{ width: 18, height: 'auto' }}>
                                  <path fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
                                </svg>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{card.label ?? card.brand} ···· {card.last4}</div>
                                <div style={{ fontSize: 10, color: '#9ca3af' }}>{card.holderName} · Exp {card.expiry}</div>
                              </div>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', border: sel ? '4px solid #1434CB' : '2px solid rgba(0,0,0,0.18)', flexShrink: 0, transition: 'all 0.15s' }} />
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ERP option */}
                <button onClick={() => setMethod('erp')} style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: method === 'erp' ? 'rgba(0,0,0,0.02)' : '#fafafa',
                  border: method === 'erp' ? '1.5px solid rgba(0,0,0,0.3)' : '1.5px solid rgba(0,0,0,0.1)',
                  borderRadius: 12, padding: '11px 14px', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ChevronRight size={14} color="#6b7280" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>ERP Procurement Flow</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Clock size={10} color="#9ca3af" />
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Avg. 45 days · Requires ERP approval</span>
                      </div>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: method === 'erp' ? '5px solid #4b5563' : '2px solid rgba(0,0,0,0.2)', transition: 'all 0.15s' }} />
                  </div>
                  <AnimatePresence>
                    {method === 'erp' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                        style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <AlertTriangle size={11} color="#d97706" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>Slower than Visa Card</span>
                          </div>
                          <p style={{ fontSize: 11, color: '#78350f', lineHeight: 1.4 }}>Card settles in <strong>1–2 days</strong>. ERP takes <strong>~45 days</strong> and requires manual approval.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <AnimatePresence mode="wait">
            {checkout === 'idle' && (
              <motion.button key="pay-btn"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => { if (method === 'card') { setCheckout('verify'); } else { setCheckout('processing'); setTimeout(() => setCheckout('done'), 2400); } }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                disabled={method === 'card' && !selectedCard}
                style={{
                  width: '100%', padding: '13px 0',
                  background: method === 'card' ? (selectedCard ? '#1434CB' : '#9ca3af') : '#374151',
                  color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: method === 'card' && !selectedCard ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s',
                }}
              >
                {method === 'card' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <span style={{ fontSize: 15, letterSpacing: '0.01em' }}>Pay with</span>
                    <VisaLogo style={{ height: 16, marginLeft: -4, '--v-logo-color': 'white' } as React.CSSProperties} />
                  </span>
                ) : (
                  <><ChevronRight size={16} />Submit ERP Purchase Order</>
                )}
              </motion.button>
            )}
            {checkout === 'verify' && (
              <motion.button key="verify-btn"
                initial={{ opacity: 0, scale: 0.96, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }} transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={handleVerify}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ width: '100%', padding: '13px 0', background: '#1434CB', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ShieldCheck size={17} strokeWidth={2} />
                Verify Identity &amp; Continue
              </motion.button>
            )}
            {checkout === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: method === 'card' ? 'rgba(20,52,203,0.08)' : 'rgba(0,0,0,0.05)', border: `1px solid ${method === 'card' ? 'rgba(20,52,203,0.2)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${method === 'card' ? 'rgba(20,52,203,0.2)' : 'rgba(0,0,0,0.1)'}`, borderTopColor: method === 'card' ? '#1434CB' : '#374151' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: method === 'card' ? '#1434CB' : '#374151' }}>
                  {method === 'card' ? 'Authorizing payment…' : 'Routing to ERP…'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <p style={{ textAlign: 'center', fontSize: 10, color: '#aaa', marginTop: 10, fontFamily: 'monospace' }}>
            {method === 'card'
              ? `Visa Commercial Card · spend-controls enforced · $${POLICY_THRESHOLD.toLocaleString()} threshold`
              : 'Oracle Suite · SAP · Manual PO approval required'}
          </p>
        </div>
      )}
    </motion.div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PettyCashPage() {
  const [query, setQuery]                     = useState('');
  const [category, setCategory]               = useState<Category | 'All'>('All');
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]               = useState(false);
  const [showPolicy, setShowPolicy]           = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const lastQueryRef                          = useRef('');

  // Show the policy overlay only on a hard refresh (Ctrl/Cmd+R) of this page,
  // not on in-app navigation.
  useEffect(() => {
    if (wasPageRefreshed()) setShowPolicy(true);
  }, []);

  const filtered = useMemo(() => {
    let list = PRODUCTS;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category !== 'All') list = list.filter((p) => p.category === category);
    return list;
  }, [query, category]);

  function handleSearch(val: string) {
    setQuery(val);
    lastQueryRef.current = val;
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <AnimatePresence>
        {showPolicy && <PolicyOverlay onDone={() => setShowPolicy(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <ProductLightbox
            product={selectedProduct}
            inCart={cart.find((i) => i.product.id === selectedProduct.id)?.qty ?? 0}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={() => addToCart(selectedProduct)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <motion.div key="cart-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.2)' }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cartOpen && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onQtyChange={changeQty} onRemove={removeItem} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#000', marginBottom: 4 }}>Petty Cash Purchases</h1>
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>
              Agency card purchases up to{' '}
              <span style={{ fontWeight: 700, color: '#1434CB' }}>${POLICY_THRESHOLD.toLocaleString()} USD</span>
              {' '}per item — Visa policy enforced
            </p>
          </div>
          <motion.button onClick={() => setCartOpen(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, background: '#1434CB', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            <ShoppingCart size={16} />Cart
            {cartCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ position: 'absolute', top: -6, right: -6, background: '#de3730', color: 'white', fontSize: 9, fontWeight: 800, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                {cartCount > 9 ? '9+' : cartCount}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Search + category filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a4a4a', pointerEvents: 'none' }} />
            <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Search products…"
              style={{ width: '100%', paddingLeft: 36, paddingRight: query ? 36 : 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, background: 'white', color: '#000', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1434CB'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
            />
            {query && (
              <button onClick={() => handleSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a4a', display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['All', ...CATEGORIES] as const).map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: category === cat ? '#1434CB' : '#F5F5F5', color: category === cat ? 'white' : '#4a4a4a' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#4a4a4a' }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
          {query.trim() && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(20,52,203,0.08)', color: '#1434CB' }}>
              Policy: all items ≤ $5,000 ✓
            </span>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>No products match your search</p>
            <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 4 }}>Try different keywords or clear the filters</p>
            <button onClick={() => { setQuery(''); setCategory('All'); }}
              style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: '#1434CB', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear filters
            </button>
          </motion.div>
        ) : (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => {
                const catStyle = CATEGORY_COLORS[product.category];
                const inCart   = cart.find((i) => i.product.id === product.id);

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.93 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      background: 'white', borderRadius: 14,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex', flexDirection: 'column',
                      cursor: 'pointer', overflow: 'hidden',
                    }}
                    whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderColor: 'rgba(20,52,203,0.2)' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: '100%', height: 110, flexShrink: 0 }}>
                      <ProductThumbnail variant={product.thumbVariant} category={product.category} />
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: catStyle.bg, color: catStyle.text, flexShrink: 0 }}>
                          {product.category}
                        </span>
                        <span style={{ fontSize: 9, color: '#aaa', fontFamily: 'monospace', flexShrink: 0 }}>{product.sku}</span>
                      </div>

                      <p style={{ fontSize: 13, fontWeight: 600, color: '#000', lineHeight: 1.35 }}>{product.name}</p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 800, color: '#1434CB' }}>${product.price.toFixed(2)}</p>
                          <p style={{ fontSize: 10, color: '#aaa' }}>per {product.unit}</p>
                        </div>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          style={{
                            background: inCart ? '#e8eeff' : '#1434CB',
                            color: inCart ? '#1434CB' : 'white',
                            border: inCart ? '1px solid rgba(20,52,203,0.3)' : 'none',
                            borderRadius: 8, padding: '7px 12px',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          {inCart ? <><Plus size={11} />Add ({inCart.qty})</> : <><ShoppingCart size={11} />Add to Cart</>}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
