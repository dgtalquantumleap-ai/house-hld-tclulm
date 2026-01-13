
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export default function ShoppingScreen() {
  const { user } = useAuth();
  const { shoppingItems } = useRealtimeData();
  const { addItem, togglePurchased, deleteItem, refreshItems } = useShoppingList();
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

  const neededItems = shoppingItems.filter(i => !i.purchased);
  const purchasedItems = shoppingItems.filter(i => i.purchased);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
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
                activeOpacity={0.7}
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
              <IconSymbol
                ios_icon_name="cart"
                android_material_icon_name="shopping-cart"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No items needed</Text>
              <Text style={styles.emptySubtext}>Tap + to add shopping items</Text>
              <TouchableOpacity 
                style={styles.emptyActionLink}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyActionText}>Add Item</Text>
              </TouchableOpacity>
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
                activeOpacity={0.7}
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
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.centered}
            >
              <Text style={styles.modalTitle}>Add Shopping Item</Text>
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Item name"
                  placeholderTextColor={colors.textSecondary}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  autoFocus
                  editable={!isSubmitting}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Quantity (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  editable={!isSubmitting}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={newItemCategory}
                  onChangeText={setNewItemCategory}
                  editable={!isSubmitting}
                />
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={styles.cancel}
                  onPress={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.add}
                  onPress={handleAddItem}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '600' }}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
    backgroundColor: colors.card,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    opacity: 0.7,
  },
  emptyActionLink: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
  },
  cancel: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  add: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
});
