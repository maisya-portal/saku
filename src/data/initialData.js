// Initial Seed Data for Maisya-Saku (Ma'had Imam Syafi'i Brebes)

export const INITIAL_PESANTREN_INFO = {
  name: "Ma'had Imam Syafi'i Brebes",
  tagline: "Mencetak Generasi Rabbani Berdasarkan Al-Qur'an dan Sunnah",
  address: "Jl. Raya Jatibarang - Brebes No. 12, Jawa Tengah",
  phone: "0812-3456-7890",
  whatsappAdmin: "6281234567890",
  bankAccounts: [
    {
      bank: "Bank Syariah Indonesia (BSI)",
      accountNo: "7198-2345-67",
      accountHolder: "Ponpes Imam Syafi'i Brebes (Keuangan Santri)",
      code: "451",
      icon: "bsi"
    },
    {
      bank: "Bank Muamalat",
      accountNo: "541-0089-1234",
      accountHolder: "Yayasan Imam Syafi'i Brebes",
      code: "147",
      icon: "muamalat"
    }
  ]
};

export const INITIAL_SANTRI = [
  {
    id: "santri-001",
    nis: "202401001",
    name: "Muhammad Al-Fatih",
    class: "Kelas 8A - Tahfizh",
    halaqah: "Ust. Zulkifli, Lc.",
    room: "Kamar Abu Bakar 02",
    rfidTag: "RFID-881920",
    barcode: "ISB202401001",
    balance: 185000,
    parentName: "H. Bambang Irawan",
    parentPhone: "081234567891",
    parentToken: "wali-fatih",
    spendingLimit: {
      type: "daily", // 'none' | 'daily' | 'weekly' | 'monthly'
      amount: 25000,
      active: true
    },
    spendingUsed: {
      daily: 8000,
      weekly: 45000,
      monthly: 120000,
      lastResetDate: new Date().toISOString().split('T')[0]
    },
    pin: "1234",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "santri-002",
    nis: "202401002",
    name: "Abdullah bin Umar",
    class: "Kelas 7B - Mutawassith",
    halaqah: "Ust. Abdullah Amin, M.Pd.",
    room: "Kamar Umar bin Khattab 01",
    rfidTag: "RFID-992831",
    barcode: "ISB202401002",
    balance: 92000,
    parentName: "dr. Hendra Pratama",
    parentPhone: "081234567892",
    parentToken: "wali-hendra", // Has 2 children (Abdullah & Hamzah)
    spendingLimit: {
      type: "daily",
      amount: 20000,
      active: true
    },
    spendingUsed: {
      daily: 15000,
      weekly: 62000,
      monthly: 180000,
      lastResetDate: new Date().toISOString().split('T')[0]
    },
    pin: "2468",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "santri-003",
    nis: "202401003",
    name: "Hamzah bin Hendra",
    class: "Kelas 9A - 'Aliyah",
    halaqah: "Ust. Manshur, Lc.",
    room: "Kamar Utsman bin Affan 04",
    rfidTag: "RFID-771239",
    barcode: "ISB202401003",
    balance: 245000,
    parentName: "dr. Hendra Pratama",
    parentPhone: "081234567892",
    parentToken: "wali-hendra", // Sibling of Abdullah
    spendingLimit: {
      type: "weekly",
      amount: 150000,
      active: true
    },
    spendingUsed: {
      daily: 5000,
      weekly: 40000,
      monthly: 110000,
      lastResetDate: new Date().toISOString().split('T')[0]
    },
    pin: "1357",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "santri-004",
    nis: "202401004",
    name: "Zaid bin Tsabit",
    class: "Kelas 7A - Tahfizh",
    halaqah: "Ust. Farhan Az-Zuhri",
    room: "Kamar Ali bin Abi Thalib 03",
    rfidTag: "RFID-445566",
    barcode: "ISB202401004",
    balance: 55000,
    parentName: "H. Ahmad Fauzi",
    parentPhone: "081234567893",
    parentToken: "wali-fauzi",
    spendingLimit: {
      type: "daily",
      amount: 15000,
      active: true
    },
    spendingUsed: {
      daily: 12000,
      weekly: 75000,
      monthly: 160000,
      lastResetDate: new Date().toISOString().split('T')[0]
    },
    pin: "9876",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  }
];

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

