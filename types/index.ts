
export type UserRole = 'Adult' | 'Parent' | 'Child' | 'Roommate';

export type TaskFrequency = 'one-time' | 'daily' | 'weekly' | 'monthly';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export type EventRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export type NotificationType = 'task' | 'event' | 'shopping' | 'expense' | 'invitation' | 'general';

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
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  frequency: TaskFrequency;
  dueDate?: string;
  status: TaskStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  householdId: string;
  name: string;
  quantity?: string;
  category?: string;
  addedByUserId: string;
  purchased: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdEvent {
  id: string;
  householdId: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  createdByUserId: string;
  assignedToUserId?: string;
  repeat: EventRepeat;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  householdId: string;
  title: string;
  amount: number;
  category?: string;
  createdByUserId: string;
  paidByUserId: string;
  date: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  householdId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}
