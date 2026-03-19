// ── guzzl.pro Physical QR Products ──

export interface QRProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  image?: string;
  popular?: boolean;
}

export const QR_PRODUCTS: QRProduct[] = [
  {
    id: "qr-metal-plate",
    name: "QR Metal Plate",
    description: "Laser-engraved aluminum plate with your unique QR code. Mount anywhere.",
    price: 39,
    features: [
      "Brushed aluminum finish",
      "Laser-engraved QR code",
      "Links to your guzzl.pro card",
      "Weather-resistant",
      "Mounting hardware included",
    ],
  },
  {
    id: "nfc-business-card",
    name: "NFC Business Card",
    description: "Premium PVC card with embedded NFC chip. Tap to share instantly.",
    price: 49,
    popular: true,
    features: [
      "Premium PVC material",
      "Embedded NFC chip",
      "Custom printed design",
      "QR code backup",
      "Tap-to-share technology",
    ],
  },
  {
    id: "jobsite-sign",
    name: "Jobsite QR Sign",
    description: "Durable outdoor sign with trackable QR code. Perfect for contractors.",
    price: 79,
    features: [
      "18\" x 24\" corrugated plastic",
      "UV-resistant printing",
      "Large scannable QR code",
      "Tracks scans by location",
      "Stake or hang mount",
    ],
  },
  {
    id: "truck-sticker",
    name: "Truck QR Sticker",
    description: "Vinyl decal QR code for vehicles. Turn your truck into a lead machine.",
    price: 29,
    features: [
      "Premium vinyl material",
      "Weather & wash resistant",
      "Easy apply & remove",
      "Multiple sizes available",
      "Trackable scans",
    ],
  },
];
