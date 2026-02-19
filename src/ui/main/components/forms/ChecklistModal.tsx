import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
    MdApartment,
    MdPerson,
    MdStraighten,
    MdDoorFront,
    MdBolt,
    MdLocalFireDepartment,
    MdElevator,
    MdPhoneInTalk,
    MdClose,
    MdExpandLess,
    MdExpandMore,
    MdCheck
} from 'react-icons/md';

type CheckItem = {
    id: string;
    label: string;
    checked: boolean;
};

type CheckSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: CheckItem[];
};


const INITIAL_CHECKLIST: CheckSection[] = [
    {
        id: 'general',
        title: 'مشخصات عمومی',
        icon: <MdApartment size={18} color="#6B7280" />,
        items: [
            { id: 'g1', label: 'تاریخ تکمیل فرم ثبت شده است', checked: false },
            { id: 'g2', label: 'منطقه و ایستگاه عملیاتی مشخص است', checked: false },
            { id: 'g3', label: 'نام ساختمان و کد نوسازی ثبت شده', checked: false },
            { id: 'g4', label: 'آدرس دقیق و کدپستی موجود است', checked: false },
            { id: 'g5', label: 'موقعیت UTM ثبت شده است', checked: false },
            { id: 'g6', label: 'نزدیکترین تقاطع مشخص است', checked: false },
        ],
    },
    {
        id: 'contacts',
        title: 'مشخصات مالک و مدیر',
        icon: <MdPerson size={18} color="#6B7280" />,
        items: [
            { id: 'c1', label: 'نام و شماره تماس مالک ثبت شده', checked: false },
            { id: 'c2', label: 'نام و شماره تماس مدیر ساختمان موجود است', checked: false },
            { id: 'c3', label: 'نام و شماره تماس نگهبان/مستأجر ثبت شده', checked: false },
        ],
    },
    {
        id: 'usage',
        title: 'کاربری و مشخصات فیزیکی',
        icon: <MdStraighten size={18} color="#6B7280" />,
        items: [
            { id: 'u1', label: 'کاربری اصلی ساختمان مشخص شده', checked: false },
            { id: 'u2', label: 'متراژ کل و ارتفاع ثبت شده', checked: false },
            { id: 'u3', label: 'ساعت بهره‌برداری و اوج جمعیت مشخص است', checked: false },
            { id: 'u4', label: 'تعداد واحدهای مسکونی، اداری و تجاری ثبت شده', checked: false },
            { id: 'u5', label: 'سال بهره‌برداری و ولتاژ مشخص است', checked: false },
        ],
    },
    {
        id: 'access',
        title: 'دسترسی‌ها و سازه',
        icon: <MdDoorFront size={18} color="#6B7280" />,
        items: [
            { id: 'a1', label: 'تعداد و موقعیت ورودی‌های اصلی ثبت شده', checked: false },
            { id: 'a2', label: 'تعداد و موقعیت ورودی‌های فرعی مشخص است', checked: false },
            { id: 'a3', label: 'تعداد و موقعیت دستگاه‌های پله ثبت شده', checked: false },
            { id: 'a4', label: 'ساختمان‌های مجاور در ۴ جهت مشخص است', checked: false },
            { id: 'a5', label: 'معابر مجاور با عرض آن‌ها ثبت شده', checked: false },
            { id: 'a6', label: 'نوع سازه مشخص شده', checked: false },
            { id: 'a7', label: 'ابعاد ساختمان (طول، عرض، ارتفاع) ثبت شده', checked: false },
            { id: 'a8', label: 'تعداد طبقات مثبت، منفی و نیم‌طبقه مشخص است', checked: false },
            { id: 'a9', label: 'نوع نمای خارجی مشخص شده', checked: false },
        ],
    },
    {
        id: 'utilities',
        title: 'انشعابات و تأسیسات',
        icon: <MdBolt size={18} color="#6B7280" />,
        items: [
            { id: 'ut1', label: 'موقعیت کنتور گاز ثبت شده', checked: false },
            { id: 'ut2', label: 'موقعیت کنتور برق ثبت شده', checked: false },
            { id: 'ut3', label: 'مشخصات برق اضطراری (UPS/ژنراتور) موجود است', checked: false },
            { id: 'ut4', label: 'موقعیت کنتور آب ثبت شده', checked: false },
            { id: 'ut5', label: 'نوع و موقعیت سیستم گرمایشی مشخص است', checked: false },
            { id: 'ut6', label: 'نوع سوخت گرمایش مشخص شده', checked: false },
            { id: 'ut7', label: 'وضعیت سیستم تهویه مکانیکی بررسی شده', checked: false },
        ],
    },
    {
        id: 'fire',
        title: 'سیستم‌های اعلام و اطفای حریق',
        icon: <MdLocalFireDepartment size={18} color="#DC2626" />,
        items: [
            { id: 'f1', label: 'موقعیت پنل اعلام حریق مشخص شده', checked: false },
            { id: 'f2', label: 'وضعیت آماده به کار بودن سیستم اعلام حریق بررسی شده', checked: false },
            { id: 'f3', label: 'نوع سیستم اعلام حریق (متعارف/آدرس‌پذیر) مشخص است', checked: false },
            { id: 'f4', label: 'وجود دتکتور، آلارم نوری و صوتی بررسی شده', checked: false },
            { id: 'f5', label: 'وجود شستی‌های اعلام حریق دستی بررسی شده', checked: false },
            { id: 'f6', label: 'سیستم تشخیص دود و گاز بررسی شده', checked: false },
            { id: 'f7', label: 'وضعیت سیستم اسپرینکلر بررسی شده', checked: false },
            { id: 'f8', label: 'موقعیت شیر کنترل اسپرینکلر ثبت شده', checked: false },
            { id: 'f9', label: 'سیستم رایزر (نوع تر/خشک) بررسی شده', checked: false },
            { id: 'f10', label: 'سیستم هوزریل بررسی شده', checked: false },
            { id: 'f11', label: 'موقعیت و کد هیدرانت‌های فعال ثبت شده', checked: false },
            { id: 'f12', label: 'منابع دیگر آب در دسترس شناسایی شده', checked: false },
        ],
    },
    {
        id: 'elevator',
        title: 'آسانسور و ایمنی تکمیلی',
        icon: <MdElevator size={18} color="#6B7280" />,
        items: [
            { id: 'e1', label: 'مشخصات آسانسورها ثبت شده', checked: false },
            { id: 'e2', label: 'اطلاعات مواد شیمیایی خطرناک (MSDS) ثبت شده', checked: false },
            { id: 'e3', label: 'موقعیت کمک‌های اولیه مشخص است', checked: false },
            { id: 'e4', label: 'اطلاعات افراد دارای معلولیت ثبت شده', checked: false },
            { id: 'e5', label: 'مکان‌های تجمع امن و مسیر دسترسی مشخص است', checked: false },
        ],
    },
    {
        id: 'emergency',
        title: 'تماس‌های اضطراری و موانع',
        icon: <MdPhoneInTalk size={18} color="#6B7280" />,
        items: [
            { id: 'em1', label: 'لیست تماس‌های اضطراری کامل است', checked: false },
            { id: 'em2', label: 'نزدیکترین مراکز امدادی با فاصله ثبت شده', checked: false },
            { id: 'em3', label: 'موانع عملیاتی سایت شناسایی شده', checked: false },
            { id: 'em4', label: 'محدودیت‌های آنتن‌دهی بیسیم بررسی شده', checked: false },
            { id: 'em5', label: 'تصرف‌های خطرناک در شعاع ۵۰ متر شناسایی شده', checked: false },
            { id: 'em6', label: 'اسامی بازدیدکنندگان ثبت شده', checked: false },
            { id: 'em7', label: 'نام و سمت تکمیل‌کننده فرم ثبت شده', checked: false },
        ],
    },
];

