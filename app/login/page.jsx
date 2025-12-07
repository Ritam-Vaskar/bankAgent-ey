"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Lock, Mail, Building2, Shield, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    if (session?.user?.name) {
      router.push("/")
    }
  }, [session, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      setError('Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signIn("github", { callbackUrl: "/" })
    } catch (error) {
      setError('Failed to sign in with GitHub')
    } finally {
      setLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Invalid email or password. Please check your credentials and try again.')
            break
          case 'Configuration':
            setError('Authentication service is not configured properly.')
            break
          default:
            setError('Authentication failed. Please try again.')
        }
      } else if (result?.ok) {
        router.push('/')
      } else {
        setError('Authentication failed. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          router.push('/')
        } else {
          setError('Account created but failed to sign in. Please try signing in manually.')
        }
      } else {
        setError(data.error || 'Failed to create account')
      }
    } catch (error) {
      setError('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">SecureBank</h2>
                <p className="text-blue-200 text-sm">Enterprise Banking Solutions</p>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Secure Access to Your Financial Future
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Experience enterprise-grade security with seamless account management. 
              Your trusted partner in digital banking excellence.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold">Bank-Level Security</p>
                <p className="text-sm text-slate-400">256-bit encryption & multi-factor authentication</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold">FDIC Insured</p>
                <p className="text-sm text-slate-400">Your deposits are protected up to $250,000</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold">Privacy First</p>
                <p className="text-sm text-slate-400">We never share your personal information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">SecureBank</h2>
                <p className="text-slate-600 text-xs">Enterprise Banking</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-600">
                {isSignUp 
                  ? 'Begin your secure banking experience' 
                  : 'Please sign in to access your account'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 px-4 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleGitHubSignIn}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"/>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleCredentialsSignIn} className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700 min-w-[100px]">
                    Email Address
                  </label>
                  <Mail className="w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700 min-w-[100px]">
                    Password
                  </label>
                  <Lock className="w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900"
                  />
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"/>
                    <span className="text-slate-600">Remember me</span>
                  </label>
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In to Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-600 hover:text-blue-600 text-sm font-medium"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="text-blue-600">Sign in</span></>
                ) : (
                  <>Don't have an account? <span className="text-blue-600">Create one</span></>
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-xs text-slate-500 leading-relaxed">
                By continuing, you agree to our{' '}
                <button className="text-blue-600 hover:underline">Terms of Service</button>
                {' '}and{' '}
                <button className="text-blue-600 hover:underline">Privacy Policy</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}