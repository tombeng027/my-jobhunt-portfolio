import { useMemo, useState } from 'react'

const tabs = [
  { id: 'rules', label: 'Identity & Rules Engine', note: 'State-specific calculator logic' },
  { id: 'sync', label: 'Idempotent Sync Lab', note: 'Dirty legacy payload protection' },
  { id: 'approval', label: 'Role-Based Approval', note: 'Authority-based controls' },
  { id: 'audit', label: 'Audit Log', note: 'Traceable event history' },
]

const ruleDefinitions = {
  CA: {
    stateName: 'California',
    taxRate: 0.0725,
    riders: {
      standard: { multiplier: 1, surcharge: 120, fee: 18 },
      premium: { multiplier: 1.12, surcharge: 260, fee: 25 },
      catastrophe: { multiplier: 1.26, surcharge: 420, fee: 32 },
    },
  },
  NY: {
    stateName: 'New York',
    taxRate: 0.041,
    riders: {
      standard: { multiplier: 1, surcharge: 140, fee: 22 },
      premium: { multiplier: 1.08, surcharge: 290, fee: 28 },
      catastrophe: { multiplier: 1.22, surcharge: 470, fee: 36 },
    },
  },
}

const riderLabels = {
  standard: 'Standard rider',
  premium: 'Premium rider',
  catastrophe: 'Catastrophe rider',
}

const baseClaimAmount = 8200

const pristineLegacyPayload = {
  claimId: 'CLM-2026-01482',
  source: 'Legacy carrier gateway',
  claimant: {
    firstName: 'Darren',
    lastName: 'Cole',
    phone: '214-555-0199',
  },
  loss: {
    reportedAt: '2026-03-22T08:14:00Z',
    amount: 50000,
    state: 'TX',
  },
  payment: {
    bankAccountLast4: '4421',
    routingLast4: '1100',
  },
}

const fieldRemovalOptions = [
  { path: 'claimant.phone', label: 'Claimant phone' },
  { path: 'payment.bankAccountLast4', label: 'Bank account last 4' },
  { path: 'payment.routingLast4', label: 'Routing last 4' },
]

const recordBeforeSync = {
  claimId: 'CLM-2026-01482',
  claimant: {
    firstName: 'Darren',
    lastName: 'Cole',
    phone: '214-555-0199',
  },
  loss: {
    reportedAt: '2026-03-21T16:09:00Z',
    amount: 50000,
    state: 'TX',
  },
  payment: {
    bankAccountLast4: '4421',
    routingLast4: '1100',
  },
}

const initialAuditEntries = [
  {
    id: 1,
    time: '08:12',
    actor: 'FNOL intake service',
    title: 'Claim created from API intake',
    detail: 'Carrier payload normalized and queued for verification.',
    tone: 'neutral',
  },
  {
    id: 2,
    time: '08:14',
    actor: 'Sync guardrail',
    title: 'Incomplete payload detected',
    detail: 'Protected fields are preserved until the carrier sends a complete record.',
    tone: 'warn',
  },
  {
    id: 3,
    time: '08:18',
    actor: 'Rules engine',
    title: 'Threshold escalation triggered',
    detail: 'Claim exceeds the $5,000 staff approval ceiling.',
    tone: 'neutral',
  },
]

