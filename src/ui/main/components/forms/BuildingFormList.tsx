import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MdAssignment, MdChecklist, MdClose, MdSearch, MdRefresh } from 'react-icons/md';
import { api } from '../../../../config/api.config';


type FormType = 'PIP' | 'FIRECHECKLIST';

interface BuildingSummary {
  id: number;
  projectName: string;
  renovationCode: string;
}

interface FormStatus {
  renovationCode: string;
  projectName: string;
  hasResponse: boolean;
  formId: number | null;
  formData: any | null;
  answers: any[];
}

interface Props {
  visible: boolean;
  formType: FormType;
  onClose: () => void;
  onOpenFilledForm: (formData: any, answers: any[], renovationCode: string, formId: number) => void;
  onOpenEmptyForm: (formData: any, renovationCode: string, formId: number) => void;
}
function formatRenovationCode(code?: string | null) {
  if (!code) return '';

  const parts = code.split('-').filter(Boolean);

  if (parts.length >= 2) {
    return parts.reverse().join('-');
  }

  return code;
}

function normalizeAnswersForView(rawAnswers: any[], formData: any): Record<number, any> {
  const result: Record<number, any> = {};
  if (!rawAnswers?.length || !formData) return result;

  const byId: Record<number, any> = {};
  formData.questionGroups?.forEach((g: any) => {
    g.questions?.forEach((q: any) => {
      byId[q.id] = q;
      q.children?.forEach((c: any) => { byId[c.id] = { ...c, parentId: q.id }; });
    });
  });

  for (const a of rawAnswers) {
    let qId: number, value: any, rowGroupId: number | null;

    if (a.questionId !== undefined) {
      qId = a.questionId; value = a.value; rowGroupId = a.rowGroupId ?? null;
    } else if (a.id !== undefined) {
      qId = a.id; value = a.answer; rowGroupId = a.rowGroupId ?? null;
    } else continue;

    const question = byId[qId];

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
}


function BuildingRow({
  item,
  formType,
  onPress,
  loading,
}: {
  item: FormStatus;
  formType: FormType;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, item.hasResponse && styles.rowFilled]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={loading}
    >
      <View style={[styles.statusDot, { backgroundColor: item.hasResponse ? '#059669' : '#d1d5db' }]} />

      <View style={[
        styles.buildingIconWrap,
        { backgroundColor: item.hasResponse ? '#f0fdf4' : '#f8fafc', borderColor: item.hasResponse ? '#bbf7d0' : '#e2e8f0' }
      ]}>
        <Text style={{ fontSize: 20 }}>{item.hasResponse ? '🏢' : '🏗️'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.buildingName} numberOfLines={1}>{item.projectName}</Text>
        <Text style={styles.buildingCode} numberOfLines={1}>کد نوسازی: {formatRenovationCode(item.renovationCode)}</Text>
      </View>

      <View style={[
        styles.statusBadge,
        { backgroundColor: item.hasResponse ? '#dcfce7' : '#fef9ee', borderColor: item.hasResponse ? '#bbf7d0' : '#fde68a' }
      ]}>
        <Text style={[styles.statusBadgeText, { color: item.hasResponse ? '#065f46' : '#92400e' }]}>
          {loading ? '...' : item.hasResponse ? '👁 مشاهده' : 'پر کردن'}
        </Text>
      </View>

      <Text style={{ color: '#cbd5e1', fontSize: 18, marginRight: 2 }}>‹</Text>
    </TouchableOpacity>
  );
}


