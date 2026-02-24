import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../../../config/api.config";
import DatePickerModalCustom from "./../../../../components/DatePickerModalCustom";
import { FileUploader } from '../forms/FileUploader';
import jalaali from "jalaali-js";

const DEFAULT_VERSION = "01";

function persianToGregorian(persianDateStr: string): Date | undefined {
    if (!persianDateStr || typeof persianDateStr !== 'string') return undefined;
    const digits = persianDateStr.replace(/[^۰۱۲۳۴۵۶۷۸۹0-9]/g, '');
    if (digits.length !== 8) return undefined;
    const persianToEnglishMap: Record<string, string> = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    const englishDigits = digits.split('').map(d => persianToEnglishMap[d] || d).join('');
    const year = parseInt(englishDigits.substring(0, 4));
    const month = parseInt(englishDigits.substring(4, 6));
    const day = parseInt(englishDigits.substring(6, 8));
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    try {
        const { gy, gm, gd } = jalaali.toGregorian(year, month, day);
        return new Date(gy, gm - 1, gd);
    } catch (e) {
        return undefined;
    }
}

const normalizeVersionValue = (value: string | number | null | undefined) => {
    const digits = value == null ? "" : String(value).replace(/[^0-9]/g, "");
    return digits ? digits.padStart(2, "0") : DEFAULT_VERSION;
};

type QuestionType =
    | "TEXT" | "PICTURE" | "NUMBER" | "FILE"
    | "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TABLE"
    | "DATE" | "DATETIME" | "PHONE" | "RENOVATIONCODE"
    | "POSTALCODE" | "LOCATION" | "EMAIL" | "STATION" | "ZONE";

interface Question {
    id: number;
    question: string;
    description: string | null;
    type: QuestionType;
    isRequired: boolean;
    options: string[] | null;
    parentId: number | null;
    children: Question[];
    order: number;
}

interface QuestionGroup {
    id: number;
    name: string;
    order: number;
    questions: Question[];
}

interface FormData {
    id: number;
    title: string;
    code: string | null;
    description: string | null;
    formType: string;
    applicationType: string;
    version: string;
    questionGroups: QuestionGroup[];
}

interface Answer {
    questionId: number;
    value: any;
    rowGroupId: number | null;
}

interface FlatQuestion {
    id: number;
    groupId: number;
    groupName: string;
    question: string;
    description: string | null;
    type: QuestionType;
    isRequired: boolean;
    options: string[] | null;
    parentId: number | null;
    isChild: boolean;
    children?: FlatQuestion[];
}

function isAnswerProvided(value: any): boolean {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
}

function validateAnswer(value: any, type: string, label?: string): { isValid: boolean; message?: string } {
    if (type === "EMAIL") {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRe.test(value)) return { isValid: false, message: "ایمیل معتبر نیست" };
    }
    if (type === "PHONE") {
        const phoneRe = /^[0-9+\-() ]{7,15}$/;
        if (value && !phoneRe.test(value)) return { isValid: false, message: "شماره تلفن معتبر نیست" };
    }
    if (type === "POSTALCODE") {
        if (value && String(value).replace(/\D/g, "").length !== 10)
            return { isValid: false, message: "کد پستی باید ۱۰ رقم باشد" };
    }
    return { isValid: true };
}


