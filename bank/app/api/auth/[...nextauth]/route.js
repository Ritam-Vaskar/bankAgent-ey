import NextAuth from 'next-auth'
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

const authOptions = {
  providers: [
    // Add these when you set up OAuth credentials
    ...(process.env.GITHUB_ID ? [GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })] : []),
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing email or password');
            return null;
          }

          await connectDB();
          
          // Find user by email
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            console.log('No user found with this email:', credentials.email);
            return null;
          }
          
          // Check if user has a password (for credentials login)
          if (!user.password) {
            console.log('User has no password set - social login account');
            return null;
          }
          
          // Check if password is set
          if (!user.isSetPassword) {
            console.log('User needs to set a password');
            return null;
          }

          // Compare password with bcrypt
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }
          
          // Return user object for successful authentication
          console.log('Authentication successful for:', credentials.email);
          return { 
            id: user._id.toString(), 
            name: user.name, 
            email: user.email 
          };
        } catch (error) {
          console.error('Authentication error:', error.message);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB();
        
        // For credentials provider, we already check in authorize function
        if (account.provider === 'credentials') {
          return true;
        }
        
        // Handle social login (Google/GitHub)
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user with profile picture from social provider
          await User.create({ 
            email: user.email, 
            name: user.name, 
            profilePicture: user.image || '' 
          });
          console.log('New user created with social login');
        } else {
          // Update existing user's profile picture if not set or empty
          if (!existingUser.profilePicture || existingUser.profilePicture === '') {
            existingUser.profilePicture = user.image || '';
            await existingUser.save();
            console.log('Updated user profile picture from social login');
          }
        }
        
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      // Add database ID to JWT token
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.profilePicture = dbUser.profilePicture;
          token.name = dbUser.name;
          token.bio = dbUser.bio;
          token.location = dbUser.location;
          token.website = dbUser.website;
        }
      }
      
      // Handle session update trigger (when profile is updated)
      if (trigger === 'update' && session) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.profilePicture = dbUser.profilePicture;
          token.name = dbUser.name;
          token.bio = dbUser.bio;
          token.location = dbUser.location;
          token.website = dbUser.website;
        }
      }
      
      return token;
    },
    async session({ session, token, trigger }) {
      // Always fetch fresh data from database for consistent updates
      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            session.user.id = token.id;
            session.user.profilePicture = dbUser.profilePicture;
            session.user.name = dbUser.name;
            session.user.bio = dbUser.bio;
            session.user.location = dbUser.location;
            session.user.website = dbUser.website;
            session.user.email = dbUser.email;
          }
        } catch (error) {
          console.error('Error fetching fresh user data in session:', error);
          // Fallback to token data if database fetch fails
          session.user.id = token.id;
          session.user.profilePicture = token.profilePicture;
          session.user.name = token.name;
          session.user.bio = token.bio;
          session.user.location = token.location;
          session.user.website = token.website;
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors back to login page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, 
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, 
    updateAge: 0, // Always update session on every request
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, 
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' 
      }
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }