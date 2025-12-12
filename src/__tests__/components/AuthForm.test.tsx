import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthForm from '../../components/AuthForm'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(() => ({})),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Firebase lib
jest.mock('../../lib/firebase', () => ({
  auth: {},
  db: {},
}))

describe('AuthForm', () => {
  const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>
  const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>
  
  // Get mocked toast functions
  const mockToast = jest.requireMock('react-hot-toast') as {
    success: jest.MockedFunction<(message: string) => void>
    error: jest.MockedFunction<(message: string) => void>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('renders login form by default', () => {
      render(<AuthForm />)
      
      expect(screen.getByText('Login to MusicBridge')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    })

    it('has correct form structure', () => {
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })
  })

  describe('Form Interactions', () => {
    it('updates email and password fields', async () => {
      const user = userEvent.setup()
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('switches between login and signup modes', async () => {
      const user = userEvent.setup()
      render(<AuthForm />)
      
      // Initially in login mode
      expect(screen.getByText('Login to MusicBridge')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
      
      // Switch to signup mode
      const switchButton = screen.getByText('Sign Up')
      await user.click(switchButton)
      
      expect(screen.getByText('Sign Up for MusicBridge')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
      
      // Switch back to login mode
      const switchBackButton = screen.getByText('Log In')
      await user.click(switchBackButton)
      
      expect(screen.getByText('Login to MusicBridge')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })
  })

  describe('Login Functionality', () => {
    it('handles successful login', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({} as { user: { uid: string; email: string | null } })
      
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(auth, 'test@example.com', 'password123')
      })
      
      expect(mockToast.success).toHaveBeenCalledWith('Logged in!')
    })

    it('handles login error', async () => {
      const user = userEvent.setup()
      const error = new Error('Invalid email or password')
      mockSignIn.mockRejectedValueOnce(error)
      
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await user.type(emailInput, 'invalid@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(auth, 'invalid@example.com', 'wrongpassword')
      })
      
      expect(mockToast.error).toHaveBeenCalledWith('Invalid email or password')
    })
  })

  describe('Signup Functionality', () => {
    it('handles successful signup', async () => {
      const user = userEvent.setup()
      mockCreateUser.mockResolvedValueOnce({} as { user: { uid: string; email: string | null } })
      
      render(<AuthForm />)
      
      // Switch to signup mode
      const switchButton = screen.getByText('Sign Up')
      await user.click(switchButton)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      
      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(auth, 'newuser@example.com', 'newpassword123')
      })
      
      expect(mockToast.success).toHaveBeenCalledWith('Account created!')
    })

    it('handles signup error', async () => {
      const user = userEvent.setup()
      const error = new Error('Email already in use')
      mockCreateUser.mockRejectedValueOnce(error)
      
      render(<AuthForm />)
      
      // Switch to signup mode
      const switchButton = screen.getByText('Sign Up')
      await user.click(switchButton)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      
      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(auth, 'existing@example.com', 'password123')
      })
      
      expect(mockToast.error).toHaveBeenCalledWith('Email already in use')
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with empty fields', async () => {
      const user = userEvent.setup()
      render(<AuthForm />)
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      // Try to submit without filling fields
      await user.click(submitButton)
      
      // Form should not submit due to HTML5 validation
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('prevents submission with invalid email format', async () => {
      const user = userEvent.setup()
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      // Form should not submit due to HTML5 email validation
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })

  describe('User Experience', () => {
    it('maintains form state when switching modes', async () => {
      const user = userEvent.setup()
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      
      // Fill form in login mode
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // Switch to signup mode
      const switchButton = screen.getByText('Sign Up')
      await user.click(switchButton)
      
      // Form values should be preserved
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
      
      // Switch back to login mode
      const switchBackButton = screen.getByText('Log In')
      await user.click(switchBackButton)
      
      // Form values should still be preserved
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('handles unknown error types gracefully', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValueOnce('Unknown error')
      
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })
      
      expect(mockToast.error).toHaveBeenCalledWith('Authentication failed')
    })
  })

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<AuthForm />)
      
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
      expect(submitButton).toBeInTheDocument()
    })

    it('has proper form submission', () => {
      render(<AuthForm />)
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
}) 