# TalentIQ - Complete Project Overview

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [System Flow](#system-flow)
5. [Code Execution System](#code-execution-system)
6. [API Endpoints](#api-endpoints)
7. [Session Management System](#session-management-system)
8. [Test Case Validation System](#test-case-validation-system)
9. [User Profile & Stats System](#user-profile--stats-system)
10. [Database Schema](#database-schema)
11. [Authentication & Authorization](#authentication--authorization)
12. [Real-time Features](#real-time-features)

---

## 🎯 Project Overview

**TalentIQ** is a **LeetCode-style coding platform** with integrated **video collaboration features**. It allows users to:
- Solve algorithmic problems in **JavaScript, Python, and Java**
- Submit code and get real-time evaluation against test cases
- Create and join collaborative coding sessions with video/audio
- Track progress with LeetCode-style profiles and heatmaps
- Chat during collaborative sessions

### Key Features
✅ Multi-language code execution (JS, Python, Java)  
✅ Real-time code evaluation with hidden test cases  
✅ Video call integration for pair programming  
✅ Real-time chat during sessions  
✅ User profiles with submission history and heatmaps  
✅ Admin panel for problem management  
✅ Streak tracking and activity analytics  

---

## 🛠️ Technology Stack

### **Backend**
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database and ODM |
| **Clerk (@clerk/express)** | Authentication & user management |
| **Stream (@stream-io/node-sdk)** | Video calls and real-time chat |
| **Inngest** | Background job processing (user sync) |
| **UUID** | Unique execution file generation |

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool and dev server |
| **TailwindCSS** | Styling framework |
| **React Router** | Client-side routing |
| **@clerk/clerk-react** | Authentication UI |
| **@stream-io/video-react-sdk** | Video call components |
| **stream-chat-react** | Chat UI components |
| **@monaco-editor/react** | Code editor (VSCode-like) |
| **Axios** | HTTP client |
| **@tanstack/react-query** | Data fetching and caching |
| **React Hot Toast** | Notifications |
| **Canvas Confetti** | Celebration effects |

### **Programming Languages for Code Execution**
- JavaScript (Node.js runtime)
- Python 3
- Java (JDK with javac and java)

---

## 🏗️ Project Architecture

```
talent-IQ/
│
├── backend/                    # Node.js Express server
│   ├── src/
│   │   ├── server.js          # Main server entry point
│   │   ├── controllers/       # Business logic handlers
│   │   ├── routes/            # API route definitions
│   │   ├── models/            # MongoDB Mongoose schemas
│   │   ├── middleware/        # Auth and request middleware
│   │   ├── services/          # Reusable business logic
│   │   ├── judge/             # Code execution system
│   │   ├── lib/               # External service clients
│   │   └── utils/             # Helper functions
│   └── temp/judge/            # Temporary execution files
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── main.jsx           # App entry point
│   │   ├── App.jsx            # Root component with routing
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   ├── api/               # API client functions
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # Utilities and configs
│   └── public/                # Static assets
│
└── Documentation files         # MD files for guides
```

---

## 🔄 System Flow

### **1. User Registration & Authentication Flow**
```
User Signs Up/In (Clerk) 
    ↓
Clerk webhook fires "user.created" event
    ↓
Inngest background job triggered
    ↓
User created in MongoDB (User model)
    ↓
Stream user created (for video/chat)
    ↓
UserProfile created with unique profile ID
    ↓
User can access platform
```

**Files Involved:**
- `backend/src/lib/inngest.js` - Background job definitions
- `backend/src/utils/userRegistrationHandler.js` - User creation logic
- `backend/src/services/profileService.js` - Profile creation

### **2. Problem Solving Flow**
```
User navigates to problem page
    ↓
Frontend fetches problem details (GET /api/problems/:id)
    ↓
User writes code in Monaco Editor
    ↓
User clicks "Run Code"
    ↓
POST /api/judge/run (runs against visible examples)
    ↓
Judge system executes code with language-specific executor
    ↓
Results displayed to user 
    ↓
User clicks "Submit"
    ↓
POST /api/judge/submit (runs against all test cases including hidden)
    ↓
Submission saved to database
    ↓
Profile stats updated (total solved, streak, heatmap)
    ↓
Success/failure message shown
```

### **3. Collaborative Session Flow**
```
Host creates session (POST /api/sessions)
    ↓
Stream video call created with unique callId
    ↓
Stream chat channel created
    ↓
Session saved to MongoDB
    ↓
Host shares session (appears in active sessions list)
    ↓
Participant joins session (POST /api/sessions/:id/join)
    ↓
Participant added to Stream call and chat
    ↓
Both users can video chat, message, and code together
    ↓
Session marked as completed when ended
```

---

## ⚙️ Code Execution System

### **Architecture Overview**

The judge system supports **JavaScript, Python, and Java** by wrapping user code and executing it in isolated processes.

```
Judge Controller (judgeController.js)
    ↓
Language Detection → Routes to appropriate executor
    ↓
┌──────────────┬──────────────┬──────────────┐
│  jsExecutor  │ pythonExecutor│ javaExecutor │
└──────────────┴──────────────┴──────────────┘
    ↓               ↓               ↓
Generates wrapper → Writes temp file → Executes → Returns result
```

### **How Code Execution Works**

#### **1. JavaScript Execution (`jsExecutor.js`)**
```javascript
// User writes:
function twoSum(nums, target) { ... }

// System generates wrapper:
const userFunction = function twoSum(nums, target) { ... };
const result = userFunction([2,7,11,15], 9);
console.log(JSON.stringify(result));

// Executes with: node tempFile.js
```

**Process:**
1. Extract function name from user code
2. Wrap function with test inputs
3. Write to `temp/judge/{uuid}.js`
4. Execute with `node` command
5. Capture stdout (the result)
6. Delete temp file
7. Compare output with expected output

#### **2. Python Execution (`pythonExecutor.js`)**
```python
# User writes:
def two_sum(nums, target):
    ...

# System generates wrapper:
def two_sum(nums, target):
    ...

result = two_sum([2,7,11,15], 9)
print(json.dumps(result))

# Executes with: python tempFile.py
```

#### **3. Java Execution (`javaExecutor.js`)**
```java
// User writes:
class Solution {
    public int[] twoSum(int[] nums, int target) { ... }
}

// System generates wrapper:
class Solution { ... }  // User code

public class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        var result = solution.twoSum(new int[]{2,7,11,15}, 9);
        System.out.println(Arrays.toString(result));
    }
}

// Executes with: javac Main.java && java Main
```

### **Key Components**

| File | Purpose |
|------|---------|
| `judgeController.js` | Main controller handling `/run` and `/submit` endpoints |
| `jsExecutor.js` | JavaScript code wrapper and execution |
| `pythonExecutor.js` | Python code wrapper and execution |
| `javaExecutor.js` | Java code wrapper and execution |
| `inputParser.js` | Parses test case inputs into function arguments |
| `outputComparator.js` | Compares actual vs expected outputs |

### **Execution Flow Diagram**
```
User Code + Test Inputs
    ↓
inputParser.js → Parse inputs to function args
    ↓
{language}Executor.js → Generate wrapper code
    ↓
Write to temp/judge/{uuid}.{ext}
    ↓
Execute with language runtime (node/python/javac+java)
    ↓
Capture stdout and stderr
    ↓
outputComparator.js → Compare results
    ↓
Return {success, output, error, passed}
    ↓
Delete temp file
```

### **Error Handling**
- **Compilation Errors**: Caught during Java compilation phase
- **Runtime Errors**: Caught with try-catch in wrapper code
- **Timeout**: 10 seconds max execution time
- **Memory Limit**: Node.js buffer limit (1MB)

---

## 🌐 API Endpoints

### **Authentication**
All protected routes use Clerk middleware (`protectRoute`) which validates JWT tokens.

### **Core API Routes**

#### **Problem Management**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/problems` | Get all problems | Public |
| GET | `/api/problems/:id` | Get problem details | Public |
| GET | `/api/problems/:id/test-cases` | Get visible test cases | Private |

#### **Judge System**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/judge/run` | Run code against examples | Private |
| POST | `/api/judge/submit` | Submit code against all test cases | Private |

**Request Body (POST /api/judge/run):**
```json
{
  "problemId": "two-sum",
  "code": "function twoSum(nums, target) { return [0, 1]; }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "status": "passed",
  "results": [
    {
      "testCase": 1,
      "input": "nums = [2,7,11,15], target = 9",
      "expectedOutput": "[0,1]",
      "userOutput": "[0,1]",
      "passed": true,
      "executionTime": "2ms"
    }
  ]
}
```

#### **Submissions**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/submissions/:problemId` | Submit solution | Private |
| GET | `/api/submissions/:problemId` | Get user's submissions for problem | Private |

#### **Sessions (Collaborative Coding)**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions` | Create new session | Private |
| GET | `/api/sessions` | Get active sessions | Private |
| GET | `/api/sessions/my-recent` | Get user's recent sessions | Private |
| GET | `/api/sessions/:id` | Get session details | Private |
| POST | `/api/sessions/:id/join` | Join a session | Private |
| PATCH | `/api/sessions/:id/complete` | Mark session as completed | Private |

#### **Chat & Video**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/chat/token` | Get Stream token for video/chat | Private |

#### **User Profile**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile/:profileId` | Get public profile | Public |
| GET | `/api/profile/my/stats` | Get current user's stats | Private |
| GET | `/api/profile/my/heatmap` | Get activity heatmap data | Private |

#### **Preferences**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/preferences` | Get user preferences | Private |
| PUT | `/api/preferences` | Update preferences | Private |

#### **Admin**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/problems` | Create new problem | Admin |
| PUT | `/api/admin/problems/:id` | Update problem | Admin |
| DELETE | `/api/admin/problems/:id` | Delete problem | Admin |

---

## 🎥 Session Management System

### **What are Sessions?**
Sessions allow two users to collaborate on solving problems together with:
- Video and audio communication
- Real-time chat
- Shared problem context

### **Technologies Used**
- **Stream Video SDK** - Powers video calls
- **Stream Chat SDK** - Powers real-time messaging
- **MongoDB** - Stores session metadata

### **Session Lifecycle**

```
1. HOST CREATES SESSION
   POST /api/sessions
   Body: { problem: "Two Sum", difficulty: "easy" }
   ↓
   - Generates unique callId (session_timestamp_random)
   - Creates Stream video call
   - Creates Stream chat channel
   - Saves session to MongoDB
   
2. SESSION LISTED
   GET /api/sessions
   ↓
   Returns all active sessions
   
3. PARTICIPANT JOINS
   POST /api/sessions/:id/join
   ↓
   - Adds participant to session in DB
   - Adds participant to Stream call
   - Adds participant to chat channel
   
4. COLLABORATION
   - Both users see video/audio
   - Both can send chat messages
   - Both can code (shared editor state via context)
   
5. SESSION ENDS
   PATCH /api/sessions/:id/complete
   ↓
   - Marks session status as "completed"
   - Session removed from active list
```

### **Database Schema (Session Model)**
```javascript
{
  problem: String,              // Problem being solved
  difficulty: String,           // easy/medium/hard
  host: ObjectId,              // User who created session
  participant: ObjectId,       // User who joined (null if no one)
  status: String,              // "active" or "completed"
  callId: String,              // Stream video call ID
  createdAt: Date,
  updatedAt: Date
}
```

### **Key Files**
- `backend/src/controllers/sessionController.js` - Session CRUD operations
- `backend/src/models/Session.js` - MongoDB schema
- `backend/src/lib/stream.js` - Stream SDK initialization
- `frontend/src/pages/SessionRoom.jsx` - Video call UI

---

## ✅ Test Case Validation System

### **How Test Cases Work**

#### **1. Problem Test Cases Structure**
Each problem has test cases stored in MongoDB:
```javascript
testCases: [
  {
    input: '{"nums": [2,7,11,15], "target": 9}',
    expectedOutput: '[0,1]',
    isHidden: false  // Visible to users
  },
  {
    input: '{"nums": [3,2,4], "target": 6}',
    expectedOutput: '[1,2]',
    isHidden: true   // Hidden test case
  }
]
```

#### **2. Run vs Submit**

**Run Code (`/api/judge/run`):**
- Executes only **visible test cases** (isHidden: false)
- Shows full input/output to user
- Used for debugging

**Submit Code (`/api/judge/submit`):**
- Executes **ALL test cases** (including hidden)
- Only shows pass/fail for hidden cases
- Determines final verdict (Accepted/Wrong Answer)

#### **3. Test Case Execution Process**

```
1. PARSE INPUTS
   inputParser.js reads: '{"nums": [2,7,11,15], "target": 9}'
   ↓
   Converts to function arguments: [[2,7,11,15], 9]

2. EXECUTE CODE
   Language executor wraps user code with test inputs
   ↓
   Captures output: "[0,1]"

3. NORMALIZE OUTPUT
   outputComparator.js normalizes both expected and actual
   ↓
   Handles: arrays, objects, strings, numbers, booleans

4. COMPARE
   Expected: [0,1]
   Actual: [0,1]
   ↓
   Result: PASS ✅
```

### **Output Comparison Logic**
```javascript
// outputComparator.js handles:
- JSON parsing and normalization
- Array order comparison (strict)
- Float precision tolerance
- String trimming and case handling
- Null/undefined handling
- Edge cases (empty arrays, nested structures)
```

### **Test Case Results Format**
```javascript
{
  testCase: 1,
  input: "nums = [2,7,11,15], target = 9",
  expectedOutput: "[0,1]",
  userOutput: "[0,1]",
  passed: true,
  executionTime: "3ms"
}
```

### **Verdict Types**
- **Accepted** - All test cases passed
- **Wrong Answer** - Output doesn't match expected
- **Runtime Error** - Code crashed during execution
- **Time Limit Exceeded** - Execution took > 10 seconds
- **Compilation Error** - Code failed to compile (Java)

---

## 👤 User Profile & Stats System

### **Profile System Overview**
TalentIQ implements a **LeetCode-style profile system** with:
- Public profile IDs (e.g., `skillful_shark_42`)
- Submission statistics
- Contribution heatmap
- Streak tracking
- Language preferences

### **Profile Creation**
When a user registers:
1. Clerk creates authentication record
2. Inngest webhook fires
3. MongoDB User document created
4. **UserProfile** automatically created with:
   - Unique public profile ID
   - Initial stats (all zeros)
   - Empty heatmap data

### **Profile Components**

#### **1. Stats Tracking**
```javascript
stats: {
  totalSolved: 15,        // Total problems solved
  easySolved: 8,          // Easy problems
  mediumSolved: 5,        // Medium problems
  hardSolved: 2           // Hard problems
}
```

#### **2. Submission Stats**
```javascript
submissionStats: {
  totalSubmissions: 45,        // All submissions
  acceptedSubmissions: 15,     // Only accepted
  acceptanceRate: "33.3%"
}
```

#### **3. Language Stats**
```javascript
languageStats: {
  javascript: 10,    // Number of JS submissions
  python: 3,
  java: 2
}
```

#### **4. Streak System**
```javascript
streak: {
  current: 7,              // Current streak (days)
  max: 14,                // Longest streak ever
  lastActivityDate: "2024-02-01"
}
```

**Streak Rules:**
- Increments when user solves a problem
- Resets if no activity for 24+ hours
- Max streak tracks all-time best

#### **5. Activity Heatmap**
```javascript
activeDates: [
  { date: "2024-02-01", count: 3 },  // Solved 3 problems
  { date: "2024-02-02", count: 1 }
]
```

### **Stats Update Flow**
```
User submits solution (Accepted)
    ↓
submissionController.js calls processSubmission()
    ↓
profileService.js updates:
    - totalSolved (+1)
    - difficulty-specific count (+1)
    - activeDates (add today if not exists)
    - streak (calculate based on last activity)
    - languageStats (increment language counter)
    ↓
SolvedProblem record created (tracks which problems solved)
    ↓
Profile saved to database
```

### **Key Files**
- `backend/src/models/UserProfile.js` - Profile schema
- `backend/src/services/profileService.js` - Profile business logic
- `backend/src/utils/dateUtils.js` - Heatmap and streak calculations
- `backend/src/utils/profileUtils.js` - Profile ID generation

---

## 🗄️ Database Schema

### **MongoDB Collections**

#### **1. Users**
```javascript
{
  clerkId: String (unique),      // Clerk authentication ID
  email: String,
  name: String,
  profileImage: String,
  role: String,                  // "user" or "admin"
  profile: ObjectId,             // Reference to UserProfile
  submissions: [{...}],          // Embedded submissions
  preferredLanguage: String,
  languageStats: {...},
  createdAt: Date
}
```

#### **2. Problems**
```javascript
{
  title: String (unique),
  slug: String (unique),
  description: String,
  difficulty: String,            // Easy/Medium/Hard
  category: String,
  constraints: [String],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean
  }],
  starterCode: {
    javascript: String,
    python: String,
    java: String
  },
  totalSubmissions: Number,
  acceptedSubmissions: Number,
  createdBy: ObjectId,
  isActive: Boolean
}
```

#### **3. Sessions**
```javascript
{
  problem: String,
  difficulty: String,
  host: ObjectId,
  participant: ObjectId,
  status: String,                // "active" or "completed"
  callId: String,                // Stream video call ID
  createdAt: Date
}
```

#### **4. Submissions**
```javascript
{
  user: ObjectId,
  problem: ObjectId,
  code: String,
  language: String,
  verdict: String,               // Accepted/Wrong Answer/etc.
  submittedAt: Date
}
```

#### **5. UserProfiles**
```javascript
{
  userId: ObjectId,
  publicProfileId: String (unique),  // e.g., "skillful_shark_42"
  stats: {...},
  submissionStats: {...},
  languageStats: {...},
  streak: {...},
  totalActiveDays: Number,
  activeDates: [{
    date: String,
    count: Number
  }]
}
```

#### **6. SolvedProblems**
```javascript
{
  userId: ObjectId,
  problemId: ObjectId,
  firstSolvedAt: Date,
  lastSolvedAt: Date,
  solveCount: Number,
  languages: [String]
}
```

---

## 🔐 Authentication & Authorization

### **Authentication Flow**
```
User signs in via Clerk UI
    ↓
Clerk generates JWT token
    ↓
Frontend stores token in memory
    ↓
Every API request includes token in headers
    ↓
Backend middleware (protectRoute) validates token
    ↓
Token decoded → user ID extracted
    ↓
User document fetched from MongoDB
    ↓
req.user populated with user data
    ↓
Controller accesses req.user
```

### **Middleware: `protectRoute.js`**
```javascript
export const protectRoute = async (req, res, next) => {
  // 1. Extract Clerk user ID from req.auth
  // 2. Find user in MongoDB by clerkId
  // 3. Attach user to req.user
  // 4. Call next() or return 401
}
```

### **Admin Routes**
Admin-only routes check `req.user.role === "admin"`:
```javascript
if (req.user.role !== "admin") {
  return res.status(403).json({ message: "Access denied" });
}
```

---

## 🔴 Real-time Features

### **Stream Integration**

#### **1. Video Calls**
- **SDK**: `@stream-io/node-sdk` (backend), `@stream-io/video-react-sdk` (frontend)
- **How it works**:
  - Backend creates Stream video call with unique `callId`
  - Frontend joins call using `callId` and user token
  - Stream handles WebRTC peer connections

#### **2. Chat**
- **SDK**: `stream-chat` (backend), `stream-chat-react` (frontend)
- **How it works**:
  - Each session has a dedicated chat channel
  - Messages sent via Stream's real-time infrastructure
  - Persistent message history

### **Stream User Sync**
When a user is created/deleted in Clerk:
```
Inngest job → Sync Stream user
    ↓
upsertStreamUser() or deleteStreamUser()
    ↓
Stream user created/deleted
```

---

## 📊 Project Statistics

- **Total API Endpoints**: 25+
- **Database Collections**: 7
- **Supported Languages**: 3 (JS, Python, Java)
- **External Services**: 3 (Clerk, Stream, Inngest)
- **Real-time Features**: Video, Chat
- **Code Execution**: Sandboxed temp file execution

---

## 🚀 How to Run the Project

### **Prerequisites**
- Node.js (v16+)
- MongoDB (local or Atlas)
- Python 3
- Java JDK
- Clerk account (authentication)
- Stream account (video/chat)

### **Environment Variables**

**Backend (`.env`):**
```env
MONGODB_URI=mongodb://localhost:27017/talentiq
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stream
STREAM_API_KEY=...
STREAM_API_SECRET=...

# Inngest
INNGEST_EVENT_KEY=...
```

**Frontend (`.env`):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000/api
```

### **Installation**
```bash
# Install all dependencies
npm run build

# Run backend
cd backend
npm run dev

# Run frontend (separate terminal)
cd frontend
npm run dev
```

### **Seeding Database**
```bash
cd backend
npm run seed  # Seeds problems to database
```

---

## 📂 Important Files Reference

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Server Entry** | `backend/src/server.js` | Express app initialization |
| **Judge System** | `backend/src/judge/judgeController.js` | Code execution orchestration |
| **JS Executor** | `backend/src/judge/jsExecutor.js` | JavaScript code wrapper |
| **Python Executor** | `backend/src/judge/pythonExecutor.js` | Python code wrapper |
| **Java Executor** | `backend/src/judge/javaExecutor.js` | Java code wrapper |
| **Session Management** | `backend/src/controllers/sessionController.js` | Session CRUD |
| **Profile Service** | `backend/src/services/profileService.js` | Profile stats logic |
| **Stream Integration** | `backend/src/lib/stream.js` | Video/chat setup |
| **Database Connection** | `backend/src/lib/db.js` | MongoDB connection |
| **Auth Middleware** | `backend/src/middleware/protectRoute.js` | JWT validation |

---

## 🎯 System Highlights

### **Why This Architecture?**
1. **Separation of Concerns**: Controllers → Services → Models
2. **Modularity**: Each executor is independent
3. **Scalability**: Background jobs with Inngest
4. **Security**: JWT-based auth, sandboxed code execution
5. **Real-time**: Stream for video/chat without building WebRTC

### **Unique Features**
- **Multi-language Support**: Not just Node.js—Python and Java too
- **Collaborative Sessions**: Video + Chat + Code = Complete pair programming
- **LeetCode-style Profiles**: Heatmaps, streaks, and public profiles
- **Hidden Test Cases**: Just like real coding platforms

---

## 📝 Summary

TalentIQ is a **full-stack coding platform** that combines:
1. **LeetCode-style problem solving** with multi-language support
2. **Real-time code execution** using sandboxed temporary files
3. **Video collaboration** powered by Stream SDK
4. **User profiles and analytics** with heatmaps and streaks
5. **Modern tech stack** (MERN + Clerk + Stream + Inngest)

The system is designed to be **extensible** (easy to add more languages), **secure** (isolated execution), and **collaborative** (video + chat built-in).

---

**Last Updated**: February 2, 2026  
**Project Version**: 1.0.0  
**Maintainer**: TalentIQ Team
