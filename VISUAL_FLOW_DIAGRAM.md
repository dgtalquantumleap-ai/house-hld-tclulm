
# HouseHLD Visual Flow Diagram

**Complete App Architecture & User Journey**

---

## 1. App Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HouseHLD App                              │
│                   Household Management System                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         Authentication Layer             │
        │    (Supabase Auth + Row Level Security)  │
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌───────────────┐          ┌───────────────┐
        │  Auth Routes  │          │  Tab Routes   │
        │   (Onboard)   │          │  (Main App)   │
        └───────────────┘          └───────────────┘
```

---

## 2. Complete Navigation Flow

### 2.1 Authentication Flow (Mandatory)

```
┌──────────────┐
│ App Launch   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐      No      ┌──────────────┐
│ User Logged In?  ├──────────────►│ Welcome Page │
└──────┬───────────┘               └──────┬───────┘
       │ Yes                               │
       │                          ┌────────┴────────┐
       │                          │                 │
       │                          ▼                 ▼
       │                   ┌──────────┐      ┌──────────┐
       │                   │  Login   │      │  Signup  │
       │                   └────┬─────┘      └────┬─────┘
       │                        │                 │
       │                        └────────┬────────┘
       │                                 │
       ▼                                 ▼
┌──────────────────┐            ┌─────────────────┐
│ Has Household?   │◄───────────┤ Email Verify    │
└──────┬───────────┘            └─────────────────┘
       │ No
       │
       ▼
┌──────────────────────────────────────────────────┐
│         MANDATORY ONBOARDING FLOW                │
│         (Cannot be skipped)                      │
└──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│  Step 1: Create  │
│   Household      │
│  (REQUIRED)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Step 2: Invite  │
│    Members       │
│  (Optional)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Step 3: Connect │
│    Calendar      │
│  (Optional)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Dashboard/Home  │
└──────────────────┘
```

### 2.2 Main App Navigation (Tab-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                    Bottom Tab Navigation                     │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│   Home   │  Tasks   │ Calendar │  Polls   │    Profile      │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
     │          │          │          │              │
     │          │          │          │              │
     ▼          ▼          ▼          ▼              ▼
  [Details below in Section 3]
```

---

## 3. Screen-by-Screen Flow

### 3.1 Onboarding Screens

