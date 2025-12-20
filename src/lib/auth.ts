import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt, { compare } from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma) as any,
	secret: process.env.NEXTAUTH_SECRET,
	session: { strategy: 'jwt' },
	providers: [
		CredentialsProvider({
			id: 'credentials',
			name: 'Псевдоним и пароль',
			credentials: {
				username: { label: 'Псевдоним', type: 'text' },
				password: { label: 'Пароль', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) return null
				const username = credentials.username.trim()
				const password = credentials.password

				const user = await prisma.user.findUnique({ where: { username } })

				if (!user) {
					const hashed = await bcrypt.hash(password, 10)
					const newUser = await prisma.user.create({
						data: {
							username,
							password: hashed,
						},
					})
					return {
						id: String(newUser.id),
						name: newUser.username,
					}
				}

				if (user.password) {
					const isValid = await compare(password, user.password)
					if (!isValid) return null
					return {
						id: String(user.id),
						name: user.name ?? user.username,
						email: user.email ?? undefined,
					} as any
				}

				// OAuth-only user
				return null
			},
		}),
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? [
					GoogleProvider({
						clientId: process.env.GOOGLE_CLIENT_ID!,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
						authorization: { params: { scope: 'openid email profile' } },
					}),
				]
			: []),
	],
	pages: {
		signIn: '/',
		error: '/',
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) token.id = (user as any).id
			return token
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string
			}
			return session
		},
		async redirect({ url, baseUrl }) {
			const u = new URL(url, baseUrl)
			const intent = u.searchParams.get('intent')
			const promo = u.searchParams.get('promo')

			if (intent === 'premium') {
				const promoParam = promo ? `?promo=${encodeURIComponent(promo)}` : ''
				return `${baseUrl}/billing${promoParam}`
			}

			if (intent === 'scan') {
				return `${baseUrl}/scan`
			}

			return `${baseUrl}/scan`
		},
	},
}
