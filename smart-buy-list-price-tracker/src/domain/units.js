/* =========================================================================
       1. DOMAIN CONSTANTS & CONVERSION FACTORS
       ========================================================================= */
const DIMENSIONS = {
  MASS: "MASS",
  VOLUME: "VOLUME",
  COUNT: "COUNT",
};

const UNIT_CONVERSIONS = {
  // MASS (Base: kg)
  kg: { dimension: DIMENSIONS.MASS, baseUnit: "kg", multiplier: 1.0 },
  g: { dimension: DIMENSIONS.MASS, baseUnit: "kg", multiplier: 0.001 },
  lb: {
    dimension: DIMENSIONS.MASS,
    baseUnit: "kg",
    multiplier: 0.453592,
  },
  oz: {
    dimension: DIMENSIONS.MASS,
    baseUnit: "kg",
    multiplier: 0.0283495,
  },
  // VOLUME (Base: l)
  l: { dimension: DIMENSIONS.VOLUME, baseUnit: "l", multiplier: 1.0 },
  ml: { dimension: DIMENSIONS.VOLUME, baseUnit: "l", multiplier: 0.001 },
  gal: {
    dimension: DIMENSIONS.VOLUME,
    baseUnit: "l",
    multiplier: 3.78541,
  },
  fl_oz: {
    dimension: DIMENSIONS.VOLUME,
    baseUnit: "l",
    multiplier: 0.0295735,
  },
  // COUNT (Base: ea)
  ea: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  pk: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  box: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  can: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  bunch: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  loc: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  thung: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  khay: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  tui: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
  hu: { dimension: DIMENSIONS.COUNT, baseUnit: "ea", multiplier: 1.0 },
};

const UNIT_GROUPS = [
  {
    key: "weight",
    en: "Weight",
    vi: "Khối Lượng",
    units: [
      { key: "kg", en: "kg (Kilogram)", vi: "kg (Kilôgam)" },
      { key: "g", en: "g (Gram)", vi: "g (Gam)" },
      { key: "lb", en: "lb (Pound)", vi: "lb (Pound)" },
      { key: "oz", en: "oz (Ounce)", vi: "oz (Ounce)" },
    ],
  },
  {
    key: "volume",
    en: "Volume",
    vi: "Thể Tích",
    units: [
      { key: "L", en: "L (Litre)", vi: "L (Lít)" },
      { key: "ml", en: "ml (Millilitre)", vi: "ml (Mililít)" },
      { key: "gal", en: "gal (Gallon)", vi: "gal (Gallon)" },
      { key: "fl oz", en: "fl oz (Fl Ounce)", vi: "fl oz (Fl Ounce)" },
    ],
  },
  {
    key: "count",
    en: "Count / Units",
    vi: "Số Lượng / Đơn Vị",
    units: [
      { key: "ea", en: "ea (Piece / Unit)", vi: "ea (Cái / Quả / Trái)" },
      { key: "pk", en: "pk (Pack)", vi: "pk (Gói / Bịch)" },
      { key: "box", en: "box (Box)", vi: "box (Hộp)" },
      { key: "can", en: "can (Can / Bottle)", vi: "can (Lon / Chai)" },
      { key: "bunch", en: "bunch (Bunch)", vi: "bunch (Bó / Nải)" },
      { key: "loc", en: "loc (Pack of 4/6)", vi: "loc (Lốc 4/6)" },
      {
        key: "thung",
        en: "thung (Carton / Case)",
        vi: "thung (Thùng / Két)",
      },
      { key: "khay", en: "khay (Tray)", vi: "khay (Khay)" },
      { key: "tui", en: "tui (Bag)", vi: "tui (Túi)" },
      { key: "hu", en: "hu (Jar / Pot)", vi: "hu (Hũ / Lọ)" },
    ],
  },
];

const CATEGORIES = {
  produce: {
    en: "Produce & Fruits",
    vi: "Rau Củ & Trái Cây",
    icon: "🥦",
  },
  dairy_eggs: {
    en: "Dairy & Eggs",
    vi: "Sữa, Trứng & Phô Mai",
    icon: "🥛",
  },
  meat_seafood: {
    en: "Meat & Seafood",
    vi: "Thịt & Hải Sản Tươi Sống",
    icon: "🥩",
  },
  bakery: { en: "Bakery & Bread", vi: "Bánh Mì & Bánh Ngọt", icon: "🍞" },
  pantry: {
    en: "Pantry & Grains",
    vi: "Gia Vị, Gạo & Đồ Khô",
    icon: "🍚",
  },
  frozen: { en: "Frozen Foods", vi: "Thực Phẩm Đông Lạnh", icon: "🧊" },
  beverages: {
    en: "Beverages & Coffee",
    vi: "Đồ Uống & Cà Phê",
    icon: "☕",
  },
  household: {
    en: "Household & Cleaning",
    vi: "Đồ Gia Dụng & Tẩy Rửa",
    icon: "🧹",
  },
  personal_care: {
    en: "Personal Care",
    vi: "Chăm Sóc Cá Nhân",
    icon: "🧴",
  },
  other: { en: "Other Items", vi: "Mục Khác", icon: "📦" },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DIMENSIONS, UNIT_CONVERSIONS, UNIT_GROUPS, CATEGORIES };
}
