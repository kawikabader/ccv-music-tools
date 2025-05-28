import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Team Roster')).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    render(<App />)
    expect(screen.getByText('Welcome to the Team Roster application.')).toBeInTheDocument()
  })
}) 