import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getMyPodHolders,
  getPodsByHolder,
  assignPodHolderToPlayer,
  assignPodToPlayer,
} from '../../../api/players';

type Props = {
  visible: boolean;
  playerId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const AssignPodModal = ({ visible, playerId, onClose, onSuccess }: Props) => {
  const [podHolders, setPodHolders] = useState<any[]>([]);
  const [pods, setPods] = useState<any[]>([]);
  const [selectedHolder, setSelectedHolder] = useState<string | null>(null);
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) loadPodHolders();
  }, [visible]);

  const loadPodHolders = async () => {
    try {
      const data = await getMyPodHolders();
      setPodHolders(data);
    } catch {
      Alert.alert('Error', 'Failed to load pod holders');
    }
  };

  const onSelectHolder = async (id: string) => {
    setSelectedHolder(id);
    setSelectedPod(null);
    setPods([]);

    try {
      const holder = await getPodsByHolder(id);
      setPods(holder);
    } catch {
      Alert.alert('Error', 'Failed to load pods');
    }
  };

  const submit = async () => {
    if (!selectedHolder || !selectedPod) {
      Alert.alert('Missing', 'Select Pod Holder and Pod');
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Assign pod holder
      await assignPodHolderToPlayer(playerId, selectedHolder);

      // 2️⃣ Assign pod
      await assignPodToPlayer(playerId, selectedPod);

      // 🔁 3️⃣ REHYDRATE SQLite + UI
      await loadPlayersUnified();

      // 4️⃣ Notify parent screen (optional refresh)
      onSuccess();

      // 5️⃣ Close modal
      onClose();;
    } catch (e: any) {
      if (e?.isOffline) {
        Alert.alert('Offline', 'No internet connection');
      } else {
        Alert.alert('Error', 'Assignment failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Assign Pod</Text>

          <Text style={styles.label}>Select Pod Holder</Text>
          {podHolders.map(h => (
            <TouchableOpacity
              key={h.pod_holder_id}
              style={[
                styles.option,
                selectedHolder === h.pod_holder_id && styles.selected,
              ]}
              onPress={() => onSelectHolder(h.pod_holder_id)}
            >
              <Text>{h.serial_number}</Text>
            </TouchableOpacity>
          ))}

          {pods.length > 0 && (
            <>
              <Text style={styles.label}>Select Pod</Text>
              {pods.map(p => (
                <TouchableOpacity
                  key={p.pod_id}
                  style={[
                    styles.option,
                    selectedPod === p.pod_id && styles.selected,
                  ]}
                  onPress={() => setSelectedPod(p.pod_id)}
                >
                  <Text>{p.serial_number}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {loading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={submit}>
                <Text style={styles.save}>Assign</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AssignPodModal;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 360,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  option: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  selected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancel: { fontWeight: '600', color: '#6B7280' },
  save: { fontWeight: '700', color: '#2563EB' },
});
