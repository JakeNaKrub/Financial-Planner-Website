import type { ExpenseIcon } from "./demo-data";

export type ExpenseCategory =
  | {
      category: "Food" | "Transport" | "Attraction" | "Shopping" | "Other";
      icon: ExpenseIcon;
    };

type CategoryName = ExpenseCategory["category"];
export const expenseCategoryNames: CategoryName[] = [
  "Food",
  "Transport",
  "Attraction",
  "Shopping",
  "Other",
];

const categoryInfo: Record<CategoryName, ExpenseCategory> = {
  Food: { category: "Food", icon: "food" },
  Transport: { category: "Transport", icon: "train" },
  Attraction: { category: "Attraction", icon: "attraction" },
  Shopping: { category: "Shopping", icon: "shop" },
  Other: { category: "Other", icon: "other" },
};
export function getExpenseCategoryInfo(category: CategoryName): ExpenseCategory {
  return categoryInfo[category];
}

/**
 * Strong phrases are worth more points than individual words.
 * This helps distinguish things like:
 *
 * "train ticket"      -> Transport
 * "museum ticket"     -> Attraction
 * "souvenir shop"     -> Shopping
 * "supermarket food"  -> Food
 */
const categoryRules: Record<
  CategoryName,
  Array<{ pattern: RegExp; weight: number }>