export default function BuildingFormsModal({
  visible,
  formType,
  onClose,
  onOpenFilledForm,
  onOpenEmptyForm,
}: Props) {
  const [formStatuses, setFormStatuses] = useState<FormStatus[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'filled' | 'unfilled'>('all');
  const [error, setError] = useState<string | null>(null);

  const accent = formType === 'PIP' ? '#3e5c76' : '#3e5c76';
  const label = formType === 'PIP' ? 'فرم PIP' : 'چک‌لیست';
  const Icon = formType === 'PIP' ? MdAssignment : MdChecklist;


  const loadData = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    setFormStatuses([]);

    try {
      const buildingsRes = await api.get('/buildings').catch(() => null);
      const rawBuildings: BuildingSummary[] = buildingsRes?.data?.data ?? buildingsRes?.data ?? [];

      if (!rawBuildings.length) {
        setLoadingList(false);
        return;
      }

      setFormStatuses(rawBuildings.map((b) => ({
        renovationCode: b.renovationCode,
        projectName: b.projectName,
        hasResponse: false,
        formId: null,
        formData: null,
        answers: [],
      })));

      const statuses = await fetchStatusesInBatches(rawBuildings);

      statuses.sort((a, b) => {
        if (a.hasResponse && !b.hasResponse) return -1;
        if (!a.hasResponse && b.hasResponse) return 1;
        return a.projectName.localeCompare(b.projectName);
      });

      setFormStatuses(statuses);

    } catch {
      setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoadingList(false);
    }
  }, [formType]);



  const fetchStatusesInBatches = async (buildings: BuildingSummary[]): Promise<FormStatus[]> => {
    const BATCH_SIZE = 5;
    const results: FormStatus[] = [];

    for (let i = 0; i < buildings.length; i += BATCH_SIZE) {
      const batch = buildings.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map((b) => fetchSingleBuildingStatus(b))
      );

      results.push(...batchResults);

      setFormStatuses(prev => {
        const map = new Map(prev.map(s => [s.renovationCode, s]));
        batchResults.forEach(r => map.set(r.renovationCode, r));
        return Array.from(map.values());
      });
    }

    return results;
  };



  const fetchSingleBuildingStatus = async (b: BuildingSummary): Promise<FormStatus> => {
    const fallback: FormStatus = {
      renovationCode: b.renovationCode,
      projectName: b.projectName,
      hasResponse: false,
      formId: null,
      formData: null,
      answers: [],
    };

    try {
      const buildingRes = await api.get(`/buildings/${encodeURIComponent(b.renovationCode)}`).catch(() => null);
      const buildingData = buildingRes?.data?.data ?? buildingRes?.data ?? {};
      const responses: any[] = buildingData?.responses ?? [];

      const matchingResponse = responses.find((r: any) => r.form?.formType === formType);

      if (matchingResponse) {
        return {
          renovationCode: b.renovationCode,
          projectName: b.projectName,
          hasResponse: true,
          formId: matchingResponse.formId,
          formData: matchingResponse.form ?? null,
          answers: matchingResponse.answers ?? [],
        }
      }

      const formsRes = await api.get(`/forms/building/${encodeURIComponent(b.renovationCode)}`).catch(() => null);
      const rawForms: any[] = formsRes?.data?.data ?? formsRes?.data ?? [];
      const matchingForm = rawForms.find((f: any) => f.formType === formType);

      if (matchingForm) {
        return {
          renovationCode: b.renovationCode,
          projectName: b.projectName,
          hasResponse: false,
          formId: matchingForm.id,
          formData: matchingForm,
          answers: [],
        };
      }

      return fallback;

    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
      setSearchQuery('');
      setFilterStatus('all');
    }
  }, [visible, formType]);

  const filtered = useMemo(() => {
    return formStatuses.filter(item => {
      if (filterStatus === 'filled' && !item.hasResponse) return false;
      if (filterStatus === 'unfilled' && item.hasResponse) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.projectName.toLowerCase().includes(q) || item.renovationCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [formStatuses, filterStatus, searchQuery]);

  const filledCount = formStatuses.filter(s => s.hasResponse).length;
  const unfilledCount = formStatuses.length - filledCount;


  const handleBuildingPress = useCallback(async (item: FormStatus) => {
    if (!item.formId) return;
    setLoadingItem(item.renovationCode);

    try {
      let formData = item.formData;

      if (!formData?.questionGroups?.length) {
        const res = await api.get(`/forms/${item.formId}`).catch(() => null);
        if (res?.data?.data) formData = res.data.data;
      }

      if (!formData) return;

      if (item.hasResponse) {
        onOpenFilledForm(formData, item.answers, item.renovationCode, item.formId);
      } else {
        onOpenEmptyForm(formData, item.renovationCode, item.formId);
      }

      onClose();
    } catch (e) {
      console.error('Error opening form:', e);
    } finally {
      setLoadingItem(null);
    }
  }, [onOpenFilledForm, onOpenEmptyForm, onClose]);

  const filledItems = filtered.filter(i => i.hasResponse);
  const unfilledItems = filtered.filter(i => !i.hasResponse);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: accent }]}>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={loadData} style={styles.iconBtn} disabled={loadingList}>
                <MdRefresh size={20} color={loadingList ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <MdClose size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconWrap, { backgroundColor: accent }]}>
                <Icon size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>لیست ساختمان‌ها — {label}</Text>
                <Text style={styles.headerSub}>وضعیت تکمیل {label} برای تمامی ساختمان‌ها</Text>
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.searchWrap}>
              <MdSearch size={16} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="جستجوی ساختمان یا کد نوسازی..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign="right"
              />
            </View>
            <View style={styles.filterBtns}>
              {([
                { id: 'all', label: 'همه' },
                { id: 'filled', label: '✓ تکمیل شده' },
                { id: 'unfilled', label: '○ پر نشده' },
              ] as { id: typeof filterStatus; label: string }[]).map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterBtn, filterStatus === f.id && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setFilterStatus(f.id)}
                >
                  <Text style={[styles.filterBtnText, filterStatus === f.id && { color: '#fff' }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loadingList ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={styles.loadingText}>در حال دریافت اطلاعات ساختمان‌ها...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadData} style={[styles.retryBtn, { backgroundColor: accent }]}>
                <Text style={styles.retryBtnText}>تلاش دوباره</Text>
              </TouchableOpacity>
            </View>
          ) : formStatuses.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🏗️</Text>
              <Text style={styles.emptyText}>ساختمانی یافت نشد</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>

              {filledItems.length > 0 && (filterStatus === 'all' || filterStatus === 'filled') && (
                <>
                  <View style={styles.sectionDivider}>
                    <View style={[styles.sectionLine, { backgroundColor: '#bbf7d0' }]} />
                    <Text style={[styles.sectionLabel, { color: '#059669' }]}>✓ تکمیل شده</Text>
                    <View style={[styles.sectionLine, { backgroundColor: '#bbf7d0' }]} />
                  </View>
                  {filledItems.map(item => (
                    <BuildingRow
                      key={item.renovationCode}
                      item={item}
                      formType={formType}
                      loading={loadingItem === item.renovationCode}
                      onPress={() => handleBuildingPress(item)}
                    />
                  ))}
                </>
              )}

              {unfilledItems.length > 0 && (filterStatus === 'all' || filterStatus === 'unfilled') && (
                <>
                  <View style={styles.sectionDivider}>
                    <View style={[styles.sectionLine, { backgroundColor: '#fecaca' }]} />
                    <Text style={[styles.sectionLabel, { color: '#dc2626' }]}>○ پر نشده</Text>
                    <View style={[styles.sectionLine, { backgroundColor: '#fecaca' }]} />
                  </View>
                  {unfilledItems.map(item => (
                    <BuildingRow
                      key={item.renovationCode}
                      item={item}
                      formType={formType}
                      loading={loadingItem === item.renovationCode}
                      onPress={() => handleBuildingPress(item)}
                    />
                  ))}
                </>
              )}

              {filtered.length === 0 && (
                <View style={styles.center}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                  <Text style={styles.emptyText}>نتیجه‌ای یافت نشد</Text>
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Platform.OS === 'web' ? ('80%' as any) : '95%',
    maxWidth: 780,
    height: Platform.OS === 'web' ? ('88%' as any) : '90%',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    flexWrap: 'wrap',
    gap: 8,

  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center', gap: 12
  },
  headerIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'right' },
  headerSub: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statBox: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0',
  },
  statNum: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  filterRow: {
    backgroundColor: '#fff', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    gap: 10,
    flexDirection: 'row-reverse',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#374151', fontFamily: 'Vazirmatn, sans-serif' },
  filterBtns: { flexDirection: 'row', gap: 6 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 10, gap: 12,
  },
  sectionLine: { flex: 1, height: 1.5, borderRadius: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '800', whiteSpace: 'nowrap' as any },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  rowFilled: { borderColor: '#bbf7d0', backgroundColor: '#fafffe' },
  statusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  buildingIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  buildingName: { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'right' },
  buildingCode: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#94a3b8', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
