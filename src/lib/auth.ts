import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            agency: true,
            garage: true
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Vérification pour les utilisateurs garage
        if (user.role === 'garage' && user.garageId) {
          const garage = await db.garage.findUnique({
            where: { id: user.garageId }
          });

          // Si le garage n'est pas validé, bloquer l'accès
          if (!garage || garage.validationStatus !== 'APPROVED') {
            throw new Error('GARAGE_NOT_APPROVED');
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agencyId: user.agencyId,
          agencyName: user.agency?.name || null,
          garageId: user.garageId,
          garageName: user.garage?.name || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
        token.agencyName = user.agencyName;
        token.garageId = user.garageId;
        token.garageName = user.garageName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.agencyId = token.agencyId as string | null;
        session.user.agencyName = token.agencyName as string | null;
        session.user.garageId = token.garageId as string | null;
        session.user.garageName = token.garageName as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'qrbag-secret-key-change-in-production'
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