#### Screen 1: Welcome
```
┌─────────────────────────────────────┐
│         Welcome to HouseHLD         │
│                                     │
│   [App Logo/Illustration]           │
│                                     │
│   Manage your household together    │
│                                     │
│   ┌─────────────────────────────┐   │
│   │      Get Started            │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │      I have an account      │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Screen 2: Login
```
┌─────────────────────────────────────┐
│           Welcome Back              │
│                                     │
│   Email: [________________]         │
│   Password: [____________]          │
│                                     │
│   ┌─────────────────────────────┐   │
│   │      Sign In                │   │
│   └─────────────────────────────┘   │
│                                     │
│   ─────── or sign in with ───────   │
│                                     │
│   [Google]  [Apple]                 │
│                                     │
│   Don't have an account? Sign up    │
└─────────────────────────────────────┘
```

#### Screen 3: Signup
```
┌─────────────────────────────────────┐
│         Create Account              │
│                                     │
│   Name: [________________]          │
│   Email: [________________]         │
│   Password: [____________]          │
│   Role: [Adult ▼]                   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │      Sign Up                │   │
│   └─────────────────────────────┘   │
│                                     │
│   ─────── or sign up with ───────   │
│                                     │
│   [Google]  [Apple]                 │
│                                     │
│   Already have an account? Login    │
└─────────────────────────────────────┘
```

#### Screen 4: Create Household (MANDATORY)
```
┌─────────────────────────────────────┐
│      Create your Household          │
│                                     │
│   [📷 Add Photo]                    │
│                                     │
│   Household Name *                  │
│   [________________]                │
│                                     │
│   Address (Optional)                │
│   [________________]                │
│                                     │
│   Primary Email *                   │
│   [________________]                │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   Create Household          │   │
│   └─────────────────────────────┘   │
│                                     │
│   * Cannot proceed without this     │
└─────────────────────────────────────┘
```

#### Screen 5: Invite Members (Optional)
```
┌─────────────────────────────────────┐
│      Invite Household Members       │
│                                     │
│   Email 1: [________________] [×]   │
│   Email 2: [________________] [×]   │
│   Email 3: [________________] [×]   │
│                                     │
│   [+ Add Another Email]             │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   Send Invitations          │   │
│   └─────────────────────────────┘   │
│                                     │
│   Skip for now                      │
│                                     │
│   ℹ️ Invitations sent via email     │
└─────────────────────────────────────┘
```

#### Screen 6: Calendar Connection (Optional)
```
┌─────────────────────────────────────┐
│      Connect Your Calendar          │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  📅 Google Calendar         │   │
│   │  Sync with Google Calendar  │   │
│   │                          ›  │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  📅 Apple iCloud            │   │
│   │  Sync with iCloud Calendar  │   │
│   │                          ›  │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   Skip - I'll do this later │   │
│   └─────────────────────────────┘   │
│                                     │
│   💡 You can connect later          │
└─────────────────────────────────────┘
```

---

### 3.2 Main App Screens

#### Home/Dashboard Screen
```
┌─────────────────────────────────────┐
│  Hello, John! 👋          [🔔 3]    │
│  Here's what's happening today      │
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │  ✓  │  │ 📅  │  │ 🛒  │         │
│  │  3  │  │  2  │  │  5  │         │
│  │Tasks│  │Event│  │ Buy │         │
│  └─────┘  └─────┘  └─────┘         │
│                                     │
│  Quick Confirm                      │
│  ┌─────────────────────────────┐   │
│  │ Task assigned: Take out trash│  │
│  │ [✓] [Done]                   │  │
│  └─────────────────────────────┘   │
│                                     │
│  Today's Meals                      │
│  ┌─────────────────────────────┐   │
│  │ 🍽️ Dinner - Pasta           │  │
│  │ 6:00 PM • Assigned to Sarah  │  │
│  └─────────────────────────────┘   │
│                                     │
│  Today's Tasks            See All   │
│  ┌─────────────────────────────┐   │
│  │ ✓ Take out trash             │  │
│  │ Daily • 7:00 PM              │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ✓ Water plants               │  │
│  │ Weekly • 8:00 AM             │  │
│  └─────────────────────────────┘   │
│                                     │
│  Upcoming Events          See All   │
│  ┌─────────────────────────────┐   │
│  │ 📅 Doctor Appointment        │  │
│  │ Dec 20 • 2:00 PM • Confirmed │  │
│  └─────────────────────────────┘   │
│                                     │
│  Shopping List            See All   │
│  ┌─────────────────────────────┐   │
│  │ 🛒 Milk                      │  │
│  │ 1 gallon • Dairy             │  │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Tasks Screen
```
┌─────────────────────────────────────┐
│  Tasks                    [+ New]   │
│                                     │
│  [All] [Pending] [Completed]        │
│                                     │
│  Today                              │
│  ┌─────────────────────────────┐   │
│  │ ○ Take out trash             │  │
│  │   Daily • 7:00 PM            │  │
│  │   Assigned to: John          │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ○ Water plants               │  │
│  │   Weekly • 8:00 AM           │  │
│  │   Assigned to: Sarah         │  │
│  └─────────────────────────────┘   │
│                                     │
│  Tomorrow                           │
│  ┌─────────────────────────────┐   │
│  │ ○ Grocery shopping           │  │
│  │   One-time • 10:00 AM        │  │
│  │   Assigned to: John          │  │
│  └─────────────────────────────┘   │
│                                     │
│  Completed                          │
│  ┌─────────────────────────────┐   │
│  │ ✓ Clean kitchen              │  │
│  │   Completed 2 hours ago      │  │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Task Detail (Modal)
```
┌─────────────────────────────────────┐
│  Take out trash            [×]      │
│                                     │
│  Title: Take out trash              │
│  Description: Take trash to curb    │
│                                     │
│  Frequency: Daily                   │
│  Due Date: Dec 19, 7:00 PM          │
│  Status: Pending                    │
│  Assigned to: John                  │
│                                     │
│  Comments (2)                       │
│  ┌─────────────────────────────┐   │
│  │ Sarah: Don't forget recycling│  │
│  │ 2 hours ago                  │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ John: Got it!                │  │
│  │ 1 hour ago                   │  │
│  └─────────────────────────────┘   │
│                                     │
│  [Add Comment...]                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Mark as Complete          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Edit] [Delete]                    │
└─────────────────────────────────────┘
```

#### Calendar Screen
```
┌─────────────────────────────────────┐
│  Calendar                 [+ New]   │
│                                     │
│  [Day] [Week] [Month]               │
│                                     │
│  December 2024                      │
│  ┌─────────────────────────────┐   │
│  │ Sun Mon Tue Wed Thu Fri Sat │   │
│  │  1   2   3   4   5   6   7  │   │
│  │  8   9  10  11  12  13  14  │   │
│  │ 15  16  17 [18] 19  20  21  │   │
│  │ 22  23  24  25  26  27  28  │   │
│  │ 29  30  31                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Today's Events                     │
│  ┌─────────────────────────────┐   │
│  │ 📅 Team Meeting              │  │
│  │ 10:00 AM - 11:00 AM          │  │
│  │ Status: Confirmed            │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📅 Dinner with Family        │  │
│  │ 6:00 PM - 8:00 PM            │  │
│  │ Status: Pending              │  │
│  └─────────────────────────────┘   │
│                                     │
│  🔗 Connected: Google Calendar      │
└─────────────────────────────────────┘
```

#### Event Detail (Modal)
```
┌─────────────────────────────────────┐
│  Team Meeting              [×]      │
│                                     │
│  Title: Team Meeting                │
│  Date: Dec 18, 2024                 │
│  Time: 10:00 AM - 11:00 AM          │
│  Description: Weekly team sync      │
│                                     │
│  Created by: John                   │
│  Assigned to: All members           │
│                                     │
│  Repeat: Weekly                     │
│  Status: Confirmed                  │
│                                     │
│  Calendar Source: Google Calendar   │
│                                     │
│  ⚠️ Conflict Resolution              │
│  ┌─────────────────────────────┐   │
│  │ Conflict with Sarah's event  │  │
│  │ [Keep Mine] [Keep Partner's] │  │
│  │ [Merge]                      │  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Confirm Attendance        │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Edit] [Delete]                    │
└─────────────────────────────────────┘
```

#### Shopping List Screen
```
┌─────────────────────────────────────┐
│  Shopping List            [+ Add]   │
│                                     │
│  [All] [Needed] [Purchased]         │
│                                     │
│  Needed (5)                         │
│  ┌─────────────────────────────┐   │
│  │ ☐ Milk                       │  │
│  │   1 gallon • Dairy           │  │
│  │   Added by John              │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ☐ Bread                      │  │
│  │   2 loaves • Bakery          │  │
│  │   Added by Sarah             │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ☐ Eggs                       │  │
│  │   1 dozen • Dairy            │  │
│  │   From meal: Breakfast       │  │
│  └─────────────────────────────┘   │
│                                     │
│  Purchased (3)                      │
│  ┌─────────────────────────────┐   │
│  │ ✓ Apples                     │  │
│  │   Purchased by Sarah         │  │
│  │   2 hours ago                │  │
│  └─────────────────────────────┘   │
│                                     │
│  💡 Auto-linked from Meal Planner   │
└─────────────────────────────────────┘
```

#### Shopping Item Detail (Modal)
```
┌─────────────────────────────────────┐
│  Milk                      [×]      │
│                                     │
│  Name: Milk                         │
│  Quantity: 1 gallon                 │
│  Category: Dairy                    │
│                                     │
│  Added by: John                     │
│  Added: 2 hours ago                 │
│                                     │
│  Comments (1)                       │
│  ┌─────────────────────────────┐   │
│  │ Sarah: Get organic if on sale│  │
│  │ 1 hour ago                   │  │
│  └─────────────────────────────┘   │
│                                     │
│  [Add Comment...]                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Mark as Purchased         │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Edit] [Delete]                    │
└─────────────────────────────────────┘
```

#### Polls Screen
```
┌─────────────────────────────────────┐
│  Family Polls             [+ New]   │
│                                     │
│  [Active] [Closed]                  │
│                                     │
│  Active Polls                       │
│  ┌─────────────────────────────┐   │
│  │ Where should we go for      │   │
│  │ vacation?                    │   │
│  │                              │   │
│  │ ○ Beach (3 votes) 60%        │   │
│  │ ○ Mountains (2 votes) 40%    │   │
│  │                              │   │
│  │ Expires in 2 days            │   │
│  │ [Vote] [Comment]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ What's for dinner Friday?    │   │
│  │                              │   │
│  │ ○ Pizza (1 vote) 33%         │   │
│  │ ○ Tacos (2 votes) 67%        │   │
│  │ ○ Pasta (0 votes) 0%         │   │
│  │                              │   │
│  │ Expires in 5 days            │   │
│  │ [Vote] [Comment]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Closed Polls                       │
│  ┌─────────────────────────────┐   │
│  │ Movie night choice           │   │
│  │ Winner: Action (4 votes)     │   │
│  │ Closed 2 days ago            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Poll Detail (Modal)
```
┌─────────────────────────────────────┐
│  Where should we go for    [×]      │
│  vacation?                          │
│                                     │
│  Created by: John                   │
│  Expires: Dec 20, 2024              │
│                                     │
│  Vote:                              │
│  ○ Beach (3 votes) 60%              │
│  ○ Mountains (2 votes) 40%          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Submit Vote               │   │
│  └─────────────────────────────┘   │
│                                     │
│  Comments (3)                       │
│  ┌─────────────────────────────┐   │
│  │ Sarah: I prefer the beach!   │  │
│  │ 1 hour ago                   │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ John: Mountains are cheaper  │  │
│  │ 30 minutes ago               │  │
│  └─────────────────────────────┘   │
│                                     │
│  [Add Comment...]                   │
│                                     │
│  [Edit] [Close Poll]                │
└─────────────────────────────────────┘
```

