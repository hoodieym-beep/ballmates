import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, TextInput, FlatList, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { ChatMessagesSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const SENDER_COLORS = ['#1565C0', '#6A1B9A', '#C62828', '#2E7D32', '#EF6C00', '#00838F', '#7B1FA2', '#558B2F'];

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getSenderColor(senderId) {
  const id = typeof senderId === 'string' ? senderId : (senderId?._id || '');
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

export default function GroupChatScreen({ route }) {
  const { sessionId } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState('');
  const { user } = useAuth();
  const socketRef = useRef(null);

  const load = useCallback(() => {
    api('/api/messages/sessions/' + sessionId + '/messages')
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Socket: real-time new messages
  useEffect(() => {
    let mounted = true;
    getSocket().then((s) => {
      if (!mounted) return;
      socketRef.current = s;
      s.emit('join:session', sessionId);
      s.on('message:new', (msg) => {
        if (mounted) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      });
    });
    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('message:new');
        socketRef.current.emit('leave:session', sessionId);
      }
    };
  }, [sessionId]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setBody('');
    setSending(true);
    try {
      await api('/api/messages/sessions/' + sessionId + '/messages', {
        method: 'POST',
        body: JSON.stringify({ body: trimmed }),
      });
      // No need to reload — socket event will add the message
    } catch (_) {} finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = (item.senderId?._id ?? item.senderId) === user._id;
    const timeStr = formatMessageTime(item.createdAt);
    const senderName = item.senderId?.name || 'Unknown';
    const senderColor = isMe ? undefined : getSenderColor(item.senderId);
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && <Text style={[styles.sender, { color: senderColor }]}>{senderName}</Text>}
        <Text style={[styles.msgBody, isMe && styles.msgBodyMe]}>{item.body}</Text>
        {timeStr ? <Text style={[styles.time, isMe && styles.timeMe]}>{timeStr}</Text> : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ChatMessagesSkeleton />
        <View style={styles.inputRow}>
          <View style={[styles.input, { flex: 1 }]} />
          <View style={[styles.sendBtn, { backgroundColor: colors.border }]} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'height' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        inverted
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Message…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="send"
          onSubmitEditing={send}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          activeOpacity={0.85}
          disabled={!body.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={colors.textOnPrimary} />
            : <Ionicons name="send" size={20} color={colors.textOnPrimary} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    maxWidth: '78%',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sender: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  msgBody: { ...typography.body, color: colors.text, lineHeight: 22 },
  msgBodyMe: { color: colors.textOnPrimary },
  time: { ...typography.caption, color: colors.textMuted, marginTop: 4, fontSize: 11 },
  timeMe: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