const approvalClaim = {
  claimId: 'CLM-2026-01482',
  policyholder: 'Darren Cole',
  amount: 50000,
  threshold: 5000,
  severity: 'High payout variance',
  flags: ['Threshold breach', 'Out-of-pattern reserve jump', 'Manual override required'],
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getPathValue(source, path) {
  return path.split('.').reduce((current, key) => current?.[key], source)
}

function removePathValue(source, path) {
  const next = structuredClone(source)
  const segments = path.split('.')
  const lastKey = segments.at(-1)
  const parent = segments.slice(0, -1).reduce((current, key) => current?.[key], next)
  if (parent && lastKey) {
    parent[lastKey] = null
  }
  return next
}

function JsonLine({ indent = 0, children, highlight = false, muted = false, sticky = false }) {
  return (
    <div
      className={[
        'json-line',
        highlight ? 'is-highlighted' : '',
        muted ? 'is-muted' : '',
        sticky ? 'is-sticky' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ paddingLeft: `${indent * 18}px` }}
    >
      {children}
    </div>
  )
}

function renderJsonRows(value, path = '', depth = 0, highlights = new Set(), syncTriggered = false, stickyHighlights = new Set()) {
  if (value === null) {
    return [
      <JsonLine
        key={`${path}-null`}
        indent={depth}
        highlight={syncTriggered && highlights.has(path)}
        sticky={syncTriggered && stickyHighlights.has(path)}
      >
        <span className="json-key">{path.split('.').at(-1)}</span>
        <span className="json-punct">: </span>
        <span className="json-null">null</span>
      </JsonLine>,
    ]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      renderJsonRows(item, `${path}[${index}]`, depth + 1, highlights, syncTriggered, stickyHighlights),
    )
  }

  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nested]) => {
      const nextPath = path ? `${path}.${key}` : key
      if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
        return [
          <JsonLine key={`${nextPath}-open`} indent={depth}>
            <span className="json-key">{key}</span>
            <span className="json-punct">: {'{'}</span>
          </JsonLine>,
          ...renderJsonRows(nested, nextPath, depth + 1, highlights, syncTriggered, stickyHighlights),
          <JsonLine key={`${nextPath}-close`} indent={depth}>
            <span className="json-punct">{'}'}</span>
          </JsonLine>,
        ]
      }

      const isMissing = syncTriggered && highlights.has(nextPath)
      const isSticky = syncTriggered && stickyHighlights.has(nextPath)
      const displayValue = typeof nested === 'string' ? `"${nested}"` : String(nested)

      return [
        <JsonLine key={nextPath} indent={depth} highlight={isMissing} muted={syncTriggered && !isMissing && nested !== null} sticky={isSticky}>
          <span className="json-key">{key}</span>
          <span className="json-punct">: </span>
          <span className={nested === null ? 'json-null' : 'json-value'}>{displayValue}</span>
        </JsonLine>,
      ]
    })
  }

  return []
}