#### Meals Screen
```
┌─────────────────────────────────────┐
│  Meal Planner             [+ New]   │
│                                     │
│  [Week] [Month]                     │
│                                     │
│  This Week                          │
│  ┌─────────────────────────────┐   │
│  │ Monday, Dec 18               │  │
│  │ 🍽️ Breakfast: Pancakes       │  │
│  │    Assigned to: Sarah        │  │
│  │ 🍽️ Dinner: Spaghetti         │  │
│  │    Assigned to: John         │  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Tuesday, Dec 19              │  │
│  │ 🍽️ Dinner: Tacos             │  │
│  │    Assigned to: Sarah        │  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Wednesday, Dec 20            │  │
│  │ [+ Add Meal]                 │  │
│  └─────────────────────────────┘   │
│                                     │
│  🛒 Auto-linked to Shopping List    │
│  📅 Synced with Calendar            │
└─────────────────────────────────────┘
```

#### Meal Detail (Modal)
```
┌─────────────────────────────────────┐
│  Spaghetti                 [×]      │
│                                     │
│  Title: Spaghetti                   │
│  Date: Dec 18, 2024                 │
│  Time: 6:00 PM                      │
│  Description: Classic Italian       │
│                                     │
│  Assigned to: John                  │
│  Created by: Sarah                  │
│                                     │
│  Ingredients (5)                    │
│  ┌─────────────────────────────┐   │
│  │ ☐ Pasta - 1 lb               │  │
│  │ ☐ Tomato sauce - 1 jar       │  │
│  │ ☐ Ground beef - 1 lb         │  │
│  │ ☐ Onion - 1                  │  │
│  │ ☐ Garlic - 3 cloves          │  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Add to Shopping List      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Add to Calendar           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Edit] [Delete]                    │
└─────────────────────────────────────┘
```

