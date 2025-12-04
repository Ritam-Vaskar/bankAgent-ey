import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import connectDB from "./lib/mongodb"
import User from "./models/User"

export const { GET, POST, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB()

        let dbUser = await User.findOne({ email: user.email })
        if (!dbUser) {
          dbUser = new User({
            name: user.name,
            email: user.email,
            image: user.image,
            googleId: profile.sub,
          })
          await dbUser.save()
          console.log("[v0] New user created:", dbUser.email)
        }

        user.id = dbUser._id.toString()
        return true
      } catch (error) {
        console.error("[v0] Sign in error:", error)
        return false
      }
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
})
