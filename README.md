# Agentic AI Banking Onboarding System

A fully functional bank account creation system powered by AI agents, using Next.js, MongoDB, and Google Gemini.

## 🚀 Features

### ✅ Implemented
- **OAuth Authentication**: Google login via NextAuth.js v5
- **AI-Powered Chat Interface**: Conversational form filling with strict validation
- **Multi-Agent Architecture**: 
  - Master Agent: Orchestrates the onboarding flow
  - Worker-KYC: Handles document verification
  - Worker-MCP: Creates bank accounts
- **Real-time Validation**: Name, DOB, Phone, Address validation
- **Document Upload**: Aadhaar and PAN document handling
- **Mock KYC Services**: DigiLocker mock API for document verification
- **MongoDB Integration**: Persistent storage for users, onboarding progress, and accounts
- **Full TypeScript to JavaScript Migration**: Pure JavaScript codebase

### 🎯 Account Creation Flow
1. User logs in with Google OAuth
2. Dashboard shows 3 menu options (Create Account, Loan, Credit Card)
3. User selects "Create Account"
4. Master Agent guides through:
   - **Full Name** (letters only, no numbers)
   - **Date of Birth** (YYYY-MM-DD, must be 18+)
   - **Phone** (10-digit Indian number, starts with 6-9)
   - **Address** (minimum 10 characters)
   - **Aadhaar Upload** (PDF/XML)
   - **PAN Upload** (PDF)
5. Worker-KYC verifies documents via mock DigiLocker
6. Worker-MCP creates account with 12-digit account number
7. User receives confirmation with account number

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: NextAuth.js v5 (Auth.js) with Google OAuth
- **AI/LLM**: Google Gemini 1.5 Flash (Free Tier)
- **File Upload**: Local file system (can be extended to S3/MinIO)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account or local MongoDB
- Google OAuth credentials
- Google AI API key

### Setup Steps

1. **Clone and Install**
```powershell
cd path\to\project
npm install
```

2. **Configure Environment Variables**

Create/Update `.env` file:

```env
# Auth.js v5 Configuration
AUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking_onboarding

# Gemini API (Get from Google AI Studio)
GOOGLE_AI_API_KEY=your-gemini-api-key
```

**To generate AUTH_SECRET:**
```powershell
openssl rand -base64 32
```

3. **Run Development Server**
```powershell
npm run dev
```

Visit `http://localhost:3000`

4. **Build for Production**
```powershell
npm run build
npm start
```

## 🏗️ Project Structure

```
EY-Techathon6/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js   # NextAuth handler
│   │   ├── chat/
│   │   │   ├── send/route.js              # Main chat endpoint
│   │   │   └── history/route.js
│   │   ├── digilocker/
│   │   │   ├── verify-aadhaar/route.js    # Mock Aadhaar verification
│   │   │   └── verify-pan/route.js        # Mock PAN verification
│   │   ├── mcp/
│   │   │   └── create-account/route.js    # Mock account creation
│   │   ├── upload/
│   │   │   ├── aadhaar/route.js
│   │   │   └── pan/route.js
│   │   └── onboarding/
│   │       └── state/route.js
│   ├── login/page.jsx                      # Login page
│   ├── layout.jsx                          # Root layout
│   ├── page.jsx                            # Dashboard (home)
│   └── globals.css
├── components/
│   ├── Dashboard.jsx                       # Main dashboard UI
│   ├── ChatWindow.jsx                      # Chat message display
│   ├── MessageBubble.jsx                   # Individual messages
│   ├── InputField.jsx                      # Chat input
│   ├── MenuButtons.jsx                     # Menu options
│   ├── FileUploadModal.jsx                 # Document upload UI
│   ├── theme-provider.jsx
│   └── ui/                                 # 56 UI components (buttons, cards, etc)
├── agents/
│   ├── master-agent.js                     # Main orchestrator
│   ├── worker-kyc.js                       # KYC verification agent
│   └── worker-mcp.js                       # Account creation agent
├── lib/
│   ├── mongodb.js                          # MongoDB connection
│   ├── gemini-client.js                    # Gemini API wrapper
│   ├── validators.js                       # Input validation functions
│   └── utils.js                            # Utility functions
├── models/
│   ├── User.js                             # User schema
│   ├── Onboarding.js                       # Onboarding progress schema
│   └── Account.js                          # Bank account schema
├── auth.js                                 # NextAuth configuration
├── jsconfig.json                           # JavaScript config
└── package.json
```

## 🤖 Agent Architecture

### Master Agent
- **Role**: Orchestrates the entire onboarding flow
- **Responsibilities**:
  - Validates user inputs step-by-step
  - Maintains conversation context
  - Routes to appropriate worker agents
  - Manages onboarding state in MongoDB
- **Validation Rules**:
  - Name: Letters and spaces only, no numbers
  - DOB: YYYY-MM-DD format, must be 18+ years old
  - Phone: 10-digit Indian number (starts with 6-9)
  - Address: Minimum 10 characters

### Worker-KYC Agent
- **Role**: Document verification specialist
- **Responsibilities**:
  - Verifies Aadhaar documents
  - Verifies PAN documents
  - Extracts user data from documents
  - Cross-references with provided personal details