#### Profile Screen
```
┌─────────────────────────────────────┐
│  Profile                            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      [Profile Photo]         │  │
│  │      John Smith              │  │
│  │      john@email.com          │  │
│  │      Role: Adult             │  │
│  └─────────────────────────────┘   │
│                                     │
│  Account                            │
│  ┌─────────────────────────────┐   │
│  │ Edit Profile              › │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Notifications             › │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Calendar Settings         › │  │
│  └─────────────────────────────┘   │
│                                     │
│  Household                          │
│  ┌─────────────────────────────┐   │
│  │ Manage Household          › │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Invite Members            › │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ View Members              › │  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Sign Out               │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Household Management Screen
```
┌─────────────────────────────────────┐
│  Household Management      [×]      │
│                                     │
│  Smith Family Household             │
│  123 Main St, City, State           │
│                                     │
│  Invite Code: ABC123                │
│  [Copy] [Share]                     │
│                                     │
│  Members (4)                        │
│  ┌─────────────────────────────┐   │
│  │ 👤 John Smith (You)          │  │
│  │    Admin • Adult             │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Sarah Smith               │  │
│  │    Admin • Adult             │  │
│  │    [Remove]                  │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Emma Smith                │  │
│  │    Member • Child            │  │
│  │    [Remove]                  │  │
│  └─────────────────────────────┘   │
│                                     │
│  Pending Invitations (1)            │
│  ┌─────────────────────────────┐   │
│  │ 📧 mike@email.com            │  │
│  │    Sent 2 days ago           │  │
│  │    [Resend] [Cancel]         │  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Invite New Member         │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Edit Household] [Leave Household] │
└─────────────────────────────────────┘
```

---

## 4. Data Flow Architecture

### 4.1 Entity Relationships

```
┌──────────────┐
│  Household   │
└──────┬───────┘
       │
       ├──────► Users (1:N)
       │        └──► User Settings (1:1)
       │        └──► Calendar Connections (1:N)
       │        └──► Notifications (1:N)
       │
       ├──────► Tasks (1:N)
       │        └──► Task Comments (1:N)
       │
       ├──────► Shopping Items (1:N)
       │        └──► Shopping Item Comments (1:N)
       │
       ├──────► Events (1:N)
       │
       ├──────► Expenses (1:N)
       │
       ├──────► Polls (1:N)
       │        ├──► Poll Options (1:N)
       │        ├──► Poll Votes (1:N)
       │        └──► Poll Comments (1:N)
       │
       ├──────► Meals (1:N)
       │        └──► Meal Ingredients (1:N)
       │             └──► Shopping Items (N:1)
       │
       └──────► Household Invitations (1:N)
