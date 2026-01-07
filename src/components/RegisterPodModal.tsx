import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { createPodsBatch } from '../api/pods';



type Props = {
  visible: boolean;
  onClose: () => void;
  onRegistered: () => void;
};

const RegisterPodModal = ({ visible, onClose, onRegistered }: Props) => {
  const [count, setCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const registerBatch = async () => {
    if (!count || Number(count) <= 0) {
      setError('Enter valid pod count');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createPodsBatch(Number(count));
      setSuccess(result);
    } catch (e) {
      setError('Batch creation failed');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setCount('');
    setSuccess(null);
    setError(null);
    onClose();
    onRegistered();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
          <Text style={styles.title}>Register Pods</Text>

          {!success && (
            <>
              <TextInput
                placeholder="Enter Number of pods"
                keyboardType="numeric"
                value={count}
                onChangeText={setCount}
                style={styles.input}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              {loading ? (
                <ActivityIndicator />
              ) : (
                <View style={styles.actionRow}>
                  {/* Cancel */}
                  <TouchableOpacity onPress={onClose}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                  </TouchableOpacity>

                  {/* Register */}
                  <TouchableOpacity onPress={registerBatch}>
                    <Text style={styles.btn}>Register</Text>
                  </TouchableOpacity>
                </View>

              )}
            </>
          )}

          {success && (
                <>
                  <Text style={styles.success}>
                    {count} Pods Registered Successfully 🎉
                  </Text>
                  <View style={styles.btnRow}>
                    <TouchableOpacity onPress={close}>
                      <Text style={styles.btn}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </>
                )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

  );
};

export default RegisterPodModal;


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 320,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: '700' },
  label: { marginTop: 10, color: '#6B7280' },
  value: { fontWeight: '700', marginTop: 4 },
  waitText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#9CA3AF',
  },
  error: {
    marginTop: 16,
    textAlign: 'center',
    color: '#EF4444',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  register: { fontWeight: '700' },

  batch: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },

  success: {
   marginTop: 8,
   fontSize: 15,
   fontWeight: '700',
   color: '#16A34A',
   textAlign: 'center',
  },
  btnRow: {
   flexDirection: 'row',
   justifyContent: 'flex-end',
   marginTop: 16,
 },

  btn: {
   fontWeight: '700',
   color: '#2563EB',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  cancelBtn: {
    fontWeight: '700',
    color: '#6B7280',
  },

});
