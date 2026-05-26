import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BackendConfig } from '../types';
import { Alert, PageHeader, Panel, SectionHeader } from './ui';

export default function SettingsView() {
  const [config, setConfig] = useState<BackendConfig>({ baseUrl: 'http://127.0.0.1:8000' });
  const [status, setStatus] = useState<'idle' | 'success' | 'checking' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeExplainTab, setActiveExplainTab] = useState<'filter' | 'percentages' | 'growth'>('filter');

  useEffect(() => {
    setConfig(api.getConfig());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    api.saveConfig(config);
    
    setStatus('checking');
    setStatusMessage('Pinging Django backend... (Checking CORS and endpoint availability)');
    try {
      const res = await fetch(`${config.baseUrl}/api/accounts/login/`, { method: 'OPTIONS' });
      if (res && res.ok) {
        setStatus('success');
        setStatusMessage(`Connection established successfully with Django backend at ${config.baseUrl}!`);
      } else {
        throw new Error('Connection failed');
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage(`Could not resolve API server at "${config.baseUrl}". Check if Python Django server is running locally on port 8000 and has django-cors-headers allowed.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Configuration Header */}
      <PageHeader
        title="Settings"
        subtitle="Configure the API connection and review backend behavior."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Setup Form Card */}
        <Panel padding="lg" className="lg:col-span-2 space-y-6">
          <SectionHeader
            title="API endpoint"
            description="Backend URL for habits and expenses."
          />

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2 pt-2 animate-fadeIn">
              <label className="label block">Django base API URL</label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="e.g. http://localhost:8000 or http://127.0.0.1:8000"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  className="input-field font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Make sure your server is running and has CORS configured. Recommended `settings.py` value:
                <code className="bg-surface-variant text-text-primary px-1 py-0.5 rounded ml-1 font-mono text-[9px]">CORS_ALLOW_ALL_ORIGINS = True</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full btn-primary"
            >
              Verify & apply
            </button>
          </form>

          {/* Connection status result */}
          {status !== 'idle' && (
            <Alert
              variant={status === 'error' ? 'error' : status === 'success' ? 'success' : 'warning'}
              className={`flex gap-3 leading-relaxed ${
                status === 'checking' ? '!bg-surface-container-high !text-text-secondary' : ''
              }`}
            >
              <div className="pt-0.5 font-bold">
                {status === 'checking' && '⚡'}
                {status === 'success' && '✅'}
                {status === 'error' && '❌'}
              </div>
              <div>
                <p className="font-semibold capitalize text-[10px] uppercase tracking-wider">
                  System Diagnostic: {status}
                </p>
                <p className="text-[11px] mt-0.5">{statusMessage}</p>
              </div>
            </Alert>
          )}
        </Panel>

        <Panel padding="lg" className="space-y-4">
          <SectionHeader title="JWT authentication" />
          <div className="text-[11px] text-text-secondary space-y-3 leading-relaxed">
            <p>
              Your custom Django setup utilizes clean <strong>JSON Web Token (JWT) Exchange logic</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-2 text-text-muted">
              <li>
                <strong>Access Tokens:</strong> Expire every <span className="text-text-primary font-semibold">30 mins</span> for defensive API querying security.
              </li>
              <li>
                <strong>Refresh Tokens:</strong> Expire in <span className="text-text-primary font-semibold">7 days</span> to rotate access levels dynamically.
              </li>
              <li>
                <strong>Auto Refresh:</strong> The frontend automatically captures standard <code>401 Unauthorized</code> response headers, initiates token rotation, and retries transactions behind the scenes.
              </li>
            </ul>
          </div>
        </Panel>
      </div>

      <Panel padding="lg" className="space-y-6">
        <SectionHeader
          title="Backend logic reference"
          description="How your Django filters and analytics endpoints work."
        />

        {/* Tab switchers and explanations */}
        <div className="flex flex-wrap gap-2 pb-3 divider">
          {[
            { id: 'filter', label: '1. Expense Filters (DjangoFilterBackend)' },
            { id: 'percentages', label: '2. Coalesce Category Percentages' },
            { id: 'growth', label: '3. 12-Month Spending History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveExplainTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeExplainTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'text-text-secondary hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Explanations layout */}
        <div className="text-sm text-text-secondary space-y-4 leading-relaxed panel-elevated p-5">
          {activeExplainTab === 'filter' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <span>🔍</span>
                <span>Case-Insensitive & Range Search Queries</span>
              </div>
              <p>
                In your <code>ExpenseFilter(django_filters.FilterSet)</code>, you configured a dynamic search helper. Here is what your rules compile to in raw SQL query syntax:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-text-muted font-sans">
                <li>
                  <strong className="text-text-primary">category (iexact):</strong> Matches categories regardless of lowercase/uppercase styling. e.g., querying <code>?category=food & drink</code> will fetch all items saved under "Food & Drink".
                </li>
                <li>
                  <strong className="text-text-primary">date_from (gte) & date_to (lte):</strong> Filters dates using <i>Greater Than or Equal to</i> and <i>Less Than or Equal to</i>. E.g., querying <code>?date_from=2026-05-01&date_to=2026-05-20</code> selects transactions logged ONLY within this month range.
                </li>
                <li>
                  <strong className="text-text-primary">min_amount & max_amount:</strong> Restricts records to a price window (using amount <code>gte</code> and <code>lte</code> validators).
                </li>
              </ul>
              <div className="pt-2 panel-elevated text-text-primary p-3 rounded-md font-mono text-xs">
                <span className="text-text-muted"># Python Backend API Call Example:</span><br />
                GET {config.baseUrl}/api/expenses/?category=Food%20&%20Drink&date_from=2026-05-01&min_amount=15.00
              </div>
            </div>
          )}

          {activeExplainTab === 'percentages' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <span>📊</span>
                <span>Coalesced Category Percentages</span>
              </div>
              <p>
                In <code>get_category_breakdown_with_percentage</code>, you group your individual transaction logs by they category and output comparative percentages. Here is the exact logic layer:
              </p>
              <p className="text-text-muted">
                1. <strong>Coalesce(Sum("amount"), Decimal("0.00"))</strong> keeps you from crashing if no logs exist. It substitutes SQL <code>NULL</code> outputs with a clean <code>0.00</code>.
              </p>
              <p className="text-text-muted">
                2. <strong>.values("category")</strong> groups the SQL ledger by unique category keys, annotating each group with its custom sum.
              </p>
              <p className="text-text-muted">
                3. The <strong>Percentage Calculation</strong> loop ensures you never do a "division by zero" error. If total monthly spend exceeds 0, it divides the category's total by the overall spent decimal, multiplies by 100, and rounds cleanly to 2 decimal places.
              </p>
            </div>
          )}

          {activeExplainTab === 'growth' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <span>📈</span>
                <span>12-Month Temporal Spending Trends</span>
              </div>
              <p>
                In your monthly history builder (<code>get_monthly_spending_history</code>), you compute the user spent trend over the past calendar year. Here is your algorithm step-by-step:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-text-muted">
                <li>
                  First, it calculates exactly 12 month-start dates (from current month back to 11 months ago) using a simple offset iterator.
                </li>
                <li>
                  Then, it uses Django's <code>TruncMonth("date")</code> DB function to group all database rows under their respective first-of-the-month day.
                </li>
                <li>
                  It generates a dictionary mapping monthly start dates to spending totals.
                </li>
                <li>
                  Finally, it loops over your calculated calendar list to output a full list. If a month has no entries, it safely sets <code>0.00</code> instead of skipping it, keeping your charts continuous!
                </li>
              </ul>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