```

### 4.2 Real-time Sync Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Supabase Real-time                      │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Device 1    │  │   Device 2    │  │   Device 3    │
│   (John)      │  │   (Sarah)     │  │   (Emma)      │
└───────────────┘  └───────────────┘  └───────────────┘

User Action on Device 1:
1. Create Task → Supabase
2. Supabase broadcasts to all subscribed devices
3. Device 2 & 3 receive update instantly
4. UI updates automatically
```

### 4.3 Calendar Integration Flow

```
┌─────────────────┐
│  HouseHLD App   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OAuth Flow     │
│  (Google/Apple) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calendar        │
│ Connections     │
│ Table           │
└────────┬────────┘
         │
         ├──► Bi-directional Sync
         │
         ▼
┌─────────────────┐
│ Household       │
│ Events Table    │
└─────────────────┘

Conflict Resolution:
1. Detect conflicting events
2. Present options to user:
   - Keep My Version
   - Keep Partner's Version
   - Merge Both
3. Update both systems
```

---

## 5. User Actions & Interactions

### 5.1 Task Management Flow

```
User Action: Create Task
    │
    ▼
┌─────────────────┐
│ Fill Task Form  │
│ - Title         │
│ - Description   │
│ - Frequency     │
│ - Due Date      │
│ - Assign To     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │
│ (tasks table)   │
└────────┬────────┘
         │
         ├──► Notify assigned user
         │
         ├──► Add to calendar if has due date
         │
         └──► Real-time sync to all devices
```

### 5.2 Shopping List Flow