> = {
  Food: [
    // Strong compound phrases
    { pattern: /food|food bill|food expense|food ingredients/i, weight: 10 },
    { pattern: /breakfast|brunch|lunch|dinner|supper/i, weight: 10 },
    { pattern: /restaurant|resto|dining|meal/i, weight: 10 },
    { pattern: /ice cream|gelato|dessert/i, weight: 10 },
    { pattern: /french fries|fries|waffle|pizza|pasta|lasagna/i, weight: 10 },
    { pattern: /coffee|café|cafe|tea|drink|beverage/i, weight: 9 },
    { pattern: /cake|donut|doughnut|cookie|chocolate/i, weight: 9 },
    { pattern: /ingredients|groceries|grocery|fruit/i, weight: 9 },
    { pattern: /fast food|takeaway|takeout|delivery/i, weight: 9 },

    // Brands / specific food places
    { pattern: /kfc|mcdonald|starbucks/i, weight: 8 },

    // Thai
    {
      pattern:
        /ข้าว|น้ำ|กาแฟ|ชา|เครื่องดื่ม|อาหาร|อาหารเช้า|อาหารกลางวัน|อาหารเที่ยง|อาหารเย็น|มื้อเย็น|ของกิน|ขนม|ของหวาน|เค้ก|โดนัท|ไอศกรีม|เจลาโต้|วาฟเฟิล|เฟรนฟราย|พิซซ่า|พาสต้า|ลาซานญ่า|ผลไม้|วัตถุดิบ|วัตถุดิบอาหาร|ทำอาหาร|ร้านอาหาร/i,
      weight: 10,
    },
  ],

  Transport: [
    // Strong phrases
    { pattern: /train ticket|rail ticket|รถไฟ|ตั๋วรถไฟ/i, weight: 12 },
    { pattern: /metro|subway|underground|tube|รถไฟใต้ดิน/i, weight: 12 },
    { pattern: /tram|รถราง/i, weight: 12 },
    { pattern: /taxi|cab|uber|bolt|แท็กซี่/i, weight: 12 },
    { pattern: /bus|coach|shuttle|รถบัส|รถเมล์/i, weight: 12 },
    { pattern: /flight|airline|เที่ยวบิน/i, weight: 12 },
    { pattern: /ferry|boat|เรือข้ามฟาก/i, weight: 12 },

    // Transport concepts
    { pattern: /transport|transit|public transport/i, weight: 10 },
    { pattern: /travel pass|transport pass|transit pass/i, weight: 10 },
    { pattern: /fare|ค่าโดยสาร|ค่าเดินทาง/i, weight: 9 },
    { pattern: /railway|rail|station|สถานี/i, weight: 8 },
    { pattern: /airport transfer|transfer/i, weight: 8 },
    { pattern: /parking|ที่จอดรถ/i, weight: 8 },
    { pattern: /toll|ทางด่วน/i, weight: 8 },

    // Bikes / scooters
    { pattern: /bike rental|bicycle rental|จักรยานเช่า/i, weight: 11 },
    { pattern: /scooter|e-scooter/i, weight: 10 },
    { pattern: /จักรยาน|bicycle/i, weight: 7 },

    // Important: "bike ride" is ambiguous.
    // Keep it Transport unless there is an explicit attraction/activity signal.
    { pattern: /bike ride|cycling|ปั่นจักรยาน/i, weight: 6 },
  ],

  Attraction: [
    // Strong attraction phrases
    { pattern: /museum|museums|พิพิธภัณฑ์/i, weight: 12 },
    { pattern: /museum admission|museum entry/i, weight: 14 },
    { pattern: /admission|entrance fee|entry fee/i, weight: 12 },
    { pattern: /attraction|attractions/i, weight: 11 },
    { pattern: /sightseeing|landmark/i, weight: 10 },
    { pattern: /tour|tour ticket|guided tour/i, weight: 10 },
    { pattern: /activity|activities/i, weight: 9 },
    { pattern: /gallery|exhibition|exhibit/i, weight: 10 },
    { pattern: /palace|castle|church|temple|zoo|aquarium/i, weight: 10 },
    { pattern: /theme park|amusement park/i, weight: 11 },

    // Thai
    {
      pattern:
        /ค่าเข้า|บัตรเข้า|ค่าเข้าชม|เข้าสถานที่|สถานที่ท่องเที่ยว|พิพิธภัณฑ์|แกลเลอรี|แกลลอรี่|หอศิลป์|พระราชวัง|ปราสาท|โบสถ์|วัด|สวนสนุก|สวนสัตว์|จุดชมวิว|แลนด์มาร์ก/i,
      weight: 12,
    },

    // Specific attractions
    { pattern: /louvre|van gogh|national museum/i, weight: 11 },
  ],

  Shopping: [
    // Strong shopping phrases
    { pattern: /shopping|shop|shopping mall|department store/i, weight: 10 },
    { pattern: /souvenir|souvenirs|ของที่ระลึก|ของฝาก/i, weight: 12 },
    { pattern: /keychain|พวงกุญแจ/i, weight: 12 },
    { pattern: /clothing|clothes|shirt|jacket|shoes|sneakers/i, weight: 10 },
    { pattern: /bag|กระเป๋า/i, weight: 9 },
    { pattern: /cosmetics|skincare|เครื่องสำอาง/i, weight: 10 },
    { pattern: /jewelry|เครื่องประดับ/i, weight: 10 },
    { pattern: /electronics|อุปกรณ์อิเล็กทรอนิกส์/i, weight: 10 },
    { pattern: /gift|gifts|present/i, weight: 9 },

    // Stores
    { pattern: /store|retail|purchase|purchased|bought/i, weight: 8 },
    { pattern: /market|mall|ห้าง|ตลาด|ร้านค้า/i, weight: 7 },
    { pattern: /ซื้อ|ซื้อของ|ช้อป|ช้อปปิ้ง/i, weight: 8 },

    // Supermarkets are ambiguous:
    // groceries -> Food
    // general shopping -> Shopping
    { pattern: /supermarket|ซูเปอร์มาร์เก็ต|ซูเปอร์/i, weight: 5 },
    { pattern: /LIDL/i, weight: 5 },
  ],

  Other: [
    // Accommodation
    { pattern: /hotel|hotels|โรงแรม/i, weight: 12 },
    { pattern: /hostel|airbnb|accommodation|lodging|ที่พัก/i, weight: 12 },

    // Taxes / fees
    { pattern: /city tax|tourist tax|ภาษีเมือง/i, weight: 12 },
    { pattern: /service charge|ค่าบริการ/i, weight: 9 },

    // Services / subscriptions
    { pattern: /canva|subscription|membership/i, weight: 10 },
    { pattern: /insurance|ประกัน/i, weight: 10 },
    { pattern: /visa|วีซ่า/i, weight: 10 },
    { pattern: /phone|โทรศัพท์|sim|esim|internet|wifi/i, weight: 9 },

    // Luggage / storage
    { pattern: /locker|luggage storage|storage|ฝากกระเป๋า/i, weight: 11 },

    // Tips / cigarettes
    { pattern: /tip|tips|gratuity|ทิป/i, weight: 10 },
    { pattern: /cigarette|cigarettes|บุหรี่/i, weight: 10 },
  ],
};

