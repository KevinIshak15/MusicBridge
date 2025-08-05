# Testing Guide for MusicBridge

This guide explains how to set up and run unit tests for the MusicBridge application.

## Setup

The project is configured with Jest and React Testing Library for unit testing. All necessary dependencies are already installed:

- `jest` - Testing framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `@testing-library/user-event` - User interaction testing
- `jest-environment-jsdom` - DOM environment for Jest

## Test Scripts

The following npm scripts are available for testing:

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

## Test Structure

Tests are organized in the `src/__tests__/` directory:

```
src/__tests__/
├── components/          # Component tests
├── lib/                # Utility function tests
├── context/            # Context tests
└── utils/              # Test utilities
```

## Writing Tests

### Component Tests

Example component test:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '../../components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Utility Function Tests

Example utility test:

```typescript
import { formatName } from '../../lib/utils'

describe('formatName', () => {
  it('formats name correctly', () => {
    expect(formatName('John', 'Doe')).toBe('John Doe')
  })
})
```

### Context Tests

Example context test:

```typescript
import { render, screen, act } from '@testing-library/react'
import { MyContextProvider, useMyContext } from '../../context/MyContext'

const TestComponent = () => {
  const { value, setValue } = useMyContext()
  return (
    <div>
      <span data-testid="value">{value}</span>
      <button onClick={() => setValue('new')}>Update</button>
    </div>
  )
}

describe('MyContext', () => {
  it('provides context values', () => {
    render(
      <MyContextProvider>
        <TestComponent />
      </MyContextProvider>
    )
    
    expect(screen.getByTestId('value')).toHaveTextContent('initial')
  })
})
```

## Testing Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` for setup and `afterEach` for cleanup

### 2. Component Testing
- Test user interactions, not implementation details
- Use `data-testid` attributes for elements that don't have semantic roles
- Test accessibility with `getByRole`, `getByLabelText`, etc.

### 3. Mocking
- Mock external dependencies (APIs, Firebase, etc.)
- Use Jest's `jest.mock()` for module mocking
- Mock browser APIs in `jest.setup.js`

### 4. Async Testing
- Use `waitFor` for async operations
- Use `userEvent.setup()` for user interactions
- Handle promises properly with `async/await`

## Mocking External Dependencies

### Firebase
```typescript
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}))
```

### Next.js Router
```typescript
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
}))
```

### API Calls
```typescript
global.fetch = jest.fn()
```

## Running Specific Tests

```bash
# Run tests matching a pattern
npx jest --testPathPatterns="auth"

# Run tests in a specific file
npx jest src/__tests__/components/AuthForm.test.tsx

# Run tests with verbose output
npx jest --verbose
```

## Coverage

The project is configured to collect coverage with a 70% threshold for:
- Branches
- Functions
- Lines
- Statements

To view coverage report:
```bash
npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Firebase/External API Errors**: Make sure to mock external dependencies
2. **Router Errors**: Mock Next.js router in tests
3. **DOM Errors**: Ensure `jsdom` environment is configured
4. **Async Errors**: Use `waitFor` for async operations

### Debugging Tests

```bash
# Run tests with debug output
npx jest --verbose --no-coverage

# Run a single test file
npx jest --testPathPatterns="MyComponent" --verbose
```

## Continuous Integration

For CI/CD, use the `test:ci` script:
```bash
npm run test:ci
```

This runs tests without watch mode and generates coverage reports suitable for CI environments. 