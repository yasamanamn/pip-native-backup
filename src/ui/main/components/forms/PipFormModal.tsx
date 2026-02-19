import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { MdClose, MdArrowForward, MdArrowBack, MdCheck } from 'react-icons/md';

type FormData = Record<string, any>;

const STEPS = [
    {
        title: 'مشخصات عمومی',
        subtitle: 'اطلاعات پایه ساختمان',
        fields: [
            { key: 'date', label: 'تاریخ تکمیل فرم', placeholder: 'روز/ماه/سال', required: true },
            { key: 'operationalZone', label: 'منطقه عملیاتی', placeholder: 'منطقه عملیاتی مربوط به محل بازدید', required: true },
            { key: 'operationalStation', label: 'ایستگاه عملیاتی', placeholder: 'نام یا کد ایستگاه عملیاتی', required: true },
            { key: 'buildingName', label: 'نام ساختمان', placeholder: 'نام رسمی ساختمان یا پلاک', required: true },
            { key: 'renovationCode', label: 'کد نوسازی', placeholder: 'کد نوسازی یا شناسه شهرداری', required: true },
            { key: 'address', label: 'آدرس دقیق', placeholder: 'خیابان، شماره، پلاک، طبقه', required: true },
            { key: 'postalCode', label: 'کد پستی', placeholder: 'کد پستی محل', required: true },
            { key: 'utmCoords', label: 'موقعیت مکانی UTM (x,y)', placeholder: 'مختصات UTM به صورت X,Y', required: true },
            { key: 'nearestIntersection', label: 'نزدیکترین تقاطع قابل دسترس', placeholder: 'نام نزدیکترین تقاطع', required: true },
        ],
    },
    {
        title: 'مشخصات مالک و مدیر',
        subtitle: 'اطلاعات تماس',
        fields: [
            { key: 'ownerName', label: 'نام مالک', placeholder: 'نام مالک رسمی ساختمان', required: true },
            { key: 'ownerPhone', label: 'شماره تماس مالک', placeholder: 'شماره تماس مالک یا نماینده قانونی', required: true },
            { key: 'managerName', label: 'نام مدیر ساختمان', placeholder: 'نام مدیر یا مسئول بهره‌برداری', required: true },
            { key: 'managerPhone', label: 'شماره تماس مدیر', placeholder: 'شماره تماس مدیر ساختمان', required: true },
            { key: 'guardName', label: 'نام نگهبان یا مستأجر', placeholder: 'نام نگهبان یا مستأجر اصلی', required: false },
            { key: 'guardPhone', label: 'شماره تماس نگهبان/مستأجر', placeholder: 'شماره تماس نگهبان یا مستأجر', required: false },
        ],
    },
    {
        title: 'کاربری و مشخصات فیزیکی',
        subtitle: 'اطلاعات فضا و بهره‌برداری',
        fields: [],
        specialFields: [
            {
                key: 'buildingUsage',
                label: 'کاربری ساختمان *',
                type: 'select',
                options: ['مسکونی', 'تجاری-کسبی', 'اداری-حرفه‌ای', 'تأسیسات شهری', 'تجمعی', 'فرهنگی-آموزشی', 'اقامتی', 'درمانی-مراقبتی', 'انباری', 'صنعتی', 'کارگاهی'],
            },
            { key: 'occupancy', label: 'تصرف‌های موجود', placeholder: 'هرگونه تصرف یا استفاده‌های فرعی', type: 'textarea' },
            { key: 'totalArea', label: 'متراژ کل (مترمربع) *', placeholder: 'مساحت کل زیربنا', type: 'number' },
            { key: 'totalHeight', label: 'ارتفاع کل (متر) *', placeholder: 'ارتفاع کلی ساختمان', type: 'number' },
            {
                key: 'hasHall',
                label: 'سالن اجتماعات/همایش دارد؟',
                type: 'boolean',
            },
            { key: 'hallLocation', label: 'موقعیت سالن اجتماعات', placeholder: 'طبقه/جهت/نزدیکی‌ها', type: 'text' },
            { key: 'operatingHours', label: 'ساعت بهره‌برداری از ساختمان', placeholder: 'ساعت شروع و خاتمه، ساعات اوج', type: 'text' },
            { key: 'peakOccupancy', label: 'متوسط تعداد افراد در ساعات اوج (نفر)', placeholder: 'تعداد افراد در اوج', type: 'number' },
            { key: 'residentialUnits', label: 'تعداد واحدهای مسکونی', placeholder: 'تعداد واحدهای مسکونی', type: 'number' },
            { key: 'officeUnits', label: 'تعداد واحدهای اداری', placeholder: 'تعداد واحدهای اداری', type: 'number' },
            { key: 'commercialUnits', label: 'تعداد واحدهای تجاری', placeholder: 'تعداد واحدهای تجاری', type: 'number' },
            { key: 'operationYear', label: 'سال بهره‌برداری', placeholder: 'سال آغاز بهره‌برداری', type: 'number' },
            {
                key: 'voltage',
                label: 'ولتاژ برق',
                type: 'select',
                options: ['110', '220', '380', '20KV', '63KV'],
            },
        ],
    },
    {
        title: 'دسترسی‌ها و سازه',
        subtitle: 'معابر، مجاورین و ساختمان',
        fields: [],
        specialFields: [
            { key: 'mainEntrances', label: 'تعداد و موقعیت ورودی‌های اصلی *', placeholder: 'تعداد و موقعیت هر ورودی اصلی', type: 'textarea' },
            { key: 'secondaryEntrances', label: 'تعداد و موقعیت ورودی‌های فرعی', placeholder: 'تعداد و موقعیت ورودی‌های فرعی', type: 'textarea' },
            { key: 'staircases', label: 'تعداد و موقعیت دستگاه پله *', placeholder: 'تعداد و موقعیت دستگاه‌های پله', type: 'textarea' },
            { key: 'adjacentBuildings', label: 'ساختمان‌های مجاور (جهات و مشخصات)', placeholder: 'شمال، جنوب، شرق، غرب - نام، فاصله، نوع تصرف', type: 'textarea' },
            { key: 'adjacentPassages', label: 'معابر مجاور (جهات و عرض معبر)', placeholder: 'نام معبر و عرض آن در هر جهت', type: 'textarea' },
            {
                key: 'structureType',
                label: 'نوع سازه *',
                type: 'select',
                options: ['بتنی', 'اسکلت فلزی معمولی', 'اسکلت فلزی محافظت شده', 'آجری', 'سوله'],
            },
            { key: 'landArea', label: 'مساحت زمین (مترمربع)', placeholder: 'مساحت زمین', type: 'number' },
            { key: 'buildingLength', label: 'طول ساختمان (متر)', placeholder: 'طول ساختمان', type: 'number' },
            { key: 'buildingWidth', label: 'عرض ساختمان (متر)', placeholder: 'عرض ساختمان', type: 'number' },
            { key: 'aboveFloors', label: 'تعداد طبقات مثبت', placeholder: 'تعداد طبقات بالای زمین', type: 'number' },
            { key: 'belowFloors', label: 'تعداد طبقات منفی', placeholder: 'تعداد طبقات زیرزمین', type: 'number' },
            { key: 'halfFloors', label: 'تعداد نیم‌طبقه', placeholder: 'تعداد نیم‌طبقه‌ها', type: 'number' },
            {
                key: 'facade',
                label: 'نوع نمای خارجی',
                type: 'select',
                options: ['غیرقابل اشتعال (سنگ، آجر و ...)', 'کامپوزیت مقاوم حریق', 'کامپوزیت قابل احتراق', 'نمای شیشه‌ای (Curtain Wall)', 'ندارد'],
            },
        ],
    },
    {
        title: 'انشعابات و تأسیسات',
        subtitle: 'سیستم‌های تأسیساتی ساختمان',
        fields: [],
        specialFields: [
            { key: 'gasMeterLocation', label: 'موقعیت کنتور گاز *', placeholder: 'محل دقیق کنتور گاز', type: 'text' },
            { key: 'electricMeterLocation', label: 'موقعیت کنتور برق *', placeholder: 'محل دقیق کنتور برق', type: 'text' },
            { key: 'mainSubstation', label: 'پست برق اصلی', placeholder: 'مشخصات و موقعیت پست برق', type: 'text' },
            { key: 'emergencyPower', label: 'موقعیت برق اضطراری (UPS/ژنراتور)', placeholder: 'محل و مشخصات برق اضطراری', type: 'text' },
            { key: 'waterMeterLocation', label: 'موقعیت کنتور آب *', placeholder: 'محل دقیق کنتور آب', type: 'text' },
            { key: 'heatingSystem', label: 'نوع و موقعیت سیستم گرمایشی *', placeholder: 'نوع و موقعیت سیستم گرمایش', type: 'textarea' },
            {
                key: 'fuelType',
                label: 'نوع سوخت گرمایش',
                type: 'select',
                options: ['گاز طبیعی', 'گاز مایع', 'گازوئیل', 'برق'],
            },
            {
                key: 'hasVentilation',
                label: 'سیستم تهویه دارد؟',
                type: 'boolean',
            },
            { key: 'ventilationDesc', label: 'توضیحات سیستم تهویه', placeholder: 'توضیحات سیستم تهویه مکانیکی', type: 'text' },
            {
                key: 'hasBasement',
                label: 'زیرزمین دارد؟',
                type: 'boolean',
            },
            { key: 'basementUsage', label: 'کاربری زیرزمین', placeholder: 'کاربری طبقات زیرزمین', type: 'text' },
        ],
    },
    {
        title: 'سیستم‌های اعلام و اطفای حریق',
        subtitle: 'ایمنی در برابر آتش',
        fields: [],
        specialFields: [
            { key: 'firePanelLocation', label: 'موقعیت پنل اعلام حریق *', placeholder: 'محل قرارگیری پنل', type: 'select', options: ['ورودی‌های اصلی ساختمان', 'طبقه همکف', 'اتاق کنترل (آتشنشانی/BMS)', 'در معرض دید نیروهای آتشنشانی', 'سایر'] },
            { key: 'fireAlarmActive', label: 'سیستم اعلام حریق آماده به کار است؟', type: 'boolean' },
            { key: 'fireAlarmType', label: 'نوع سیستم اعلام حریق', type: 'select', options: ['متعارف', 'آدرس‌پذیر', 'سایر'] },
            { key: 'hasDetector', label: 'سیستم تشخیص حریق (دتکتور/سنسور) دارد؟', type: 'boolean' },
            { key: 'hasOpticalAlarm', label: 'سیستم نوری اعلام حریق دارد؟', type: 'boolean' },
            { key: 'hasManualBreaker', label: 'شستی اعلام حریق (دستی) دارد؟', type: 'boolean' },
            { key: 'hasAudioAlarm', label: 'سیستم صوتی اعلام حریق دارد؟', type: 'boolean' },
            { key: 'hasSmokeDetector', label: 'سیستم تشخیص دود دارد؟', type: 'boolean' },
            { key: 'hasGasDetector', label: 'سیستم تشخیص گاز دارد؟', type: 'boolean' },
            { key: 'hasSprinkler', label: 'سیستم اسپرینکلر دارد؟', type: 'boolean' },
            { key: 'sprinklerValveLocation', label: 'موقعیت شیر کنترل اسپرینکلر', placeholder: 'محل قرارگیری شیر کنترل', type: 'text' },
            { key: 'hasRiser', label: 'سیستم رایزر دارد؟', type: 'boolean' },
            { key: 'riserType', label: 'نوع رایزر', type: 'select', options: ['تر', 'خشک', 'NA'] },
            { key: 'hasHoseReel', label: 'سیستم هوزریل دارد؟', type: 'boolean' },
            { key: 'riserInletLocation', label: 'موقعیت قرارگیری ورودی رایزرها', placeholder: 'محل ورودی رایزرها', type: 'text' },
            { key: 'riserZoning', label: 'زون‌بندی تغذیه رایزرها', placeholder: 'نحوه تقسیم‌بندی رایزرها', type: 'textarea' },
            { key: 'nearestHydrant', label: 'کد و موقعیت نزدیکترین هیدرانت فعال', placeholder: 'کد و موقعیت هیدرانت', type: 'text' },
            { key: 'otherWaterSources', label: 'منابع دیگر آب در دسترس', placeholder: 'تانک‌ها، منابع محلی - ظرفیت و دبی و موقعیت', type: 'textarea' },
        ],
    },
    {
        title: 'آسانسور، مواد خطرناک و کمک‌های اولیه',
        subtitle: 'تجهیزات و ایمنی تکمیلی',
        fields: [],
        specialFields: [
            { key: 'hasElevator', label: 'آسانسور دارد؟', type: 'boolean' },
            { key: 'elevatorDetails', label: 'مشخصات آسانسورها', placeholder: 'موقعیت، ظرفیت (نفر)، نوع نیروی محرکه، کاربری برای هر آسانسور', type: 'textarea' },
            { key: 'hazardousMaterials', label: 'اطلاعات مواد شیمیایی خطرناک', placeholder: 'نوع ماده، موقعیت، مقدار (kg)، نام مسئول، محل نگهداری برگه MSDS', type: 'textarea' },
            { key: 'firstAidLocations', label: 'موقعیت کمک‌های اولیه', placeholder: 'موقعیت و محتویات پک‌های کمک‌های اولیه', type: 'textarea' },
            { key: 'disabledResidents', label: 'اطلاعات افراد دارای معلولیت ساکن ساختمان', placeholder: 'نام، نوع معلولیت، محل اقامت و شماره تماس', type: 'textarea' },
            { key: 'safeAssemblyPoints', label: 'موقعیت مکان‌های تجمع امن', placeholder: 'موقعیت و مسیرهای دسترسی به مکان‌های تجمع امن', type: 'textarea' },
        ],
    },
    {
        title: 'تماس‌های اضطراری و موانع',
        subtitle: 'اطلاعات پایانی',
        fields: [],
        specialFields: [
            { key: 'emergencyContacts', label: 'لیست تماس‌های اضطراری *', placeholder: 'نام، سمت و شماره تماس افراد و سازمان‌های اضطراری', type: 'textarea' },
            { key: 'nearestReliefCenters', label: 'نزدیکترین مراکز امدادی', placeholder: 'نام، فاصله، آدرس و شماره تماس مراکز امدادی', type: 'textarea' },
            { key: 'operationalObstacles', label: 'موانع عملیاتی', placeholder: 'موانع عملیاتی که ممکن است عملیات اضطراری را محدود کند', type: 'textarea' },
            { key: 'wirelessLimitations', label: 'محدودیت‌های آنتن‌دهی بیسیم', placeholder: 'محدودیت آنتن‌دهی یا نقاط کور بیسیم', type: 'textarea' },
            { key: 'dangerousOccupancies', label: 'تصرف‌های خطرناک تا شعاع 50 متر', placeholder: 'هر نوع تصرف یا فعالیت خطرناک در شعاع 50 متر', type: 'textarea' },
            { key: 'visitorNames', label: 'اسامی افراد بازدیدکننده *', placeholder: 'اسامی افراد حاضر در بازدید', type: 'textarea' },
            { key: 'formFillerName', label: 'نام تکمیل‌کننده فرم *', placeholder: 'نام و سمت شخصی که فرم را تکمیل کرده است', type: 'text' },
        ],
    },
];

