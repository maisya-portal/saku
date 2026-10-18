// Initial Seed Data for Maisya-Saku (Ma'had Imam Syafi'i Brebes)

export const INITIAL_PESANTREN_INFO = {
  name: "Ma'had Imam Syafi'i Brebes",
  tagline: "Mencetak Generasi Rabbani Berdasarkan Al-Qur'an dan Sunnah",
  address: "Jalan Terusan Islamic Center Sigempol KM 03 Limbangan Wetan Brebes",
  phone: "082119836050",
  whatsappAdmin: "6282119836050",
  staffGatePin: "991588",
  appBaseUrl: "https://isb-portal.web.app/",
  rekeningUangSaku: {
    bank: "Bank Syariah Indonesia (BSI)",
    accountNo: "5221717173",
    accountHolder: "Ponpes Imam Syafii Brebes",
    code: "451",
    purpose: "Uang Saku, Jajan Kantin, Laundry, Wartel & Tarik Tunai",
    contactName: "Ustadz Firdhi",
    contactWa: "6281949682554",
    waRaw: "081949682554"
  },
  rekeningSPP: {
    bank: "Bank Syariah Indonesia (BSI)",
    accountNo: "6469965840",
    accountHolder: "Yayasan Pendidikan Imam Syafi'i Brebes",
    code: "451",
    purpose: "Pembayaran SPP & Tagihan Pendidikan",
    contactName: "Bapak Imawan",
    contactWa: "62818275720",
    waRaw: "0818275720"
  },
  bankAccounts: [
    {
      bank: "Bank Syariah Indonesia (BSI)",
      accountNo: "5221717173",
      accountHolder: "Ponpes Imam Syafii Brebes",
      code: "451",
      category: "uang_saku",
      label: "Rekening Uang Saku Santri",
      purpose: "Jajan, Laundry, Wartel & Tarik Tunai",
      contactName: "Ustadz Firdhi",
      contactWa: "6281949682554"
    },
    {
      bank: "Bank Syariah Indonesia (BSI)",
      accountNo: "6469965840",
      accountHolder: "Yayasan Pendidikan Imam Syafi'i Brebes",
      code: "451",
      category: "spp",
      label: "Rekening SPP & Syahriyah",
      purpose: "Pembayaran SPP & Biaya Pendidikan",
      contactName: "Bapak Imawan",
      contactWa: "62818275720"
    }
  ]
};

export const INITIAL_SANTRI = [];

export const INITIAL_KANTIN_PRODUCTS = [
  {
    id: "prod-001",
    name: "Roti Sisir Mentega Manis",
    category: "Makanan & Roti",
    price: 4000,
    stock: 45,
    unit: "bungkus",
    barcode: "8991001",
    isAvailable: true,
    image: "🍞"
  },
  {
    id: "prod-002",
    name: "Susu Kurma UHT Segar 200ml",
    category: "Minuman Dingin",
    price: 6000,
    stock: 30,
    unit: "kotak",
    barcode: "8991002",
    isAvailable: true,
    image: "🥛"
  },
  {
    id: "prod-003",
    name: "Air Mineral Santri 600ml",
    category: "Minuman Dingin",
    price: 3000,
    stock: 80,
    unit: "botol",
    barcode: "8991003",
    isAvailable: true,
    image: "💧"
  },
  {
    id: "prod-004",
    name: "Nasi Uduk Ayam Suwir Komplit",
    category: "Makanan Berat",
    price: 12000,
    stock: 25,
    unit: "porsi",
    barcode: "8991004",
    isAvailable: true,
    image: "🍱"
  },
  {
    id: "prod-005",
    name: "Buku Tulis Khath Arab 38 Lembar",
    category: "Alat Tulis & Kitab",
    price: 5000,
    stock: 50,
    unit: "buku",
    barcode: "8991005",
    isAvailable: true,
    image: "📓"
  },
  {
    id: "prod-006",
    name: "Pulpen Gel Hitam 0.5mm",
    category: "Alat Tulis & Kitab",
    price: 3500,
    stock: 65,
    unit: "buah",
    barcode: "8991006",
    isAvailable: true,
    image: "🖊️"
  },
  {
    id: "prod-007",
    name: "Sabun Mandi Herbal Zaitun",
    category: "Perlengkapan Santri",
    price: 4500,
    stock: 32,
    unit: "batang",
    barcode: "8991007",
    isAvailable: true,
    image: "🧼"
  },
  {
    id: "prod-008",
    name: "Siwak Zaitun Al-Khair Asli",
    category: "Perlengkapan Santri",
    price: 7000,
    stock: 28,
    unit: "batang",
    barcode: "8991008",
    isAvailable: true,
    image: "🌿"
  },
  {
    id: "prod-009",
    name: "Minyak Wangi Non-Alkohol Kasturi",
    category: "Perlengkapan Santri",
    price: 15000,
    stock: 14,
    unit: "botol roll-on",
    barcode: "8991009",
    isAvailable: true,
    image: "🧪"
  },
  {
    id: "prod-010",
    name: "Kurma Sukari Premium 250gr",
    category: "Makanan & Roti",
    price: 25000,
    stock: 18,
    unit: "box",
    barcode: "8991010",
    isAvailable: true,
    image: "🌴"
  }
];

