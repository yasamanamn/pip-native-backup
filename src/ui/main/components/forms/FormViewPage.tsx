import React, { useMemo } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from "react-native";


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

interface Props {
    formData: FormData;
    answers: Record<number, any>;
    onClose?: () => void;
    onCreateNew?: () => void;
}


function formatValue(value: any, type: QuestionType, children?: FlatQuestion[]): React.ReactNode {
    if (value === null || value === undefined || value === "") {
        return <Text style={styles.emptyValue}>—</Text>;
    }

    if (type === "TABLE" && Array.isArray(value)) {
        if (value.length === 0) return <Text style={styles.emptyValue}>بدون ردیف</Text>;
        return <TableAnswer rows={value} columns={children ?? []} />;
    }

    if (type === "PICTURE" || type === "FILE") {
        if (typeof value === "string" && value.startsWith("http")) {
            if (type === "PICTURE") {
                return (
                    <Image
                        source={{ uri: value }}
                        style={styles.imageAnswer}
                        resizeMode="contain"
                    />
                );
            }
            return (
                <Text style={styles.linkValue} numberOfLines={1}>
                    {value}
                </Text>
            );
        }
    }

    if (type === "LOCATION" && typeof value === "object") {
        return (
            <Text style={styles.answerValue}>
                {`lat: ${value.lat ?? "—"}  |  lng: ${value.lng ?? "—"}`}
            </Text>
        );
    }

    if (type === "DATE" || type === "DATETIME") {
        const d = value instanceof Date ? value : new Date(value);
        if (!isNaN(d.getTime())) {
            return (
                <Text style={styles.answerValue}>
                    {d.toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </Text>
            );
        }
    }

    if (Array.isArray(value)) {
        return (
            <View style={styles.badgeRow}>
                {value.map((v, i) => (
                    <View key={i} style={styles.badge}>
                        <Text style={styles.badgeText}>{String(v)}</Text>
                    </View>
                ))}
            </View>
        );
    }

    if (typeof value === "boolean") {
        return <Text style={styles.answerValue}>{value ? "بله" : "خیر"}</Text>;
    }

    return <Text style={styles.answerValue}>{String(value)}</Text>;
}


function TableAnswer({ rows, columns }: { rows: any[]; columns: FlatQuestion[] }) {
    if (columns.length === 0) return null;
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
            <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableHeaderRow}>
                    <View style={[styles.tableHeaderCell, styles.idxCell]}>
                        <Text style={styles.tableHeaderText}>#</Text>
                    </View>
                    {columns.map((col) => (
                        <View key={col.id} style={[styles.tableHeaderCell, styles.dataCell]}>
                            <Text style={styles.tableHeaderText}>{col.question}</Text>
                        </View>
                    ))}
                </View>
                {/* Rows */}
                {rows.map((row, rowIdx) => (
                    <View
                        key={rowIdx}
                        style={[styles.tableBodyRow, rowIdx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                    >
                        <View style={[styles.tableBodyCell, styles.idxCell]}>
                            <View style={styles.idxBadge}>
                                <Text style={styles.idxBadgeText}>{rowIdx + 1}</Text>
                            </View>
                        </View>
                        {columns.map((col) => {
                            const cellVal = row[col.id];
                            return (
                                <View key={col.id} style={[styles.tableBodyCell, styles.dataCell]}>
                                    {Array.isArray(cellVal) ? (
                                        <View style={styles.badgeRow}>
                                            {cellVal.map((v, i) => (
                                                <View key={i} style={styles.badge}>
                                                    <Text style={styles.badgeText}>{String(v)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={styles.tableCellText}>
                                            {cellVal !== undefined && cellVal !== null && cellVal !== ""
                                                ? String(cellVal)
                                                : "—"}
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}


export default function FormViewPage({ formData, answers, onClose, onCreateNew }: Props) {
    const { flatQuestions, byId } = useMemo(() => {
        if (!formData || !Array.isArray(formData.questionGroups))
            return { flatQuestions: [] as FlatQuestion[], byId: {} as Record<number, FlatQuestion> };

        const flat: FlatQuestion[] = [];
        const byId: Record<number, FlatQuestion> = {};

        formData.questionGroups.forEach((g) => {
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
    }, [formData]);

    const groupedQuestions = useMemo(() => {
        const groups: { groupName: string; questions: FlatQuestion[] }[] = [];
        const seen = new Map<string, FlatQuestion[]>();

        flatQuestions.filter((q) => !q.isChild).forEach((q) => {
            if (!seen.has(q.groupName)) {
                const arr: FlatQuestion[] = [];
                seen.set(q.groupName, arr);
                groups.push({ groupName: q.groupName, questions: arr });
            }
            seen.get(q.groupName)!.push(q);
        });

        return groups;
    }, [flatQuestions]);

    const answeredCount = flatQuestions.filter(
        (q) => !q.isChild && answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
    ).length;

    const totalCount = flatQuestions.filter((q) => !q.isChild).length;

    return (
        <Modal animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            {onClose && (
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <Text style={styles.closeBtnText}>✕</Text>
                                </TouchableOpacity>
                            )}
                            <View style={{ flex: 1 }}>
                                {formData.description && (
                                    <Text style={styles.formTitle}>{formData.description}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.statsBar}>
                            <Text style={styles.statsText}>
                                {answeredCount} از {totalCount} سوال پاسخ داده شده
                            </Text>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {groupedQuestions.map((group) => (
                            <View key={group.groupName} style={styles.group}>
                                <View style={styles.groupHeader}>
                                    <Text style={styles.groupTitle}>{group.groupName}</Text>
                                </View>

                                {group.questions.map((q) => {
                                    const val = answers[q.id];
                                    const hasValue =
                                        val !== null &&
                                        val !== undefined &&
                                        val !== "" &&
                                        !(Array.isArray(val) && val.length === 0);

                                    return (
                                        <View key={q.id} style={[styles.qaCard, !hasValue && styles.qaCardEmpty]}>
                                            <View style={styles.questionRow}>
                                                <Text style={styles.questionText}>{q.question}</Text>
                                                {q.isRequired && (
                                                    <View style={styles.requiredPill}>
                                                        <Text style={styles.requiredPillText}>اجباری</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {q.description && (
                                                <Text style={styles.questionDesc}>{q.description}</Text>
                                            )}
                                            <View style={styles.answerBox}>
                                                {formatValue(val, q.type, q.children)}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        <View style={{ height: 32 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        {onCreateNew && (
                            <TouchableOpacity style={styles.createNewBtn} onPress={onCreateNew}>
                                <Text style={styles.createNewBtnText}>＋ ایجاد فرم جدید</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: Platform.OS === "web" ? ("90%" as any) : "95%",
        maxWidth: 860,
        height: Platform.OS === "web" ? ("90%" as any) : "95%",
        backgroundColor: "#f5f7fa",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 24,
    },

    header: {
        backgroundColor: "#fff",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 12,
    },
    closeBtnText: { fontSize: 16, color: "#555", fontWeight: "500" },
    formTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111827",
        textAlign: "right",
        marginBottom: 6,
    },
    headerMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    formTypeTag: {
        backgroundColor: "#fee7e0",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    formTypeTagText: { fontSize: 12, fontWeight: "600", color: "#c44b2a" },
    filledBadge: {
        backgroundColor: "#dcfce7",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    filledBadgeText: { fontSize: 12, fontWeight: "600", color: "#166534" },
    statsBar: { marginTop: 4 },
    statsText: { fontSize: 13, color: "#6b7280", textAlign: "right", marginBottom: 6 },
    progressTrack: {
        height: 5,
        backgroundColor: "#e5e7eb",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 3 },

    body: { flex: 1 },

    group: { marginBottom: 4 },
    groupHeader: {
        backgroundColor: "#f0f4ff",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: "#c7d2fe",
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3730a3",
        textAlign: "right",
    },

    qaCard: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    qaCardEmpty: { opacity: 0.6, borderStyle: "dashed" },
    questionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    questionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1f2937",
        flex: 1,
        textAlign: "right",
    },
    questionDesc: {
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "right",
        marginBottom: 8,
    },
    requiredPill: {
        backgroundColor: "#fee2e2",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    requiredPillText: { fontSize: 10, color: "#dc2626", fontWeight: "600" },

    answerBox: {
        marginTop: 8,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    answerValue: {
        fontSize: 15,
        color: "#374151",
        textAlign: "right",
        lineHeight: 24,
    },
    emptyValue: { fontSize: 14, color: "#d1d5db", textAlign: "right" },
    linkValue: { fontSize: 13, color: "#3b82f6", textAlign: "right" },
    imageAnswer: {
        width: "100%",
        height: 220,
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: "#f3f4f6",
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "flex-end",
    },
    badge: {
        backgroundColor: "#ede9fe",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    badgeText: { fontSize: 13, color: "#3e5c76", fontWeight: "500" },

    tableScroll: { marginTop: 4 },
    table: { minWidth: "100%" },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#f0f4ff",
        borderBottomWidth: 2,
        borderBottomColor: "#c7d2fe",
    },
    tableHeaderCell: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderRightColor: "#c7d2fe",
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#3730a3",
        textAlign: "right",
    },
    tableBodyRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    tableBodyCell: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
    },
    rowEven: { backgroundColor: "#fff" },
    rowOdd: { backgroundColor: "#f9fafb" },
    idxCell: { width: 44, alignItems: "center" },
    dataCell: { minWidth: 130 },
    idxBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#ede9fe",
        justifyContent: "center",
        alignItems: "center",
    },
    idxBadgeText: { fontSize: 11, fontWeight: "700", color: "#5b21b6" },
    tableCellText: { fontSize: 13, color: "#374151", textAlign: "right" },

    footer: {
        backgroundColor: "#fff",
        padding: 14,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    createNewBtn: {
        backgroundColor: "#3e5c76",
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    createNewBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    closeFullBtn: {
        backgroundColor: "#6b7280",
        paddingHorizontal: 28,
        paddingVertical: 11,
        borderRadius: 8,
    },
    closeFullBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
