
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useAuth } from '@/contexts/AuthContext';

export default function ShoppingScreen() {
  const { user } = useAuth();
  const { items, isLoading, addItem, togglePurchased, deleteItem, refreshItems } = useShoppingList();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshItems();
    setRefreshing(false);
  };

  const handleTogglePurchased = async (itemId: string, purchased: boolean) => {
    const { error } = await togglePurchased(itemId, !purchased);
    
    if (error) {
      Alert.alert('Error', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await addItem(
        newItemName,
        newItemQuantity || undefined,
        newItemCategory || undefined
      );

      if (error) {
        Alert.alert('Error', error);
      } else {
        setNewItemName('');
        setNewItemQuantity('');
        setNewItemCategory('');
        setShowAddModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const canDelete = user?.role === 'Adult' || user?.role === 'Parent';
    
    if (!canDelete) {
      Alert.alert('Permission Denied', 'Only adults can delete items');
      return;
    }

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteItem(itemId);
            if (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const neededItems = items.filter(i => !i.purchased);
  const purchasedItems = items.filter(i => i.purchased);

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.card}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Needed ({neededItems.length})</Text>
          {neededItems.length > 0 ? (
            neededItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleTogglePurchased(item.id, item.purchased)}
                onLongPress={() => handleDeleteItem(item.id)}
              >
                <View style={styles.checkbox}>
                  <IconSymbol
                    ios_icon_name="circle"
                    android_material_icon_name="radio_button_unchecked"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity && (
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                  )}
                  {item.category && (
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items needed</Text>
            </View>
          )}
        </View>

        {purchasedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purchased ({purchasedItems.length})</Text>
            {purchasedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, styles.purchasedCard]}
                onPress={() => handleTogglePurchased(item.id, item.purchased)}
              >
                <View style={styles.checkbox}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={24}
                    color={colors.success}
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, styles.purchasedText]}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Shopping Item</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Item name"
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
              editable={!isSubmitting}
            />
            <TextInput
              style={commonStyles.input}
              placeholder="Quantity (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              editable={!isSubmitting}
            />
            <TextInput
              style={commonStyles.input}
              placeholder="Category (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newItemCategory}
              onChangeText={setNewItemCategory}
              editable={!isSubmitting}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <Text style={buttonStyles.outlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={handleAddItem}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.card} />
                ) : (
                  <Text style={buttonStyles.text}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  purchasedCard: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  purchasedText: {
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.secondary,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
