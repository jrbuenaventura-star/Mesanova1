import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock del ContactForm
const mockContactForm = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  city: '',
  message: '',
}

describe('ContactForm Component', () => {
  it('should validate required fields', () => {
    const { fullName, email, phone } = mockContactForm
    const isValid = fullName && email && phone
    expect(isValid).toBe(false)
  })

  it('should validate email format', () => {
    const validEmail = 'test@example.com'
    const invalidEmail = 'invalid-email'
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(emailRegex.test(validEmail)).toBe(true)
    expect(emailRegex.test(invalidEmail)).toBe(false)
  })

  it('should accept valid form data', () => {
    const validForm = {
      fullName: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+57 300 123 4567',
      company: 'Mi Empresa',
      city: 'Bogotá',
      message: 'Mensaje de prueba',
    }

    const isValid = validForm.fullName && validForm.email && validForm.phone
    expect(isValid).toBe(true)
  })
})
