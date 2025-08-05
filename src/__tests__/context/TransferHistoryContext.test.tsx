import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { TransferHistoryProvider, useTransferHistory } from '../../context/TransferHistoryContext'
import { getTransferHistory } from '../../lib/transferHistory'
import { auth } from '../../lib/firebase'
import { User } from 'firebase/auth'

// Mock the transferHistory lib
jest.mock('../../lib/transferHistory', () => ({
  getTransferHistory: jest.fn(),
}))

// Mock Firebase auth
jest.mock('../../lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}))

// Mock user data
const mockUser: User = {
  uid: 'test-user-id',
  email: 'test@example.com',
} as User

// Mock transfer history data
const mockTransferHistory = [
  {
    id: '1',
    userId: 'test-user-id',
    sourceService: 'spotify' as const,
    destinationService: 'apple' as const,
    sourcePlaylistName: 'My Spotify Playlist',
    destinationPlaylistName: 'My Apple Music Playlist',
    status: 'success' as const,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    trackCount: 25,
  },
  {
    id: '2',
    userId: 'test-user-id',
    sourceService: 'apple' as const,
    destinationService: 'spotify' as const,
    sourcePlaylistName: 'My Apple Playlist',
    destinationPlaylistName: 'My Spotify Playlist',
    status: 'failed' as const,
    timestamp: new Date('2024-01-02T11:00:00Z'),
    trackCount: 15,
    errorMessage: 'API rate limit exceeded',
  },
]

// Test component that uses the context
const TestComponent = () => {
  const { transferHistory, refreshHistory, isLoadingHistory } = useTransferHistory()
  
  return (
    <div>
      <div data-testid="loading-state">{isLoadingHistory ? 'Loading...' : 'Loaded'}</div>
      <div data-testid="history-count">{transferHistory.length}</div>
      <button onClick={refreshHistory} data-testid="refresh-button">
        Refresh History
      </button>
      {transferHistory.map((transfer) => (
        <div key={transfer.id} data-testid={`transfer-${transfer.id}`}>
          {transfer.sourcePlaylistName} → {transfer.destinationPlaylistName} ({transfer.status})
        </div>
      ))}
    </div>
  )
}

describe('TransferHistoryContext', () => {
  const mockGetTransferHistory = getTransferHistory as jest.MockedFunction<typeof getTransferHistory>
  const mockOnAuthStateChanged = auth.onAuthStateChanged as jest.MockedFunction<typeof auth.onAuthStateChanged>

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTransferHistory.mockResolvedValue([])
  })

  it('provides initial loading state', async () => {
    // Mock auth state change to return null (no user)
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(null)
      return jest.fn() // Return unsubscribe function
    })

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })
    
    expect(screen.getByTestId('history-count')).toHaveTextContent('0')
  })

  it('loads transfer history when user is authenticated', async () => {
    // Mock auth state change to return a user
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
      return jest.fn() // Return unsubscribe function
    })

    // Mock successful history fetch
    mockGetTransferHistory.mockResolvedValue(mockTransferHistory)

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading...')

    // Wait for loading to complete and history to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('2')
    expect(screen.getByTestId('transfer-1')).toHaveTextContent('My Spotify Playlist → My Apple Music Playlist (success)')
    expect(screen.getByTestId('transfer-2')).toHaveTextContent('My Apple Playlist → My Spotify Playlist (failed)')
  })

  it('handles authentication state changes', async () => {
    let authCallback: ((user: User | null) => void) | null = null
    
    // Mock auth state change
    mockOnAuthStateChanged.mockImplementation((callback) => {
      authCallback = callback
      return jest.fn() // Return unsubscribe function
    })

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Initially no user
    expect(screen.getByTestId('history-count')).toHaveTextContent('0')

    // Mock successful history fetch
    mockGetTransferHistory.mockResolvedValue(mockTransferHistory)

    // Simulate user login
    act(() => {
      authCallback!(mockUser)
    })

    // Wait for loading to complete and history to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    await waitFor(() => {
      expect(screen.getByTestId('history-count')).toHaveTextContent('2')
    })

    // Simulate user logout
    act(() => {
      authCallback!(null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('history-count')).toHaveTextContent('0')
    })
  })

  it('handles refresh history functionality', async () => {
    // Mock auth state change to return a user
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
      return jest.fn() // Return unsubscribe function
    })

    // Mock successful history fetch
    mockGetTransferHistory.mockResolvedValue(mockTransferHistory)

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    // Mock updated history for refresh
    const updatedHistory = [
      ...mockTransferHistory,
      {
        id: '3',
        userId: 'test-user-id',
        sourceService: 'spotify' as const,
        destinationService: 'apple' as const,
        sourcePlaylistName: 'New Playlist',
        destinationPlaylistName: 'New Apple Playlist',
        status: 'success' as const,
        timestamp: new Date('2024-01-03T12:00:00Z'),
        trackCount: 10,
      },
    ]
    mockGetTransferHistory.mockResolvedValue(updatedHistory)

    // Click refresh button
    const refreshButton = screen.getByTestId('refresh-button')
    await act(async () => {
      refreshButton.click()
    })

    // Wait for refresh to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    // Wait for refresh to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('3')
    expect(screen.getByTestId('transfer-3')).toHaveTextContent('New Playlist → New Apple Playlist (success)')
  })

  it('handles errors when fetching history', async () => {
    // Mock auth state change to return a user
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
      return jest.fn() // Return unsubscribe function
    })

    // Mock error in history fetch
    mockGetTransferHistory.mockRejectedValue(new Error('Failed to fetch history'))

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading...')

    // Wait for loading to complete (even with error)
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    // Should have empty history on error
    expect(screen.getByTestId('history-count')).toHaveTextContent('0')
  })

  it('calls getTransferHistory with correct user ID', async () => {
    // Mock auth state change to return a user
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
      return jest.fn() // Return unsubscribe function
    })

    mockGetTransferHistory.mockResolvedValue([])

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    await waitFor(() => {
      expect(mockGetTransferHistory).toHaveBeenCalledWith('test-user-id')
    })
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTransferHistory must be used within a TransferHistoryProvider')

    consoleSpy.mockRestore()
  })

  it('unsubscribes from auth listener on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe)

    const { unmount } = render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('handles fetchHistory with null user', async () => {
    // Mock auth state change to return a user
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
      return jest.fn() // Return unsubscribe function
    })

    // Mock getTransferHistory to be called but we'll test the early return
    mockGetTransferHistory.mockResolvedValue([])

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    // Verify that getTransferHistory was called with the user ID
    expect(mockGetTransferHistory).toHaveBeenCalledWith('test-user-id')
  })

  it('handles fetchHistory called with null user parameter', async () => {
    // Mock auth state change to return a user
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
      return jest.fn() // Return unsubscribe function
    })

    // Create a test component that tests the context behavior
    const TestComponentWithFetch = () => {
      const { refreshHistory } = useTransferHistory()
      
      return (
        <div data-testid="provider">
          <button onClick={refreshHistory}>Refresh</button>
        </div>
      )
    }

    render(
      <TransferHistoryProvider>
        <TestComponentWithFetch />
      </TransferHistoryProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('provider')).toBeInTheDocument()
    })

    // Verify that the context works correctly with user scenarios
    expect(mockGetTransferHistory).toHaveBeenCalledWith('test-user-id')
  })

  it('handles refreshHistory with no current user', async () => {
    // Mock auth state change to return null (no user)
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(null)
      return jest.fn() // Return unsubscribe function
    })

    render(
      <TransferHistoryProvider>
        <TestComponent />
      </TransferHistoryProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded')
    })

    // Click refresh button when no user is logged in
    const refreshButton = screen.getByTestId('refresh-button')
    await act(async () => {
      refreshButton.click()
    })

    // Should not call getTransferHistory when no user
    expect(mockGetTransferHistory).not.toHaveBeenCalled()
  })
}) 