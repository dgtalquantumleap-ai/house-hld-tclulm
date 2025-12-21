
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
import { useMeals } from '@/hooks/useMeals';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export default function MealsScreen() {
  const { user } = useAuth();
  const { meals, isLoading, createMeal, deleteMeal, refreshMeals } = useMeals();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [mealTitle, setMealTitle] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealDate, setMealDate] = useState(new Date());
  const [mealTime, setMealTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: '1', name: '', quantity: '' }]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMeals();
    setRefreshing(false);
  };

  const handleCreateMeal = async () => {
    if (!mealTitle.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    setIsCreating(true);
    
    const validIngredients = ingredients.filter(ing => ing.name.trim()).map(ing => ({
      name: ing.name,
      quantity: ing.quantity
    }));
    const timeString = `${mealTime.getHours().toString().padStart(2, '0')}:${mealTime.getMinutes().toString().padStart(2, '0')}`;
    
    const { error } = await createMeal(
      mealTitle,
      mealDate.toISOString().split('T')[0],
      timeString,
      mealDescription,
      undefined,
      validIngredients.length > 0 ? validIngredients : undefined
    );
    
    setIsCreating(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Meal added to calendar and ingredients added to shopping list');
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setMealTitle('');
    setMealDescription('');
    setMealDate(new Date());
    setMealTime(new Date());
    setIngredients([{ id: '1', name: '', quantity: '' }]);
  };

  const addIngredient = () => {
    const newId = Date.now().toString();
    setIngredients([...ingredients, { id: newId, name: '', quantity: '' }]);
  };

  const updateIngredient = (id: string, field: 'name' | 'quantity', value: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const handleDeleteMeal = (mealId: string, mealTitle: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteMeal(mealId);
            if (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  // Group meals by date
  const groupedMeals = meals.reduce((acc, meal) => {
    const date = new Date(meal.mealDate).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

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
          <Text style={styles.title}>Meal Planner</Text>
          <Text style={styles.subtitle}>Plan meals and auto-add ingredients</Text>
        </View>

        {Object.keys(groupedMeals).length > 0 ? (
          Object.entries(groupedMeals).map(([date, dateMeals]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateMeals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <IconSymbol
                      ios_icon_name="fork.knife"
                      android_material_icon_name="restaurant"
                      size={24}
                      color={colors.accent}
                    />
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealTitle}>{meal.title}</Text>
                      <Text style={styles.mealTime}>
                        {meal.mealTime || 'No time set'}
                      </Text>
                      {meal.description && (
                        <Text style={styles.mealDescription}>{meal.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteMeal(meal.id, meal.title)}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="fork.knife"
              android_material_icon_name="restaurant"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No meals planned</Text>
            <Text style={styles.emptySubtext}>Add a meal to get started</Text>
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

      {/* Create Meal Modal */}
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
            <Text style={styles.modalTitle}>Add Meal</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Meal Name *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g., Spaghetti Bolognese"
              placeholderTextColor={colors.textSecondary}
              value={mealTitle}
              onChangeText={setMealTitle}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[commonStyles.input, styles.textArea]}
              placeholder="Add notes about the meal..."
              placeholderTextColor={colors.textSecondary}
              value={mealDescription}
              onChangeText={setMealDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {mealDate.toLocaleDateString()}
              </Text>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={mealDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setMealDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Time (Optional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {mealTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="access-time"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={mealTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setMealTime(selectedTime);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Ingredients (Optional)</Text>
            <Text style={styles.helperText}>
              Ingredients will be automatically added to your shopping list
            </Text>
            
            {ingredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientRow}>
                <TextInput
                  style={[commonStyles.input, styles.ingredientName]}
                  placeholder="Ingredient name"
                  placeholderTextColor={colors.textSecondary}
                  value={ingredient.name}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                />
                <TextInput
                  style={[commonStyles.input, styles.ingredientQuantity]}
                  placeholder="Qty"
                  placeholderTextColor={colors.textSecondary}
                  value={ingredient.quantity}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'quantity', value)}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeIngredient(ingredient.id)}
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

            <TouchableOpacity style={styles.addIngredientButton} onPress={addIngredient}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.addIngredientText}>Add Ingredient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.createButton, isCreating && styles.buttonDisabled]}
              onPress={handleCreateMeal}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={buttonStyles.text}>Add Meal</Text>
              )}
            </TouchableOpacity>
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
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientName: {
    flex: 2,
    marginBottom: 0,
    marginRight: 8,
  },
  ingredientQuantity: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    marginLeft: 8,
  },
  addIngredientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  addIngredientText: {
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
});
