import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser, JwtPayload } from './interfaces/auth-user.interface';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    // Verify reCAPTCHA token
    const recaptchaSecret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    
    if (recaptchaSecret) {
      // Validate that captchaToken is provided
      if (!loginDto.captchaToken) {
        throw new UnauthorizedException('reCAPTCHA token is required');
      }

      const isValidCaptcha = await this.verifyCaptcha(loginDto.captchaToken, recaptchaSecret);
      if (!isValidCaptcha) {
        throw new UnauthorizedException('Invalid reCAPTCHA verification. Please try again.');
      }
    } else {
      // If no secret key is set, skip verification (development mode with test keys)
      console.warn('⚠️  reCAPTCHA secret key not set - skipping verification (development mode)');
      console.warn('⚠️  For production, set RECAPTCHA_SECRET_KEY in .env file');
    }

    const user = await this.usersService.findByIdentifier(loginDto.identifier, true);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.usersService.validatePassword(loginDto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.setLastLogin(user.id);

    const safeUser = await this.usersService.findOne(user.id);
    const authUser = this.mapToAuthUser(safeUser);

    // Generate new session and tokens (invalidates previous session)
    const { refreshToken, expiresAt, sessionId } = await this.generateAndStoreRefreshToken(authUser.id);
    const accessToken = this.generateAccessToken(authUser, sessionId);

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
      user: authUser,
    };
  }

  private async verifyCaptcha(token: string, secretKey: string): Promise<boolean> {
    if (!token || !secretKey) {
      console.error('reCAPTCHA verification failed: Missing token or secret key');
      return false;
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
          timeout: 5000, // 5 seconds timeout
        },
      );

      const { success, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.warn('reCAPTCHA verification failed:', {
          errorCodes: errorCodes || [],
          message: 'Token verification unsuccessful',
        });
        return false;
      }

      console.log('reCAPTCHA verification successful');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('reCAPTCHA verification error:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
        });
      } else {
        console.error('reCAPTCHA verification error:', error);
      }
      return false;
    }
  }

  async getProfile(user: AuthUser) {
    return user;
  }

  private generateAccessToken(user: AuthUser, sessionId: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      modules: user.allowedModules,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      sessionId,
    };

    return this.jwtService.sign(payload);
  }

  private mapToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      allowedModules: user.allowedModules,
      isActive: user.isActive,
    };
  }

  private async generateAndStoreRefreshToken(userId: number, existingSessionId?: string) {
    // TTL can be provided either as a string (e.g. "7d") or a number of seconds.
    // We type it as JwtSignOptions['expiresIn'] so it matches jsonwebtoken's supported formats.
    const ttl = this.configService.get<JwtSignOptions['expiresIn']>(
      'REFRESH_TOKEN_TTL',
      '7d' as JwtSignOptions['expiresIn'],
    );
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET', 'super-refresh-secret');
    const sessionId = existingSessionId ?? randomUUID();

    const payload = { sub: userId, sessionId };
    const refreshToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: ttl,
    });

    // Decode to get exact expiration date
    const decoded: any = this.jwtService.decode(refreshToken);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hash = await bcrypt.hash(refreshToken, saltRounds);

    await this.usersService.setRefreshToken(userId, hash, expiresAt ?? null, sessionId);

    return { refreshToken, expiresAt, sessionId };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET', 'super-refresh-secret');
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret });
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new ForbiddenException('Refresh token not valid');
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearRefreshToken(user.id);
      throw new ForbiddenException('Refresh token expired');
    }

    // Ensure refresh token is for current session
    if (!payload.sessionId || !user.sessionId || payload.sessionId !== user.sessionId) {
      throw new ForbiddenException('Refresh token session invalid');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new ForbiddenException('Refresh token mismatch');
    }

    const safeUser = await this.usersService.findOne(user.id);
    const authUser = this.mapToAuthUser(safeUser);

    const { refreshToken: newRefreshToken, expiresAt, sessionId } = await this.generateAndStoreRefreshToken(
      authUser.id,
      user.sessionId ?? payload.sessionId,
    );
    const accessToken = this.generateAccessToken(authUser, sessionId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: expiresAt,
      user: authUser,
    };
  }

  async logout(userId: number) {
    await this.usersService.clearRefreshToken(userId);
  }
}


