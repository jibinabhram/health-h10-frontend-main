import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  useWindowDimensions,
  UIManager,
  findNodeHandle,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import RegisterPodModal from '../../components/RegisterPodModal';
import { downloadPods } from '../../utils/podExport';
import { fetchPods } from '../../api/pods';
import { useTheme } from '../../components/context/ThemeContext';
import { updatePodStatus } from '../../api/pods';


/* ================= TYPES ================= */

type PodStatus = 'ALL' | 'ACTIVE' | 'ASSIGNED' | 'MAINTENANCE' | 'DAMAGED' | 'LOST';

type Pod = {
  id: string;
  serial: string;
  deviceId: string;
  status: Exclude<PodStatus, 'ALL'>;
  batchId: string;
};


/* ================= PAGINATION (ADDED) ================= */
const ITEMS_PER_PAGE = 10;


/* ================= COLORS ================= */

const COLORS = {
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    border: '#E5E7EB',
    muted: '#64748B',
  },
  dark: {
    bg: '#020617',
    card: '#020617',
    text: '#E5E7EB',
    border: '#1E293B',
    muted: '#94A3B8',
  },
};

// ✅ Used ONLY for top filter dropdown
const FILTER_STATUS_OPTIONS: PodStatus[] = [
  'ALL',
  'ACTIVE',
  'ASSIGNED',
  'MAINTENANCE',
  'DAMAGED',
  'LOST',
];

// ✅ Used ONLY for row status edit (NO ALL)
const ROW_STATUS_OPTIONS: Exclude<PodStatus, 'ALL'>[] = [
  'ACTIVE',
  'ASSIGNED',
  'MAINTENANCE',
  'DAMAGED',
  'LOST',
];



/* ================= SCREEN ================= */