interface ChecklistModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ChecklistModal({ visible, onClose }: ChecklistModalProps) {
    const [sections, setSections] = useState<CheckSection[]>(INITIAL_CHECKLIST);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
        Object.fromEntries(INITIAL_CHECKLIST.map(s => [s.id, true]))
    );

    if (!visible) return null;

    const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
    const checkedItems = sections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0);
    const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

    const toggleItem = (sectionId: string, itemId: string) => {
        setSections(prev =>
            prev.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        items: section.items.map(item =>
                            item.id === itemId ? { ...item, checked: !item.checked } : item
                        ),
                    }
                    : section
            )
        );
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const toggleAllInSection = (sectionId: string) => {
        setSections(prev =>
            prev.map(section => {
                if (section.id !== sectionId) return section;
                const allChecked = section.items.every(i => i.checked);
                return {
                    ...section,
                    items: section.items.map(item => ({ ...item, checked: !allChecked })),
                };
            })
        );
    };

    const handleReset = () => {
        setSections(INITIAL_CHECKLIST.map(s => ({
            ...s,
            items: s.items.map(i => ({ ...i, checked: false })),
        })));
    };

    return (
        <View style={styles.overlay}>
            <View style={styles.modal}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>چک‌لیست تکمیل فرم PIP</Text>
                            <Text style={styles.formTag}>چک‌لیست بازدید</Text>

                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MdClose size={20} color="#dadee4" />
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                            <Text style={styles.statNum}>{checkedItems}</Text>
                            <Text style={styles.statLabel}>تکمیل‌شده</Text>
                        </View>
                        <View style={styles.progressBarWrap}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress}%` as any },
                                        progress === 100 && styles.progressFillComplete,
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressPercent}>{Math.round(progress)}٪</Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Text style={styles.statNum}>{totalItems}</Text>
                            <Text style={styles.statLabel}>کل موارد</Text>
                        </View>
                    </View>
                </View>

                {/* List */}
                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                    {sections.map(section => {
                        const sectionChecked = section.items.filter(i => i.checked).length;
                        const sectionTotal = section.items.length;
                        const allChecked = sectionChecked === sectionTotal;
                        const isExpanded = expandedSections[section.id];

                        return (
                            <View key={section.id} style={styles.section}>
                                <TouchableOpacity
                                    style={styles.sectionHeader}
                                    onPress={() => toggleSection(section.id)}
                                    activeOpacity={0.7}
                                >
                                     <View style={styles.sectionRight}>
                                        <Text style={styles.sectionTitle}>{section.title}</Text>
                                        <View style={styles.sectionIcon}>{section.icon}</View>
                                    </View>
                                    <View style={styles.sectionLeft}>
                                        {isExpanded ? (
                                            <MdExpandLess size={20} color="#6B7280" />
                                        ) : (
                                            <MdExpandMore size={20} color="#6B7280" />
                                        )}
                                        <Text style={styles.sectionProgress}>
                                            {sectionChecked}/{sectionTotal}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.itemsList}>
                                        <TouchableOpacity
                                            style={styles.selectAllBtn}
                                            onPress={() => toggleAllInSection(section.id)}
                                        >
                                            <Text style={styles.selectAllText}>
                                                {allChecked ? 'برداشتن انتخاب همه' : 'انتخاب همه'}
                                            </Text>
                                        </TouchableOpacity>

                                        {section.items.map(item => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[styles.checkItem, item.checked && styles.checkItemDone]}
                                                onPress={() => toggleItem(section.id, item.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                                                    {item.checked && <MdCheck size={13} color="#fff" />}
                                                </View>
                                                <Text style={[styles.itemLabel, item.checked && styles.itemLabelDone]}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    <View style={{ height: 16 }} />
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                        <Text style={styles.resetBtnText}>بازنشانی</Text>
                    </TouchableOpacity>
                    {progress === 100 && (
                        <View style={styles.completeBadge}>
                            <MdCheck size={16} color="#16A34A" />
                            <Text style={styles.completeBadgeText}>چک‌لیست کامل شد!</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
                        <Text style={styles.closeFooterBtnText}>بستن</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'fixed' as any,
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: 520,
        maxHeight: '90vh' as any,
        flexDirection: 'column',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
    },
    header: {
        backgroundColor: '#d95d39',
        padding: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    formTag: {
        fontSize: 11,
        color: '#fcf8f8',
        fontWeight: '600',
        letterSpacing: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statBadge: {
        alignItems: 'center',
    },
    statNum: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: '#fff',
    },
    progressBarWrap: {
        flex: 1,
        gap: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    progressFillComplete: {
        backgroundColor: '#c6ebbe',
    },
    progressPercent: {
        fontSize: 11,
        color: '#BAE6FD',
        textAlign: 'center',
    },
    body: {
        flex: 1,
        padding: 12,
    },
    section: {
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
    },
    sectionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
   sectionIcon: {
  width: 22,
  alignItems: 'center',
  justifyContent: 'center',
},

    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    sectionProgress: {
        fontSize: 12,
        color: '#6B7280',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    itemsList: {
        padding: 8,
        backgroundColor: '#fff',
    },
    selectAllBtn: {
        alignSelf: 'flex-end',
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    selectAllText: {
        fontSize: 11,
        color: '#b45309',
        fontWeight: '600',
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 2,
    },
    checkItemDone: {
        backgroundColor: '#F0FDF4',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    itemLabel: {
        fontSize: 13,
        color: '#374151',
        flex: 1,
        textAlign: 'right',
        lineHeight: 20,
    },
    itemLabelDone: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FAFAFA',
    },
    resetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    resetBtnText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    completeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    completeBadgeText: {
        fontSize: 13,
        color: '#16A34A',
        fontWeight: '600',
    },
    closeFooterBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeFooterBtnText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '700',
    },
});
