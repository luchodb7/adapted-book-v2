import { Entity } from "@/shared/domain/base";
import type { Role, MembershipStatus } from "@prisma/client";

export interface MembershipProps {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  role: Role;
  status: MembershipStatus;
  readonly joinedAt: Date;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Membership extends Entity {
  private constructor(private props: MembershipProps) {
    super(props.id);
  }

  static fromPersistence(props: MembershipProps): Membership {
    return new Membership(props);
  }

  static create(input: {
    id: string;
    userId: string;
    organizationId: string;
    role: Role;
    status?: MembershipStatus;
  }): Membership {
    const now = new Date();
    return new Membership({
      id: input.id,
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      status: input.status ?? "ACTIVE",
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  changeRole(newRole: Role): void {
    if (this.props.role === newRole) return;
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.status = "SUSPENDED";
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = "ACTIVE";
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt) return;
    this.props.deletedAt = new Date();
    this.props.updatedAt = this.props.deletedAt;
  }

  toJSON(): MembershipProps {
    return { ...this.props };
  }

  get role() { return this.props.role; }
  get status() { return this.props.status; }
  get userId() { return this.props.userId; }
  get organizationId() { return this.props.organizationId; }
  get isActive() { return this.props.status === "ACTIVE" && this.props.deletedAt === null; }
}
