
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { usePolls } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Poll, PollOption, PollComment } from '@/types';

export default function PollsScreen() {
  const { user } = useAuth();
  const { polls, isLoading, createPoll, getPollOptions, vote, getUserVote, getPollComments, addComment, refreshPolls } = usePolls();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [pollComments, setPollComments] = useState<PollComment[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  
  // Create poll form
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [newComment, setNewComment] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPolls();
    setRefreshing(false);
  };

  const handleCreatePoll = async () => {
    if (!newPollTitle.trim()) {
      Alert.alert('Error', 'Please enter a poll title');
      return;
    }

    const validOptions = newPollOptions.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 options');
      return;
    }

    setIsCreating(true);
    const { error } = await createPoll(newPollTitle, newPollDescription, validOptions);
    setIsCreating(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Poll created successfully');
      setShowCreateModal(false);
      setNewPollTitle('');
      setNewPollDescription('');
      setNewPollOptions(['', '']);
    }
  };

  const handleViewPoll = async (poll: Poll) => {
    setSelectedPoll(poll);
    const options = await getPollOptions(poll.id);
    setPollOptions(options);
    const vote = await getUserVote(poll.id);
    setUserVote(vote);
    const comments = await getPollComments(poll.id);
    setPollComments(comments);
  };

  const handleVote = async (optionId: string) => {
    if (!selectedPoll) return;
    
    const { error } = await vote(selectedPoll.id, optionId);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setUserVote(optionId);
      const options = await getPollOptions(selectedPoll.id);
      setPollOptions(options);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPoll || !newComment.trim()) return;

    const { error } = await addComment(selectedPoll.id, newComment);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setNewComment('');
      const comments = await getPollComments(selectedPoll.id);
      setPollComments(comments);
    }
  };

  const addPollOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const removePollOption = (index: number) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const getTotalVotes = () => {
    return pollOptions.reduce((sum, opt) => sum + opt.voteCount, 0);
  };

  const getVotePercentage = (voteCount: number) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((voteCount / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Family Polls</Text>
          <Text style={styles.subtitle}>Make decisions together</Text>
        </View>

        {polls.length > 0 ? (
          polls.map((poll) => (
            <TouchableOpacity
              key={poll.id}
              style={styles.pollCard}
              onPress={() => handleViewPoll(poll)}
            >
              <View style={styles.pollHeader}>
                <IconSymbol
                  ios_icon_name="chart.bar.fill"
                  android_material_icon_name="poll"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.pollHeaderText}>
                  <Text style={styles.pollTitle}>{poll.title}</Text>
                  {poll.description && (
                    <Text style={styles.pollDescription}>{poll.description}</Text>
                  )}
                </View>
              </View>
              {poll.expiresAt && (
                <Text style={styles.expiryText}>
                  Expires: {new Date(poll.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="chart.bar"
              android_material_icon_name="poll"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No polls yet</Text>
            <Text style={styles.emptySubtext}>Create a poll to get started</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={24}
          color={colors.card}
        />
      </TouchableOpacity>

      {/* Create Poll Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Poll</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Poll Title *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="What should we decide?"
              placeholderTextColor={colors.textSecondary}
              value={newPollTitle}
              onChangeText={setNewPollTitle}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[commonStyles.input, styles.textArea]}
              placeholder="Add more details..."
              placeholderTextColor={colors.textSecondary}
              value={newPollDescription}
              onChangeText={setNewPollDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Options *</Text>
            {newPollOptions.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  style={[commonStyles.input, styles.optionInput]}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={colors.textSecondary}
                  value={option}
                  onChangeText={(value) => updatePollOption(index, value)}
                />
                {newPollOptions.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePollOption(index)}
                  >
                    <IconSymbol
                      ios_icon_name="minus.circle.fill"
                      android_material_icon_name="remove-circle"
                      size={24}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addOptionButton} onPress={addPollOption}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.addOptionText}>Add Option</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.createButton, isCreating && styles.buttonDisabled]}
              onPress={handleCreatePoll}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={buttonStyles.text}>Create Poll</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* View Poll Modal */}
      <Modal
        visible={!!selectedPoll}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPoll(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPoll(null)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Poll Results</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedPoll && (
              <React.Fragment>
                <Text style={styles.pollTitleLarge}>{selectedPoll.title}</Text>
                {selectedPoll.description && (
                  <Text style={styles.pollDescriptionLarge}>{selectedPoll.description}</Text>
                )}

                <View style={styles.optionsSection}>
                  <Text style={styles.sectionTitle}>Vote</Text>
                  {pollOptions.map((option) => {
                    const percentage = getVotePercentage(option.voteCount);
                    const isSelected = userVote === option.id;

                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCard, isSelected && styles.selectedOption]}
                        onPress={() => handleVote(option.id)}
                      >
                        <View style={styles.optionContent}>
                          <Text style={styles.optionText}>{option.optionText}</Text>
                          <Text style={styles.voteCount}>{option.voteCount} votes</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.percentage}>{percentage}%</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.commentsSection}>
                  <Text style={styles.sectionTitle}>Comments ({pollComments.length})</Text>
                  
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={[commonStyles.input, styles.commentInput]}
                      placeholder="Add a comment..."
                      placeholderTextColor={colors.textSecondary}
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <IconSymbol
                        ios_icon_name="paperplane.fill"
                        android_material_icon_name="send"
                        size={20}
                        color={newComment.trim() ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {pollComments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <Text style={styles.commentAuthor}>{comment.user?.name || 'Unknown'}</Text>
                      <Text style={styles.commentText}>{comment.commentText}</Text>
                      <Text style={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </React.Fragment>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pollCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pollHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  pollDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    marginLeft: 12,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  addOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  createButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pollTitleLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  pollDescriptionLarge: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  optionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  voteCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  commentsSection: {
    marginBottom: 40,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    marginBottom: 0,
  },
  sendButton: {
    marginLeft: 12,
    padding: 12,
  },
  commentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