interface TextInputFieldProps {
    qId: number; value: string; onChangeText: (text: string) => void;
    multiline?: boolean; keyboardType?: any; placeholder?: string;
    hasError?: boolean; errorMessage?: string | null;
}
const TextInputField = React.memo(({ qId, value, onChangeText, multiline = false, keyboardType = "default", placeholder, hasError, errorMessage }: TextInputFieldProps) => (
    <View>
        <TextInput
            style={[styles.input, styles.inputRtl, multiline && styles.textarea, hasError && styles.inputError]}
            value={value} onChangeText={onChangeText} multiline={multiline}
            numberOfLines={multiline ? 4 : 1} keyboardType={keyboardType}
            placeholder={placeholder} placeholderTextColor="#9CA3AF" textAlign="right"
        />
        {hasError && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
));

const SingleChoiceField = React.memo(({ q, selectedValue, onSelect }: { q: FlatQuestion; selectedValue: any; onSelect: (value: string) => void }) => (
    <View style={styles.choiceGroup}>
        {(q.options || []).map((opt) => {
            const selected = selectedValue === opt;
            return (
                <TouchableOpacity key={opt} style={[styles.choiceRow, selected && styles.choiceRowSelected]} onPress={() => onSelect(opt)}>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                    <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{opt}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
));

const MultipleChoiceField = React.memo(({ q, selectedValues, onToggle }: { q: FlatQuestion; selectedValues: string[]; onToggle: (value: string) => void }) => (
    <View style={styles.choiceGroup}>
        {(q.options || []).map((opt) => {
            const checked = selectedValues.includes(opt);
            return (
                <TouchableOpacity key={opt} style={[styles.choiceRow, checked && styles.choiceRowSelected]} onPress={() => onToggle(opt)}>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>}
                    </View>
                    <Text style={[styles.choiceLabel, checked && styles.choiceLabelSelected]}>{opt}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
));

const TableCellTextInput = React.memo(({ value, onChangeText, keyboardType = "default" }: { value: string; onChangeText: (text: string) => void; keyboardType?: any }) => (
    <TextInput style={styles.tableCellInput} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder="—" placeholderTextColor="#C0C0C0" textAlign="right" />
));

const TableCellSingleChoice = React.memo(({ options, selectedValue, onSelect }: { options: string[]; selectedValue: any; onSelect: (value: string) => void }) => (
    <View style={styles.tableCellChoiceGroup}>
        {options.map((opt) => {
            const selected = selectedValue === opt;
            return (
                <TouchableOpacity key={opt} style={[styles.tableCellChoiceRow, selected && styles.tableCellChoiceRowSelected]} onPress={() => onSelect(opt)} activeOpacity={0.7}>
                    <View style={[styles.tableCellRadio, selected && styles.tableCellRadioSelected]} />
                    <Text style={[styles.tableCellChoiceLabel, selected && styles.tableCellChoiceLabelSelected]}>{opt}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
));

const TableCellMultipleChoice = React.memo(({ options, selectedValues, onToggle }: { options: string[]; selectedValues: string[]; onToggle: (value: string) => void }) => (
    <View style={styles.tableCellChoiceGroup}>
        {options.map((opt) => {
            const checked = selectedValues.includes(opt);
            return (
                <TouchableOpacity key={opt} style={[styles.tableCellChoiceRow, checked && styles.tableCellChoiceRowSelected]} onPress={() => onToggle(opt)} activeOpacity={0.7}>
                    <View style={[styles.tableCellCheckbox, checked && styles.tableCellCheckboxChecked]}>
                        {checked && <Text style={styles.tableCellCheckmark}>✓</Text>}
                    </View>
                    <Text style={[styles.tableCellChoiceLabel, checked && styles.tableCellChoiceLabelSelected]}>{opt}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
));

const TableRow = React.memo(({ row, rowIdx, columns, parentId, onUpdateCell, onRemoveRow, isEven }: {
    row: any; rowIdx: number; columns: FlatQuestion[]; parentId: number;
    onUpdateCell: (parentId: number, rowIdx: number, childId: number, value: any) => void;
    onRemoveRow: (parentId: number, rowIdx: number) => void; isEven: boolean;
}) => {
    const textTypes = ["TEXT", "NUMBER", "EMAIL", "PHONE", "POSTALCODE"];
    const renderCell = (child: FlatQuestion) => {
        if (textTypes.includes(child.type)) return <TableCellTextInput value={row[child.id] !== undefined ? String(row[child.id]) : ""} onChangeText={(text) => onUpdateCell(parentId, rowIdx, child.id, text)} keyboardType={child.type === "NUMBER" ? "numeric" : "default"} />;
        if (child.type === "SINGLE_CHOICE") return <TableCellSingleChoice options={child.options || []} selectedValue={row[child.id]} onSelect={(val) => onUpdateCell(parentId, rowIdx, child.id, val)} />;
        if (child.type === "MULTIPLE_CHOICE") {
            const curr = Array.isArray(row[child.id]) ? row[child.id] : [];
            return <TableCellMultipleChoice options={child.options || []} selectedValues={curr} onToggle={(opt) => { const next = curr.includes(opt) ? curr.filter((o: string) => o !== opt) : [...curr, opt]; onUpdateCell(parentId, rowIdx, child.id, next); }} />;
        }
        return <Text style={styles.tableCellUnsupported}>پشتیبانی نشده</Text>;
    };
    return (
        <View style={[styles.tableBodyRow, isEven ? styles.tableBodyRowEven : styles.tableBodyRowOdd]}>
            <View style={[styles.tableBodyCell, styles.tableIndexCell]}><View style={styles.tableRowBadge}><Text style={styles.tableRowBadgeText}>{rowIdx + 1}</Text></View></View>
            {columns.map((child) => <View key={child.id} style={[styles.tableBodyCell, styles.tableDataCell]}>{renderCell(child)}</View>)}
            <View style={[styles.tableBodyCell, styles.tableActionCell]}><TouchableOpacity style={styles.tableDeleteButton} onPress={() => onRemoveRow(parentId, rowIdx)} activeOpacity={0.7}><Text style={styles.tableDeleteIcon}>🗑</Text></TouchableOpacity></View>
        </View>
    );
});

const TableField = React.memo(({ q, rows, onAddRow, onUpdateCell, onRemoveRow }: {
    q: FlatQuestion; rows: any[];
    onAddRow: (questionId: number) => void;
    onUpdateCell: (parentId: number, rowIdx: number, childId: number, value: any) => void;
    onRemoveRow: (parentId: number, rowIdx: number) => void;
}) => {
    const columns = q.children ?? [];
    return (
        <View style={styles.tableWrapper}>
            <View style={styles.tableTopBar}><Text style={styles.tableRowCount}>{rows.length > 0 ? `${rows.length} ردیف` : "هنوز ردیفی اضافه نشده"}</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScrollView}>
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeaderRow}>
                        <View style={[styles.tableHeaderCell, styles.tableIndexCell]}><Text style={styles.tableHeaderCellText}>#</Text></View>
                        {columns.map((child) => <View key={child.id} style={[styles.tableHeaderCell, styles.tableDataCell]}><Text style={styles.tableHeaderCellText} numberOfLines={2}>{child.question}</Text>{child.isRequired && <Text style={styles.tableHeaderRequired}> *</Text>}</View>)}
                        <View style={[styles.tableHeaderCell, styles.tableActionCell]}><Text style={styles.tableHeaderCellText}>حذف</Text></View>
                    </View>
                    {rows.length === 0 ? (
                        <View style={styles.tableEmptyRow}><Text style={styles.tableEmptyText}>برای افزودن اطلاعات روی «+ افزودن ردیف» بزنید</Text></View>
                    ) : (
                        rows.map((row, rowIdx) => <TableRow key={rowIdx} row={row} rowIdx={rowIdx} columns={columns} parentId={q.id} onUpdateCell={onUpdateCell} onRemoveRow={onRemoveRow} isEven={rowIdx % 2 === 0} />)
                    )}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.tableAddRowButton} onPress={() => onAddRow(q.id)} activeOpacity={0.8}>
                <Text style={styles.tableAddRowIcon}>＋</Text>
                <Text style={styles.tableAddRowText}>افزودن ردیف</Text>
            </TouchableOpacity>
        </View>
    );
});


interface Props {
    formId: number;
    renovationCode: string;
    username?: string;
    initialFormData?: FormData | null;
    initialAnswers?: any[];  
    onSaved?: (responseId: number, formType: string) => void;
    onClose?: () => void;
}

export default function FormResponsePage({
    formId,
    renovationCode,
    username = "",
    initialFormData,
    initialAnswers,
    onSaved,
    onClose,
}: Props) {
    const [form, setForm] = useState<FormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const answersRef = useRef<Record<number, any>>({});
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<number, string | null>>({});
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const draftKey = useMemo(
        () => `formDraft_${formId}_${renovationCode}_${username}`,
        [formId, renovationCode, username]
    );

    useEffect(() => { answersRef.current = answers; }, [answers]);

    useEffect(() => {
        let cancelled = false;

        const loadForm = async () => {
            if (initialFormData && typeof initialFormData === "object" && initialFormData.id) {
                if (!cancelled) {
                    setForm({
                        ...initialFormData,
                        version: normalizeVersionValue(initialFormData.version),
                        questionGroups: Array.isArray(initialFormData.questionGroups)
                            ? initialFormData.questionGroups
                            : [],
                    });
                }
            } else {
                if (!formId) { setError("شناسه فرم یافت نشد"); setLoading(false); return; }
                try {
                    const res = await api.get(`/forms/${formId}`);
                    const json = res.data;
                    if (!json?.success) throw new Error(json?.message || "خطا در دریافت فرم");
                    if (!cancelled) {
                        setForm({
                            ...json.data,
                            version: normalizeVersionValue(json.data?.version),
                            questionGroups: json.data?.questionGroups ?? [],
                        });
                    }
                } catch (e: any) {
                    if (!cancelled) { setError(e?.message || "خطا در بارگذاری فرم"); setLoading(false); }
                }
            }
        };

        loadForm();
        return () => { cancelled = true; };
    }, [initialFormData, formId]);

    const { flatQuestions, byId } = useMemo(() => {
        if (!form || !Array.isArray(form.questionGroups))
            return { flatQuestions: [] as FlatQuestion[], byId: {} as Record<number, FlatQuestion> };

        const flat: FlatQuestion[] = [];
        const byId: Record<number, FlatQuestion> = {};

        form.questionGroups.forEach((g) => {
            g.questions.forEach((q) => {
                const parent: FlatQuestion = {
                    id: q.id, groupId: g.id, groupName: g.name,
                    question: q.question, description: q.description,
                    type: q.type, isRequired: q.isRequired,
                    options: q.options, parentId: q.parentId,
                    isChild: false, children: [],
                };
                flat.push(parent);
                byId[parent.id] = parent;

                if (q.type === "TABLE" && Array.isArray(q.children)) {
                    q.children.forEach((c) => {
                        const childFlat: FlatQuestion = {
                            id: c.id, groupId: g.id, groupName: g.name,
                            question: c.question, description: c.description,
                            type: c.type, isRequired: c.isRequired,
                            options: c.options, parentId: parent.id, isChild: true,
                        };
                        parent.children?.push(childFlat);
                        byId[childFlat.id] = childFlat;
                    });
                }
            });
        });

        return { flatQuestions: flat, byId };
    }, [form]);

    const normalizeAnswers = useCallback((rawAnswers: any[] | undefined): Record<number, any> => {
        const result: Record<number, any> = {};
        if (!rawAnswers || !Array.isArray(rawAnswers)) return result;

        for (const a of rawAnswers) {
            let qId: number, value: any, rowGroupId: number | null;

            if (a.questionId !== undefined) {
                qId = a.questionId; value = a.value; rowGroupId = a.rowGroupId;
            } else if (a.id !== undefined) {
                qId = a.id; value = a.answer; rowGroupId = a.rowGroupId;
            } else continue;

            const question = byId[qId];

            if (question?.type === 'DATE' && typeof value === 'string') {
                const converted = persianToGregorian(value);
                if (converted) value = converted;
            }

            if (rowGroupId !== null && rowGroupId !== undefined) {
                const parentId = question?.parentId;
                if (!parentId) continue;
                if (!result[parentId]) result[parentId] = [];
                let row = result[parentId].find((r: any) => r.rowGroupId === rowGroupId);
                if (!row) { row = { rowGroupId }; result[parentId].push(row); }
                row[qId] = value;
            } else {
                result[qId] = value;
            }
        }

        return result;
    }, [byId]);
    useEffect(() => {
        if (!form || !Object.keys(byId).length) return;
        let cancelled = false;

        const loadAnswers = async () => {
            setLoading(true);
            try {
                if (initialAnswers !== undefined) {

                    const normalized = normalizeAnswers(initialAnswers);
                    if (!cancelled) setAnswers(normalized);
                    return;
                }

                const draftRaw = await AsyncStorage.getItem(draftKey);
                if (draftRaw) {
                    const parsed = JSON.parse(draftRaw);
                    const now = Date.now();
                    if (parsed?._ts && now - parsed._ts > 3 * 24 * 60 * 60 * 1000) {
                        await AsyncStorage.removeItem(draftKey);
                    } else if (parsed?.data) {
                        if (!cancelled) setAnswers(parsed.data);
                        return;
                    }
                }

                if (!cancelled) setAnswers({});

            } catch (e) {
                console.error('Error loading answers:', e);
                if (!cancelled) setAnswers({});
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadAnswers();
        return () => { cancelled = true; };
    }, [form, byId, draftKey, normalizeAnswers, initialAnswers]);

    const currentQuestion = flatQuestions[currentQuestionIdx] ?? null;
    const isLastQuestion = currentQuestionIdx === flatQuestions.length - 1;
    const totalQuestions = flatQuestions.length;
    const progress = totalQuestions > 0 ? ((currentQuestionIdx + 1) / totalQuestions) * 100 : 0;
    const currentGroup = form?.questionGroups.find((g) => g.id === currentQuestion?.groupId);
    const stepNumStr = String(currentQuestionIdx + 1).padStart(2, "0");

    const requiredUnanswered = useMemo(() => {
        return flatQuestions.filter((q) => {
            if (!q.isRequired) return false;
            const ans = answers[q.id];
            if (q.type === "TABLE") {
                if (!Array.isArray(ans) || ans.length === 0) return true;
                return !ans.every((row: any) => q.children?.every((child) => {
                    if (!child.isRequired) return true;
                    return isAnswerProvided(row[child.id]);
                }));
            }
            return !isAnswerProvided(ans);
        });
    }, [answers, flatQuestions]);

    const hasErrors = Object.keys(fieldErrors).some((k) => !!fieldErrors[+k]);
    const canSave = requiredUnanswered.length === 0 && !hasErrors;

    const updateAnswer = useCallback((questionId: number, value: any, questionText?: string, type?: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        const questionType = type || byId[questionId]?.type;
        if (["DATE", "DATETIME", "LOCATION"].includes(questionType!)) {
            setFieldErrors((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
            return;
        }
        const { isValid, message } = validateAnswer(value, questionType!, questionText);
        setFieldErrors((prev) => {
            const n = { ...prev };
            if (!isValid) n[questionId] = message || "خطای نامشخص";
            else delete n[questionId];
            return n;
        });
    }, [byId]);

    const addTableRow = useCallback((questionId: number) => {
        setAnswers((prev) => {
            const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
            const question = byId[questionId];
            const newRow: any = { rowGroupId: current.length };
            question?.children?.forEach((child) => { newRow[child.id] = child.type === "MULTIPLE_CHOICE" ? [] : ""; });
            return { ...prev, [questionId]: [...current, newRow] };
        });
    }, [byId]);

    const updateTableRow = useCallback((parentId: number, rowIdx: number, childId: number, value: any) => {
        setAnswers((prev) => {
            const updated = { ...prev };
            const rows = Array.isArray(updated[parentId]) ? [...updated[parentId]] : [];
            rows[rowIdx] = { ...rows[rowIdx], [childId]: value };
            updated[parentId] = rows;
            return updated;
        });
    }, []);

    const removeTableRow = useCallback((questionId: number, rowIdx: number) => {
        setAnswers((prev) => {
            const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
            return { ...prev, [questionId]: current.filter((_, i) => i !== rowIdx) };
        });
    }, []);

    const saveDraft = useCallback(async () => {
        if (!username) { Alert.alert("خطا", "نام کاربری یافت نشد. لطفاً وارد شوید."); return; }
        try {
            await AsyncStorage.setItem(draftKey, JSON.stringify({ data: answersRef.current, _ts: Date.now() }));
            Alert.alert("موفق", "پاسخ‌ها به صورت پیش‌نویس ذخیره شدند.");
        } catch {
            Alert.alert("خطا", "ذخیره پیش‌نویس با خطا مواجه شد.");
        }
    }, [draftKey, username]);

    const saveResponse = useCallback(async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const answerArray: Answer[] = [];
            for (const [qIdStr, val] of Object.entries(answers)) {
                const qId = Number(qIdStr);
                const q = byId[qId];
                if (!q) continue;
                if (q.type === "TABLE" && Array.isArray(val)) {
                    val.forEach((row: any, rowIdx: number) => {
                        Object.entries(row).forEach(([childKey, childVal]) => {
                            if (childKey === "rowGroupId") return;
                            answerArray.push({ questionId: Number(childKey), value: childVal, rowGroupId: rowIdx });
                        });
                    });
                } else {
                    answerArray.push({ questionId: qId, value: val, rowGroupId: null });
                }
            }
            const res = await api.put(`/forms/${formId}/responses`, { renovationCode, answers: answerArray });
            const json = res.data;
            if (!json?.success) throw new Error(json?.message || "خطا در ذخیره");
            await AsyncStorage.removeItem(draftKey);
            setShowPreview(false);
            setSubmitted(true);
            const formType = form?.formType === "PIP" ? "PIP" : "FIRECHECKLIST";
            onSaved?.(json.data.id, formType);
        } catch (e: any) {
            Alert.alert("خطا", e?.message || "خطا در ذخیره پاسخ");
        } finally {
            setSaving(false);
        }
    }, [answers, byId, canSave, formId, renovationCode, form, draftKey, onSaved]);

    const renderInput = (q: FlatQuestion) => {
        const strVal = answers[q.id] !== undefined && answers[q.id] !== null ? String(answers[q.id]) : "";
        switch (q.type) {
            case "TEXT":
                return <TextInputField qId={q.id} value={strVal} multiline placeholder="پاسخ خود را بنویسید" onChangeText={(text) => updateAnswer(q.id, text, q.question, q.type)} hasError={!!fieldErrors[q.id]} errorMessage={fieldErrors[q.id]} />;
            case "NUMBER":
                return <TextInputField qId={q.id} value={strVal} keyboardType="numeric" placeholder="عدد را وارد کنید" onChangeText={(text) => updateAnswer(q.id, text === "" ? undefined : Number(text), q.question, q.type)} hasError={!!fieldErrors[q.id]} errorMessage={fieldErrors[q.id]} />;
            case "EMAIL":
                return <TextInputField qId={q.id} value={strVal} keyboardType="email-address" placeholder="ایمیل خود را وارد کنید" onChangeText={(text) => updateAnswer(q.id, text, q.question, q.type)} hasError={!!fieldErrors[q.id]} errorMessage={fieldErrors[q.id]} />;
            case "PHONE":
                return <TextInputField qId={q.id} value={strVal} keyboardType="phone-pad" placeholder="شماره تلفن را وارد کنید" onChangeText={(text) => updateAnswer(q.id, text, q.question, q.type)} hasError={!!fieldErrors[q.id]} errorMessage={fieldErrors[q.id]} />;
            case "POSTALCODE":
                return <TextInputField qId={q.id} value={strVal} keyboardType="numeric" placeholder="کد پستی را وارد کنید" onChangeText={(text) => updateAnswer(q.id, text, q.question, q.type)} hasError={!!fieldErrors[q.id]} errorMessage={fieldErrors[q.id]} />;
            case "RENOVATIONCODE":
                return <TextInputField qId={q.id} value={strVal} placeholder="کد نوسازی را وارد کنید" onChangeText={(text) => updateAnswer(q.id, text, q.question, q.type)} />;
            case "DATE":
                return <DatePickerModalCustom value={answers[q.id]} onChange={(date) => updateAnswer(q.id, date, q.question, "DATE")} label="انتخاب تاریخ" />;
            case "DATETIME":
                return <DatePickerModalCustom value={answers[q.id]} onChange={(date) => updateAnswer(q.id, date, q.question, "DATETIME")} label="تاریخ و زمان" />;
            case "LOCATION":
                return (
                    <View style={styles.locationBox}>
                        <TextInput style={[styles.input, styles.inputRtl, { flex: 1 }]} value={answers[q.id]?.lat ? String(answers[q.id].lat) : ""} onChangeText={(text) => updateAnswer(q.id, { ...(answers[q.id] || {}), lat: parseFloat(text) }, q.question, "LOCATION")} placeholder="latitude" keyboardType="numeric" placeholderTextColor="#9CA3AF" textAlign="right" />
                        <TextInput style={[styles.input, { flex: 1 }]} value={answers[q.id]?.lng ? String(answers[q.id].lng) : ""} onChangeText={(text) => updateAnswer(q.id, { ...(answers[q.id] || {}), lng: parseFloat(text) }, q.question, "LOCATION")} placeholder="longitude" keyboardType="numeric" placeholderTextColor="#9CA3AF" textAlign="right" />
                    </View>
                );
            case "SINGLE_CHOICE":
                return <SingleChoiceField q={q} selectedValue={answers[q.id]} onSelect={(val) => updateAnswer(q.id, val)} />;
            case "MULTIPLE_CHOICE":
                return <MultipleChoiceField q={q} selectedValues={Array.isArray(answers[q.id]) ? answers[q.id] : []} onToggle={(opt) => { const curr = Array.isArray(answers[q.id]) ? [...answers[q.id]] : []; updateAnswer(q.id, curr.includes(opt) ? curr.filter((o: string) => o !== opt) : [...curr, opt]); }} />;
            case "TABLE":
                return <TableField q={q} rows={Array.isArray(answers[q.id]) ? answers[q.id] : []} onAddRow={addTableRow} onUpdateCell={updateTableRow} onRemoveRow={removeTableRow} />;
            case "STATION":
            case "ZONE":
                return <TextInputField qId={q.id} value={strVal} onChangeText={(text) => updateAnswer(q.id, text, q.question, q.type)} placeholder={`انتخاب ${q.type === "STATION" ? "ایستگاه" : "منطقه"}`} />;
            case "PICTURE":
            case "FILE":
                return <FileUploader questionId={q.id} type={q.type} onUploadComplete={(url) => updateAnswer(q.id, url, q.question, q.type)} existingUrl={answers[q.id]} />;
            default:
                return <Text style={{ color: "#9CA3AF", textAlign: "right" }}>نوع سوال پشتیبانی نشده است</Text>;
        }
    };

    const renderContent = () => {
        if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3e5c76" /><Text style={styles.loadingText}>در حال بارگذاری...</Text></View>;
        if (error || !form) return <View style={styles.center}><Text style={styles.errorState}>{error || "فرمی یافت نشد"}</Text><TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeButtonText}>بستن</Text></TouchableOpacity></View>;
        if (submitted) return (
            <View style={[styles.center, { flex: 1 }]}>
                <View style={styles.successIcon}><Text style={{ fontSize: 36 }}>✓</Text></View>
                <Text style={styles.successTitle}>فرم با موفقیت ثبت شد</Text>
                <Text style={styles.successSub}>اطلاعات فرم {form.formType} ذخیره شده است</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeButtonText}>بستن</Text></TouchableOpacity>
            </View>
        );

        return (
            <>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        {onClose && <TouchableOpacity onPress={onClose} style={styles.closeIconButton}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>}
                        {form.description && <Text style={styles.formTitle}>{form.description}</Text>}
                    </View>
                </View>

                <View style={styles.progressContainer}><View style={[styles.progressBar, { width: `${progress}%` }]} /></View>

                <View style={styles.mainContent}>
                    {Platform.OS !== 'web' && (
                        <TouchableOpacity style={styles.sidebarToggle} onPress={() => setSidebarVisible(!sidebarVisible)}>
                            <Text style={styles.sidebarToggleText}>{sidebarVisible ? 'پنهان کردن فهرست' : 'نمایش فهرست سوالات'}</Text>
                        </TouchableOpacity>
                    )}
                    <View style={[styles.sidebar, Platform.OS !== 'web' && !sidebarVisible && styles.sidebarHidden]}>
                        <FlatList
                            data={flatQuestions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={[styles.sidebarItem, currentQuestionIdx === index && styles.sidebarItemActive, item.isChild && styles.sidebarChildItem]}
                                    onPress={() => { setCurrentQuestionIdx(index); if (Platform.OS !== 'web') setSidebarVisible(false); }}
                                >
                                    <Text style={[styles.sidebarItemText, currentQuestionIdx === index && styles.sidebarItemTextActive]}>{item.isChild ? '  └ ' : ''}{item.question}</Text>
                                    {!isAnswerProvided(answers[item.id]) && item.isRequired && <Text style={styles.requiredStar}>*</Text>}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>

                    <ScrollView style={styles.questionArea} showsVerticalScrollIndicator={false}>
                        {currentQuestion && (
                            <View style={styles.questionCard}>
                                <View style={styles.questionHeader}>
                                    <Text style={styles.stepIndicator}>سوال {stepNumStr}</Text>
                                    <Text style={styles.groupBadge}>{currentGroup?.name || 'عمومی'}</Text>
                                </View>
                                <Text style={styles.questionText}>{currentQuestion.question}{currentQuestion.isRequired && <Text style={styles.requiredStar}> *</Text>}</Text>
                                {currentQuestion.description && <Text style={styles.questionDescription}>{currentQuestion.description}</Text>}
                                <View style={styles.inputContainer}>{renderInput(currentQuestion)}</View>
                            </View>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerButtons}>
                        <TouchableOpacity style={[styles.footerButton, styles.draftButton]} onPress={saveDraft}>
                            <Text style={styles.draftButtonText}>ذخیره پیش‌نویس</Text>
                        </TouchableOpacity>
                        <View style={styles.navButtons}>
                            <TouchableOpacity style={[styles.navButton, currentQuestionIdx === 0 && styles.navButtonDisabled]} onPress={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))} disabled={currentQuestionIdx === 0}>
                                <Text style={styles.navButtonText}>قبلی</Text>
                            </TouchableOpacity>
                            {!isLastQuestion ? (
                                <TouchableOpacity style={styles.navButton} onPress={() => setCurrentQuestionIdx(prev => prev + 1)}>
                                    <Text style={styles.navButtonText}>بعدی</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.navButton, styles.previewButton]} onPress={() => setShowPreview(true)}>
                                    <Text style={styles.navButtonText}>پیش‌نمایش</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {showPreview && (
                    <View style={styles.previewOverlay}>
                        <View style={styles.previewContainer}>
                            <View style={styles.previewHeader}>
                                <Text style={styles.previewTitle}>پیش‌نمایش پاسخ‌ها</Text>
                                <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewCloseButton}><Text style={styles.previewCloseIcon}>✕</Text></TouchableOpacity>
                            </View>
                            <ScrollView style={styles.previewContent}>
                                {flatQuestions.map((q) => {
                                    const answer = answers[q.id];
                                    if (!isAnswerProvided(answer)) return null;
                                    let displayValue = '';
                                    if (q.type === 'TABLE' && Array.isArray(answer)) displayValue = `${answer.length} ردیف`;
                                    else if (Array.isArray(answer)) displayValue = answer.join('، ');
                                    else if (typeof answer === 'object') displayValue = JSON.stringify(answer);
                                    else displayValue = String(answer);
                                    return (
                                        <View key={q.id} style={styles.previewItem}>
                                            <Text style={styles.previewQuestion}>{q.question}</Text>
                                            <Text style={styles.previewAnswer}>{displayValue}</Text>
                                        </View>
                                    );
                                })}
                                {requiredUnanswered.length > 0 && (
                                    <View style={styles.previewWarning}><Text style={styles.previewWarningText}>⚠️ {requiredUnanswered.length} سوال اجباری پاسخ داده نشده</Text></View>
                                )}
                            </ScrollView>
                            <View style={styles.previewFooter}>
                                <TouchableOpacity style={[styles.previewButton, styles.previewCancelButton]} onPress={() => setShowPreview(false)}>
                                    <Text style={styles.previewCancelButtonText}>بازگشت</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.previewButton, styles.previewConfirmButton, (!canSave || saving) && styles.previewButtonDisabled]} onPress={saveResponse} disabled={!canSave || saving}>
                                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.previewConfirmButtonText}>ثبت نهایی</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </>
        );
    };

    return (
        <Modal animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: Platform.OS === 'web' ? '90%' : '95%', maxWidth: 1200, height: Platform.OS === 'web' ? '90%' : '95%', backgroundColor: '#f5f5f5', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 24 },
    closeIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeIcon: { fontSize: 18, color: '#666', fontWeight: '500' },
    closeButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3e5c76', borderRadius: 8 },
    closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    previewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    previewContainer: { width: Platform.OS === 'web' ? '600px' as any : '90%', maxWidth: 600, maxHeight: '80%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 24 },
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
    previewTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    previewCloseButton: { padding: 8 },
    previewCloseIcon: { fontSize: 20, color: '#666' },
    previewContent: { padding: 16, maxHeight: 400, backgroundColor: '#fff' },
    previewItem: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    previewQuestion: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
    previewAnswer: { fontSize: 14, color: '#666', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6 },
    previewWarning: { backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, marginTop: 8 },
    previewWarningText: { color: '#856404', fontSize: 14, textAlign: 'center' },
    previewFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
    previewButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
    previewCancelButton: { backgroundColor: '#f5f5f5' },
    previewCancelButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
    previewConfirmButton: { backgroundColor: '#3e5c76' },
    previewConfirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    previewButtonDisabled: { opacity: 0.5 },
    root: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    errorState: { fontSize: 16, color: '#dc2626', textAlign: 'center' },
    header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerText: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' },
    formTitle: { fontSize: 16, fontWeight: '800', color: "#000000", textAlign: 'right', flex: 1 },
    progressContainer: { height: 4, backgroundColor: '#e0e0e0' },
    progressBar: { height: '100%', backgroundColor: '#3e5c76' },
    mainContent: { flex: 1, flexDirection: 'row' },
    sidebarToggle: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    sidebarToggleText: { fontSize: 14, color: '#3e5c76', textAlign: 'center' },
    sidebar: { width: 250, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#e5e7eb' },
    sidebarHidden: { display: 'none' },
    sidebarItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sidebarChildItem: { paddingRight: 24, backgroundColor: '#fafafa' },
    sidebarItemActive: { backgroundColor: '#E8F0F6', borderRightWidth: 3, borderRightColor: '#3e5c76' },
    sidebarItemText: { fontSize: 13, color: '#666', flex: 1 },
    sidebarItemTextActive: { color: '#3e5c76', fontWeight: '500' },
    questionArea: { flex: 1, padding: 16 },
    questionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    stepIndicator: { fontSize: 14, fontWeight: '600', color: '#3e5c76' },
    groupBadge: { fontSize: 12, color: '#888', backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    questionText: { fontSize: 18, fontWeight: '500', color: '#333', marginBottom: 8 },
    questionDescription: { fontSize: 14, color: '#888', marginBottom: 16 },
    inputContainer: { marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff', marginBottom: 8 },
    inputError: { borderColor: '#dc2626' },
    textarea: { minHeight: 100, textAlignVertical: 'top' },
    errorText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
    choiceGroup: { marginTop: 8 },
    choiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
    choiceRowSelected: { backgroundColor: '#E8F0F6', borderColor: '#3e5c76' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#3e5c76', marginLeft: 12 },
    radioSelected: { backgroundColor: '#3e5c76' },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#3e5c76', marginLeft: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#3e5c76' },
    choiceLabel: { fontSize: 16, color: '#333', flex: 1 },
    choiceLabelSelected: { color: '#3e5c76', fontWeight: '500' },
    locationBox: { flexDirection: 'row', gap: 8 },
    requiredStar: { color: '#dc2626', fontSize: 16, marginLeft: 4 },
    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    footerButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    draftButton: { backgroundColor: '#f5f5f5' },
    draftButtonText: { color: '#666', fontSize: 14 },
    navButtons: { flexDirection: 'row', gap: 8 },
    navButton: { backgroundColor: '#3e5c76', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: 'center' },
    navButtonDisabled: { backgroundColor: '#ccc' },
    navButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    successTitle: { fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 8 },
    successSub: { fontSize: 16, color: '#666', textAlign: 'center' },
    inputRtl: { textAlign: "right", writingDirection: "rtl" },
    tableWrapper: { borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', overflow: 'hidden', marginTop: 8 },
    tableTopBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tableRowCount: { fontSize: 13, color: '#888', textAlign: 'right' },
    tableScrollView: { maxHeight: 420 },
    tableContainer: { minWidth: '100%' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f0f4ff', borderBottomWidth: 2, borderBottomColor: '#d0d9f0' },
    tableHeaderCell: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#d0d9f0' },
    tableHeaderCellText: { fontSize: 13, fontWeight: '700', color: '#3b4a6b', textAlign: 'right' },
    tableHeaderRequired: { color: '#dc2626', fontSize: 14, fontWeight: '700' },
    tableBodyRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    tableBodyRowEven: { backgroundColor: '#fff' },
    tableBodyRowOdd: { backgroundColor: '#fafbff' },
    tableBodyCell: { paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
    tableIndexCell: { width: 48, alignItems: 'center', justifyContent: 'center' },
    tableDataCell: { minWidth: 140, maxWidth: 220 },
    tableActionCell: { width: 56, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0 },
    tableRowBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef1fb', justifyContent: 'center', alignItems: 'center' },
    tableRowBadgeText: { fontSize: 12, fontWeight: '700', color: '#3b4a6b' },
    tableCellInput: { borderWidth: 1, borderColor: '#dde3ee', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, fontSize: 14, backgroundColor: '#fff', color: '#333' },
    tableCellChoiceGroup: { gap: 4 },
    tableCellChoiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4, backgroundColor: '#fff' },
    tableCellChoiceRowSelected: { backgroundColor: '#fee7e0', borderColor: '#3e5c76' },
    tableCellRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#3e5c76', marginLeft: 8 },
    tableCellRadioSelected: { backgroundColor: '#3e5c76' },
    tableCellCheckbox: { width: 16, height: 16, borderRadius: 3, borderWidth: 2, borderColor: '#3e5c76', marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
    tableCellCheckboxChecked: { backgroundColor: '#3e5c76' },
    tableCellCheckmark: { color: '#fff', fontSize: 10, fontWeight: '700' },
    tableCellChoiceLabel: { fontSize: 13, color: '#444', flex: 1 },
    tableCellChoiceLabelSelected: { color: '#3e5c76', fontWeight: '500' },
    tableCellUnsupported: { fontSize: 12, color: '#aaa', fontStyle: 'italic', textAlign: 'center' },
    tableEmptyRow: { paddingVertical: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafbff' },
    tableEmptyText: { fontSize: 13, color: '#aaa', textAlign: 'center' },
    tableDeleteButton: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    tableDeleteIcon: { fontSize: 16 },
    tableAddRowButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f5f7ff', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 6 },
    tableAddRowIcon: { fontSize: 18, color: '#3e5c76', fontWeight: '700' },
    tableAddRowText: { fontSize: 14, color: '#3e5c76', fontWeight: '600' },
});