export const INITIAL_SPP_TAGIHAN = [
  {
    id: "spp-001",
    santriNis: "202401001",
    monthYear: "Oktober 2026",
    title: "SPP Syahriyah Pesantren - Oktober 2026",
    amount: 750000,
    status: "UNPAID",
    dueDate: "2026-10-20"
  },
  {
    id: "spp-002",
    santriNis: "202401002",
    monthYear: "Oktober 2026",
    title: "SPP Syahriyah Pesantren - Oktober 2026",
    amount: 750000,
    status: "PAID",
    paidAt: "2026-10-05T09:30:00Z"
  },
  {
    id: "ekstra-001",
    santriNis: "202401001",
    monthYear: "Semester Ganjil",
    title: "Ekstrakurikuler Memanah Sunnah",
    amount: 150000,
    status: "UNPAID",
    dueDate: "2026-10-25"
  },
  {
    id: "ekstra-002",
    santriNis: "202401003",
    monthYear: "Semester Ganjil",
    title: "Ekstrakurikuler Bela Diri Tapak Suci",
    amount: 100000,
    status: "PAID",
    paidAt: "2026-10-02T14:15:00Z"
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: "trx-101",
    santriId: "santri-001",
    santriNis: "202401001",
    santriName: "Muhammad Al-Fatih",
    type: "DEPOSIT",
    categoryLabel: "Setoran Uang Saku",
    amount: 200000,
    previousBalance: 0,
    currentBalance: 200000,
    note: "Transfer Bank BSI - Disetujui Bendahara",
    cashierRole: "Bendahara Pesantren",
    cashierName: "Ust. Ahmad Syaifullah, S.E.",
    verificationMethod: "TRANSFER_CONFIRMED",
    timestamp: "2026-10-12T08:15:00Z"
  },
  {
    id: "trx-102",
    santriId: "santri-001",
    santriNis: "202401001",
    santriName: "Muhammad Al-Fatih",
    type: "PURCHASE_KANTIN",
    categoryLabel: "Kantin Ma'had",
    amount: 7000,
    previousBalance: 200000,
    currentBalance: 193000,
    items: [
      { name: "Roti Sisir Mentega Manis", price: 4000, qty: 1, subtotal: 4000 },
      { name: "Air Mineral Santri 600ml", price: 3000, qty: 1, subtotal: 3000 }
    ],
    note: "Belanja snack istirahat sore",
    cashierRole: "Petugas Kantin",
    cashierName: "Akhi Rian",
    verificationMethod: "RFID",
    timestamp: "2026-10-13T16:20:00Z"
  },
  {
    id: "trx-103",
    santriId: "santri-001",
    santriNis: "202401001",
    santriName: "Muhammad Al-Fatih",
    type: "TELPON",
    categoryLabel: "Wartel Santri",
    amount: 8000,
    previousBalance: 193000,
    currentBalance: 185000,
    durationMinutes: 8,
    note: "Telepon Umi & Abi (8 menit)",
    cashierRole: "Petugas Wartel",
    cashierName: "Akhi Ridwan",
    verificationMethod: "FINGERPRINT_TOUCH",
    timestamp: "2026-10-14T09:45:00Z"
  },
  {
    id: "trx-104",
    santriId: "santri-002",
    santriNis: "202401002",
    santriName: "Abdullah bin Umar",
    type: "LAUNDRY",
    categoryLabel: "Laundry Pesantren",
    amount: 18000,
    previousBalance: 110000,
    currentBalance: 92000,
    weightKg: 3,
    note: "Cuci + Setrika Wangi (3 Kg)",
    cashierRole: "Petugas Laundry",
    cashierName: "Ibu Maryam",
    verificationMethod: "BARCODE",
    timestamp: "2026-10-14T11:10:00Z"
  }
];

export const INITIAL_TOPUP_REQUESTS = [
  {
    id: "topup-001",
    santriId: "santri-001",
    santriNis: "202401001",
    santriName: "Muhammad Al-Fatih",
    parentName: "H. Bambang Irawan",
    parentPhone: "081234567891",
    bankTarget: "Bank Syariah Indonesia (BSI)",
    amount: 100000,
    uniqueCode: 321,
    totalTransfer: 100321,
    proofImageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
    status: "PENDING", // 'PENDING' | 'APPROVED' | 'REJECTED'
    note: "Uang saku pekan ke-3 Oktober",
    createdAt: "2026-10-14T13:30:00Z"
  }
];