/**
 * Normalize text before matching.
 */
function normalizeTitle(title: string): string {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Explicit phrase overrides.
 *
 * These are useful when a title contains words belonging to
 * multiple categories.
 */
const overrides: Array<{
  pattern: RegExp;
  category: CategoryName;
}> = [
  // Food wins over supermarket/store terminology
  {
    pattern:
      /supermarket.*(food|groceries|grocery|ingredients)|(?:food|groceries|grocery|ingredients).*supermarket/i,
    category: "Food",
  },

  // Train tickets should never become Attraction because of "ticket"
  {
    pattern: /train.*ticket|ticket.*train|รถไฟ.*(ticket|ตั๋ว)|ตั๋ว.*รถไฟ/i,
    category: "Transport",
  },

  // Museum tickets are attractions
  {
    pattern:
      /(museum|พิพิธภัณฑ์).*(ticket|admission|entry)|(?:ticket|admission|entry).*(museum|พิพิธภัณฑ์)/i,
    category: "Attraction",
  },

  // Souvenirs at attractions are still shopping
  {
    pattern:
      /(souvenir|keychain|ของที่ระลึก|พวงกุญแจ).*(louvre|museum|พิพิธภัณฑ์)|(?:louvre|museum|พิพิธภัณฑ์).*(souvenir|keychain|ของที่ระลึก|พวงกุญแจ)/i,
    category: "Shopping",
  },

  // Hotel tax belongs to Other, not Transport/Attraction
  {
    pattern: /(hotel|โรงแรม).*(tax|city tax|tourist tax|ภาษี)/i,
    category: "Other",
  },

  // Food-related bike activity is still transport unless explicitly an attraction
  {
    pattern: /bike ride|bicycle ride|จักรยาน|bicycle/i,
    category: "Transport",
  },
];

/**
 * Get the best category based on the highest score.
 */
export function detectExpenseCategory(title: string): ExpenseCategory {
  const normalizedTitle = normalizeTitle(title);

  // 1. Explicit overrides always win.
  for (const override of overrides) {
    if (override.pattern.test(normalizedTitle)) {
      return categoryInfo[override.category];
    }
  }

  // 2. Score every category.
  const scores: Record<CategoryName, number> = {
    Food: 0,
    Transport: 0,
    Attraction: 0,
    Shopping: 0,
    Other: 0,
  };

  for (const [category, rules] of Object.entries(categoryRules) as [
    CategoryName,
    Array<{ pattern: RegExp; weight: number }>
  ][]) {
    for (const rule of rules) {
      if (rule.pattern.test(normalizedTitle)) {
        scores[category] += rule.weight;
      }
    }
  }

  // 3. Pick the highest score.
  let bestCategory: CategoryName = "Other";
  let bestScore = 0;

  for (const category of Object.keys(scores) as CategoryName[]) {
    if (scores[category] > bestScore) {
      bestCategory = category;
      bestScore = scores[category];
    }
  }

  return categoryInfo[bestCategory];
}