import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api') || req.url.includes('/api/')) {
    let token = localStorage.getItem('construtec_jwt_token');
    if (!token) {
      try {
        const saved = localStorage.getItem('construtec_session_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.token) {
            token = String(parsed.token);
            localStorage.setItem('construtec_jwt_token', token);
          }
        }
      } catch {
        // ignora erro de leitura
      }
    }
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(cloned);
    }
  }
  return next(req);
};