```
User Action: Add Item
    │
    ▼
┌─────────────────┐
│ Add Item Form   │
│ - Name          │
│ - Quantity      │
│ - Category      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │
│ (shopping_items)│
└────────┬────────┘
         │
         ├──► Real-time sync to all devices
         │
         └──► Notify household members

User Action: Mark Purchased
    │
    ▼
┌─────────────────┐
│ Update Status   │
│ purchased = true│
│ purchased_by    │
│ purchased_at    │
└────────┬────────┘
         │
         └──► Real-time sync to all devices
```

### 5.3 Meal Planning Flow

```
User Action: Create Meal
    │
    ▼
┌─────────────────┐
│ Fill Meal Form  │
│ - Title         │
│ - Date/Time     │
│ - Assigned To   │
│ - Ingredients   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │
│ (meals table)   │
└────────┬────────┘
         │
         ├──► Create meal_ingredients records
         │
         ├──► Auto-add ingredients to shopping list
         │
         ├──► Create calendar event
         │
         ├──► Notify assigned user
         │
         └──► Real-time sync to all devices
```

### 5.4 Poll Flow

```
User Action: Create Poll
    │
    ▼
┌─────────────────┐
│ Fill Poll Form  │
│ - Title         │
│ - Description   │
│ - Options       │
│ - Expiry Date   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │
│ (polls table)   │
└────────┬────────┘
         │
         ├──► Create poll_options records
         │
         ├──► Notify household members
         │
         └──► Real-time sync to all devices

User Action: Vote
    │
    ▼
┌─────────────────┐
│ Select Option   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Vote       │
│ (poll_votes)    │
└────────┬────────┘
         │
         ├──► Update vote count
         │
         ├──► Notify poll creator
         │
         └──► Real-time sync to all devices
```

---

## 6. Notification System

### 6.1 Notification Types

```
┌─────────────────────────────────────┐
│        Notification Types            │
├─────────────────────────────────────┤
│ • Task Assigned                      │
│ • Task Completed                     │
│ • Event Created                      │
│ • Event Reminder                     │
│ • Shopping Item Added                │
│ • Shopping Item Purchased            │
│ • Poll Created                       │
│ • Poll Vote Cast                     │
│ • Poll Expiring Soon                 │
│ • Meal Assigned                      │
│ • Expense Added                      │
│ • Invitation Sent                    │
│ • Invitation Accepted                │
│ • Calendar Conflict                  │
└─────────────────────────────────────┘
```

### 6.2 Notification Flow

```
Trigger Event
    │
    ▼
┌─────────────────┐
│ Create          │
│ Notification    │
│ Record          │
└────────┬────────┘
         │
         ├──► Push Notification (if enabled)
         │
         ├──► Email Notification (if enabled)
         │
         ├──► In-app Notification
         │
         └──► Real-time sync to user's devices
```

---

## 7. Role-Based Permissions

### 7.1 Permission Matrix

```
┌──────────────┬─────────┬─────────┬─────────┬───────────┐
│   Action     │  Admin  │  Adult  │  Child  │ Roommate  │
├──────────────┼─────────┼─────────┼─────────┼───────────┤
│ Create Task  │    ✓    │    ✓    │    ✗    │     ✓     │
│ Edit Task    │    ✓    │    ✓    │    ✗    │     ✓     │
│ Delete Task  │    ✓    │    ✓    │    ✗    │     ✓     │
│ Complete Task│    ✓    │    ✓    │    ✓    │     ✓     │
├──────────────┼─────────┼─────────┼─────────┼───────────┤
│ Add Shopping │    ✓    │    ✓    │    ✓    │     ✓     │
│ Edit Shopping│    ✓    │    ✓    │    ✗    │     ✓     │
│ Delete Shop  │    ✓    │    ✓    │    ✗    │     ✓     │
│ Mark Bought  │    ✓    │    ✓    │    ✓    │     ✓     │
├──────────────┼─────────┼─────────┼─────────┼───────────┤
│ Create Event │    ✓    │    ✓    │    ✗    │     ✓     │
│ Edit Event   │    ✓    │    ✓    │    ✗    │     ✓     │
│ Delete Event │    ✓    │    ✓    │    ✗    │     ✓     │
├──────────────┼─────────┼─────────┼─────────┼───────────┤
│ Create Poll  │    ✓    │    ✓    │    ✓    │     ✓     │
│ Vote on Poll │    ✓    │    ✓    │    ✓    │     ✓     │
│ Comment Poll │    ✓    │    ✓    │    ✓    │     ✓     │
├──────────────┼─────────┼─────────┼─────────┼───────────┤
│ Invite Member│    ✓    │    ✓    │    ✗    │     ✗     │
│ Remove Member│    ✓    │    ✗    │    ✗    │     ✗     │
│ Edit Househld│    ✓    │    ✗    │    ✗    │     ✗     │
└──────────────┴─────────┴─────────┴─────────┴───────────┘
```

