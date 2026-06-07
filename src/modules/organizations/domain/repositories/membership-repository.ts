import type { Membership } from "../entities/membership";
import type { Role } from "@prisma/client";

export interface MembershipRepository {
  findById(id: string): Promise<Membership | null>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<Membership | null>;
  listByOrganization(
    organizationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ items: Membership[]; total: number }>;
  countByRole(organizationId: string, role: Role): Promise<number>;
  save(membership: Membership): Promise<void>;
  delete(id: string): Promise<void>;
}