function buildRulesPreview(stateCode, riderType) {
  const stateRules = ruleDefinitions[stateCode]
  const riderRules = stateRules.riders[riderType]

  return {
    state: stateCode,
    rider: riderType,
    formulaVersion: `rules-${stateCode.toLowerCase()}-2026.03`,
    formula: {
      baseAmount: baseClaimAmount,
      multiplier: riderRules.multiplier,
      surcharge: riderRules.surcharge,
      filingFee: riderRules.fee,
      taxRate: stateRules.taxRate,
      totalExpression: '((baseAmount * multiplier) + surcharge + filingFee) * (1 + taxRate)',
    },
    editableBy: ['Operations analyst', 'Product owner'],
    redeployRequired: false,
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('rules')
  const [viewRole, setViewRole] = useState('staff')
  const [syncTriggered, setSyncTriggered] = useState(false)
  const [overrideReason, setOverrideReason] = useState('Large-loss payout confirmed after manager review and reserve verification.')
  const [auditEntries, setAuditEntries] = useState(initialAuditEntries)
  const [approvalState, setApprovalState] = useState('pending')
  const [selectedState, setSelectedState] = useState('CA')
  const [selectedRider, setSelectedRider] = useState('premium')
  const [removedFields, setRemovedFields] = useState(['claimant.phone', 'payment.bankAccountLast4'])

  const previewRules = useMemo(() => buildRulesPreview(selectedState, selectedRider), [selectedRider, selectedState])
  const stateRules = ruleDefinitions[selectedState]
  const selectedRiderRules = stateRules.riders[selectedRider]
  const subtotal = baseClaimAmount * selectedRiderRules.multiplier + selectedRiderRules.surcharge + selectedRiderRules.fee
  const calculatedTotal = subtotal * (1 + stateRules.taxRate)

  const incomingPayload = useMemo(() => {
    return removedFields.reduce((payload, path) => removePathValue(payload, path), pristineLegacyPayload)
  }, [removedFields])

  const missingPaths = useMemo(() => {
    return fieldRemovalOptions
      .map((option) => option.path)
      .filter((path) => getPathValue(incomingPayload, path) === null)
  }, [incomingPayload])

  const protectedFieldCount = missingPaths.length
  const highlightSet = useMemo(() => new Set(missingPaths), [missingPaths])
  const stickySet = useMemo(() => new Set(missingPaths), [missingPaths])

  const syncStatus = syncTriggered
    ? `Sync blocked. ${protectedFieldCount} sticky field${protectedFieldCount === 1 ? '' : 's'} stayed protected.`
    : 'Choose which legacy fields to remove, then process the payload to show the guardrail.'

  function handleFieldToggle(path) {
    setSyncTriggered(false)
    setRemovedFields((current) =>
      current.includes(path) ? current.filter((item) => item !== path) : [...current, path],
    )
  }

  function handleSimulateSync() {
    setSyncTriggered(true)
    setActiveTab('sync')
    setAuditEntries((current) => {
      const eventId = 400 + missingPaths.length
      const existing = current.find((entry) => entry.id === eventId)
      if (existing) return current
      return [
        {
          id: eventId,
          time: '08:19',
          actor: 'Sync simulator',
          title:
            missingPaths.length > 0
              ? `Overwrite blocked on ${missingPaths.length} sticky field${missingPaths.length === 1 ? '' : 's'}`
              : 'Payload accepted without protected-field conflicts',
          detail:
            missingPaths.length > 0
              ? `The upstream record arrived with missing values for ${missingPaths.join(', ')}, so the system preserved trusted database data.`
              : 'All protected fields were present, so the sync could safely proceed.',
          tone: missingPaths.length > 0 ? 'danger' : 'success',
        },
        ...current,
      ]
    })
  }

  function handleApproveClaim() {
    if (viewRole !== 'manager' || !overrideReason.trim()) return
    setApprovalState('approved')
    setActiveTab('audit')
    setAuditEntries((current) => {
      if (current.some((entry) => entry.id === 5)) return current
      return [
        {
          id: 5,
          time: '08:26',
          actor: 'Claims manager',
          title: 'Risk override approved',
          detail: overrideReason.trim(),
          tone: 'success',
        },
        ...current,
      ]
    })
  }

  const tabBody = {
    rules: (
      <section className="scenario-grid">
        <div className="scenario-panel scenario-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Sprint 1</p>
              <h2>Identity & Rules Engine</h2>
            </div>
            <span className="audit-pill">Config-backed logic</span>
          </div>
          <p className="panel-copy">
            This demo shows how state-specific calculation rules can live in configuration instead of hard-coded branches. When the user
            changes the state or rider, the active formula preview changes immediately, which is the case-study proof that non-dev teams
            can update rates without waiting for a redeploy.
          </p>

          <div className="rules-layout">
            <article className="rules-calculator">
              <div className="control-grid">
                <label className="select-field">
                  <span>State</span>
                  <select value={selectedState} onChange={(event) => setSelectedState(event.target.value)}>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                  </select>
                </label>

                <label className="select-field">
                  <span>Rider type</span>
                  <select value={selectedRider} onChange={(event) => setSelectedRider(event.target.value)}>
                    <option value="standard">Standard rider</option>
                    <option value="premium">Premium rider</option>
                    <option value="catastrophe">Catastrophe rider</option>
                  </select>
                </label>
              </div>

              <div className="calculation-card">
                <p>Quoted claim amount</p>
                <strong>{formatCurrency(calculatedTotal)}</strong>
                <span>
                  Base {formatCurrency(baseClaimAmount)} x {selectedRiderRules.multiplier} + surcharge {formatCurrency(selectedRiderRules.surcharge)} +
                  fee {formatCurrency(selectedRiderRules.fee)} + {Math.round(stateRules.taxRate * 1000) / 10}% state tax.
                </span>
              </div>
            </article>

            <article className="rules-preview-card">
              <div className="json-card-head">
                <span>Rules preview</span>
                <span>{stateRules.stateName}</span>
              </div>
              <div className="json-body rules-body">
                {renderJsonRows(previewRules, '', 0, new Set(), false, new Set())}
              </div>
            </article>
          </div>
        </div>

        <aside className="scenario-sidebar">
          <article className="metric-card">
            <p>Case study angle</p>
            <strong>Logic decoupled from code</strong>
            <span>Rates and rider math can be changed by ops or product owners without shipping app code.</span>
          </article>
          <article className="metric-card">
            <p>Current state</p>
            <strong>{stateRules.stateName}</strong>
            <span>{riderLabels[selectedRider]} rule set is active in the preview panel.</span>
          </article>
          <article className="metric-card">
            <p>Business benefit</p>
            <strong>No redeploy required</strong>
            <span>That is the exact organizational payoff recruiters should notice.</span>
          </article>
        </aside>
      </section>
    ),
    sync: (
      <section className="scenario-grid">
        <div className="scenario-panel scenario-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Sprint 2</p>
              <h2>Idempotent Sync Lab</h2>
            </div>
            <button className="primary-action" type="button" onClick={handleSimulateSync}>
              {syncTriggered ? 'Sync Processed' : 'Process Sync'}
            </button>
          </div>
          <p className="panel-copy">
            This lab emulates a dirty legacy payload. You can remove critical fields from the left-side source payload, then process the
            sync to show how sticky fields glow and remain protected in system state instead of being wiped out by unreliable upstream data.
          </p>

          <div className="field-toggle-row">
            {fieldRemovalOptions.map((option) => {
              const active = removedFields.includes(option.path)
              return (
                <button
                  key={option.path}
                  type="button"
                  className={active ? 'field-chip is-active' : 'field-chip'}
                  onClick={() => handleFieldToggle(option.path)}
                >
                  {active ? `Missing: ${option.label}` : `Keep: ${option.label}`}
                </button>
              )
            })}
          </div>

          <div className="status-banner">
            <span className="status-dot" />
            <strong>{syncTriggered ? 'Idempotent guardrail active' : 'Configure the legacy payload'}</strong>
            <span>{syncStatus}</span>
          </div>

          <div className="json-grid">
            <article className="json-card">
              <div className="json-card-head">
                <span>Legacy system payload</span>
                <span>Fields can disappear</span>
              </div>
              <div className="json-body">{renderJsonRows(incomingPayload, '', 0, highlightSet, syncTriggered, new Set())}</div>
            </article>

            <article className="json-card">
              <div className="json-card-head">
                <span>System state</span>
                <span>Sticky fields preserved</span>
              </div>
              <div className="json-body">{renderJsonRows(recordBeforeSync, '', 0, new Set(), false, syncTriggered ? stickySet : new Set())}</div>
            </article>
          </div>
        </div>

        <aside className="scenario-sidebar">
          <article className="metric-card">
            <p>Sticky fields</p>
            <strong>{protectedFieldCount}</strong>
            <span>Protected values glow when the source system tries to erase them.</span>
          </article>
          <article className="metric-card">
            <p>Case study angle</p>
            <strong>Maintain data integrity</strong>
            <span>Even when the source system is unreliable, the sync remains safe and repeatable.</span>
          </article>
          <article className="metric-card">
            <p>Why idempotent matters</p>
            <strong>Repeat runs stay stable</strong>
            <span>The same broken payload cannot gradually degrade trusted production records.</span>
          </article>
        </aside>
      </section>
    ),
    approval: (
      <section className="scenario-grid">
        <div className="scenario-panel scenario-panel-wide">
          <div className="panel-heading role-heading">
            <div>
              <p className="panel-kicker">Scenario 03</p>
              <h2>Threshold Logic: Staff vs Manager</h2>
            </div>
            <div className="role-toggle" aria-label="Toggle claim approval role">
              <button type="button" className={viewRole === 'staff' ? 'is-active' : ''} onClick={() => setViewRole('staff')}>
                View as Staff
              </button>
              <button type="button" className={viewRole === 'manager' ? 'is-active' : ''} onClick={() => setViewRole('manager')}>
                View as Manager
              </button>
            </div>
          </div>

          <div className="claim-shell">
            <div className="claim-summary">
              <span className="claim-chip">{approvalClaim.claimId}</span>
              <h3>{approvalClaim.policyholder}</h3>
              <p>
                Claim amount <strong>{formatCurrency(approvalClaim.amount)}</strong> exceeds the staff approval ceiling of{' '}
                <strong>{formatCurrency(approvalClaim.threshold)}</strong>.
              </p>
              <div className="flag-row">
                {approvalClaim.flags.map((flag) => (
                  <span key={flag} className="flag-chip">
                    {flag}
                  </span>
                ))}
              </div>
            </div>

            <div className="approval-card">
              <p className="approval-label">Approval control</p>
              <button
                type="button"
                className="approve-button"
                disabled={viewRole === 'staff'}
                title={viewRole === 'staff' ? 'Requires Manager Approval (Threshold: $5,000).' : 'Manager override available.'}
                onClick={handleApproveClaim}
              >
                {approvalState === 'approved' ? 'Claim Approved' : 'Approve Claim'}
              </button>
              {viewRole === 'staff' ? (
                <p className="tooltip-copy">Requires Manager Approval (Threshold: $5,000).</p>
              ) : (
                <label className="override-field">
                  <span>Risk override reason</span>
                  <textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} rows={4} />
                </label>
              )}
            </div>
          </div>
        </div>

        <aside className="scenario-sidebar">
          <article className="metric-card">
            <p>Current role</p>
            <strong>{viewRole === 'staff' ? 'Staff adjuster' : 'Claims manager'}</strong>
            <span>{viewRole === 'staff' ? 'Approval disabled above threshold.' : 'Override field enabled for accountable decisions.'}</span>
          </article>
          <article className="metric-card">
            <p>Rule in plain English</p>
            <strong>$5,000 ceiling</strong>
            <span>Same claim, different interface state depending on authority level.</span>
          </article>
          <article className="metric-card">
            <p>Why it matters</p>
            <strong>Governance by design</strong>
            <span>The UI makes unsafe approval impossible for the wrong role.</span>
          </article>
        </aside>
      </section>
    ),
    audit: (
      <section className="scenario-grid audit-layout">
        <div className="scenario-panel scenario-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Scenario 04</p>
              <h2>Audit Log Visualization</h2>
            </div>
            <span className="audit-pill">Immutable trail</span>
          </div>
          <p className="panel-copy">
            Every protected sync decision and approval event is rendered into a timeline so reviewers can understand what happened, who
            acted, and why the system allowed or blocked the step.
          </p>

          <div className="audit-list">
            {auditEntries.map((entry) => (
              <article key={entry.id} className={`audit-entry tone-${entry.tone}`}>
                <div className="audit-time">{entry.time}</div>
                <div className="audit-content">
                  <p className="audit-actor">{entry.actor}</p>
                  <h3>{entry.title}</h3>
                  <p>{entry.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="scenario-sidebar">
          <article className="metric-card">
            <p>Observed events</p>
            <strong>{auditEntries.length}</strong>
            <span>Interactive tabs feed the same audit narrative instead of separate screenshots.</span>
          </article>
          <article className="metric-card">
            <p>Best evidence</p>
            <strong>Action + reason + timestamp</strong>
            <span>Shows how logic, controls, and human decisions fit together.</span>
          </article>
        </aside>
      </section>
    ),
  }

  return (
    <div className="prototype-page">
      <header className="hero-shell">
        <div>
          <p className="eyebrow">Case Study Prototype • Frontend-only walkthrough</p>
          <h1>Claims Decisioning Showcase</h1>
          <p className="hero-copy">
            A recruiter-friendly prototype of the exact product logic I would demo in an insurtech admin platform: config-driven rules,
            idempotent sync guardrails, threshold approvals, and audit visibility. No backend theater, just the workflow decisions that mattered.
          </p>
        </div>
        <div className="hero-actions">
          <a className="back-link" href="./case-studies.html">
            Back to Case Studies
          </a>
          <div className="hero-stats">
            <div>
              <span>Scenario tabs</span>
              <strong>4</strong>
            </div>
            <div>
              <span>Focus</span>
              <strong>Logic over backend</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="dashboard-shell">
        <aside className="dashboard-nav" aria-label="Scenario tabs">
          <p className="nav-label">Prototype flow</p>
          {tabs.map((tab, index) => (
            <button key={tab.id} type="button" className={activeTab === tab.id ? 'tab-link is-active' : 'tab-link'} onClick={() => setActiveTab(tab.id)}>
              <span className="tab-index">0{index + 1}</span>
              <span>
                <strong>{tab.label}</strong>
                <small>{tab.note}</small>
              </span>
            </button>
          ))}
        </aside>

        <main className="dashboard-content">{tabBody[activeTab]}</main>
      </section>
    </div>
  )
}

export default App