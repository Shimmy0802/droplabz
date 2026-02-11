import { describe, expect, it, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const dbMock = {
    user: {
        findUnique: vi.fn(),
    },
    communityMember: {
        findUnique: vi.fn(),
    },
    community: {
        findUnique: vi.fn(),
    },
    superAdminAuditLog: {
        create: vi.fn(),
    },
};

vi.mock('@/lib/auth', () => ({
    auth: authMock,
}));

vi.mock('@/lib/db', () => ({
    db: dbMock,
}));

describe('auth middleware', () => {
    beforeEach(() => {
        authMock.mockReset();
        dbMock.user.findUnique.mockReset();
        dbMock.communityMember.findUnique.mockReset();
    });

    it('requireAuth throws when no session', async () => {
        authMock.mockResolvedValue(null);
        const { requireAuth } = await import('@/lib/auth/middleware');
        await expect(requireAuth()).rejects.toThrowError();
    });

    it('getCurrentUser returns user details', async () => {
        authMock.mockResolvedValue({ user: { id: 'user-1' } });
        dbMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            role: 'MEMBER',
            discordId: '123',
            createdAt: new Date(),
        });

        const { getCurrentUser } = await import('@/lib/auth/middleware');
        const user = await getCurrentUser();
        expect(user.id).toBe('user-1');
    });

    it('requireCommunityAdmin rejects non-admin member', async () => {
        authMock.mockResolvedValue({ user: { id: 'user-1' } });
        dbMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            role: 'MEMBER',
            discordId: '123',
            createdAt: new Date(),
        });
        dbMock.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

        const { requireCommunityAdmin } = await import('@/lib/auth/middleware');
        await expect(requireCommunityAdmin('community-1')).rejects.toThrowError();
    });

    it('requireCommunityAdmin allows admin role', async () => {
        authMock.mockResolvedValue({ user: { id: 'user-1' } });
        dbMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            role: 'ADMIN',
            discordId: '123',
            createdAt: new Date(),
        });
        dbMock.communityMember.findUnique.mockResolvedValue({ role: 'ADMIN' });

        const { requireCommunityAdmin } = await import('@/lib/auth/middleware');
        const user = await requireCommunityAdmin('community-1');
        expect(user.id).toBe('user-1');
    });

    it('requireSuperAdmin blocks non-super-admin', async () => {
        process.env.SUPER_ADMIN_DISCORD_IDS = '';
        authMock.mockResolvedValue({ user: { id: 'user-1' } });
        dbMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            role: 'ADMIN',
            discordId: '123',
            createdAt: new Date(),
        });

        const { requireSuperAdmin } = await import('@/lib/auth/middleware');
        await expect(requireSuperAdmin()).rejects.toThrowError();
    });

    it('requireSuperAdmin allows super admin', async () => {
        process.env.SUPER_ADMIN_DISCORD_IDS = '';
        authMock.mockResolvedValue({ user: { id: 'user-1' } });
        dbMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            role: 'SUPER_ADMIN',
            discordId: '123',
            createdAt: new Date(),
        });

        const { requireSuperAdmin } = await import('@/lib/auth/middleware');
        const user = await requireSuperAdmin();
        expect(user.id).toBe('user-1');
    });
});
