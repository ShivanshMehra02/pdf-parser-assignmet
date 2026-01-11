import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.module';
import { users } from '../db/schema';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For demo user, accept password123
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
      name: user.name 
    };

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, name: string) {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
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
      name: newUser.name 
    };

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  // Initialize demo user on startup
  async initializeDemoUser() {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'demo@example.com'))
      .limit(1);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.insert(users).values({
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
      });
      console.log('✅ Demo user created: demo@example.com / password123');
    }
  }
}
