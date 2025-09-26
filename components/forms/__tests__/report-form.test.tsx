/**
 * Tests for ReportForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ReportForm } from '../report-form';
import * as incidentApi from '@/lib/api/incidents';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the incident API
jest.mock('@/lib/api/incidents', () => ({
  submitIncidentReport: jest.fn(),
  formDataToApiRequest: jest.fn(),
  saveDraftToStorage: jest.fn(),
  loadDraftFromStorage: jest.fn(),
  clearDraftFromStorage: jest.fn(),
  hasDraftInStorage: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

describe('ReportForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (incidentApi.hasDraftInStorage as jest.Mock).mockReturnValue(false);
    (incidentApi.loadDraftFromStorage as jest.Mock).mockReturnValue(null);
  });

  it('should render all form fields', () => {
    render(<ReportForm />);

    // Check for main sections
    expect(screen.getByText('Incident Type *')).toBeInTheDocument();
    expect(screen.getByText('Severity Level *')).toBeInTheDocument();
    expect(screen.getByText('Location *')).toBeInTheDocument();
    expect(screen.getByText('Description *')).toBeInTheDocument();
    
    // Check for incident type options
    expect(screen.getByText('Flooding')).toBeInTheDocument();
    expect(screen.getByText('Traffic Accident')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    
    // Check for severity levels
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<ReportForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please select an incident type/i)).toBeInTheDocument();
    });
  });

  it('should handle incident type selection', async () => {
    render(<ReportForm />);

    const floodOption = screen.getByText('Flooding').closest('.cursor-pointer');
    
    if (floodOption) {
      fireEvent.click(floodOption);
    }

    // The card should have the selected styling
    expect(floodOption).toHaveClass('border-primary');
  });

  it('should handle severity level selection', async () => {
    render(<ReportForm />);

    const highSeverity = screen.getByText('High Priority').closest('.cursor-pointer');
    
    if (highSeverity) {
      fireEvent.click(highSeverity);
    }

    expect(highSeverity).toHaveClass('border-primary');
  });

  it('should handle parish selection', async () => {
    render(<ReportForm />);

    // For now, just check that the parish select is rendered
    const parishSelect = screen.getByRole('combobox');
    expect(parishSelect).toBeInTheDocument();
  });

  it('should handle text input changes', async () => {
    render(<ReportForm />);

    const descriptionField = screen.getByPlaceholderText(/describe what happened/i);
    fireEvent.change(descriptionField, { target: { value: 'Test incident description' } });

    expect(descriptionField).toHaveValue('Test incident description');
  });

  it('should handle anonymous reporting toggle', async () => {
    render(<ReportForm />);

    const anonymousCheckbox = screen.getByLabelText(/submit anonymously/i);
    fireEvent.click(anonymousCheckbox);

    expect(anonymousCheckbox).toBeChecked();

    // Name and phone fields should be disabled
    const nameField = screen.getByLabelText(/your name/i);
    const phoneField = screen.getByLabelText(/phone number/i);
    
    expect(nameField).toBeDisabled();
    expect(phoneField).toBeDisabled();
  });

  it('should submit form with valid data', async () => {
    const mockResponse = {
      id: 'test-report-id',
      status: 'pending' as const,
      parish: 'kingston' as const,
      incidentType: 'flood' as const,
      severity: 'high' as const,
      createdAt: new Date(),
    };

    (incidentApi.formDataToApiRequest as jest.Mock).mockReturnValue({
      incidentType: 'flood',
      severity: 'high',
      parish: 'kingston',
      description: 'Test description',
      incidentDate: new Date(),
      isAnonymous: false,
      receiveUpdates: true,
    });

    (incidentApi.submitIncidentReport as jest.Mock).mockResolvedValue(mockResponse);

    render(<ReportForm />);

    // Fill required fields
    const floodOption = screen.getByText('Flooding').closest('.cursor-pointer');
    if (floodOption) fireEvent.click(floodOption);

    const highSeverity = screen.getByText('High Priority').closest('.cursor-pointer');
    if (highSeverity) fireEvent.click(highSeverity);

    const descriptionField = screen.getByPlaceholderText(/describe what happened/i);
    fireEvent.change(descriptionField, { target: { value: 'Test incident description' } });

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(incidentApi.submitIncidentReport).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/report submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('should save draft when save as draft is clicked', async () => {
    render(<ReportForm />);

    const descriptionField = screen.getByPlaceholderText(/describe what happened/i);
    fireEvent.change(descriptionField, { target: { value: 'Draft description' } });

    const saveDraftButton = screen.getByRole('button', { name: /save as draft/i });
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(incidentApi.saveDraftToStorage).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/report saved as draft successfully/i)).toBeInTheDocument();
    });
  });

  it('should show draft loading option when draft exists', () => {
    (incidentApi.hasDraftInStorage as jest.Mock).mockReturnValue(true);

    render(<ReportForm />);

    expect(screen.getByText(/you have a saved draft/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('should load draft when load draft button is clicked', async () => {
    const mockDraft = {
      incidentType: 'flood',
      severity: 'medium',
      parish: 'kingston',
      community: 'New Kingston',
      address: '123 Test St',
      description: 'Draft description',
      date: '2024-01-15',
      time: '10:00',
      reporterName: 'Test User',
      reporterPhone: '+1-876-123-4567',
      anonymous: false,
      receiveUpdates: true,
      savedAt: new Date().toISOString(),
    };

    (incidentApi.hasDraftInStorage as jest.Mock).mockReturnValue(true);
    (incidentApi.loadDraftFromStorage as jest.Mock).mockReturnValue(mockDraft);

    render(<ReportForm />);

    const loadDraftButton = screen.getByRole('button', { name: /load draft/i });
    fireEvent.click(loadDraftButton);

    expect(incidentApi.loadDraftFromStorage).toHaveBeenCalled();

    // Check that form fields are populated
    await waitFor(() => {
      const descriptionField = screen.getByDisplayValue('Draft description');
      expect(descriptionField).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('Network error');

    (incidentApi.formDataToApiRequest as jest.Mock).mockReturnValue({
      incidentType: 'flood',
      severity: 'high',
      parish: 'kingston',
      description: 'Test description',
      incidentDate: new Date(),
      isAnonymous: false,
      receiveUpdates: true,
    });

    (incidentApi.submitIncidentReport as jest.Mock).mockRejectedValue(mockError);

    render(<ReportForm />);

    // Fill required fields
    const floodOption = screen.getByText('Flooding').closest('.cursor-pointer');
    if (floodOption) fireEvent.click(floodOption);

    const highSeverity = screen.getByText('High Priority').closest('.cursor-pointer');
    if (highSeverity) fireEvent.click(highSeverity);

    const descriptionField = screen.getByPlaceholderText(/describe what happened/i);
    fireEvent.change(descriptionField, { target: { value: 'Test incident description' } });

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should disable updates checkbox when anonymous is selected', async () => {
    render(<ReportForm />);

    const anonymousCheckbox = screen.getByLabelText(/submit anonymously/i);
    const updatesCheckbox = screen.getByLabelText(/receive updates/i);

    fireEvent.click(anonymousCheckbox);

    expect(updatesCheckbox).toBeDisabled();
  });
});