const PodManagementScreen = () => {
  const { theme } = useTheme();
  const colors = COLORS[theme];



    const measure = (
      ref: React.RefObject<View>,
      cb: (pos: { x: number; y: number; w: number }) => void,
    ) => {
      const node = findNodeHandle(ref.current);
      if (!node) return;

      UIManager.measureInWindow(node, (x, y, w) => {
        cb({ x, y, w });
      });
    };


  const [pods, setPods] = useState<Pod[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');


  const [statusFilter, setStatusFilter] = useState<PodStatus>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);


  const [editingPodId, setEditingPodId] = useState<string | null>(null);


  const [showBackdrop, setShowBackdrop] = useState(false);

  const batchBtnRef = useRef<View>(null);
  const statusBtnRef = useRef<View>(null);

  const [batchPos, setBatchPos] = useState({ x: 0, y: 0, w: 0 });
  const [statusPos, setStatusPos] = useState({ x: 0, y: 0, w: 0 });


  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    podId: string;
    newStatus: Exclude<PodStatus, 'ALL'>;
    oldStatus: Exclude<PodStatus, 'ALL'>;
  } | null>(null);


  /* ================= PAGE STATE (ADDED) ================= */
  const [page, setPage] = useState(1);


  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  useEffect(() => {
    loadPods();
  }, []);

  const loadPods = async () => {
    const data = await fetchPods();
    const mapped: Pod[] = data.map((p: any) => ({
      id: p.pod_id,
      serial: p.serial_number,
      deviceId: p.device_id,
      status: p.lifecycle_status,
      batchId: p.batch_id,
    }));
    setPods(mapped);

    const uniqueBatches = Array.from(
      new Set(mapped.map(p => p.batchId)),
    ).sort((a, b) => b.localeCompare(a));

    setBatches(['ALL', ...uniqueBatches]);
  };

  /* ================= FILTER ================= */

  const filteredPods = useMemo(() => {
    return pods
      .filter(p => {
        if (selectedBatch !== 'ALL' && p.batchId !== selectedBatch) return false;
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (
          search &&
          !`${p.serial}${p.deviceId}${p.status}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const aNum = Number(a.serial.replace('PD', ''));
        const bNum = Number(b.serial.replace('PD', ''));
        return aNum - bNum; // ✅ ASCENDING
      });
  }, [pods, selectedBatch, statusFilter, search]);


  const filteredBatches = useMemo(() => {
    if (!batchSearch) return batches;
    return batches.filter(b =>
      b.toLowerCase().includes(batchSearch.toLowerCase()),
    );
  }, [batches, batchSearch]);



   /* ================= PAGINATED DATA (ADDED) ================= */

    const totalPages = Math.ceil(filteredPods.length / ITEMS_PER_PAGE);

    const paginatedPods = useMemo(() => {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return filteredPods.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPods, page]);

    /* RESET PAGE ON FILTER CHANGE (ADDED) */
    useEffect(() => {
      setPage(1);
    }, [selectedBatch, statusFilter, search]);


  const counts = useMemo(
    () => ({
      ACTIVE: pods.filter(p => p.status === 'ACTIVE').length,
      MAINTENANCE: pods.filter(p => p.status === 'MAINTENANCE').length,
      DAMAGED: pods.filter(p => p.status === 'DAMAGED').length,
      LOST: pods.filter(p => p.status === 'LOST').length,
    }),
    [pods],
  );

  return (
    <>
      {/* ✅ NEW: BACKGROUND BLOCKER (INSIDE HEADER) */}







     <FlatList
       data={paginatedPods}
       keyExtractor={item => item.id}
       keyboardShouldPersistTaps="handled"

       // 🔥 IMPORTANT FIX
       removeClippedSubviews={false}

       style={{
         backgroundColor: colors.bg,
         flex: 1,
       }}

       contentContainerStyle={{
         padding: 16,
         paddingBottom: 80,
         width: '100%',          // ✅ fill available space
         alignSelf: 'flex-start' // ✅ prevent centering
       }}



        ListHeaderComponent={
          <>
            {/* ================= HEADER ================= */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Pod Management
              </Text>

              <View style={styles.headerActions}>
               <TouchableOpacity
                 onPress={() => downloadPods(filteredPods)}
                 style={styles.iconBtn}
               >
                 <Ionicons
                   name="download-outline"
                   size={24}
                   color={colors.text}
                 />
               </TouchableOpacity>


                <TouchableOpacity
                  style={styles.registerBtn}
                  onPress={() => setOpen(true)}
                >
                  <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ================= COUNT BOXES ================= */}
            <View style={styles.cards}>
              {[
                { k: 'ACTIVE', v: counts.ACTIVE, c: '#22C55E' },
                { k: 'MAINTENANCE', v: counts.MAINTENANCE, c: '#F97316' },
                { k: 'DAMAGED', v: counts.DAMAGED, c: '#EF4444' },
                { k: 'LOST', v: counts.LOST, c: '#6B7280' },
              ].map(s => (
                <View
                  key={s.k}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={{ color: s.c, fontSize: 18, fontWeight: '700' }}>
                    {s.v}
                  </Text>
                  <Text style={{ color: colors.text }}>{s.k}</Text>
                </View>
              ))}
            </View>


            {/* ================= SEARCH | BATCH | STATUS ================= */}
            <View style={{ marginBottom: 12 }}>

              <View style={{ flexDirection: 'row', gap: 12 }}>

                {/* SEARCH */}
                <View
                  style={[
                    styles.searchBox,
                    { flex: 2, backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="search-outline" size={18} color={colors.muted} />
                  <TextInput
                    placeholder="Search pods"
                    placeholderTextColor={colors.muted}
                    value={search}
                    onChangeText={setSearch}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>

                {/* BATCH BUTTON */}
               <View style={{ flex: 1 }} ref={batchBtnRef}>

                  <TouchableOpacity
                    style={[
                      styles.searchBox,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      measure(batchBtnRef, setBatchPos);
                      setBatchOpen(true);
                      setFilterOpen(false);
                    }}


                  >
                    <Ionicons name="layers-outline" size={18} color={colors.muted} />
                    <Text style={{ marginLeft: 8, color: colors.text, flex: 1 }}>
                      {selectedBatch === 'ALL' ? 'All Batches' : selectedBatch}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* STATUS BUTTON */}
                <View style={{ flex: 1 }} ref={statusBtnRef}>

                  <TouchableOpacity
                    style={[
                      styles.searchBox,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      measure(statusBtnRef, setStatusPos);
                      setFilterOpen(true);
                      setBatchOpen(false);
                    }}

                  >
                    <Ionicons name="filter-outline" size={18} color={colors.muted} />
                    <Text style={{ marginLeft: 8, color: colors.text, flex: 1 }}>
                      {statusFilter}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

              </View>
            </View>

            {/* ================= BATCH MODAL ================= */}
            <Modal visible={batchOpen} transparent animationType="fade">
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setBatchOpen(false)}
              />

              <View
                style={{
                  position: 'absolute',
                  top: batchPos.y + 44,
                  left: batchPos.x,
                  width: batchPos.w,
                  maxHeight: 260,
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  elevation: 40,
                }}
              >

                <TextInput
                  placeholder="Search batch"
                  placeholderTextColor={colors.muted}
                  value={batchSearch}
                  onChangeText={setBatchSearch}
                  style={{
                    padding: 12,
                    color: colors.text,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                  }}
                />

                <ScrollView keyboardShouldPersistTaps="handled">
                  {filteredBatches.map(b => (
                    <TouchableOpacity
                      key={b}
                      style={{ padding: 12 }}
                      onPress={() => {
                        setSelectedBatch(b);
                        setBatchOpen(false);
                        setBatchSearch('');
                        setPage(1);
                      }}
                    >
                      <Text style={{ color: colors.text }}>
                        {b === 'ALL' ? 'All Batches' : b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Modal>

            {/* ================= STATUS MODAL ================= */}
            <Modal visible={filterOpen} transparent animationType="fade">
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setFilterOpen(false)}
              />

              <View
                style={{
                  position: 'absolute',
                  top: statusPos.y + 44,
                  left: statusPos.x,
                  width: statusPos.w,
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  elevation: 40,
                }}
              >

                {FILTER_STATUS_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={{
                      padding: 12,
                      backgroundColor:
                        statusFilter === s ? '#2563EB22' : 'transparent',
                    }}
                    onPress={() => {
                      setStatusFilter(s);
                      setFilterOpen(false);
                      setPage(1);
                    }}
                  >
                    <Text style={{ color: colors.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Modal>

            <Modal visible={confirmOpen} transparent animationType="fade">
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 320,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                    Confirm Status Change
                  </Text>

                  <Text style={{ marginTop: 10, color: colors.muted }}>
                    Change status to <Text style={{ fontWeight: '700' }}>
                      {pendingChange?.newStatus}
                    </Text>?
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      gap: 12,
                      marginTop: 20,
                    }}
                  >
                    {/* CANCEL */}
                    <TouchableOpacity
                      onPress={() => {
                        setConfirmOpen(false);
                        setPendingChange(null);
                      }}
                    >
                      <Text style={{ color: colors.muted }}>Cancel</Text>
                    </TouchableOpacity>

                    {/* CONFIRM */}
                    <TouchableOpacity
                      onPress={async () => {
                        if (!pendingChange) return;

                        const { podId, newStatus, oldStatus } = pendingChange;

                        // Optimistic UI
                        setPods(prev =>
                          prev.map(p =>
                            p.id === podId ? { ...p, status: newStatus } : p,
                          ),
                        );

                        setConfirmOpen(false);
                        setEditingPodId(null);
                        setPendingChange(null);

                        try {
                          await updatePodStatus(podId, newStatus);
                        } catch {
                          // rollback
                          setPods(prev =>
                            prev.map(p =>
                              p.id === podId ? { ...p, status: oldStatus } : p,
                            ),
                          );
                          alert('Status update failed');
                        }
                      }}
                    >
                      <Text style={{ color: '#2563EB', fontWeight: '700' }}>
                        Confirm
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>


            {/* ================= TABLE HEADER ================= */}
            {isTablet && (
              <View style={[styles.tableHeader, { borderColor: colors.border }]}>
                <Text style={[styles.colSno, styles.th, { color: colors.text }]}>
                  S.No
                </Text>
                <Text style={[styles.colSerial, styles.th, { color: colors.text }]}>
                  Serial
                </Text>
                <Text style={[styles.colDevice, styles.th, { color: colors.text }]}>
                  Device
                </Text>
                <Text style={[styles.colStatus, styles.th, { color: colors.text }]}>
                  Status
                </Text>
              </View>
            )}
          </>
        }


        renderItem={({ item, index }) => (
          <View style={[styles.row, { borderColor: colors.border }]}>
            {/* SERIAL NUMBER */}
            <Text style={[styles.colSno, { color: colors.text }]}>
              {(page - 1) * ITEMS_PER_PAGE + index + 1}
            </Text>

            <Text style={[styles.colSerial, { color: colors.text }]}>
              {item.serial}
            </Text>

            <Text style={[styles.colDevice, { color: colors.text }]}>
              {item.deviceId}
            </Text>

            <View style={styles.colStatus}>
              {editingPodId === item.id ? (
                ROW_STATUS_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      setPendingChange({
                        podId: item.id,
                        newStatus: s,
                        oldStatus: item.status,
                      });
                      setConfirmOpen(true);
                    }}


                  >
                    <Text style={[styles[`status_${s}`], { marginVertical: 4 }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={() => setEditingPodId(item.id)}
                >
                  <Text style={styles[`status_${item.status}`]}>
                    {item.status}
                  </Text>

                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}


        /* ✅ PAGINATION FOOTER */
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={page === 1 ? colors.muted : colors.text}
                />
              </TouchableOpacity>

              <Text style={{ color: colors.text }}>
                Page {page} / {totalPages}
              </Text>

              <TouchableOpacity
                disabled={page === totalPages}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={page === totalPages ? colors.muted : colors.text}
                />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <RegisterPodModal
        visible={open}
        onClose={() => setOpen(false)}
        onRegistered={loadPods}
      />
    </>
  );
};

export default PodManagementScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  /* ================= HEADER ================= */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  registerBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  registerText: {
    color: '#fff',
    fontWeight: '600',
  },

  /* ================= BATCH CHIPS ================= */
  batchChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  /* ================= COUNT CARDS ================= */
  cards: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  card: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },

  /* ================= SEARCH ================= */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },

  /* ================= FILTER DROPDOWN ================= */
  filterBtn: {
    padding: 6,
  },

 filterDropdown: {
   position: 'absolute',
   top: 44,
   left: 0,
   right: 0,
   maxHeight: 260,
   borderRadius: 10,
   borderWidth: 1,
   paddingVertical: 6,

   zIndex: 5001,
   elevation: 5001,
 },



iconBtn: {
  width: 32,
  height: 32,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.04)',
},



  filterItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  filterItemActive: {
    backgroundColor: '#2563EB22',
  },

  /* ================= TABLE ================= */
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  th: {
    fontWeight: '700',
  },

  colSno: { width: 60 },
  colSerial: { flex: 1 },
  colDevice: { flex: 1 },
  colStatus: {
    width: 140,
    justifyContent: 'center',
  },

  /* ================= PAGINATION ================= */
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 14,
    marginTop: 8,
  },

  paginationBtn: {
    padding: 6,
    borderRadius: 6,
  },

  paginationText: {
    fontSize: 14,
    fontWeight: '600',
  },


  /* ================= STATUS COLORS ================= */
  status_ACTIVE: {
    color: '#22C55E',
    fontWeight: '600',
  },
  status_ASSIGNED: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  status_MAINTENANCE: {
    color: '#F97316',
    fontWeight: '600',
  },
  status_DAMAGED: {
    color: '#EF4444',
    fontWeight: '600',
  },
  status_LOST: {
    color: '#6B7280',
    fontWeight: '600',
  },
});
