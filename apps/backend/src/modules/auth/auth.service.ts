import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserStatus } from './user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  role: string;
  tenantId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    // Check for existing email
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
      withDeleted: false,
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create user — passwordHash will be hashed by @BeforeInsert
    const user = this.userRepo.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash: dto.password,
      phone: dto.phone,
      role: dto.role,
      status: UserStatus.ACTIVE, // In prod: PENDING_VERIFICATION with email flow
    });

    await this.userRepo.save(user);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'passwordHash', 'role', 'status', 'firstName', 'lastName', 'tenantId'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended. Please contact support.');
    }

    const isValid = await user.validatePassword(dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Token invalid or user suspended');
    }
    return user;
  }

  private generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    // Omit sensitive fields from user response
    const { passwordHash, ...safeUser } = user as any;

    return { accessToken, refreshToken, user: safeUser };
  }
}
