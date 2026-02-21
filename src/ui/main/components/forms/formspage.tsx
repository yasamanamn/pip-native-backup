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

const DEFAULT_VERSION = "01";

const normalizeVersionValue = (value: string | number | null | undefined) => {
    const digits = value == null ? "" : String(value).replace(/[^0-9]/g, "");
    return digits ? digits.padStart(2, "0") : DEFAULT_VERSION;
};

type QuestionType =
    | "TEXT"
    | "PICTURE"
    | "NUMBER"
    | "FILE"
    | "MULTIPLE_CHOICE"
    | "SINGLE_CHOICE"
    | "TABLE"
    | "DATE"
    | "DATETIME"
    | "PHONE"
    | "RENOVATIONCODE"
    | "POSTALCODE"
    | "LOCATION"
    | "EMAIL"
    | "STATION"
    | "ZONE";

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

function validateAnswer(
    value: any,
    type: string,
    label?: string
): { isValid: boolean; message?: string } {
    if (type === "EMAIL") {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRe.test(value))
            return { isValid: false, message: "ایمیل معتبر نیست" };
    }
    if (type === "PHONE") {
        const phoneRe = /^[0-9+\-() ]{7,15}$/;
        if (value && !phoneRe.test(value))
            return { isValid: false, message: "شماره تلفن معتبر نیست" };
    }
    if (type === "POSTALCODE") {
        if (value && String(value).replace(/\D/g, "").length !== 10)
            return { isValid: false, message: "کد پستی باید ۱۰ رقم باشد" };
    }
    return { isValid: true };
}

