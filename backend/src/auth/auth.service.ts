import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ip?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'REGISTERED',
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.USER_REGISTER,
      ipAddress: ip,
      metadata: { email: user.email },
    });

    const token = this.signToken(user.id, user.email, user.role, user.name);
    return { accessToken: token, user: this.sanitize(user) };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      ipAddress: ip,
      metadata: { email: user.email },
    });

    const token = this.signToken(user.id, user.email, user.role, user.name);
    return { accessToken: token, user: this.sanitize(user) };
  }

  private signToken(id: string, email: string, role: string, name: string) {
    return this.jwt.sign({ sub: id, email, role, name });
  }

  private sanitize(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