---

## 8. Mobile-First Design Principles

### 8.1 Design Guidelines

```
┌─────────────────────────────────────┐
│     Mobile-First Design              │
├─────────────────────────────────────┤
│ • Clean, breathable layouts          │
│ • Large touch targets (44x44 min)    │
│ • Bottom navigation for easy reach   │
│ • Swipe gestures for actions         │
│ • Pull-to-refresh on lists           │
│ • Modal sheets for details           │
│ • Inline editing where possible      │
│ • Real-time updates without refresh  │
│ • Optimistic UI updates              │
│ • Offline-first architecture         │
│ • Dark mode support                  │
│ • Accessibility (WCAG 2.1 AA)        │
└─────────────────────────────────────┘
```

### 8.2 Responsive Breakpoints

```
Mobile:  320px - 767px  (Primary target)
Tablet:  768px - 1023px (Optimized)
Desktop: 1024px+        (Supported)
```

---

## 9. Technical Architecture

### 9.1 Tech Stack

```
┌─────────────────────────────────────┐
│         Frontend                     │
│  • React Native (Expo 54)            │
│  • TypeScript                        │
│  • Expo Router (File-based routing)  │
│  • React Context (State management)  │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         Backend                      │
│  • Supabase (PostgreSQL)             │
│  • Row Level Security (RLS)          │
│  • Real-time Subscriptions           │
│  • Edge Functions (Serverless)       │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Authentication                  │
│  • Supabase Auth                     │
│  • Email/Password                    │
│  • OAuth (Google, Apple)             │
│  • Email Verification                │
└─────────────────────────────────────┘
```

### 9.2 Data Persistence

```
┌─────────────────────────────────────┐
│      Supabase PostgreSQL             │
│                                      │
│  • 18 Tables                         │
│  • 90+ Indexes                       │
│  • 37 Foreign Keys                   │
│  • 80+ RLS Policies                  │
│  • Real-time enabled                 │
│  • Automatic backups                 │
└─────────────────────────────────────┘
```

---

## 10. Summary

### 10.1 Key Features

1. **Mandatory Onboarding** - Cannot skip household creation
2. **Real-time Sync** - All data syncs instantly across devices
3. **Role-based Access** - Different permissions for different roles
4. **Calendar Integration** - OAuth with Google/Apple calendars
5. **Conflict Resolution** - Smart handling of calendar conflicts
6. **Meal Planning** - Auto-links ingredients to shopping list
7. **Family Polls** - Democratic decision-making
8. **Task Management** - Recurring tasks with assignments
9. **Shopping Lists** - Collaborative shopping with comments
10. **Notifications** - Real-time alerts for all activities

### 10.2 User Journey Summary

```
1. Sign Up/Login
   ↓
2. Create Household (MANDATORY)
   ↓
3. Invite Members (Optional)
   ↓
4. Connect Calendar (Optional)
   ↓
5. Dashboard/Home
   ↓
6. Use Features:
   - Tasks
   - Calendar
   - Shopping
   - Polls
   - Meals
   - Expenses
   ↓
7. Manage Household & Profile
```

---

**Diagram Generated:** December 2024  
**Status:** ✅ Complete & Production-Ready  
**Platform:** iOS & Android (React Native + Expo)
