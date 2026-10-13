import { Injectable } from '@angular/core';
import axios, { AxiosError, AxiosInstance } from 'axios';

/** Servicio base; cada equipo configura la IP REAL del servidor de Apache. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http: AxiosInstance = axios.create({ timeout: 12000 });

  // Ejemplo de URL en el celular: http://192.168.1.151:80/mi-reto/api
  setBaseUrl(url: string): void {
    localStorage.setItem('api_base_url', url.trim().replace(/\/$/, ''));
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

  explainError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const e = error as AxiosError;
      return `HTTP ${e.response?.status || 'sin respuesta'} | ${e.config?.url || 'sin URL'} | ${JSON.stringify(e.response?.data || e.message)}`;
    }
    return error instanceof Error ? error.message : String(error);
  }
}
