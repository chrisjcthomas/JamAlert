/**
 * Tests for RegisterForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '../register-form';
import { authService } from '../../../lib/api/auth';
import { Parish } from '../../../lib/types';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('../../../lib/api/auth');

const mockPush = jest.fn();
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render all form fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parish/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sms alerts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email alerts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/emergency alerts only/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register for alerts/i })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /register for alerts/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockResponse = {
      userId: '123',
      email: 'test@example.com',
      parish: Parish.KINGSTON,
    };

    mockAuthService.register.mockResolvedValueOnce(mockResponse);

    render(<RegisterForm />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '876-123-4567' },
    });

    // Select parish
    const parishSelect = screen.getByRole('combobox');
    fireEvent.click(parishSelect);
    await waitFor(() => {
      const kingstonOption = screen.getByText('Kingston');
      fireEvent.click(kingstonOption);
    });

    // Check alert preferences
    fireEvent.click(screen.getByLabelText(/email alerts/i));
    
    // Accept terms
    fireEvent.click(screen.getByLabelText(/i agree to receive safety alerts/i));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /register for alerts/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '876-123-4567',
        parish: Parish.KINGSTON,
        address: undefined,
        smsAlerts: false,
        emailAlerts: true,
        emergencyOnly: false,
      });
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });

    // Should redirect after delay
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/my-alerts');
    }, { timeout: 4000 });
  });

  it('should handle API errors', async () => {
    const error = new Error('Registration failed');
    mockAuthService.register.mockRejectedValueOnce(error);

    render(<RegisterForm />);

    // Fill out minimal valid form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });

    // Select parish
    const parishSelect = screen.getByRole('combobox');
    fireEvent.click(parishSelect);
    await waitFor(() => {
      const kingstonOption = screen.getByText('Kingston');
      fireEvent.click(kingstonOption);
    });

    // Check alert preferences and terms
    fireEvent.click(screen.getByLabelText(/email alerts/i));
    fireEvent.click(screen.getByLabelText(/i agree to receive safety alerts/i));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /register for alerts/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('should clear field errors when user starts typing', async () => {
    render(<RegisterForm />);

    // Submit empty form to trigger validation
    const submitButton = screen.getByRole('button', { name: /register for alerts/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });

    // Start typing in first name field
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'J' },
    });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
    });
  });
});