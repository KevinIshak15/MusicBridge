// Simple utility function for testing
export const add = (a: number, b: number): number => {
  return a + b
}

export const multiply = (a: number, b: number): number => {
  return a * b
}

export const formatName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`
}

describe('Utility Functions', () => {
  describe('add', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
      expect(add(-1, 1)).toBe(0)
      expect(add(0, 0)).toBe(0)
    })
  })

  describe('multiply', () => {
    it('should multiply two numbers correctly', () => {
      expect(multiply(2, 3)).toBe(6)
      expect(multiply(-2, 3)).toBe(-6)
      expect(multiply(0, 5)).toBe(0)
    })
  })

  describe('formatName', () => {
    it('should format name correctly', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe')
      expect(formatName('Jane', 'Smith')).toBe('Jane Smith')
    })
  })
}) 