interface PipFormModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function PipFormModal({ visible, onClose }: PipFormModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>({});
    const [submitted, setSubmitted] = useState(false);

    const step = STEPS[currentStep];
    const totalSteps = STEPS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
        else setSubmitted(true);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    const handleClose = () => {
        setCurrentStep(0);
        setFormData({});
        setSubmitted(false);
        onClose();
    };

    const allFields = [...(step.fields || []), ...(step.specialFields || [])];

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.modal}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>فرم پیش‌طرح حادثه</Text>
                            <Text style={styles.formTag}>PIP فرم</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <MdClose size={20} color="#dadee4" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                        </View>
                        <Text style={styles.progressText}>
                            مرحله {currentStep + 1} از {totalSteps}
                        </Text>
                    </View>

                    {/* Step dots */}
                    <View style={styles.stepDots}>
                        {STEPS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i < currentStep && styles.dotCompleted,
                                    i === currentStep && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {submitted ? (
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <MdCheck size={40} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>فرم با موفقیت ثبت شد</Text>
                        <Text style={styles.successSub}>اطلاعات فرم PIP ذخیره شده است</Text>
                        <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                            <Text style={styles.doneBtnText}>بستن</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Step header */}
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepNumber}>۰{currentStep + 1}</Text>
                            <View>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                            </View>
                        </View>

                        {/* Fields */}
                        <ScrollView style={styles.fieldsContainer} showsVerticalScrollIndicator={false}>
                            {step.fields.map(field => (
                                <View key={field.key} style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>
                                        {field.label} {field.required && <Text style={styles.required}>*</Text>}
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={field.placeholder}
                                        placeholderTextColor="#9CA3AF"
                                        value={formData[field.key] || ''}
                                        onChangeText={v => handleChange(field.key, v)}
                                    />
                                </View>
                            ))}

                            {(step.specialFields || []).map(field => (
                                <View key={field.key} style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>{field.label}</Text>

                                    {field.type === 'boolean' && (
                                        <View style={styles.boolRow}>
                                            {['دارد', 'ندارد'].map(opt => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    style={[
                                                        styles.boolBtn,
                                                        formData[field.key] === opt && styles.boolBtnActive,
                                                    ]}
                                                    onPress={() => handleChange(field.key, opt)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.boolBtnText,
                                                            formData[field.key] === opt && styles.boolBtnTextActive,
                                                        ]}
                                                    >
                                                        {opt}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {field.type === 'select' && (
                                        <View style={styles.selectGrid}>
                                            {field.options!.map(opt => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    style={[
                                                        styles.selectChip,
                                                        formData[field.key] === opt && styles.selectChipActive,
                                                    ]}
                                                    onPress={() => handleChange(field.key, opt)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.selectChipText,
                                                            formData[field.key] === opt && styles.selectChipTextActive,
                                                        ]}
                                                    >
                                                        {opt}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {field.type === 'textarea' && (
                                        <TextInput
                                            style={[styles.input, styles.textarea]}
                                            placeholder={field.placeholder}
                                            placeholderTextColor="#9CA3AF"
                                            value={formData[field.key] || ''}
                                            onChangeText={v => handleChange(field.key, v)}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    )}

                                    {(field.type === 'text' || field.type === 'number') && (
                                        <TextInput
                                            style={styles.input}
                                            placeholder={field.placeholder}
                                            placeholderTextColor="#9CA3AF"
                                            value={formData[field.key] || ''}
                                            onChangeText={v => handleChange(field.key, v)}
                                            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                                        />
                                    )}
                                </View>
                            ))}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* Footer nav */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.navBtn, styles.backBtn, currentStep === 0 && styles.navBtnDisabled]}
                                onPress={handleBack}
                                disabled={currentStep === 0}
                            >
                                <MdArrowForward size={18} color={currentStep === 0 ? '#D1D5DB' : '#374151'} />
                                <Text style={[styles.navBtnText, currentStep === 0 && styles.navBtnTextDisabled]}>
                                    قبلی
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>
                                    {currentStep === totalSteps - 1 ? 'ثبت فرم' : 'بعدی'}
                                </Text>
                                {currentStep < totalSteps - 1 && (
                                    <MdArrowBack size={18} color="#fff" />
                                )}
                                {currentStep === totalSteps - 1 && (
                                    <MdCheck size={18} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
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
        width: 560,
        maxHeight: '90vh' as any,
        overflow: 'hidden',
        flexDirection: 'column',
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
    },
    formTag: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        justifyContent: 'flex-end',
        display: 'flex',
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    progressTrack: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: '#ffff',
        minWidth: 80,
        textAlign: 'right',
    },
    stepDots: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    dotCompleted: {
        backgroundColor: '#fffff',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 20,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stepNumber: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ee9880',
        lineHeight: 36,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        alignItems:'center',
    },
    stepSubtitle: {
        fontSize: 13,
        color: '#606061',
        marginTop: 2,
    },
    fieldsContainer: {
        flex: 1,
        padding: 20,
    },
    fieldGroup: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
        textAlign: 'right',
    },
    required: {
        color: '#EF4444',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        textAlign: 'right',
        backgroundColor: '#FAFAFA',
    },
    textarea: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    boolRow: {
        flexDirection: 'row',
        gap: 8,
    },
    boolBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    boolBtnActive: {
        borderColor: '#fffff',
        backgroundColor: '#EFF6FF',
    },
    boolBtnText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    boolBtnTextActive: {
        color: '#0C4A6E',
        fontWeight: '700',
    },
    selectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
    },
    selectChipActive: {
        borderColor: '#ffff',
        backgroundColor: '#EFF6FF',
    },
    selectChipText: {
        fontSize: 13,
        color: '#6B7280',
    },
    selectChipTextActive: {
        color: '#ee9880',
        fontWeight: '600',
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
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    backBtn: {},
    navBtnDisabled: {
        opacity: 0.4,
    },
    navBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    navBtnTextDisabled: {
        color: '#D1D5DB',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#d95d39',
    },
    nextBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    successSub: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 32,
    },
    doneBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#ffff',
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
