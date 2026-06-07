import type { Organization } from "../entities/organization";

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByUserId(userId: string): Promise<Organization[]>;
  save(organization: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}
