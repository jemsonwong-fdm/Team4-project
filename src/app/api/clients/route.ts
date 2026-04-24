import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { initializeMockData } from '@/lib/data/initMockData';
import { clientStore } from '@/lib/data/stores';
import { accessControlService } from '@/lib/services/accessControlService';

export async function GET(request: NextRequest) {
    try {
        const rm = await requireAuth();
        await initializeMockData();

        const searchParams = request.nextUrl.searchParams;
        const search = (searchParams.get('search') || '').trim().toLowerCase();
        const ecosystemPosition = searchParams.get('ecosystemPosition');

        let clients = clientStore.getByRM(rm.id);

        if (search) {
            clients = clients.filter((client) =>
                client.companyName.toLowerCase().includes(search) ||
                client.geography.toLowerCase().includes(search) ||
                client.esgAlignment.toLowerCase().includes(search)
            );
        }

        if (ecosystemPosition && ecosystemPosition !== 'all') {
            clients = clients.filter((client) =>
                client.ecosystemPositions.includes(ecosystemPosition as any)
            );
        }

        clients = clients.sort((a, b) => a.companyName.localeCompare(b.companyName));

        await accessControlService.logAccess(
            rm.id,
            'client',
            'list',
            'read',
            {
                search,
                ecosystemPosition,
                count: clients.length
            }
        );

        return NextResponse.json({
            success: true,
            data: clients,
            count: clients.length
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch clients',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
