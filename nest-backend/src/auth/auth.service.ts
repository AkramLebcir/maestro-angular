import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser, JwtPayload } from './interfaces/auth-user.interface';
import axios from 'axios';

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
    return {
      accessToken: this.generateAccessToken(safeUser),
      user: this.mapToAuthUser(safeUser),
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

  private generateAccessToken(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      modules: user.allowedModules,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
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
}


