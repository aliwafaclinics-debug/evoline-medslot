import {
  Entity,
  Column,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/decorators';

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

@Entity('users')
@Index(['email'], { unique: true, where: '"deleted_at" IS NULL' })
export class User extends BaseEntity {
  @Column({ type: 'citext' })
  email: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Exclude()
  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'email_verified_at', nullable: true, type: 'timestamptz' })
  emailVerifiedAt?: Date;

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;

  @Column({ name: 'profile_photo_url', nullable: true })
  profilePhotoUrl?: string;

  @Column({ name: 'language_preference', default: 'en', length: 10 })
  languagePreference: string;

  @Column({ name: 'tenant_id', nullable: true, type: 'uuid' })
  tenantId?: string;

  // Virtual getter
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
  }
}