interface Props {
    formId: number;
    renovationCode: string;
    username?: string;
    initialFormData?: FormData | null;
    onSaved?: (responseId: number, formType: string) => void;
    onClose?: () => void;
}
export default function FormResponsePage({
    formId,
    renovationCode,
    username = "",
    initialFormData,
    onSaved,
    onClose,
}: Props) {
    const [form, setForm] = useState<FormData | null>(
        initialFormData && initialFormData !== null ? initialFormData : null
    );
    const [loading, setLoading] = useState(
        initialFormData === null || initialFormData === undefined
    );
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (initialFormData && typeof initialFormData === "object") {
            setForm({
                ...initialFormData,
                version: normalizeVersionValue(initialFormData.version),
                questionGroups: Array.isArray(initialFormData.questionGroups)
                    ? initialFormData.questionGroups
                    : [],
            });
            setLoading(false);
        }
    }, [initialFormData]);

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

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    /* ── Build flatQuestions ── */
    const { flatQuestions, byId, childrenByParent } = useMemo(() => {
        if (!form || !Array.isArray(form.questionGroups))
            return {
                flatQuestions: [] as FlatQuestion[],
                byId: {} as Record<number, FlatQuestion>,
                childrenByParent: {} as Record<number, FlatQuestion[]>,
            };

        const flat: FlatQuestion[] = [];
        const byId: Record<number, FlatQuestion> = {};
        const childrenByParent: Record<number, FlatQuestion[]> = {};

        form.questionGroups.forEach((g) => {
            g.questions.forEach((q) => {
                const parent: FlatQuestion = {
                    id: q.id,
                    groupId: g.id,
                    groupName: g.name,
                    question: q.question,
                    description: q.description,
                    type: q.type,
                    isRequired: q.isRequired,
                    options: q.options,
                    parentId: q.parentId,
                    isChild: false,
                    children: [],
                };
                flat.push(parent);
                byId[parent.id] = parent;

                if (q.type === "TABLE" && Array.isArray(q.children)) {
                    childrenByParent[parent.id] = [];
                    q.children.forEach((c) => {
                        const childFlat: FlatQuestion = {
                            id: c.id,
                            groupId: g.id,
                            groupName: g.name,
                            question: c.question,
                            description: c.description,
                            type: c.type,
                            isRequired: c.isRequired,
                            options: c.options,
                            parentId: parent.id,
                            isChild: true,
                        };
                        childrenByParent[parent.id].push(childFlat);
                        parent.children?.push(childFlat);
                        byId[childFlat.id] = childFlat;
                    });
                }
            });
        });
        return { flatQuestions: flat, byId, childrenByParent };
    }, [form]);

    const normalizeAnswers = useCallback(
        (rawAnswers: any[] | undefined) => {
            const result: Record<number, any> = {};
            if (!rawAnswers || !Array.isArray(rawAnswers)) return result;
            for (const a of rawAnswers) {
                const qId: number = a.questionId;
                if (a.rowGroupId !== null && a.rowGroupId !== undefined) {
                    const parentId = byId[qId]?.parentId;
                    if (!parentId) continue;
                    if (!result[parentId]) result[parentId] = [];
                    let row = result[parentId].find((r: any) => r.rowGroupId === a.rowGroupId);
                    if (!row) {
                        row = { rowGroupId: a.rowGroupId };
                        result[parentId].push(row);
                    }
                    row[qId] = a.value;
                } else {
                    result[qId] = a.value;
                }
            }
            return result;
        },
        [byId, childrenByParent]
    );

    useEffect(() => {
        if (initialFormData !== undefined) return;
        if (!formId) return;
        let cancelled = false;
        (async () => {
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
                    setLoading(false);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message || "خطا در بارگذاری فرم");
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [formId, initialFormData]);

    useEffect(() => {
        if (!form || !Object.keys(byId).length) return;
        let cancelled = false;
        (async () => {
            try {
                const draftRaw = await AsyncStorage.getItem(draftKey);
                if (draftRaw) {
                    const parsed = JSON.parse(draftRaw);
                    const now = Date.now();
                    const ttlMs = 3 * 24 * 60 * 60 * 1000;
                    if (parsed?._ts && now - parsed._ts > ttlMs) {
                        await AsyncStorage.removeItem(draftKey);
                    } else if (parsed?.data) {
                        if (!cancelled) setAnswers(parsed.data);
                    }
                }
                const res = await api.get(`/buildings/${encodeURIComponent(renovationCode)}`);
                const json = res.data;
                if (!cancelled) {
                    const response = json?.data?.responses?.find((r: any) => r.formId === form.id);
                    if (response) {
                        const normalized = normalizeAnswers(response.answers);
                        setAnswers(normalized);
                    }
                }
            } catch (e: any) {
                console.log("load responses:", e?.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [form, byId, draftKey, renovationCode, normalizeAnswers]);

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
                return !ans.every((row: any) =>
                    q.children?.every((child) => {
                        if (!child.isRequired) return true;
                        return isAnswerProvided(row[child.id]);
                    })
                );
            }
            return !isAnswerProvided(ans);
        });
    }, [answers, flatQuestions]);

    const hasErrors = Object.keys(fieldErrors).filter((k) => fieldErrors[+k]).length > 0;
    const canSave = requiredUnanswered.length === 0 && !hasErrors;

    const updateAnswer = useCallback(
        (questionId: number, value: any, questionText?: string, type?: string) => {
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
        },
        [byId]
    );

    const addTableRow = useCallback((questionId: number) => {
        setAnswers((prev) => {
            const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
            const question = byId[questionId];
            const newRow: any = { rowGroupId: current.length };
            question?.children?.forEach((child) => {
                newRow[child.id] = child.type === "MULTIPLE_CHOICE" ? [] : "";
            });
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
            const payload = { data: answersRef.current, _ts: Date.now() };
            await AsyncStorage.setItem(draftKey, JSON.stringify(payload));
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


    const TextInputField = ({
        qId, multiline = false, keyboardType = "default", placeholder,
    }: { qId: number; multiline?: boolean; keyboardType?: any; placeholder?: string }) => (
        <View>
            <TextInput
                style={[
                    styles.input,
                    styles.inputRtl,
                    multiline && styles.textarea,
                    fieldErrors[qId] ? styles.inputError : null
                ]} value={answers[qId] !== undefined && answers[qId] !== null ? String(answers[qId]) : ""}
                onChangeText={(text) => {
                    const val = byId[qId]?.type === "NUMBER" ? (text === "" ? undefined : Number(text)) : text;
                    updateAnswer(qId, val, byId[qId]?.question, byId[qId]?.type);
                }}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                keyboardType={keyboardType}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                textAlign="left"
            />
            {fieldErrors[qId] ? <Text style={styles.errorText}>{fieldErrors[qId]}</Text> : null}
        </View>
    );

    const SingleChoiceField = ({ q }: { q: FlatQuestion }) => (
        <View style={styles.choiceGroup}>
            {(q.options || []).map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                        onPress={() => updateAnswer(q.id, opt)}
                    >
                        <View style={[styles.radio, selected && styles.radioSelected]} />
                        <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{opt}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const MultipleChoiceField = ({ q }: { q: FlatQuestion }) => (
        <View style={styles.choiceGroup}>
            {(q.options || []).map((opt) => {
                const current = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                const checked = current.includes(opt);
                return (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.choiceRow, checked && styles.choiceRowSelected]}
                        onPress={() => {
                            const curr = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];
                            updateAnswer(q.id, checked ? curr.filter((o: string) => o !== opt) : [...curr, opt]);
                        }}
                    >
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>}
                        </View>
                        <Text style={[styles.choiceLabel, checked && styles.choiceLabelSelected]}>{opt}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const TableField = ({ q }: { q: FlatQuestion }) => {
        const rows: any[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
        return (
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.tableHeaderText, { width: 40 }]}>ردیف</Text>
                            {q.children?.map((child) => (
                                <Text key={child.id} style={[styles.tableCell, styles.tableHeaderText, { minWidth: 120 }]}>
                                    {child.question}{child.isRequired ? <Text style={{ color: "#EF4444" }}> *</Text> : null}
                                </Text>
                            ))}
                            <Text style={[styles.tableCell, styles.tableHeaderText, { width: 60 }]}>عملیات</Text>
                        </View>
                        {rows.map((row, rowIdx) => (
                            <View key={rowIdx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: 40, textAlign: "center" }]}>{rowIdx + 1}</Text>
                                {q.children?.map((child) => (
                                    <View key={child.id} style={[styles.tableCell, { minWidth: 120 }]}>
                                        {["TEXT", "NUMBER", "EMAIL", "PHONE", "POSTALCODE"].includes(child.type) ? (
                                            <TextInput
                                                style={[styles.input, styles.inputRtl, { marginBottom: 0 }]} value={row[child.id] !== undefined ? String(row[child.id]) : ""}
                                                onChangeText={(text) => updateTableRow(q.id, rowIdx, child.id, text)}
                                                keyboardType={child.type === "NUMBER" ? "numeric" : "default"}
                                                textAlign="right"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        ) : child.type === "SINGLE_CHOICE" ? (
                                            <View>
                                                {(child.options || []).map((opt) => (
                                                    <TouchableOpacity key={opt} style={styles.choiceRow} onPress={() => updateTableRow(q.id, rowIdx, child.id, opt)}>
                                                        <View style={[styles.radio, row[child.id] === opt && styles.radioSelected]} />
                                                        <Text style={styles.choiceLabel}>{opt}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ) : child.type === "MULTIPLE_CHOICE" ? (
                                            <View>
                                                {(child.options || []).map((opt) => {
                                                    const curr = Array.isArray(row[child.id]) ? row[child.id] : [];
                                                    const checked = curr.includes(opt);
                                                    return (
                                                        <TouchableOpacity key={opt} style={styles.choiceRow} onPress={() => {
                                                            updateTableRow(q.id, rowIdx, child.id, checked ? curr.filter((o: string) => o !== opt) : [...curr, opt]);
                                                        }}>
                                                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                                                {checked && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
                                                            </View>
                                                            <Text style={styles.choiceLabel}>{opt}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        ) : (
                                            <Text style={{ color: "#9CA3AF", fontSize: 12 }}>پشتیبانی نشده</Text>
                                        )}
                                    </View>
                                ))}
                                <View style={[styles.tableCell, { width: 60 }]}>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeTableRow(q.id, rowIdx)}>
                                        <Text style={styles.deleteBtnText}>حذف</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
                <TouchableOpacity style={styles.addRowBtn} onPress={() => addTableRow(q.id)}>
                    <Text style={styles.addRowBtnText}>+ افزودن ردیف</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderInput = (q: FlatQuestion) => {
        switch (q.type) {
            case "TEXT":
                return <TextInputField qId={q.id} multiline placeholder="پاسخ خود را بنویسید" />;
            case "NUMBER":
                return <TextInputField qId={q.id} keyboardType="numeric" placeholder="عدد را وارد کنید" />;
            case "EMAIL":
                return <TextInputField qId={q.id} keyboardType="email-address" placeholder="ایمیل خود را وارد کنید" />;
            case "PHONE":
                return <TextInputField qId={q.id} keyboardType="phone-pad" placeholder="شماره تلفن را وارد کنید" />;
            case "POSTALCODE":
                return <TextInputField qId={q.id} keyboardType="numeric" placeholder="کد پستی را وارد کنید" />;
            case "RENOVATIONCODE":
                return <TextInputField qId={q.id} placeholder="کد بازسازی را وارد کنید" />;
            case "DATE":
                return (
                    <View>
                        <TextInput
                            style={[styles.input, styles.inputRtl]} value={answers[q.id] ?? ""}
                            onChangeText={(text) => updateAnswer(q.id, text, q.question, "DATE")}
                            placeholder="تاریخ (YYYY/MM/DD)"
                            placeholderTextColor="#9CA3AF"
                            textAlign="right"
                        />
                        <Text style={styles.hintText}>فرمت: YYYY/MM/DD</Text>
                    </View>
                );
            case "DATETIME":
                return (
                    <TextInput
                        style={[styles.input, styles.inputRtl]} value={answers[q.id] ?? ""}
                        onChangeText={(text) => updateAnswer(q.id, text, q.question, "DATETIME")}
                        placeholder="تاریخ و زمان (YYYY/MM/DD HH:mm)"
                        placeholderTextColor="#9CA3AF"
                        textAlign="right"
                    />
                );
            case "LOCATION":
                return (
                    <View style={styles.locationBox}>
                        <TextInput
                            style={[styles.input, styles.inputRtl, { flex: 1 }]} value={answers[q.id]?.lat ? String(answers[q.id].lat) : ""}
                            onChangeText={(text) => updateAnswer(q.id, { ...(answers[q.id] || {}), lat: parseFloat(text) }, q.question, "LOCATION")}
                            placeholder="latitude"
                            keyboardType="numeric"
                            placeholderTextColor="#9CA3AF"
                            textAlign="right"
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={answers[q.id]?.lng ? String(answers[q.id].lng) : ""}
                            onChangeText={(text) => updateAnswer(q.id, { ...(answers[q.id] || {}), lng: parseFloat(text) }, q.question, "LOCATION")}
                            placeholder="longitude"
                            keyboardType="numeric"
                            placeholderTextColor="#9CA3AF"
                            textAlign="right"
                        />
                    </View>
                );
            case "SINGLE_CHOICE":
                return <SingleChoiceField q={q} />;
            case "MULTIPLE_CHOICE":
                return <MultipleChoiceField q={q} />;
            case "TABLE":
                return <TableField q={q} />;
            case "STATION":
            case "ZONE":
                return <TextInputField qId={q.id} placeholder={`انتخاب ${q.type === "STATION" ? "ایستگاه" : "منطقه"}`} />;
            case "PICTURE":
            case "FILE":
                return (
                    <View style={styles.filePlaceholder}>
                        <Text style={styles.filePlaceholderIcon}>{q.type === "PICTURE" ? "📷" : "📎"}</Text>
                        <Text style={styles.filePlaceholderText}>
                            {q.type === "PICTURE" ? "انتخاب تصویر" : "انتخاب فایل"}
                        </Text>
                        <Text style={styles.filePlaceholderSub}>از react-native-image-picker استفاده کنید</Text>
                    </View>
                );
            default:
                return <Text style={{ color: "#9CA3AF", textAlign: "right" }}>نوع سوال پشتیبانی نشده است</Text>;
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#d95d39" />
                    <Text style={styles.loadingText}>در حال بارگذاری...</Text>
                </View>
            );
        }

        if (error || !form) {
            return (
                <View style={styles.center}>
                    <Text style={styles.errorState}>{error || "فرمی یافت نشد"}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>بستن</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (submitted) {
            return (
                <View style={[styles.center, { flex: 1 }]}>
                    <View style={styles.successIcon}>
                        <Text style={{ fontSize: 36 }}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>فرم با موفقیت ثبت شد</Text>
                    <Text style={styles.successSub}>اطلاعات فرم {form.formType} ذخیره شده است</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>بستن</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <>
 
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        {onClose && (
                            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        )}

                        {form.description && (
                            <Text style={styles.formTitle}>{form.description}</Text>
                        )}
                    </View>

                    <View style={styles.headerText}>
                        <Text style={styles.formTag}>{form.code ?? form.formType}</Text>
                        {/* <Text style={styles.formVersion}>نسخه {form.version}</Text> */}
                    </View>
                </View>



                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>

                {/* Main content area - flexible layout */}
                <View style={styles.mainContent}>
                    {/* Sidebar toggle for mobile */}
                    {Platform.OS !== 'web' && (
                        <TouchableOpacity
                            style={styles.sidebarToggle}
                            onPress={() => setSidebarVisible(!sidebarVisible)}
                        >
                            <Text style={styles.sidebarToggleText}>
                                {sidebarVisible ? 'پنهان کردن فهرست' : 'نمایش فهرست سوالات'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Sidebar - hidden on mobile unless toggled */}
                    <View style={[
                        styles.sidebar,
                        Platform.OS !== 'web' && !sidebarVisible && styles.sidebarHidden
                    ]}>
                        <FlatList
                            data={flatQuestions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.sidebarItem,
                                        currentQuestionIdx === index && styles.sidebarItemActive,
                                        item.isChild && styles.sidebarChildItem
                                    ]}
                                    onPress={() => {
                                        setCurrentQuestionIdx(index);
                                        if (Platform.OS !== 'web') setSidebarVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.sidebarItemText,
                                        currentQuestionIdx === index && styles.sidebarItemTextActive
                                    ]}>
                                        {item.isChild ? '  └ ' : ''}{item.question}
                                    </Text>
                                    {!isAnswerProvided(answers[item.id]) && item.isRequired && (
                                        <Text style={styles.requiredStar}>*</Text>
                                    )}
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
                                <Text style={styles.questionText}>
                                    {currentQuestion.question}
                                    {currentQuestion.isRequired && <Text style={styles.requiredStar}> *</Text>}
                                </Text>
                                {currentQuestion.description && (
                                    <Text style={styles.questionDescription}>{currentQuestion.description}</Text>
                                )}
                                <View style={styles.inputContainer}>
                                    {renderInput(currentQuestion)}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>


                <View style={styles.footer}>
                    <View style={styles.footerButtons}>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.draftButton]}
                            onPress={saveDraft}
                        >
                            <Text style={styles.draftButtonText}>ذخیره پیش‌نویس</Text>
                        </TouchableOpacity>

                        <View style={styles.navButtons}>
                            <TouchableOpacity
                                style={[styles.navButton, currentQuestionIdx === 0 && styles.navButtonDisabled]}
                                onPress={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIdx === 0}
                            >
                                <Text style={styles.navButtonText}>قبلی</Text>
                            </TouchableOpacity>

                            {!isLastQuestion ? (
                                <TouchableOpacity
                                    style={styles.navButton}
                                    onPress={() => setCurrentQuestionIdx(prev => prev + 1)}
                                >
                                    <Text style={styles.navButtonText}>بعدی</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.navButton, styles.previewButton]}
                                    onPress={() => setShowPreview(true)}
                                >
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
                                <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewCloseButton}>
                                    <Text style={styles.previewCloseIcon}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.previewContent}>
                                {flatQuestions.map((q) => {
                                    const answer = answers[q.id];
                                    if (!isAnswerProvided(answer)) return null;

                                    let displayValue = '';
                                    if (q.type === 'TABLE' && Array.isArray(answer)) {
                                        displayValue = `${answer.length} ردیف`;
                                    } else if (Array.isArray(answer)) {
                                        displayValue = answer.join('، ');
                                    } else if (typeof answer === 'object') {
                                        displayValue = JSON.stringify(answer);
                                    } else {
                                        displayValue = String(answer);
                                    }

                                    return (
                                        <View key={q.id} style={styles.previewItem}>
                                            <Text style={styles.previewQuestion}>{q.question}</Text>
                                            <Text style={styles.previewAnswer}>{displayValue}</Text>
                                        </View>
                                    );
                                })}

                                {requiredUnanswered.length > 0 && (
                                    <View style={styles.previewWarning}>
                                        <Text style={styles.previewWarningText}>
                                            ⚠️ {requiredUnanswered.length} سوال اجباری پاسخ داده نشده
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.previewFooter}>
                                <TouchableOpacity
                                    style={[styles.previewButton, styles.previewCancelButton]}
                                    onPress={() => setShowPreview(false)}
                                >
                                    <Text style={styles.previewCancelButtonText}>بازگشت</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.previewButton,
                                        styles.previewConfirmButton,
                                        (!canSave || saving) && styles.previewButtonDisabled
                                    ]}
                                    onPress={saveResponse}
                                    disabled={!canSave || saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.previewConfirmButtonText}>ثبت نهایی</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </>
        );
    };


    return (
        <Modal
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContainer: {
        width: Platform.OS === 'web' ? '90%' : '95%',
        maxWidth: 1200,
        height: Platform.OS === 'web' ? '90%' : '95%',
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 24,
    },
    closeIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    closeIcon: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },

    closeButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#d95d39',
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    previewOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    previewContainer: {
        width: Platform.OS === 'web' ? '600px' : '90%',
        maxWidth: 600,
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 24,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    previewCloseButton: {
        padding: 8,
    },
    previewCloseIcon: {
        fontSize: 20,
        color: '#666',
    },
    previewContent: {
        padding: 16,
        maxHeight: 400,
        backgroundColor: '#fff',
    },
    previewItem: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    previewQuestion: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    previewAnswer: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 6,
    },
    previewWarning: {
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    previewWarningText: {
        color: '#856404',
        fontSize: 14,
        textAlign: 'center',
    },
    previewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    previewButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 6,
    },
    previewCancelButton: {
        backgroundColor: '#f5f5f5',
    },
    previewCancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    previewConfirmButton: {
        backgroundColor: '#d95d39',
    },
    previewConfirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    previewButtonDisabled: {
        opacity: 0.5,
    },

    root: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorState: {
        fontSize: 16,
        color: '#dc2626',
        textAlign: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerText: {
        flexDirection: 'row',
        justifyContent: 'flex-end',  
        alignItems: 'center',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',  
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    headerTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    formTag: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d95d39',
        backgroundColor: '#fee7e0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'flex-start',  
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: "#000000",
        textAlign: 'right',  
        flex: 1,  
    },
    formDescription: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    formVersion: {
        fontSize: 12,
        color: '#999',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#e0e0e0',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#d95d39',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebarToggle: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sidebarToggleText: {
        fontSize: 14,
        color: '#d95d39',
        textAlign: 'center',
    },
    sidebar: {
        width: 250,
        backgroundColor: '#fff',
        borderLeftWidth: 1,
        borderLeftColor: '#e5e7eb',
    },
    sidebarHidden: {
        display: 'none',
    },
    sidebarItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sidebarChildItem: {
        paddingRight: 24,
        backgroundColor: '#fafafa',
    },
    sidebarItemActive: {
        backgroundColor: '#fee7e0',
        borderRightWidth: 3,
        borderRightColor: '#d95d39',
    },
    sidebarItemText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    sidebarItemTextActive: {
        color: '#d95d39',
        fontWeight: '500',
    },
    questionArea: {
        flex: 1,
        padding: 16,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepIndicator: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d95d39',
    },
    groupBadge: {
        fontSize: 12,
        color: '#888',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    questionText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    questionDescription: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    inputContainer: {
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    inputError: {
        borderColor: '#dc2626',
    },
    textarea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 4,
    },
    hintText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    choiceGroup: {
        marginTop: 8,
    },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    choiceRowSelected: {
        backgroundColor: '#fee7e0',
        borderColor: '#d95d39',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#d95d39',
        marginLeft: 12,
    },
    radioSelected: {
        backgroundColor: '#d95d39',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#d95d39',
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#d95d39',
    },
    choiceLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    choiceLabelSelected: {
        color: '#d95d39',
        fontWeight: '500',
    },
    locationBox: {
        flexDirection: 'row',
        gap: 8,
    },
    filePlaceholder: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    filePlaceholderIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    filePlaceholderText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    filePlaceholderSub: {
        fontSize: 12,
        color: '#999',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 2,
        borderBottomColor: '#ddd',
    },
    tableCell: {
        padding: 8,
        borderLeftWidth: 1,
        borderLeftColor: '#e5e7eb',
    },
    tableHeaderText: {
        fontWeight: '600',
        color: '#666',
    },
    addRowBtn: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    addRowBtnText: {
        color: '#666',
        fontSize: 14,
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
        padding: 4,
        borderRadius: 4,
        alignItems: 'center',
    },
    deleteBtnText: {
        color: '#dc2626',
        fontSize: 12,
    },
    requiredStar: {
        color: '#dc2626',
        fontSize: 16,
        marginLeft: 4,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    draftButton: {
        backgroundColor: '#f5f5f5',
    },
    draftButtonText: {
        color: '#666',
        fontSize: 14,
    },
    navButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    navButton: {
        backgroundColor: '#d95d39',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#ccc',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    successSub: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    inputRtl: {
        textAlign: "right",
        writingDirection: "rtl",
    },
});