import { Entity } from "@/shared/domain/base";

export interface OrganizationProps {
  readonly id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  locale: string;
  timezone: string;
  settings: Record<string, unknown>;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Organization aggregate root — represents a tenant.
 *
 * Owns its own settings, members, stories, and audit logs. All other
 * tenant-scoped aggregates reference the organization by id.
 */
export class Organization extends Entity {
  private constructor(private props: OrganizationProps) {
    super(props.id);
  }

  static fromPersistence(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  static create(input: {
    id: string;
    name: string;
    slug: string;
    locale?: string;
    timezone?: string;
  }): Organization {
    const now = new Date();
    return new Organization({
      id: input.id,
      name: input.name.trim(),
      slug: input.slug,
      logoUrl: null,
      description: null,
      website: null,
      locale: input.locale ?? "en",
      timezone: input.timezone ?? "UTC",
      settings: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  rename(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      throw new Error("Organization name must be between 2 and 100 characters");
    }
    this.props.name = trimmed;
    this.props.updatedAt = new Date();
  }

  updateBranding(input: { logoUrl?: string | null; description?: string | null; website?: string | null }): void {
    if (input.logoUrl !== undefined) this.props.logoUrl = input.logoUrl;
    if (input.description !== undefined) this.props.description = input.description;
    if (input.website !== undefined) this.props.website = input.website;
    this.props.updatedAt = new Date();
  }

  updateSettings(patch: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...patch };
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt) return;
    this.props.deletedAt = new Date();
    this.props.updatedAt = this.props.deletedAt;
  }

  toJSON(): OrganizationProps {
    return { ...this.props };
  }

  get name() { return this.props.name; }
  get slug() { return this.props.slug; }
  get isDeleted() { return this.props.deletedAt !== null; }
}
