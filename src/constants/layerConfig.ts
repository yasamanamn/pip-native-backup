import { LayerType } from "@prisma/client";

export interface LayerConfig {
  type: LayerType;
  name: string;
  description: string;
  category: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
}

export const LAYER_CONFIG: Record<LayerType, LayerConfig> = {
  AXE: {
    type: "AXE",
    name: "ابزار شکستن",
    description: "ابزارهای مورد نیاز برای شکستن سطوح در شرایط اضطراری",
    category: "تجهیزات ایمنی",
    visible: true,
    opacity: 1,
    zIndex: 10
  },
  CRANE_TRUCK: {
    type: "CRANE_TRUCK",
    name: "خودروی جرثقیل",
    description: "خودروهای مجهز به جرثقیل برای عملیات بلند کردن و جابجایی",
    category: "خودروهای سنگین",
    visible: true,
    opacity: 1,
    zIndex: 15
  },
  ELECTRICAL_BOX: {
    type: "ELECTRICAL_BOX",
    name: "جعبه تقسیم برق",
    description: "مراکز توزیع و کنترل برق در ساختمان",
    category: "تأسیسات برقی",
    visible: true,
    opacity: 1,
    zIndex: 8
  },
  ELECTRICAL_POST: {
    type: "ELECTRICAL_POST",
    name: "پست برق",
    description: "پست‌های توزیع برق و تجهیزات وابسته",
    category: "تأسیسات برقی",
    visible: true,
    opacity: 1,
    zIndex: 8
  },
  ELEVATOR: {
    type: "ELEVATOR",
    name: "آسانسور",
    description: "سیستم‌های حمل و نقل عمودی در ساختمان",
    category: "تأسیسات ساختمان",
    visible: true,
    opacity: 1,
    zIndex: 5
  },
  EXIT: {
    type: "EXIT",
    name: "خروج اضطراری",
    description: "مسیرهای خروج اضطراری و درهای فرار",
    category: "ایمنی",
    visible: true,
    opacity: 1,
    zIndex: 20
  },
  FAN_TRUCK: {
    type: "FAN_TRUCK",
    name: "خودروی فن",
    description: "خودروهای مجهز به سیستم تهویه قوی",
    category: "خودروهای تخصصی",
    visible: true,
    opacity: 1,
    zIndex: 15
  },
  FIRE_EXTINGUISHER: {
    type: "FIRE_EXTINGUISHER",
    name: "کپسول اطفاء حریق",
    description: "کپسول‌های آتش‌نشانی و تجهیزات اطفاء حریق",
    category: "ایمنی",
    visible: true,
    opacity: 1,
    zIndex: 12
  },
  FIRST_AID: {
    type: "FIRST_AID",
    name: "کمک‌های اولیه",
    description: "مراکز کمک‌های اولیه و جعبه‌های امدادی",
    category: "ایمنی",
    visible: true,
    opacity: 1,
    zIndex: 12
  },
  GAS_CUTOFF: {
    type: "GAS_CUTOFF",
    name: "شیر قطع جریان گاز",
    description: "شیرهای اصلی قطع جریان گاز در شرایط اضطراری",
    category: "تأسیسات گازی",
    visible: true,
    opacity: 1,
    zIndex: 10
  },
  GAS_REDUCE: {
    type: "GAS_REDUCE",
    name: "ایستگاه تقلیل فشار گاز",
    description: "ایستگاه‌های کنترل و تقلیل فشار گاز",
    category: "تأسیسات گازی",
    visible: true,
    opacity: 1,
    zIndex: 8
  },
  GROUND_HYDRANT: {
    type: "GROUND_HYDRANT",
    name: "هیدرانت زمینی",
    description: "هیدرانت‌های نصب شده در سطح زمین",
    category: "آتش‌نشانی",
    visible: true,
    opacity: 1,
    zIndex: 6
  },
  HEAVY_TRUCK: {
    type: "HEAVY_TRUCK",
    name: "خودروی سنگین",
    description: "خودروهای سنگین برای حمل بار و تجهیزات",
    category: "خودروها",
    visible: true,
    opacity: 1,
    zIndex: 15
  },
  HOSE_REEL: {
    type: "HOSE_REEL",
    name: "هوزریل",
    description: "قرقره‌های شلنگ آتش‌نشانی",
    category: "آتش‌نشانی",
    visible: true,
    opacity: 1,
    zIndex: 7
  },
  LIGHT_TRUCK: {
    type: "LIGHT_TRUCK",
    name: "خودروی سبک",
    description: "خودروهای سبک برای حمل سریع تجهیزات",
    category: "خودروها",
    visible: true,
    opacity: 1,
    zIndex: 14
  },
  MSDS: {
    type: "MSDS",
    name: "محل ذخیره مواد خطرناک",
    description: "مراکز نگهداری مواد خطرناک و شیمیایی",
    category: "ایمنی",
    visible: true,
    opacity: 1,
    zIndex: 11
  },
  NOTE: {
    type: "NOTE",
    name: "یادداشت",
    description: "نقاط یادداشت و اطلاعات متنی",
    category: "اطلاعاتی",
    visible: true,
    opacity: 1,
    zIndex: 3
  },
  PICTURE: {
    type: "PICTURE",
    name: "تصویر",
    description: "تصاویر و مستندات بصری",
    category: "اطلاعاتی",
    visible: true,
    opacity: 1,
    zIndex: 3
  },
  POWER_LINE: {
    type: "POWER_LINE",
    name: "خط فشار قوی برق",
    description: "خطوط انتقال برق فشار قوی",
    category: "تأسیسات برقی",
    visible: true,
    opacity: 1,
    zIndex: 9
  },
  PUMP_CONNECTION: {
    type: "PUMP_CONNECTION",
    name: "اتصال پمپ آتش‌نشانی",
    description: "نقاط اتصال پمپ‌های آتش‌نشانی",
    category: "آتش‌نشانی",
    visible: true,
    opacity: 1,
    zIndex: 7
  },
  RISER: {
    type: "RISER",
    name: "رایزر",
    description: "لوله‌های عمودی و رایزرهای تأسیساتی",
    category: "تأسیسات",
    visible: true,
    opacity: 1,
    zIndex: 6
  },
  SAFE_PUBLIC: {
    type: "SAFE_PUBLIC",
    name: "محل تجمع امن",
    description: "مناطق تعیین شده برای تجمع امن در شرایط اضطراری",
    category: "ایمنی",
    visible: true,
    opacity: 1,
    zIndex: 20
  },
  SUPPORT_TRUCK: {
    type: "SUPPORT_TRUCK",
    name: "خودروی پشتیبان",
    description: "خودروهای پشتیبانی و خدمات",
    category: "خودروها",
    visible: true,
    opacity: 1,
    zIndex: 13
  },
  WALL_HYDRANT: {
    type: "WALL_HYDRANT",
    name: "هیدرانت دیواری",
    description: "هیدرانت‌های نصب شده روی دیوار",
    category: "آتش‌نشانی",
    visible: true,
    opacity: 1,
    zIndex: 6
  },
  WATER_CUTOFF: {
    type: "WATER_CUTOFF",
    name: "شیر قطع جریان آب",
    description: "شیرهای اصلی قطع جریان آب",
    category: "تأسیسات آبی",
    visible: true,
    opacity: 1,
    zIndex: 10
  }
};

export const LAYER_CATEGORIES = [
  "ایمنی",
  "خودروها", 
  "خودروهای سنگین",
  "خودروهای تخصصی",
  "تأسیسات برقی",
  "تأسیسات گازی",
  "تأسیسات آبی",
  "تأسیسات ساختمان",
  "تأسیسات",
  "آتش‌نشانی",
  "اطلاعاتی",
  "تجهیزات ایمنی"
] as const;

export type LayerCategory = typeof LAYER_CATEGORIES[number];