### Worker-MCP Agent
- **Role**: Core banking interface
- **Responsibilities**:
  - Creates bank accounts in mock core system
  - Generates 12-digit account numbers
  - Returns account creation confirmation

## 📊 MongoDB Collections

### users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  image: String,
  googleId: String,
  createdAt: Date
}
```

### onboarding
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  flow: String,              // "account_creation"
  status: String,            // INIT, PERSONAL_PENDING, KYC_PENDING, VERIFIED, COMPLETED
  step: String,              // name, dob, phone, address, aadhaar, pan, verification, final
  data: {
    fullName: String,
    dob: String,
    phone: String,
    address: String,
    aadhaarUrl: String,
    panUrl: String,
    aadhaarData: Object,
    panData: Object,
    accountNumber: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### accounts
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  accountNumber: String,
  kycVerified: Boolean,
  createdAt: Date
}
```

## 🔒 Validation System

All inputs are validated both on frontend and backend:

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| Name | `/^[a-zA-Z\s]+$/` | "Please enter a valid full name (letters only)" |
| DOB | YYYY-MM-DD, Age ≥ 18 | "Please enter valid DOB and be at least 18 years old" |
| Phone | `/^[6-9]\d{9}$/` | "Please enter a valid 10-digit Indian phone number" |
| Address | Length ≥ 10 chars | "Please enter a valid address (minimum 10 characters)" |
| Aadhaar | 12 digits or PDF/XML | "Please provide valid Aadhaar document" |
| PAN | `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` | "Please provide valid PAN document" |

## 🚦 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler
- `GET /api/auth/session` - Get current session
- `GET /api/auth/providers` - Get available providers

### Chat & Onboarding
- `POST /api/chat/send` - Main chat endpoint
- `GET /api/chat/history` - Get chat history
- `GET /api/onboarding/state` - Get onboarding state

### Document Upload
- `POST /api/upload/aadhaar` - Upload Aadhaar document
- `POST /api/upload/pan` - Upload PAN document

### Mock Services
- `POST /api/digilocker/verify-aadhaar` - Verify Aadhaar
- `POST /api/digilocker/verify-pan` - Verify PAN
- `POST /api/mcp/create-account` - Create bank account

## 🎨 UI Components

The project includes 56+ reusable UI components from shadcn/ui (converted to JavaScript):
- Forms: Input, Textarea, Select, Checkbox, Radio, Switch
- Feedback: Alert, Toast, Dialog, Sheet
- Navigation: Tabs, Accordion, Sidebar, Breadcrumb
- Data Display: Card, Table, Badge, Avatar
- And many more...

## 🔧 Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Google AI (Gemini) Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy to `.env` as `GOOGLE_AI_API_KEY`

### MongoDB Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Get connection string
5. Replace `<username>` and `<password>`
6. Add database name at the end: `/banking_onboarding`

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot destructure property 'GET' of handlers"**
- Ensure `.env` has `AUTH_URL` and `AUTH_SECRET` (not just `NEXTAUTH_*`)
- Clear `.next` folder: `Remove-Item -Recurse -Force .next`
- Restart dev server

**2. "Module not found: bcryptjs"**
- Run: `npm install bcryptjs`

**3. "Invalid Google Client ID"**
- Ensure `GOOGLE_CLIENT_ID` doesn't start with `http://`
- Should be format: `123456-abc.apps.googleusercontent.com`

**4. MongoDB connection errors**
- Verify connection string includes database name
- Check network access in MongoDB Atlas (allow your IP)
- Ensure database user has read/write permissions

**5. Gemini API errors**
- Verify API key is valid
- Check quota limits in Google AI Studio
- Ensure `GOOGLE_AI_API_KEY` is set in `.env`

## 📝 Development Notes

### TypeScript to JavaScript Migration
This project was fully converted from TypeScript to JavaScript:
- All `.tsx` → `.jsx`
- All `.ts` → `.js`
- Removed all type annotations
- Created `jsconfig.json` for IDE support
- Updated `components.json` to `tsx: false`

### NextAuth v5 Changes
- Uses `AUTH_URL` and `AUTH_SECRET` (new in v5)
- Export `{ GET, POST, auth, signIn, signOut }` from NextAuth()
- Import directly: `export { GET, POST } from "@/auth"`

## 🚀 Future Enhancements

- [ ] Add Loan application flow
- [ ] Add Credit Card application flow
- [ ] Real DigiLocker integration
- [ ] Real core banking API integration
- [ ] Document OCR for automatic data extraction
- [ ] Multi-language support
- [ ] SMS/Email notifications
- [ ] Account dashboard with transactions
- [ ] Admin panel for reviewing applications

## 📄 License

MIT

## 👥 Contributors

- Ritam Vaskar

## 🙏 Acknowledgments

- Built for EY Techathon 6
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Powered by [Next.js](https://nextjs.org)
- AI by [Google Gemini](https://deepmind.google/technologies/gemini)

---

**Note**: This is a prototype/MVP. For production use, implement proper security measures, real KYC verification, and connect to actual banking systems.
