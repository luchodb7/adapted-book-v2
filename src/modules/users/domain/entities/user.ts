import { Entity } from "@/shared/domain/base";

export interface UserProps {
  readonly id: string;
  email: string;
  emailVerified: Date | null;
  hashedPassword: string | null;
  name: string | null;
  image: string | null;
  locale: string;
  timezone: string;
  preferences: Record<string, unknown>;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class User extends Entity {
  private constructor(private props: UserProps) {
    super(props.id);
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  updateProfile(input: { name?: string; image?: string; locale?: string; timezone?: string }): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.image !== undefined) this.props.image = input.image;
    if (input.locale !== undefined) this.props.locale = input.locale;
    if (input.timezone !== undefined) this.props.timezone = input.timezone;
    this.props.updatedAt = new Date();
  }

  updatePreferences(patch: Record<string, unknown>): void {
    this.props.preferences = { ...this.props.preferences, ...patch };
    this.props.updatedAt = new Date();
  }

  verifyEmail(): void {
    if (!this.props.emailVerified) {
      this.props.emailVerified = new Date();
      this.props.updatedAt = this.props.emailVerified;
    }
  }

  softDelete(): void {
    if (this.props.deletedAt) return;
    this.props.deletedAt = new Date();
    this.props.updatedAt = this.props.deletedAt;
  }

  toJSON(): UserProps {
    return { ...this.props };
  }

  get email() { return this.props.email; }
  get name() { return this.props.name; }
  get isVerified() { return this.props.emailVerified !== null; }
  get isLocked() { return this.props.lockedUntil !== null && this.props.lockedUntil > new Date(); }
}
