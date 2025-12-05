
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { ShoppingItem } from '@/types';

export default function ShoppingScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [items, setItems] = useState<ShoppingItem[]>([
    {
      id: '1',
      householdId: '1',
      name: 'Milk',
      quantity: '1 gallon',
      category: 'Dairy',
      addedByUserId: '1',
      purchased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      householdId: '1',
      name: 'Bread',
      category: 'Bakery',
      addedByUserId: '1',
      purchased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const togglePurchased = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, purchased: !item.purchased };
      }
      return item;
    }));
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      householdId: '1',
      name: newItemName,
      addedByUserId: '1',
      purchased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setShowAddModal(false);
  };

  const neededItems = items.filter(i => !i.purchased);
  const purchasedItems = items.filter(i => i.purchased);

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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Needed ({neededItems.length})</Text>
          {neededItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => togglePurchased(item.id)}
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
          ))}
        </View>

        {purchasedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purchased ({purchasedItems.length})</Text>
            {purchasedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, styles.purchasedCard]}
                onPress={() => togglePurchased(item.id)}
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
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={buttonStyles.outlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={addItem}
              >
                <Text style={buttonStyles.text}>Add</Text>
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
