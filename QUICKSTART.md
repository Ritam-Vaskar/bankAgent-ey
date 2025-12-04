# Quick Start Guide

## ✅ System Status Check

Your banking onboarding system is now fully configured and ready to use!

## 🎯 Testing the Complete Flow

### 1. Start the Application

```powershell
npm run dev
```

Server should start at: `http://localhost:3000`

### 2. Login Flow

1. Open browser and go to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Click **"Sign in with Google"**
4. Complete Google OAuth login
5. After successful login, you'll be redirected to `/` (Dashboard)

### 3. Account Creation Flow

**Step 1: Start Account Creation**
- On Dashboard, you'll see 3 menu buttons:
  - ✅ Create Account (functional)
  - 🚧 Loan (placeholder)
  - 🚧 Credit Card (placeholder)
- Click **"Create Account"**

**Step 2: Enter Full Name**
- Agent asks: "Please enter your full name."
- Type: `John Doe` (letters only)
- ❌ Invalid: `John123` (contains numbers)
- Agent validates and asks for DOB

**Step 3: Enter Date of Birth**
- Agent asks: "Please provide your date of birth (YYYY-MM-DD format):"
- Type: `2000-01-15` (must be 18+)
- ❌ Invalid: `2010-01-15` (under 18)
- ❌ Invalid: `15-01-2000` (wrong format)
- Agent validates and asks for phone

**Step 4: Enter Phone Number**
- Agent asks: "Please provide your 10-digit phone number:"
- Type: `9876543210` (10 digits, starts with 6-9)
- ❌ Invalid: `12345678` (too short)
- ❌ Invalid: `5876543210` (must start with 6-9)
- Agent validates and asks for address

**Step 5: Enter Address**
- Agent asks: "Please provide your address (minimum 10 characters):"
- Type: `123 Main Street, Mumbai, Maharashtra, India`
- ❌ Invalid: `123 Main` (too short)
- Agent validates and requests Aadhaar upload

**Step 6: Upload Aadhaar**
- File upload modal opens
- Upload Aadhaar document (PDF or XML)
- Agent confirms receipt and asks for PAN

**Step 7: Upload PAN**
- File upload modal opens again
- Upload PAN document (PDF)
- Agent processes documents

**Step 8: Verification & Account Creation**
- System automatically:
  - Verifies Aadhaar via mock DigiLocker
  - Verifies PAN via mock DigiLocker
  - Creates account via mock MCP
- You receive confirmation:
  ```
  🎉 Account created successfully!
  Your Account Number: XXXXXXXXXXXX
  ```

## 🧪 Test Data

### Valid Test Inputs

**Personal Details:**
- Name: `Rahul Kumar`
- DOB: `1995-06-15`
- Phone: `9876543210`
- Address: `Flat 301, Sunshine Apartments, MG Road, Bangalore, Karnataka 560001`

**Documents:**
- Aadhaar: Upload any PDF (mock service accepts all)
- PAN: Upload any PDF (mock service accepts all)

### Invalid Test Inputs (to test validation)

**Name:**
- `John123` → ❌ "contains numbers"
- `J` → ❌ "too short"

**DOB:**
- `15-06-1995` → ❌ "wrong format"
- `2010-01-15` → ❌ "under 18"
- `1990-13-45` → ❌ "invalid date"

**Phone:**
- `12345` → ❌ "too short"
- `5876543210` → ❌ "must start with 6-9"
- `98765432101` → ❌ "too long"

**Address:**
- `123 Main` → ❌ "too short"

## 🔍 Monitoring & Debugging

### Check Terminal Logs

The terminal shows detailed logs:
```
[v0] Current step: name
[v0] User message: John Doe
[v0] Gemini response: ...
[v0] KYC verified, creating account...
[v0] Chat response: { message: '...', action: 'continue' }
```

### Check MongoDB

You can verify data is being saved by:
1. Going to MongoDB Atlas dashboard
2. Browse Collections
3. Check `users`, `onboarding`, and `accounts` collections

### Check Session

