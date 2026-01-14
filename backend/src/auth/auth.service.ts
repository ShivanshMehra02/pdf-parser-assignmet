import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('DATABASE')
    private readonly db: NodePgDatabase<typeof import('../db/schema')>,
  ) {}

  async validateUser(email: string, password: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Demo user shortcut
    if (email === 'demo@example.com' && password === 'password123') {
      const { password: _, ...result } = user;
      return result;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      success: true,
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, name?: string) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning();

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };

    return {
      success: true,
      user: newUser,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async initializeDemoUser() {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, 'demo@example.com'))
      .limit(1);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await this.db.insert(users).values({
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
      });

      console.log('✅ Demo user created: demo@example.com / password123');
    }
  }
}
