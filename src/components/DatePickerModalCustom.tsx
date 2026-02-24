import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Platform,
} from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import jalaali from "jalaali-js";

I18nManager.forceRTL(true);


interface PersianDate {
  jy: number;
  jm: number;
  jd: number;
}

interface DatePickerModalCustomProps {
  label?: string;
  placeholder?: string;
  value?: Date | string | null;  
  onChange?: (date: Date | undefined) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: "single" | "range" | "multiple";
  disabled?: boolean;
}


const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toPersianNumerals(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function gregorianToJalali(date: Date): PersianDate {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    return { jy, jm, jd };
  }

  const { jy, jm, jd } = jalaali.toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return { jy, jm, jd };
}

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

function formatPersianDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "تاریخ نامعتبر";
  }
  const { jy, jm, jd } = gregorianToJalali(date);
  return `${toPersianNumerals(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toPersianNumerals(jy)}`;
}

function toValidDate(value: Date | string | null | undefined): Date {
  if (!value) return new Date();

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}


interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onSelectDate: (date: Date) => void;
}

function CalendarGrid({
  year,
  month,
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
}: CalendarGridProps) {
  const daysInMonth = jalaali.jalaaliMonthLength(year, month);

  const firstDayGregorian = jalaliToGregorian(year, month, 1);
  const rawDay = firstDayGregorian.getDay(); 
  const firstDayOffset = rawDay === 6 ? 0 : rawDay + 1;

  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day: number) => {
    if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) return false;
    const sel = gregorianToJalali(selectedDate);
    return sel.jy === year && sel.jm === month && sel.jd === day;
  };

  const isDisabled = (day: number) => {
    const d = jalaliToGregorian(year, month, day);
    if (minDate && minDate instanceof Date && !isNaN(minDate.getTime()) && d < minDate) return true;
    if (maxDate && maxDate instanceof Date && !isNaN(maxDate.getTime()) && d > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const today = gregorianToJalali(new Date());
    return today.jy === year && today.jm === month && today.jd === day;
  };

  return (
    <View style={styles.calendarGrid}>
      <View style={styles.weekdayRow}>
        {PERSIAN_WEEKDAYS.map((d, i) => (
          <View key={i} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, i === 6 && styles.fridayText]}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.daysContainer}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={styles.weekRow}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              const isFriday = col === 6;
              const selected = day !== null && isSelected(day);
              const disabled = day !== null && isDisabled(day);
              const today = day !== null && isToday(day);

              return (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.dayCell,
                    selected && styles.selectedDay,
                    today && !selected && styles.todayDay,
                  ]}
                  onPress={() => {
                    if (day && !disabled) {
                      onSelectDate(jalaliToGregorian(year, month, day));
                    }
                  }}
                  disabled={!day || disabled}
                  activeOpacity={0.7}
                >
                  {day !== null && (
                    <Text
                      style={[
                        styles.dayText,
                        isFriday && styles.fridayDayText,
                        selected && styles.selectedDayText,
                        disabled && styles.disabledDayText,
                        today && !selected && styles.todayDayText,
                      ]}
                    >
                      {toPersianNumerals(day)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}



export default function DatePickerModalCustom({
  label = "تاریخ",
  placeholder = "انتخاب تاریخ",
  value,
  onChange,
  minimumDate,
  maximumDate,
  disabled = false,
}: DatePickerModalCustomProps) {
  const [visible, setVisible] = useState(false);

  const validDate = toValidDate(value);

  const [currentJYear, setCurrentJYear] = useState(() => {
    const d = validDate;
    return gregorianToJalali(d).jy;
  });
  const [currentJMonth, setCurrentJMonth] = useState(() => {
    const d = validDate;
    return gregorianToJalali(d).jm;
  });
  const [internalDate, setInternalDate] = useState<Date | undefined>(
    value instanceof Date && !isNaN(value.getTime()) ? value : undefined
  );

  const open = () => {
    if (!disabled) {
      const d = internalDate ?? new Date();
      const jd = gregorianToJalali(d);
      setCurrentJYear(jd.jy);
      setCurrentJMonth(jd.jm);
      setVisible(true);
    }
  };

  const close = () => setVisible(false);

  const confirm = () => {
    onChange?.(internalDate);
    setVisible(false);
  };

  const goToPrevMonth = () => {
    if (currentJMonth === 1) {
      setCurrentJMonth(12);
      setCurrentJYear((y) => y - 1);
    } else {
      setCurrentJMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentJMonth === 12) {
      setCurrentJMonth(1);
      setCurrentJYear((y) => y + 1);
    } else {
      setCurrentJMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (date: Date) => {
    setInternalDate(date);
  };

  const displayValue = internalDate && internalDate instanceof Date && !isNaN(internalDate.getTime())
    ? formatPersianDate(internalDate)
    : undefined;

  return (
    <>
      <View style={styles.wrapper}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TouchableOpacity
          style={[styles.inputField, disabled && styles.inputFieldDisabled]}
          onPress={open}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.inputText,
              !displayValue && styles.placeholderText,
            ]}
          >
            {displayValue ?? placeholder}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {visible && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={close}
            activeOpacity={1}
          />
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>انتخاب تاریخ</Text>
              {internalDate && internalDate instanceof Date && !isNaN(internalDate.getTime()) && (
                <Text style={styles.selectedDateDisplay}>
                  {formatPersianDate(internalDate)}
                </Text>
              )}
            </View>

            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={goToNextMonth}
                style={styles.navButton}
              >
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>

              <View style={styles.monthTitleWrap}>
                <Text style={styles.monthTitle}>
                  {PERSIAN_MONTHS[currentJMonth - 1]}
                </Text>
                <Text style={styles.yearTitle}>
                  {toPersianNumerals(currentJYear)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={goToPrevMonth}
                style={styles.navButton}
              >
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <CalendarGrid
              year={currentJYear}
              month={currentJMonth}
              selectedDate={internalDate}
              minDate={minimumDate}
              maxDate={maximumDate}
              onSelectDate={handleSelectDate}
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={close}>
                <Text style={styles.cancelText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !internalDate && styles.confirmBtnDisabled,
                ]}
                onPress={confirm}
                disabled={!internalDate}
              >
                <Text style={styles.confirmText}>تأیید</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}



const ACCENT = "#3e5c76";
const ACCENT_LIGHT = "#EFF6FF";
const SURFACE = "#FFFFFF";
const BORDER = "#E2E8F0";
const TEXT_PRIMARY = "#1E293B";
const TEXT_SECONDARY = "#64748B";
const TEXT_MUTED = "#CBD5E1";
const FRIDAY = "#EF4444";

const styles = StyleSheet.create({
  // Trigger
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: Platform.OS === "ios" ? "IRANSans" : "sans-serif",
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputText: {
    fontFamily: Platform.OS === "ios" ? "IRANSans" : "sans-serif",
    fontSize: 15,
    color: TEXT_PRIMARY,
    textAlign: "right",
    writingDirection: "rtl",
    flex: 1,
  },
  placeholderText: {
    color: TEXT_MUTED,
  },
  calendarIcon: {
    fontSize: 18,
    marginLeft: 8,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    width: 340,
    marginTop:125,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
    zIndex: 1001,
  },
  modalHeader: {
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: "flex-end",
  },
  modalTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectedDateDisplay: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "right",
    writingDirection: "rtl",
  },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ACCENT_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrow: {
    fontSize: 20,
    color: ACCENT,
    lineHeight: 24,
    fontWeight: "600",
  },
  monthTitleWrap: {
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  yearTitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },

  calendarGrid: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  weekdayRow: {
    flexDirection: "row-reverse",
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  fridayText: {
    color: FRIDAY,
  },
  daysContainer: {},
  weekRow: {
    flexDirection: "row-reverse",
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    margin: 1,
  },
  selectedDay: {
    backgroundColor: ACCENT,
  },
  todayDay: {
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_PRIMARY,
  },
  fridayDayText: {
    color: FRIDAY,
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabledDayText: {
    color: TEXT_MUTED,
  },
  todayDayText: {
    color: ACCENT,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  confirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: ACCENT,
  },
  confirmBtnDisabled: {
    backgroundColor: TEXT_MUTED,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});