import { Injectable, signal } from '@angular/core';
import axios, { AxiosError, AxiosInstance } from 'axios';

/** Servicio base; cada equipo configura la IP REAL del servidor de Apache. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http: AxiosInstance = axios.create({ timeout: 12000 });

  /** URL base actual, como signal para que las pantallas reaccionen al configurarla. */
  readonly baseUrl = signal(localStorage.getItem('api_base_url') || '');

  // Ejemplo de URL en el celular: http://192.168.1.151:80/mi-reto/api
  setBaseUrl(url: string): void {
    const clean = url.trim().replace(/\/$/, '');
    localStorage.setItem('api_base_url', clean);
    this.baseUrl.set(clean);
  }

  getBaseUrl(): string {
    return localStorage.getItem('api_base_url') || '';
  }

  private url(endpoint: string): string {
    const base = this.getBaseUrl();
    if (!base) throw new Error('Configura la URL de la API antes de comenzar.');
    return `${base}/${endpoint.replace(/^\//, '')}`;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.http.get<T>(this.url(endpoint));
    return response.data;
  }

  async postJson<T>(endpoint: string, payload: unknown): Promise<T> {
    const response = await this.http.post<T>(this.url(endpoint), payload);
    return response.data;
  }

  async postFile<T>(endpoint: string, form: FormData): Promise<T> {
    // No fijar a mano Content-Type: Axios/navegador deben añadir boundary.
    const response = await this.http.post<T>(this.url(endpoint), form);
    return response.data;
  }

  /** Método, URL, estado HTTP y error legible (CONTRATO_API.md). */
  explainError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const e = error as AxiosError<{ error?: string }>;
      const method = e.config?.method?.toUpperCase() || 'SIN MÉTODO';
      const status = e.response?.status || 'sin respuesta';
      const detail = e.response?.data?.error
        || (e.response ? JSON.stringify(e.response.data) : `${e.message} (¿IP, puerto o firewall correctos?)`);
      return `${method} ${e.config?.url || 'sin URL'} | HTTP ${status} | ${detail}`;
    }
    return error instanceof Error ? error.message : String(error);
  }
}
