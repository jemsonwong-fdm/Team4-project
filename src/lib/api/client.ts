/**
 * API Client - Typed fetch wrappers for all API endpoints
 * Requirements: All
 */

import type { Opportunity, Invitation, Client } from '@/lib/models';
import { toast } from 'sonner';

// API Response Types
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: string;
    count?: number;
}

interface OpportunitiesListResponse {
    success: boolean;
    data: Opportunity[];
    count: number;
}

interface OpportunityDetailResponse {
    success: boolean;
    data: Opportunity;
}

interface InvitationsListResponse {
    success: boolean;
    data: Array<Invitation & { opportunity?: Opportunity }>;
    count: number;
}

interface InvitationResponse {
    success: boolean;
    data: Invitation;
}

interface ClientsListResponse {
    success: boolean;
    data: Client[];
    count: number;
}

interface GenerateOpportunitiesResponse {
    success: boolean;
    data: {
        opportunitiesGenerated: number;
        clientsAnalyzed: number;
        pairsEvaluated: number;
        minScore: number;
    };
}

// Error class for API errors
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public details?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Base fetch wrapper with error handling
async function apiFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || 'An error occurred';
            const errorDetails = data.details;

            if (response.status === 401) {
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `/login?redirect=${redirect}`;
                }

                throw new ApiError('Authentication required', response.status, errorDetails);
            }

            // Show error toast
            toast.error(errorMessage, {
                description: errorDetails,
            });

            throw new ApiError(errorMessage, response.status, errorDetails);
        }

        return data as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Network or parsing error
        const message = error instanceof Error ? error.message : 'Network error';
        toast.error('Request failed', {
            description: message,
        });
        throw new ApiError(message, 0);
    }
}

// Opportunities API
export const opportunitiesApi = {
    /**
     * Get list of opportunities with optional filters
     * @param filters - Optional filters for client name, ecosystem position, RM, and limit
     */
    async list(filters?: {
        clientName?: string;
        ecosystemPosition?: string;
        rm?: string;
        limit?: number;
    }): Promise<Opportunity[]> {
        const params = new URLSearchParams();

        if (filters?.clientName) params.append('clientName', filters.clientName);
        if (filters?.ecosystemPosition) params.append('ecosystemPosition', filters.ecosystemPosition);
        if (filters?.rm) params.append('rm', filters.rm);
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const url = `/api/opportunities${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await apiFetch<OpportunitiesListResponse>(url);

        return response.data;
    },

    /**
     * Get a single opportunity by ID
     * @param id - Opportunity ID
     */
    async get(id: string): Promise<Opportunity> {
        const response = await apiFetch<OpportunityDetailResponse>(`/api/opportunities/${id}`);
        return response.data;
    },

    /**
     * Generate new opportunities
     * @param options - Optional generation options
     */
    async generate(options?: {
        minScore?: number;
        concurrency?: number;
    }): Promise<GenerateOpportunitiesResponse['data']> {
        const response = await apiFetch<GenerateOpportunitiesResponse>(
            '/api/opportunities/generate',
            {
                method: 'POST',
                body: JSON.stringify(options || {}),
            }
        );

        // Show success toast
        toast.success('Opportunities generated', {
            description: `Generated ${response.data.opportunitiesGenerated} opportunities from ${response.data.clientsAnalyzed} clients`,
        });

        return response.data;
    },
};

// Invitations API
export const invitationsApi = {
    /**
     * Get list of invitations
     * @param type - Filter by 'received', 'sent', or 'all' (default)
     */
    async list(type?: 'received' | 'sent' | 'all'): Promise<Array<Invitation & { opportunity?: Opportunity }>> {
        const params = new URLSearchParams();
        if (type) params.append('type', type);

        const url = `/api/invitations${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await apiFetch<InvitationsListResponse>(url);

        return response.data;
    },

    /**
     * Send an invitation for an opportunity
     * @param opportunityId - Opportunity ID
     */
    async send(opportunityId: string): Promise<Invitation> {
        const response = await apiFetch<InvitationResponse>(
            '/api/invitations',
            {
                method: 'POST',
                body: JSON.stringify({ opportunityId }),
            }
        );

        // Show success toast
        toast.success('Invitation sent', {
            description: 'The other RM has been notified',
        });

        return response.data;
    },

    /**
     * Respond to an invitation
     * @param id - Invitation ID
     * @param status - 'accepted' or 'declined'
     */
    async respond(id: string, status: 'accepted' | 'declined'): Promise<Invitation> {
        const response = await apiFetch<InvitationResponse>(
            `/api/invitations/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify({ status }),
            }
        );

        // Show success toast
        toast.success(
            status === 'accepted' ? 'Invitation accepted' : 'Invitation declined',
            {
                description: status === 'accepted'
                    ? 'You can now collaborate on this opportunity'
                    : 'The sender has been notified',
            }
        );

        return response.data;
    },
};

// Clients API
export const clientsApi = {
    /**
     * Get clients for authenticated RM
     */
    async list(filters?: {
        search?: string;
        ecosystemPosition?: string;
    }): Promise<Client[]> {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.ecosystemPosition) params.append('ecosystemPosition', filters.ecosystemPosition);

        const url = `/api/clients${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await apiFetch<ClientsListResponse>(url);
        return response.data;
    },
};

// Mock Data API
export const mockDataApi = {
    /**
     * Load mock data
     */
    async load(): Promise<void> {
        await apiFetch<ApiResponse<void>>(
            '/api/mock-data/load',
            {
                method: 'POST',
            }
        );

        toast.success('Mock data loaded', {
            description: 'Sample clients and RMs have been loaded',
        });
    },
};
