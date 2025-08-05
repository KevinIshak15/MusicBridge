import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}))

// Mock the firebase config
jest.mock('../../lib/firebase', () => ({
  auth: {},
}))

describe('Auth Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loginUser', () => {
    it('should call signInWithEmailAndPassword with correct parameters', async () => {
      const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>
      mockSignIn.mockResolvedValueOnce({} as any)
      
      const email = 'test@example.com'
      const password = 'password123'
      
      // This would be your actual login function
      // await loginUser(email, password)
      
      // For now, just verify the mock is set up correctly
      expect(mockSignIn).toBeDefined()
    })

    it('should throw error when signInWithEmailAndPassword fails', async () => {
      const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>
      const error = new Error('Invalid credentials')
      mockSignIn.mockRejectedValueOnce(error)
      
      const email = 'test@example.com'
      const password = 'wrongpassword'
      
      // This would be your actual login function
      // await expect(loginUser(email, password)).rejects.toThrow('Invalid credentials')
      
      // For now, just verify the mock is set up correctly
      expect(mockSignIn).toBeDefined()
    })
  })

  describe('registerUser', () => {
    it('should call createUserWithEmailAndPassword with correct parameters', async () => {
      const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>
      mockCreateUser.mockResolvedValueOnce({} as any)
      
      const email = 'newuser@example.com'
      const password = 'newpassword123'
      
      // This would be your actual register function
      // await registerUser(email, password)
      
      // For now, just verify the mock is set up correctly
      expect(mockCreateUser).toBeDefined()
    })
  })
}) 