export const INITIAL_LAUNDRY_SERVICES = [
  {
    id: "lnd-001",
    name: "Cuci + Setrika Wangi Reguler",
    type: "per_kg",
    price: 6000,
    unit: "Kg",
    duration: "2 Hari",
    description: "Pakaian harian dicuci bersih, disetrika rapi dan diberi pewangi segar khusus santri."
  },
  {
    id: "lnd-002",
    name: "Cuci Kering Lipat Express",
    type: "per_kg",
    price: 4500,
    unit: "Kg",
    duration: "1 Hari",
    description: "Pakaian dicuci bersih dan dikeringkan serta dilipat rapi."
  },
  {
    id: "lnd-003",
    name: "Cuci Jubah & Gamis Putih Khusus",
    type: "per_pcs",
    price: 8000,
    unit: "Pcs",
    duration: "2 Hari",
    description: "Perawatan khusus jubah agar serat kain terjaga dan tetap putih cemerlang."
  },
  {
    id: "lnd-004",
    name: "Cuci Selimut / Bedcover Santri",
    type: "per_pcs",
    price: 15000,
    unit: "Pcs",
    duration: "2-3 Hari",
    description: "Pencucian selimut tebal dan sprei kasur asrama santri."
  }
];

export const INITIAL_WARTEL_BOOTHS = [
  {
    id: "booth-1",
    name: "Bilik Telepon 01 (Asrama Abu Bakar)",
    status: "READY", // 'READY' | 'IN_USE'
    ratePerMinute: 1000
  },
  {
    id: "booth-2",
    name: "Bilik Telepon 02 (Asrama Umar)",
    status: "READY",
    ratePerMinute: 1000
  },
  {
    id: "booth-3",
    name: "Bilik Telepon 03 (Kantor Wartel Utama)",
    status: "READY",
    ratePerMinute: 1000
  }
];

export const INITIAL_SPP_TAGIHAN = [];

export const INITIAL_TRANSACTIONS = [];

export const INITIAL_TOPUP_REQUESTS = [];

export const INITIAL_ROLE_ACCOUNTS = [
  {
    id: "role-admin",
    role: "admin",
    name: "Super Admin Keuangan Ma'had",
    title: "Administrator & Bendahara Utama",
    token: "admin-isb-2026",
    pin: "123456",
    phone: "081234567890",
    biometricRegistered: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
  },
  {
    id: "role-kantin",
    role: "kantin",
    name: "Akhi Rian (Kasir Kantin)",
    title: "Petugas Kasir Kantin Santri",
    token: "kantin-isb-2026",
    pin: "112233",
    phone: "081234567894",
    biometricRegistered: true,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
  },
  {
    id: "role-laundry",
    role: "laundry",
    name: "Ummu Maryam (Petugas Laundry)",
    title: "Petugas Laundry Pesantren",
    token: "laundry-isb-2026",
    pin: "223344",
    phone: "081234567895",
    biometricRegistered: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
  },
  {
    id: "role-wartel",
    role: "wartel",
    name: "Akhi Ridwan (Operator Wartel)",
    title: "Petugas Wartel Santri",
    token: "wartel-isb-2026",
    pin: "334455",
    phone: "081234567896",
    biometricRegistered: true,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
  },
  {
    id: "role-spp",
    role: "spp",
    name: "Ust. Zulkifli (Kasir Syahriyah)",
    title: "Kasir SPP & Tagihan Pesantren",
    token: "spp-isb-2026",
    pin: "445566",
    phone: "081234567897",
    biometricRegistered: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: "role-kiosk",
    role: "kiosk",
    name: "Kiosk Anjungan Mandiri",
    title: "Anjungan Cek Saldo Santri",
    token: "kiosk-isb-2026",
    pin: "000000",
    phone: "",
    biometricRegistered: false,
    avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150"
  }
];
