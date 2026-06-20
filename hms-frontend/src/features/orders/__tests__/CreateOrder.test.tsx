import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CreateOrder } from '../CreateOrder';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
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

const mockUser = {
  id: 'U123',
  email: 'test@example.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Admin'],
  permissions: ['order.create'],
};

const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isLoading: false, logout: vi.fn(), refetchUser: vi.fn() }}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('CreateOrder Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (apiClient.get as unknown as Mock).mockImplementation(async (url: string) => {
      if (url === '/v1/catalog') {
        return { data: [{ id: 'S1', type: 'SERVICE', code: 'CBC', name: 'CBC', department: 'Hem', price: 10 }] };
      }
      if (url.includes('/v1/patients')) {
        return { data: [{ id: 'P1', firstName: 'John', lastName: 'Doe', age: 30, gender: 'M' }] };
      }
      throw new Error('Unknown endpoint');
    });
  });

  it('does not call alert() and instead calls API on submit', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.post as unknown as Mock).mockResolvedValue({ data: { id: 'O123' } });

    renderWithAuth(<CreateOrder />);

    // Select patient
    fireEvent.change(screen.getByPlaceholderText(/Search by name or ID.../i), { target: { value: 'P001' } });
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/v1/patients', expect.any(Object)));

    // Add a service
    const serviceBtn = await screen.findByText('CBC');
    fireEvent.click(serviceBtn);

    // Submit
    fireEvent.click(screen.getByText(/Create Order/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/v1/orders', expect.objectContaining({
        patientId: 'P1',
        branchId: 'B123',
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/queue');
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows error message on API failure', async () => {
    (apiClient.post as unknown as Mock).mockRejectedValue({
      response: { data: { message: 'Internal Server Error' } },
    });

    renderWithAuth(<CreateOrder />);

    // Select patient
    fireEvent.change(screen.getByPlaceholderText(/Search by name or ID.../i), { target: { value: 'P001' } });
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    // Add service
    const serviceBtn = await screen.findByText('CBC');
    fireEvent.click(serviceBtn);

    // Submit
    fireEvent.click(screen.getByText(/Create Order/i));

    await waitFor(() => {
      expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
    });
  });

  it('fetches services from catalog on mount', async () => {
    renderWithAuth(<CreateOrder />);
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/catalog');
    });
  });
});
