import { Habit, Expense, HabitCategory, ExpenseCategory, AuthState, BackendConfig } from '../types';

// State keys
const CONFIG_KEY = 'quantum_backend_config';
const AUTH_KEY = 'quantum_auth_state';

const DEFAULT_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://trackwise-production-cfc2.up.railway.app';

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
      if (response.status === 401 && this.auth.refreshToken && !path.includes('/accounts/refresh/')) {
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

    this.saveAuth({
      isAuthenticated: true,
      user: { email: payload.email, firstName: '', lastName: '' },
      accessToken: data.access,
      refreshToken: data.refresh,
    });

    let profile: any = {};
    try {
      profile = await this.request('/api/accounts/profile/');
    } catch {
      profile = {};
    }

    const userObj = {
      email: profile.email || payload.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
    };

    this.saveAuth({
      isAuthenticated: true,
      user: userObj,
      accessToken: data.access,
      refreshToken: data.refresh,
    });

    return userObj;
  }

  // --- HABIT API CRUD ---
  public async getHabits(): Promise<Habit[]> {
    const data = await this.request('/api/habits/');
    let todayHabits: any[] = [];
    try {
      const todayPayload = await this.request('/api/habits/today/');
      todayHabits = todayPayload?.habits || [];
    } catch {
      todayHabits = [];
    }

    const todayById = new Map<string, boolean>();
    for (const h of todayHabits) {
      const target = h.target_value ?? 1;
      const completed = (h.logs || []).some((log: any) => log.value >= target);
      todayById.set(String(h.id), completed);
    }

    return Promise.all(
      data.map(async (h: any) => {
        const mapped = this.mapBackendHabit(h);
        if (todayById.has(mapped.id)) {
          mapped.isCompletedToday = todayById.get(mapped.id) ?? false;
        }

        try {
          const streak = await this.getHabitStreak(mapped.id);
          mapped.streak = streak.current_streak ?? 0;
          if (streak.today_status === 'completed') mapped.isCompletedToday = true;
          if (streak.today_status === 'pending') mapped.isCompletedToday = false;
        } catch {
          // Keep today-endpoint derived status when streak lookup fails.
        }

        try {
          const stats = await this.getHabitStats(mapped.id);
          mapped.completionRate = Math.round(stats.completion_rate ?? 0);
          mapped.history7d = (stats.last_7_days_status || []).map(
            (day: { completed: boolean }) => day.completed === true
          );
        } catch {
          // Stats are optional for list rendering.
        }

        return mapped;
      })
    );
  }

  public async createHabit(habit: Omit<Habit, 'id' | 'streak' | 'history7d' | 'completionRate' | 'history'>): Promise<Habit> {
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

  public async getHabitStreak(id: string): Promise<any> {
    return await this.request(`/api/habits/${id}/streak/`);
  }

  public async getHabitStats(id: string): Promise<any> {
    return await this.request(`/api/habits/${id}/stats/`);
  }

  public async getHabitDashboardSummary(): Promise<any> {
    const response = await this.request('/api/habits/dashboard/summary/');
    return {
      ...response,
      today_summary: response?.today || response?.today_summary,
      trend: Array.isArray(response?.trend)
        ? response.trend
        : response?.trend?.last_7_days || [],
    };
  }

  // --- EXPENSE API CRUD ---
  public async getExpenses(filters?: {
    category?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
  }): Promise<Expense[]> {
    let url = '/api/expenses/';
    const params = new URLSearchParams();
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.min_amount !== undefined) params.append('min_amount', String(filters.min_amount));
      if (filters.max_amount !== undefined) params.append('max_amount', String(filters.max_amount));
    }
    const qStr = params.toString();
    if (qStr) url += `?${qStr}`;

    const data = await this.request(url);
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

  public async getExpenseDashboardStats(): Promise<any> {
    const response = await this.request('/api/expenses/stats/dashboard/');
    return {
      ...response,
      last_7_days: response?.last_7_days || response?.last_7_days_spending || [],
      month_change:
        typeof response?.month_change === 'object'
          ? response.month_change?.percentage_change ?? 0
          : response?.month_change ?? 0,
      top_category_this_month:
        typeof response?.top_category_this_month === 'object'
          ? response.top_category_this_month?.category || 'None'
          : response.top_category_this_month || 'None',
      monthly_spending_history: response?.monthly_spending_history || [],
    };
  }

  public async getExpenseAnalytics(): Promise<any> {
    return await this.request('/api/expenses/stats/analytics/');
  }

  // --- COMBINED SUMMARY ENDPOINT ---
  public async getCombinedDashboardSummary(): Promise<any> {
    const response = await this.request('/api/dashboard/summary/');
    const habitStats = response.habit_stats ?? response.habits;
    const expenseStats = this.normalizeExpenseStats(
      response.expense_stats ?? response.expenses
    );
    return {
      habit_stats: habitStats,
      expense_stats: expenseStats,
      habits: habitStats,
      expenses: expenseStats,
    };
  }

  private normalizeExpenseStats(response: any): any {
    if (!response) return {};
    return {
      ...response,
      last_7_days: response.last_7_days || response.last_7_days_spending || [],
      month_change:
        typeof response.month_change === 'object'
          ? response.month_change?.percentage_change ?? 0
          : response.month_change ?? 0,
      top_category_this_month:
        typeof response.top_category_this_month === 'object'
          ? response.top_category_this_month?.category || 'None'
          : response.top_category_this_month || 'None',
      monthly_spending_history: response.monthly_spending_history || [],
    };
  }

  // --- MODEL MAPPER HELPERS ---
  private mapBackendHabit(b: any): Habit {
    return {
      id: String(b.id),
      name: b.name,
      category: this.mapCategory(b.category) as HabitCategory,
      streak: 0, // Calculated dynamically by the streak endpoint
      history7d: [false, false, false, false, false, false, false],
      completionRate: 0,
      isCompletedToday: false,
      history: {},
      createdDate: b.start_date || b.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      targetValue: b.target_value,
      targetUnit: b.target_unit,
    };
  }

  private mapBackendExpense(b: any): Expense {
    return {
      id: String(b.id),
      amount: parseFloat(b.amount),
      category: b.category as ExpenseCategory,
      date: b.date,
      merchant: b.merchant || '',
      note: b.note || '',
      created_at: b.created_at,
      updated_at: b.updated_at,
    };
  }

  private mapCategory(cat?: string): string {
    if (!cat) return 'Health';
  
    const map: Record<string, string> = {
      HEALTH: 'Health',
      PRODUCTIVITY: 'Productivity',
      FINANCE: 'Finance',
      EDUCATION: 'Education',
    };
  
    return map[cat.toUpperCase()] || 'Health';
  }
}

export const api = new ApiClient();
