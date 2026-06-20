import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPatient } from '../RegisterPatient';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterPatient Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call API or navigate if required fields are missing', async () => {
    render(
      <BrowserRouter>
        <RegisterPatient />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/Save Patient/i));

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
  });

  it('calls API and navigates on successful registration', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'P123' } });

    render(
      <BrowserRouter>
        <RegisterPatient />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John', name: 'firstName' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe', name: 'lastName' } });
    fireEvent.change(screen.getByLabelText(/Birthdate/i), { target: { value: '1990-01-01', name: 'dob' } });

    fireEvent.click(screen.getByText(/Save Patient/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/v1/patients', expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-01',
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/patients');
    });
  });

  it('shows error message on API failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { data: { message: 'Patient with this ID already exists' } },
    });

    render(
      <BrowserRouter>
        <RegisterPatient />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John', name: 'firstName' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe', name: 'lastName' } });
    fireEvent.change(screen.getByLabelText(/Birthdate/i), { target: { value: '1990-01-01', name: 'dob' } });

    fireEvent.click(screen.getByText(/Save Patient/i));

    await waitFor(() => {
      expect(screen.getByText(/Patient with this ID already exists/i)).toBeInTheDocument();
    });
  });
});
