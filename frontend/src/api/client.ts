import {
  Habit,
  HabitCreatePayload,
  HabitDashboardSummary,
  HabitLog,
  Expense,
  AuthState,
  BackendConfig,
  CombinedDashboardSummary,
  ExpenseAnalytics,
  ExpenseDashboardStats,
  ExpenseUpdatePayload,
  HabitUpdatePayload,
} from '../types';

// State keys
const CONFIG_KEY = 'quantum_backend_config';
const AUTH_KEY = 'quantum_auth_state';
const PRE_DEMO_AUTH_KEY = 'trackwise_auth_before_demo';

const DEFAULT_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://trackwise-api-fk4c.onrender.com';

const AUTH_DEBUG =
  typeof import.meta !== 'undefined' &&
  (import.meta.env?.DEV === true || import.meta.env?.VITE_AUTH_DEBUG === 'true');

type PersistedAuth = Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'>;

export type AuthInitResult = {
  ok: boolean;
  error?: string;
};

// Base API Call utility with JWT handling
class ApiClient {
  private sessionInvalidatedListeners = new Set<() => void>();
  private config: BackendConfig = {
    baseUrl: DEFAULT_API_BASE,
  };

  private auth: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  };

  constructor() {
    this.loadState();
  }

  private logAuth(message: string, detail?: unknown) {
    if (!AUTH_DEBUG) return;
    console.info(`[TrackWise:auth] ${message}`, detail ?? '');
  }

  private logRequest(message: string, detail?: unknown) {
    if (!AUTH_DEBUG) return;
    console.info(`[TrackWise:api] ${message}`, detail ?? '');
  }

  private loadState() {
    try {
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as Partial<BackendConfig>;
        this.config = {
          baseUrl: parsed.baseUrl || this.config.baseUrl,
        };
      }
      const savedAuth = localStorage.getItem(AUTH_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth) as Partial<PersistedAuth & { isAuthenticated?: boolean }>;
        this.auth = {
          isAuthenticated: false,
          user: parsed.user ?? null,
          accessToken: parsed.accessToken ?? null,
          refreshToken: parsed.refreshToken ?? null,
        };
        this.logAuth('Restored credentials from localStorage (session not yet verified)', {
          hasAccessToken: !!this.auth.accessToken,
          hasRefreshToken: !!this.auth.refreshToken,
          ignoredStoredFlag: parsed.isAuthenticated,
        });
      }
    } catch (e) {
      console.error('Error loading API Client local state', e);
      this.clearAuth();
    }
  }

  private persistCredentials() {
    const payload: PersistedAuth = {
      user: this.auth.user,
      accessToken: this.auth.accessToken,
      refreshToken: this.auth.refreshToken,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  }

  private clearAuth(notifySessionExpired = false) {
    this.auth = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    };
    localStorage.removeItem(AUTH_KEY);
    this.logAuth('Session cleared');
    if (notifySessionExpired) {
      this.sessionInvalidatedListeners.forEach((listener) => listener());
    }
  }

  /** Subscribe to mid-session logout (expired refresh token, etc.). */
  public onSessionInvalidated(listener: () => void): () => void {
    this.sessionInvalidatedListeners.add(listener);
    return () => this.sessionInvalidatedListeners.delete(listener);
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) return true;
    if (error instanceof Error) {
      return /failed to fetch|networkerror|load failed/i.test(error.message);
    }
    return false;
  }

  private isDemoProfile(profile: { email?: string | null; is_demo?: boolean | null }): boolean {
    return profile.is_demo === true;
  }

  /** Validates stored JWTs against the backend before showing the dashboard. */
  public async initializeAuth(): Promise<AuthInitResult> {
    this.logAuth('initializeAuth: start');

    if (!this.auth.accessToken || !this.auth.refreshToken) {
      this.logAuth('initializeAuth: no tokens — showing login');
      this.clearAuth();
      return { ok: false };
    }

    try {
      const profile = await this.request('/api/accounts/profile/');
      this.auth = {
        isAuthenticated: true,
        user: {
          email: profile.email,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          isDemo: this.isDemoProfile(profile),
          demoExpiresAt: profile.demo_expires_at || undefined,
        },
        accessToken: this.auth.accessToken,
        refreshToken: this.auth.refreshToken,
      };
      this.persistCredentials();
      this.logAuth('initializeAuth: session valid', { email: profile.email });
      return { ok: true };
    } catch (error) {
      this.logAuth('initializeAuth: session invalid — clearing stale tokens', error);
      this.clearAuth();
      if (this.isNetworkError(error)) {
        return {
          ok: false,
          error: `Cannot reach API at ${this.config.baseUrl}. Start Django with: python manage.py runserver 8000`,
        };
      }
      return { ok: false, error: 'Session expired or invalid. Please sign in again.' };
    }
  }

  public saveConfig(config: BackendConfig) {
    this.config = config;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  public saveAuth(auth: Partial<AuthState>) {
    this.auth = { ...this.auth, ...auth };
    if (this.auth.accessToken && this.auth.refreshToken) {
      this.persistCredentials();
    }
    this.logAuth('saveAuth', {
      isAuthenticated: this.auth.isAuthenticated,
      hasAccessToken: !!this.auth.accessToken,
      hasRefreshToken: !!this.auth.refreshToken,
    });
  }

  public logout() {
    const refreshToken = this.auth.refreshToken;
    const accessToken = this.auth.accessToken;

    this.clearAuth();

    if (refreshToken && accessToken) {
      const url = `${this.config.baseUrl}/api/accounts/logout/`;
      this.logRequest('logout', { url });
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }).catch((err) => console.error('[TrackWise:api] logout request failed', err));
    }
  }

  public getConfig(): BackendConfig {
    return this.config;
  }

  public getAuth(): AuthState {
    return this.auth;
  }

  // Handle headers and auto token refresh
  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    const requestAccessToken = this.auth.accessToken;

    if (this.auth.accessToken) {
      headers.set('Authorization', `Bearer ${this.auth.accessToken}`);
    }
    if (!headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
      headers.set('Content-Type', 'application/json');
    }

    const bodyPreview =
      typeof options.body === 'string' && options.body.length > 0
        ? (() => {
            try {
              const parsed = JSON.parse(options.body);
              if (parsed.password) parsed.password = '***';
              return parsed;
            } catch {
              return '[non-json body]';
            }
          })()
        : undefined;

    this.logRequest('→ request', { method, url, hasAuthHeader: headers.has('Authorization'), body: bodyPreview });

    try {
      let response = await fetch(url, { ...options, method, headers });

      this.logRequest('← response', { method, url, status: response.status });

      // Encountered unauthorized, try refreshing token
      if (
        response.status === 401 &&
        this.auth.refreshToken &&
        this.auth.accessToken === requestAccessToken &&
        !path.includes('/accounts/refresh/')
      ) {
        this.logAuth('401 received — attempting token refresh', { path });
        const refreshed = await this.rotateToken();
        if (refreshed) {
          headers.set('Authorization', `Bearer ${this.auth.accessToken}`);
          this.logRequest('→ retry after refresh', { method, url });
          response = await fetch(url, { ...options, method, headers });
          this.logRequest('← retry response', { method, url, status: response.status });
        } else {
          this.clearAuth(true);
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const detail =
          errJson.detail ||
          errJson.message ||
          (Array.isArray(errJson.non_field_errors) ? errJson.non_field_errors[0] : undefined) ||
          Object.values(errJson).flat().find((v) => typeof v === 'string') ||
          `Request failed: ${response.statusText}`;
        const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
        this.logRequest('request failed', { method, url, status: response.status, message });
        throw new Error(message);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[TrackWise:api] ${method} ${url} failed:`, message);
      throw e;
    }
  }

  // DRF token rotation
  private async rotateToken(): Promise<boolean> {
    const url = `${this.config.baseUrl}/api/accounts/refresh/`;
    this.logAuth('rotateToken: requesting new access token', { url });
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.auth.refreshToken }),
      });

      this.logAuth('rotateToken: response', { status: response.status });

      if (response.ok) {
        const data = await response.json();
        const newAccess = data.access;
        const newRefresh = data.refresh || this.auth.refreshToken;

        this.saveAuth({
          isAuthenticated: true,
          accessToken: newAccess,
          refreshToken: newRefresh,
        });
        return true;
      }
      return false;
    } catch (error) {
      this.logAuth('rotateToken: failed', error);
      return false;
    }
  }

  // --- REGISTRATION / LOGIN ---
  public async register(payload: any): Promise<boolean> {
    await this.request('/api/accounts/register/', {
      method: 'POST',
      body: JSON.stringify({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        password: payload.password,
      }),
    });
    return true;
  }

  public async login(payload: any): Promise<any> {
    const data = await this.request('/api/accounts/login/', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });

    const previousAuth = this.auth;
    this.auth = {
      isAuthenticated: false,
      user: null,
      accessToken: data.access,
      refreshToken: data.refresh,
    };
    try {
      const profile = await this.request('/api/accounts/profile/');
      const userObj = {
        email: profile.email || payload.email,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        isDemo: this.isDemoProfile(profile),
        demoExpiresAt: profile.demo_expires_at || undefined,
      };

      this.saveAuth({
        isAuthenticated: true,
        user: userObj,
        accessToken: data.access,
        refreshToken: data.refresh,
      });

      return userObj;
    } catch (error) {
      this.auth = previousAuth;
      throw error;
    }
  }

  public async demoLogin(): Promise<any> {
    const previousAuth = this.auth;
    if (
      previousAuth.accessToken &&
      previousAuth.refreshToken &&
      previousAuth.user?.isDemo !== true
    ) {
      try {
        sessionStorage.setItem(PRE_DEMO_AUTH_KEY, JSON.stringify({
          user: previousAuth.user,
          accessToken: previousAuth.accessToken,
          refreshToken: previousAuth.refreshToken,
        }));
      } catch {
        throw new Error('Unable to safely preserve your current sign-in before entering the demo.');
      }
    } else if (previousAuth.user?.isDemo !== true) {
      try {
        sessionStorage.removeItem(PRE_DEMO_AUTH_KEY);
      } catch {
        throw new Error('Unable to safely start the demo in this browser session.');
      }
    }

    const data = await this.request('/api/accounts/demo/', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    this.auth = {
      isAuthenticated: false,
      user: null,
      accessToken: data.access,
      refreshToken: data.refresh,
    };
    try {
      const profile = await this.request('/api/accounts/profile/');
      if (!this.isDemoProfile(profile)) {
        throw new Error('The demo endpoint did not return a designated demo account.');
      }

      const userObj = {
        email: profile.email,
        firstName: profile.first_name || 'Demo',
        lastName: profile.last_name || 'User',
        isDemo: true,
        demoExpiresAt: profile.demo_expires_at || data.expires_at,
      };

      this.saveAuth({
        isAuthenticated: true,
        user: userObj,
        accessToken: data.access,
        refreshToken: data.refresh,
      });

      return userObj;
    } catch (error) {
      this.auth = previousAuth;
      if (previousAuth.accessToken && previousAuth.refreshToken) {
        this.persistCredentials();
      } else {
        this.clearAuth();
      }
      throw error;
    }
  }

  public async resetDemoWorkspace(): Promise<void> {
    await this.request('/api/accounts/demo/reset/', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  public async exitDemo(): Promise<AuthInitResult> {
    if (this.auth.user?.isDemo !== true) {
      return { ok: false };
    }

    let saved: string | null;
    try {
      saved = sessionStorage.getItem(PRE_DEMO_AUTH_KEY);
      sessionStorage.removeItem(PRE_DEMO_AUTH_KEY);
    } catch {
      throw new Error('Unable to restore the previous sign-in from this browser session.');
    }

    this.logout();
    if (!saved) return { ok: false };

    try {
      const previous = JSON.parse(saved) as PersistedAuth;
      this.auth = {
        isAuthenticated: false,
        user: previous.user,
        accessToken: previous.accessToken,
        refreshToken: previous.refreshToken,
      };
      this.persistCredentials();
      return await this.initializeAuth();
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  // --- HABIT API CRUD ---
  public async getHabits(): Promise<Habit[]> {
    const [data, todayPayload] = await Promise.all([
      this.request('/api/habits/'),
      this.request('/api/habits/today/'),
    ]);
    if (!Array.isArray(data) || !Array.isArray(todayPayload?.habits)) {
      throw new Error('Habit endpoints returned an unexpected response.');
    }
    const todayById = new Map<string, boolean>();
    for (const h of todayPayload.habits) {
      if (!Array.isArray(h.logs) || typeof h.target_value !== 'number') {
        throw new Error('Today-habits endpoint returned an unexpected record.');
      }
      const completed = h.logs.some((log: unknown) =>
        Boolean(log && typeof log === 'object' && 'value' in log && typeof log.value === 'number' && log.value >= h.target_value)
      );
      todayById.set(String(h.id), completed);
    }

    return data.map((habit: unknown) => {
      const mapped = this.mapBackendHabit(habit);
      mapped.isCompletedToday = todayById.get(mapped.id) ?? false;
      return mapped;
    });
  }

  public async createHabit(habit: HabitCreatePayload): Promise<Habit> {
    const response = await this.request('/api/habits/', {
      method: 'POST',
      body: JSON.stringify({
        name: habit.name,
        frequency: habit.frequency || 'DAILY',
        target_value: habit.targetValue || 1,
        target_unit: habit.targetUnit || 'BOOL',
        start_date: habit.createdDate,
        is_active: true,
      }),
    });

    return this.mapBackendHabit(response);
  }

  public async deleteHabit(id: string): Promise<void> {
    await this.request(`/api/habits/${id}/`, {
      method: 'DELETE',
    });
  }

  public async updateHabit(id: string, habit: HabitUpdatePayload): Promise<Habit> {
    const response = await this.request(`/api/habits/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(habit.name !== undefined ? { name: habit.name } : {}),
        ...(habit.targetValue !== undefined ? { target_value: habit.targetValue } : {}),
        ...(habit.targetUnit !== undefined ? { target_unit: habit.targetUnit } : {}),
        ...(habit.createdDate !== undefined ? { start_date: habit.createdDate } : {}),
      }),
    });
    return this.mapBackendHabit(response);
  }

  public async logHabit(habitId: string, date: string, value: number, note?: string): Promise<any> {
    return await this.request('/api/habits/logs/', {
      method: 'POST',
      body: JSON.stringify({
        habit: parseInt(habitId, 10),
        date,
        value,
        note: note || '',
      }),
    });
  }

  public async getHabitLogs(): Promise<HabitLog[]> {
    const response = await this.request('/api/habits/logs/');
    if (!Array.isArray(response)) {
      throw new Error('Habit history returned an unexpected response.');
    }
    return response.map((value: unknown) => {
      if (
        !value ||
        typeof value !== 'object' ||
        !('id' in value) ||
        !('habit' in value) ||
        !('date' in value) ||
        !('value' in value) ||
        !('note' in value) ||
        typeof value.id !== 'number' ||
        typeof value.habit !== 'number' ||
        typeof value.date !== 'string' ||
        typeof value.value !== 'number' ||
        typeof value.note !== 'string'
      ) {
        throw new Error('Habit history returned a record with an unexpected shape.');
      }
      const log = value as {
        id: number;
        habit: number;
        date: string;
        value: number;
        note: string;
        created_at?: string;
        updated_at?: string;
      };
      return {
        id: log.id,
        habit: log.habit,
        date: log.date,
        value: log.value,
        note: log.note,
        created_at: log.created_at,
        updated_at: log.updated_at,
      };
    });
  }

  public async getHabitStreak(id: string): Promise<{ habit_id: number; habit_name: string; current_streak: number; today_status: string }> {
    return await this.request(`/api/habits/${id}/streak/`);
  }

  public async getHabitStats(id: string): Promise<{
    habit_id: number;
    habit_name: string;
    current_streak: number;
    today_status: string;
    total_completed_days: number;
    longest_streak: number;
    completion_rate: number;
    last_7_days_status: Array<{ date: string; completed: boolean }>;
  }> {
    return await this.request(`/api/habits/${id}/stats/`);
  }

  public async getHabitDashboardSummary(): Promise<HabitDashboardSummary> {
    return await this.request('/api/habits/dashboard/summary/');
  }

  // --- EXPENSE API CRUD ---
  public async getExpenses(filters?: {
    category?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    ordering?: '-date' | '-date,-created_at' | 'date' | 'date,created_at' | '-amount' | '-amount,-date' | 'amount' | 'amount,date';
  }): Promise<Expense[]> {
    let url = '/api/expenses/';
    const params = new URLSearchParams();
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.min_amount !== undefined) params.append('min_amount', String(filters.min_amount));
      if (filters.max_amount !== undefined) params.append('max_amount', String(filters.max_amount));
      if (filters.ordering) params.append('ordering', filters.ordering);
    }
    const qStr = params.toString();
    if (qStr) url += `?${qStr}`;

    const data = await this.request(url);
    if (!Array.isArray(data)) {
      throw new Error('Expense endpoint returned an unexpected response.');
    }
    return data.map((exp: any) => this.mapBackendExpense(exp));
  }

  public async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const response = await this.request('/api/expenses/', {
      method: 'POST',
      body: JSON.stringify({
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        merchant: expense.merchant || '',
        note: expense.note || '',
      }),
    });

    return this.mapBackendExpense(response);
  }

  public async deleteExpense(id: string): Promise<void> {
    await this.request(`/api/expenses/${id}/`, {
      method: 'DELETE',
    });
  }

  public async updateExpense(id: string, expense: ExpenseUpdatePayload): Promise<Expense> {
    const response = await this.request(`/api/expenses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(expense),
    });
    return this.mapBackendExpense(response);
  }

  public async getExpenseDashboardStats(): Promise<ExpenseDashboardStats> {
    return await this.request('/api/expenses/stats/dashboard/');
  }

  public async getExpenseAnalytics(): Promise<ExpenseAnalytics> {
    return await this.request('/api/expenses/stats/analytics/');
  }

  // --- COMBINED SUMMARY ENDPOINT ---
  public async getCombinedDashboardSummary(): Promise<CombinedDashboardSummary> {
    return await this.request('/api/dashboard/summary/');
  }

  // --- MODEL MAPPER HELPERS ---
  private mapBackendHabit(value: unknown): Habit {
    if (
      !value ||
      typeof value !== 'object' ||
      !('id' in value) ||
      !('name' in value) ||
      !('frequency' in value) ||
      !('target_value' in value) ||
      !('target_unit' in value) ||
      !('start_date' in value) ||
      !('is_active' in value)
    ) {
      throw new Error('Habit endpoint returned an unexpected record.');
    }
    const b = value as Record<string, unknown>;
    if (
      typeof b.name !== 'string' ||
      b.frequency !== 'DAILY' ||
      typeof b.target_value !== 'number' ||
      !['MINUTES', 'COUNT', 'BOOL'].includes(String(b.target_unit)) ||
      typeof b.start_date !== 'string' ||
      typeof b.is_active !== 'boolean'
    ) {
      throw new Error('Habit endpoint returned fields that do not match the supported habit schema.');
    }
    return {
      id: String(b.id),
      name: b.name,
      isCompletedToday: false,
      createdDate: b.start_date,
      frequency: 'DAILY',
      targetValue: b.target_value,
      targetUnit: b.target_unit as Habit['targetUnit'],
      isActive: b.is_active,
    };
  }

  private mapBackendExpense(value: unknown): Expense {
    if (!value || typeof value !== 'object' || !('id' in value) || !('amount' in value) || !('date' in value) || !('category' in value)) {
      throw new Error('Expense endpoint returned an unexpected record.');
    }
    const b = value as Record<string, unknown>;
    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || typeof b.date !== 'string' || typeof b.category !== 'string') {
      throw new Error('Expense endpoint returned fields that do not match the supported expense schema.');
    }
    return {
      id: String(b.id),
      amount,
      category: b.category,
      date: b.date,
      merchant: typeof b.merchant === 'string' ? b.merchant : '',
      note: typeof b.note === 'string' ? b.note : '',
      created_at: typeof b.created_at === 'string' ? b.created_at : undefined,
      updated_at: typeof b.updated_at === 'string' ? b.updated_at : undefined,
    };
  }
}

export const api = new ApiClient();
