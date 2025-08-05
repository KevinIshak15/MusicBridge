import React from 'react'
import { render, screen } from '@testing-library/react'

// Simple component for testing
const SimpleComponent = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div data-testid="simple-component">
      <h1>{title}</h1>
      <div>{children}</div>
    </div>
  )
}

describe('SimpleComponent', () => {
  it('renders with title and children', () => {
    render(
      <SimpleComponent title="Test Title">
        <p>Test content</p>
      </SimpleComponent>
    )
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders different titles', () => {
    render(
      <SimpleComponent title="Another Title">
        <span>Different content</span>
      </SimpleComponent>
    )
    
    expect(screen.getByText('Another Title')).toBeInTheDocument()
    expect(screen.getByText('Different content')).toBeInTheDocument()
  })
}) 