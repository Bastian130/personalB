import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register'];
const protectedPaths = ['/dashboard', '/cv', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si le token existe dans les cookies ou localStorage (via header)
  const token = request.cookies.get('authToken')?.value;
  
  // Vérifier si la route est protégée
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );
  
  // Vérifier si la route est publique
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );
  
  // Si la route est protégée et qu'il n'y a pas de token, rediriger vers /login
  if (isProtectedPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // Si l'utilisateur est connecté et essaie d'accéder à login/register, rediriger vers dashboard
  if (isPublicPath && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  // Ajouter le token dans les headers pour les requêtes API côté serveur
  const response = NextResponse.next();
  if (token) {
    response.headers.set('x-auth-token', token);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Matcher toutes les routes sauf:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
};

