
export type UserRole = 'Adult' | 'Parent' | 'Child' | 'Roommate';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: UserRole;
  householdId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  name: string;
  address?: string;
  createdByUserId: string;
  membersCount: number;
  inviteCode: string;
  adminUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly';
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdByUserId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  commentText: string;
  createdAt: string;
  user?: User;
}

export interface ShoppingItem {
  id: string;
  householdId: string;
  name: string;
  quantity?: string;
  category?: string;
  addedByUserId?: string;
  purchased: boolean;
  purchasedByUserId?: string;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItemComment {
  id: string;
  shoppingItemId: string;
  userId: string;
  commentText: string;
  createdAt: string;
  user?: User;
}

export interface HouseholdEvent {
  id: string;
  householdId: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  createdByUserId?: string;
  assignedToUserId?: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  confirmationStatus?: 'pending' | 'confirmed' | 'declined';
  calendarSource?: string;
  externalEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  householdId: string;
  title: string;
  amount: number;
  category?: string;
  createdByUserId?: string;
  paidByUserId?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  householdId: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'shopping' | 'expense' | 'invitation' | 'general' | 'poll' | 'meal';
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  email: string;
  invitedByUserId?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string;
}

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: 'google' | 'apple';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  calendarId?: string;
  calendarName?: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Poll {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  createdByUserId?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  voteCount: number;
  createdAt: string;
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export interface PollComment {
  id: string;
  pollId: string;
  userId: string;
  commentText: string;
  createdAt: string;
  user?: User;
}

export interface Meal {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  mealDate: string;
  mealTime?: string;
  assignedToUserId?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealIngredient {
  id: string;
  mealId: string;
  shoppingItemId?: string;
  ingredientName: string;
  quantity?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  taskNotifications: boolean;
  eventNotifications: boolean;
  shoppingNotifications: boolean;
  pollNotifications: boolean;
  mealNotifications: boolean;
  showPersonalCalendarEvents: boolean;
  createdAt: string;
  updatedAt: string;
}