Visit `http://localhost:3000/api/auth/session` to see:
```json
{
  "user": {
    "name": "Your Name",
    "email": "your@email.com",
    "image": "...",
    "id": "..."
  },
  "expires": "..."
}
```

## 🐛 Common Issues & Solutions

### Issue: Stuck on login page after Google OAuth
**Solution:** 
- Check that `GOOGLE_CLIENT_ID` is correct (no `http://` prefix)
- Ensure redirect URI in Google Console is: `http://localhost:3000/api/auth/callback/google`

### Issue: Agent not responding
**Solution:**
- Check `GOOGLE_AI_API_KEY` is set in `.env`
- Check terminal for Gemini API errors
- Verify API quota in Google AI Studio

### Issue: "Unauthorized" error
**Solution:**
- Sign out and sign in again
- Clear browser cookies for `localhost`
- Check MongoDB connection

### Issue: Documents not uploading
**Solution:**
- Check file size (should be < 10MB)
- Check file format (Aadhaar: PDF/XML, PAN: PDF)
- Check terminal for upload errors

## 📊 Expected Database State

After completing one account creation:

**users collection:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "googleId": "...",
  "createdAt": "2025-12-04T..."
}
```

**onboarding collection:**
```json
{
  "_id": "...",
  "userId": "...",
  "flow": "account_creation",
  "status": "COMPLETED",
  "step": "final",
  "data": {
    "fullName": "John Doe",
    "dob": "1995-06-15",
    "phone": "9876543210",
    "address": "123 Main Street...",
    "aadhaarUrl": "File uploaded: ...",
    "panUrl": "File uploaded: ...",
    "accountNumber": "123456789012"
  },
  "createdAt": "2025-12-04T...",
  "updatedAt": "2025-12-04T..."
}
```

**accounts collection:**
```json
{
  "_id": "...",
  "userId": "...",
  "accountNumber": "123456789012",
  "kycVerified": true,
  "createdAt": "2025-12-04T..."
}
```

## 🎉 Success Indicators

You've successfully completed the flow when you see:

1. ✅ Google OAuth login works
2. ✅ Dashboard shows menu buttons
3. ✅ Chat interface responds to messages
4. ✅ Validation errors show for invalid inputs
5. ✅ Valid inputs progress to next step
6. ✅ File upload modal opens for documents
7. ✅ Final confirmation message with account number
8. ✅ Data saved in MongoDB collections

## 🔄 Reset Testing

To test the flow again:

**Option 1: New User**
- Sign out
- Sign in with different Google account

**Option 2: Same User (Clear Progress)**
```javascript
// In MongoDB Atlas or Compass, delete the onboarding record
db.onboarding.deleteMany({ userId: "your-user-id" })
```

**Option 3: Complete Reset**
```javascript
// Delete all test data
db.users.deleteMany({})
db.onboarding.deleteMany({})
db.accounts.deleteMany({})
```

## 📱 Mobile Testing

The UI is responsive. Test on mobile by:
1. Get your network IP: Run `ipconfig` in terminal
2. Look for "IPv4 Address" (e.g., `192.168.1.100`)
3. On mobile browser, visit: `http://192.168.1.100:3000`
4. Update Google OAuth redirect URI to include mobile IP

## 🚀 Production Deployment

When ready to deploy:

1. **Build for production:**
```powershell
npm run build
```

2. **Test production build locally:**
```powershell
npm start
```

3. **Deploy to Vercel (recommended):**
```powershell
npm install -g vercel
vercel
```

4. **Update environment variables** in deployment platform:
- Set production URLs for `AUTH_URL`
- Update Google OAuth redirect URIs
- Verify MongoDB connection string
- Set all other env vars

## 📞 Support

If you encounter issues:
1. Check terminal logs for detailed error messages
2. Review the main README.md for troubleshooting
3. Check MongoDB connection and data
4. Verify all `.env` variables are set correctly
5. Clear `.next` folder and restart: `Remove-Item -Recurse -Force .next; npm run dev`

---

**Happy Testing! 🎉**
