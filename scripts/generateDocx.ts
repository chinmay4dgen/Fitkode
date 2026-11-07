import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function makeDocHeader(title: string, subtitle: string, meta: string): string {
  return `
    <w:p>
      <w:pPr>
        <w:pBdr><w:bottom w:val="single" w:sz="18" w:space="12" w:color="10B981"/></w:pBdr>
        <w:spacing w:before="120" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="1E1B4B"/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="60" w:after="160"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="059669"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t>${escapeXml(subtitle)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:shd w:val="clear" w:color="auto" w:fill="F3F4F6"/>
        <w:spacing w:before="100" w:after="240"/>
        <w:ind w:left="180" w:right="180"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:color w:val="4B5563"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr>
        <w:t>${escapeXml(meta)}</w:t>
      </w:r>
    </w:p>`;
}

function makeH1(text: string): string {
  return `
    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
        <w:pBdr><w:bottom w:val="single" w:sz="8" w:space="6" w:color="4F46E5"/></w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="311042"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

function makeH2(text: string): string {
  return `
    <w:p>
      <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="065F46"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

function makePara(text: string, boldPrefix = ''): string {
  return `
    <w:p>
      <w:pPr><w:spacing w:before="60" w:after="100"/></w:pPr>
      ${boldPrefix ? `<w:r><w:rPr><w:b/><w:color w:val="111827"/><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">${escapeXml(boldPrefix)} </w:t></w:r>` : ''}
      <w:r>
        <w:rPr><w:color w:val="1F2937"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

function makeCallout(title: string, text: string, borderColor = 'F59E0B', bgColor = 'FFFBEB'): string {
  return `
    <w:p>
      <w:pPr>
        <w:pBdr><w:left w:val="single" w:sz="24" w:space="12" w:color="${borderColor}"/></w:pBdr>
        <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
        <w:spacing w:before="120" w:after="120"/>
        <w:ind w:left="240" w:right="180"/>
      </w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="92400E"/><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">${escapeXml(title)}: </w:t></w:r>
      <w:r><w:rPr><w:color w:val="1F2937"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
    </w:p>`;
}

function makeBullet(boldPrefix: string, text: string): string {
  return `
    <w:p>
      <w:pPr>
        <w:ind w:left="360" w:hanging="240"/>
        <w:spacing w:before="40" w:after="70"/>
      </w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="4338CA"/><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">• ${escapeXml(boldPrefix)} </w:t></w:r>
      <w:r><w:rPr><w:color w:val="1F2937"/><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
    </w:p>`;
}

function makeTable(headers: string[], rows: string[][], colWidths: number[] = []): string {
  const headerCells = headers.map((h, i) => {
    const wAttr = colWidths[i] ? `<w:tcW w:w="${colWidths[i]}" w:type="dxa"/>` : '';
    return `
      <w:tc>
        <w:tcPr>
          ${wAttr}
          <w:shd w:val="clear" w:color="auto" w:fill="1E1B4B"/>
          <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar>
        </w:tcPr>
        <w:p>
          <w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(h)}</w:t></w:r>
        </w:p>
      </w:tc>`;
  }).join('');

  const bodyRows = rows.map((row, rIdx) => {
    const fill = rIdx % 2 === 0 ? 'FFFFFF' : 'F9FAFB';
    const cells = row.map((cell, cIdx) => {
      const wAttr = colWidths[cIdx] ? `<w:tcW w:w="${colWidths[cIdx]}" w:type="dxa"/>` : '';
      return `
        <w:tc>
          <w:tcPr>
            ${wAttr}
            <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
            <w:tcMar><w:top w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar>
          </w:tcPr>
          <w:p>
            <w:r><w:rPr>${cIdx === 0 ? '<w:b/>' : ''}<w:color w:val="1F2937"/><w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">${escapeXml(cell)}</w:t></w:r>
          </w:p>
        </w:tc>`;
    }).join('');
    return `<w:tr>${cells}</w:tr>`;
  }).join('');

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>${headerCells}</w:tr>
      ${bodyRows}
    </w:tbl>
    <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr></w:p>`;
}

let body = '';

body += makeDocHeader(
  'Fitkode Guardrails and Evaluation Framework',
  'Architectural Integrity, PII Security, State Synchronization & Deployment Evaluation (v2.0)',
  'Target Environment: Fitkode Performance & Nutrition Platform (fitkode.com) | Super Admins: chinmay4jain@gmail.com & myfitkode@gmail.com | Generated: November 2026'
);

body += makeH1('1. Executive Summary & Framework Objectives');
body += makePara(
  'This document constitutes the official engineering constitution, architectural source of truth, and mandatory pre-flight checklist for Fitkode. It synthesizes all historical project iterations, distilling hard-won lessons from database schema migrations, client-server state synchronization, security reviews (O1–O4), and delicate data recovery operations.'
);
body += makeCallout(
  'The Core Invariant (The No-Break Rule)',
  'No future security patch, code cleanup, performance optimization, or deployment may be merged or executed if it breaks existing live user workflows, destroys cached client records, alters confirmed email configurations, or fabricates personal client information.'
);
body += makePara(
  'Every regression experienced across the project history stemmed from localized optimizations—such as aggressively stripping seed files to minimize bundle size, attempting to reach 100% profile completion by generating placeholder values, or applying rigid server security checks before client code was prepared to send authorization tokens. This framework guarantees that architectural integrity, data consistency, and user experience evolve in tandem without disruption.'
);

body += makeH1('2. Synthesis of Project History & Lessons Learned');

body += makeH2('Lesson 1: The Perils of Destructive Client-Side Cache Purging');
body += makeBullet('Incident Analysis:', 'During an effort to purge mock/seed data from frontend code, a one-time migration routine (fk_seed_purged_v1) was triggered in AuthContext.tsx. It executed localStorage.removeItem() calls across admin registries, meal plans, workout plans, and weekly tracking entries.');
body += makeBullet('Root Cause:', 'The cleanup operated under the faulty premise that all enrolled users and assigned plans were already 100% mirrored in remote Supabase tables and readable by the active session. When RLS or schema sync lagged, the browser lost its only surviving copy of client dossiers.');
body += makeBullet('Engineering Guardrail:', 'Never deploy unconditional destructive cache purges. Instead, adopt additive, versioned cache keys with safe fallback resolvers. Client-side records must only be superseded when a validated server record with a newer updatedAt timestamp is received.');

body += makeH2('Lesson 2: PII Integrity & The Zero-Fabrication Rule');
body += makeBullet('Incident Analysis:', 'During directory recovery, member Atul Gupta record was populated with a synthetic phone number (+91 98114 00612), address, and medical details from an old seed template because his actual phone number was absent from an administrative directory screenshot, while the UI demanded 100% completion.');
body += makeBullet('Cascading Defect:', 'The member store merge algorithm contained a conditional check: profileRate >= existingMember.profileCompletion. Because the synthetic seed claimed 100% completion, whenever real data arrived with fewer optional fields completed, the real data was ignored and the fabricated phone number remained active.');
body += makeBullet('Engineering Guardrail:', 'Strict Zero-Fabrication Policy. No automated script, fallback store, or developer intervention may synthesize, guess, or borrow personal identifiable information (PII) such as phone numbers, dates of birth, street addresses, or medical conditions. Missing fields must remain empty strings (""). Real data from Supabase public.profiles must unconditionally override seed data regardless of percentage calculation.');

body += makeH2('Lesson 3: Robust Admin Role Resolution (Union vs. Overwrite)');
body += makeBullet('Incident Analysis:', 'Configuration discrepancies between hosting environments (e.g., ADMIN_EMAILS vs admin_email, or case-sensitivity variations) caused the admin check to evaluate to false, resulting in 0 registered members displayed to Super Admins. An early typo (chinma4jain@gmail.com) also created intermittent permission drops.');
body += makeBullet('Engineering Guardrail:', 'Immutable Admin Invariant. Both chinmay4jain@gmail.com and myfitkode@gmail.com are permanently embedded as default Super Admins across client, Express server, and database triggers. Environment variable checks must strictly UNION default admins with process.env.ADMIN_EMAILS and process.env.ADMIN_EMAIL, ensuring misconfiguration can never lock out legitimate owners.');

body += makeH2('Lesson 4: Proactive Client-Server Plan Synchronization');
body += makeBullet('Incident Analysis:', 'Diet and workout plans assigned by Coach Chinmay to enrolled clients (such as Atul Gupta 4 Days workout) were persisted to the backend server but remained invisible to the client upon logging in.');
body += makeBullet('Root Cause:', 'The user-facing MealPlannerPage and WorkoutPlannerPage only read synchronous localStorage on initial mount without executing an active fetch against the server endpoints (/api/meal-plans, /api/workout-plans).');
body += makeBullet('Engineering Guardrail:', 'Bi-Directional State Reconciliation. Every member portal route must trigger an asynchronous fetch on mount (useEffect) to pull active coach-assigned plans and merge them with local storage using plan ID and update timestamp.');

body += makeH2('Lesson 5: Resilient Offline Synchronization Architecture');
body += makeBullet('Incident Analysis:', 'An omnipresent green banner (4 offline updates queued for cloud sync) became frozen at the bottom of the interface. When users clicked Sync Now, nothing happened.');
body += makeBullet('Root Cause:', 'Background database errors (such as RLS denials or missing schema tables) were caught and indiscriminately enqueued as offline updates even when the client possessed active internet connectivity. Replaying the exact same failing query repeatedly failed, leaving the queue blocked.');
body += makeBullet('Engineering Guardrail:', 'Network-Gated Queuing. Mutations must only enter fitkode_pending_sync_queue_v1 when !navigator.onLine is explicitly true. Clicking Sync Now must execute a single flush attempt and clear the queue unconditionally if errors persist to prevent permanent visual traps.');

body += makeH1('3. Confirmed Security Decisions & Architecture (O1 - O4)');
body += makePara(
  'During the security remediation phase, four fundamental architectural decisions were evaluated and locked in to protect client privacy without breaking operational workflows:'
);

body += makeTable(
  ['Decision ID', 'Architecture Focus', 'Confirmed Decision', 'Operational & Security Rationale'],
  [
    [
      'O1',
      'Repository Visibility & Public Assets',
      'Keep GitHub repository open for now; sanitize all public PII.',
      'Rather than relying on private repo obscurity, eliminate static PII leaks. All chat screenshots and PDFs in public/assets/aistudio/ were purged and added to .gitignore. Real client data is quarantined in authenticated database and server storage.'
    ],
    [
      'O2',
      'Production Host Target & Build Pipeline',
      'Express Server on Cloud Run / Node.js; leave GitHub Actions intact.',
      'The production deployment relies on Node.js/Express (server.ts) serving static frontend assets and proxying secure API routes. Server bundling outputs to dist-server/server.cjs to prevent leaking server source code in public web roots.'
    ],
    [
      'O3',
      'Admin Identities & Email Configuration',
      'Dual Super Admins: chinmay4jain@gmail.com & myfitkode@gmail.com.',
      'myfitkode@gmail.com is locked as the verified SMTP sender for Nodemailer transactional emails. Both addresses are granted Super Admin across all layers. The typo chinma4jain@gmail.com was eliminated across the entire codebase.'
    ],
    [
      'O4',
      'Payment Processing Fallback',
      'Preserve orderless checkout fallback on client; verify pricing on server.',
      'Guarantees customers are never blocked from completing membership payment if /api/razorpay/create-order encounters latency. Server-side payment verification strictly validates payment ID, order ID, and HMAC signatures against PLAN_CATALOG.'
    ]
  ],
  [1200, 2400, 2800, 3600]
);

body += makeH1('4. Multi-Tier State Hierarchy & Merging Rules');
body += makePara(
  'To prevent conflicts between local browser state, Express caching, and Supabase cloud tables, all stores must adhere to the following 4-tier precedence hierarchy:'
);
body += makeBullet(
  'Priority 1 (Highest Authority) — Live Supabase Database:',
  'public.profiles, public.weekly_tracker_entries, and embedded JSON fields. When remote data is received, non-empty fields unconditionally overwrite local and fallback values. RLS policies protect rows while allowing Super Admins full dossier inspection.'
);
body += makeBullet(
  'Priority 2 (Server Persistence Engine) — Express Backend (.server_data/*.json):',
  'The backend maintains persistent JSON state for member rosters, communication logs, and plans. Protected by Bearer token authorization and ADMIN_EMAILS verification.'
);
body += makeBullet(
  'Priority 3 (Local Client Cache) — Browser LocalStorage:',
  'Cached records allow instantaneous page loads and offline viewing. Large base64 photo strings are automatically stripped before storage via storageGuard.ts to protect the 5MB browser quota.'
);
body += makeBullet(
  'Priority 4 (Lowest Authority) — Seed & Fallback Definitions:',
  'Code-level fallbacks provide UI scaffolding if the user is in an uninitialized environment. Fallbacks must never overwrite real data and must adhere strictly to the Zero-Fabrication rule.'
);

body += makeH2('Immutable Rules for Merging State');
body += makeBullet('Rule A (Non-Destructive Update):', 'Incoming plan or member arrays must be merged by identifier (id or email). Newer updatedAt timestamps take precedence.');
body += makeBullet('Rule B (Field-Level Granularity):', 'A profile update from Supabase containing phone, name, and email must merge with local medical answers rather than replacing the whole object with undefined fields.');
body += makeBullet('Rule C (Silent Trigger Protection):', 'Database trigger public.protect_profile_privileged_columns() silently prevents non-admin users from escalating role, plan_id, or coach notes without throwing SQL exceptions that break legitimate profile updates.');

body += makeH1('5. PII Handling & Data Privacy Protocol');
body += makePara(
  'Fitkode processes sensitive physical health assessments, body circumferences, progress photographs, and personal contact info. The following protocols govern all data handling:'
);

body += makeTable(
  ['Data Classification', 'Examples', 'Storage Rules', 'Access Control'],
  [
    [
      'Critical Personal PII',
      'Full name, phone, email, date of birth, residential address',
      'Stored in public.profiles. Never hardcoded into source control or committed in public assets.',
      'Self (authenticated owner) and Super Admins (chinmay4jain@gmail.com, myfitkode@gmail.com).'
    ],
    [
      'Sensitive Health Data',
      '70-Q medical history, symptoms, digestion, weight, measurements',
      'Stored in encrypted database tables and client local storage under user-specific storage keys.',
      'Explicit consent required on onboarding. Accessible only by assigned Coach/Admin.'
    ],
    [
      'Progress Photographs',
      'Front, back, side weekly physique check-in images',
      'Stored in progress-photos bucket. Rendered via <ProgressPhoto /> using time-limited signed URLs.',
      'Private folder access restricted to storage.foldername(name)[1] = auth.user_id OR admin.'
    ],
    [
      'Payment Credentials',
      'Razorpay order IDs, payment signatures, transaction logs',
      'Key secrets stored strictly in server-side environment variables. Never sent to client bundle.',
      'Server-side verification endpoints only.'
    ]
  ],
  [2000, 2600, 2800, 2600]
);

body += makeH1('6. Comprehensive Pre-Flight Deployment Checklist');
body += makePara(
  'Every future pull request, build compilation, and production release must be evaluated against this 15-point checklist:'
);

body += makeTable(
  ['#', 'Verification Category', 'Inspection Standard & Test Action', 'Sign-Off Criteria'],
  [
    ['1', 'Data Persistence', 'Verify no localStorage.removeItem() or cache purge scripts exist in the deployment diff.', 'Zero destructive wipes; all member records and dossiers preserved.'],
    ['2', 'PII Fabrication', 'Inspect seed files and fallback objects for any synthetic phone numbers, addresses, or DOBs.', 'Zero fabricated PII. Unknown fields left empty (""). Real mobile numbers validated.'],
    ['3', 'Supabase Precedence', 'Verify memberStore.ts merge logic allows Supabase profile data to win unconditionally.', 'Remote data updates local store regardless of completion percentage score.'],
    ['4', 'Admin Dual Role', 'Verify chinmay4jain@gmail.com and myfitkode@gmail.com are both recognized as Super Admin.', 'Admin Portal displays full roster; no permission degradation.'],
    ['5', 'Email Integrity', 'Confirm myfitkode@gmail.com SMTP configuration and templates remain untouched.', 'Transactional emails (welcome, check-in, plans) send successfully.'],
    ['6', 'Plan Visibility', 'Verify member login automatically pulls coach-assigned meal and workout plans.', 'Atul Gupta and other clients see current coach split upon login.'],
    ['7', 'Merge Non-Destructiveness', 'Verify saveAllMealPlans and saveAllWorkoutPlans merge server responses by ID.', 'Existing plans not overwritten by partial server payloads.'],
    ['8', 'Offline Queue Hygiene', 'Verify sync queue enqueues ONLY when offline; verify Sync Now clears pending queue.', 'No stuck offline banners for online users.'],
    ['9', 'Privilege Escalation Guard', 'Test non-admin profile save with role: admin or planId: paid.', 'Server/trigger silently strips privileged fields; user remains unpaid.'],
    ['10', 'Payment Catalog Verification', 'Test checkout with modified amount; verify server validates price against PLAN_CATALOG.', 'Server enforces catalog pricing; Rs 1 test plan does not grant paid tier.'],
    ['11', 'Signed Photo URLs', 'Inspect progress photo views (WeeklyTrackerModal, PhotoCompareModal) for <ProgressPhoto />.', 'Signed URLs resolve with 23h cache; fall back safely if public.'],
    ['12', 'XSS & Output Sanitization', 'Verify user strings in communication logs and printouts pass through escapeHtml().', 'HTML tags neutralized; email preview rendered in sandboxed iframe.'],
    ['13', 'UI Cleanliness', 'Verify diagnostic tools (DB Health & SQL Fix) are nested inside Role Preview dropdown.', 'Primary navigation remains clean, focused on daily coaching workflows.'],
    ['14', 'Build Output Isolation', 'Verify server.ts compiles to dist-server/server.cjs and frontend to dist/.', 'Backend secrets and logic are never exposed in static web root.'],
    ['15', 'Type & Build Gate', 'Execute npm run lint (tsc --noEmit) and npm run build.', 'Zero compilation errors, zero type errors, exit code 0.']
  ],
  [600, 2200, 4400, 2800]
);

body += makeH1('7. Emergency Incident Response & Rollback Protocol');
body += makePara(
  'If an unforeseen data regression or permission anomaly occurs during deployment, the following rapid response runbook must be initiated immediately:'
);
body += makeBullet('Phase 1 — Immediate Triage (0-5 Minutes):', 'Check the Super Admin Portal (/admin). If Total Registered displays 0, verify the active user session email and inspect the browser console for Supabase RLS recursion errors.');
body += makeBullet('Phase 2 — Non-Destructive Restore (5-15 Minutes):', 'If client caches appear empty, trigger the Refresh button in the Admin Portal to re-pull from server.ts and Supabase. Trigger the 1-Click Vault Backup (.json) download to take an instantaneous snapshot.');
body += makeBullet('Phase 3 — Environment Isolation (15-30 Minutes):', 'If auth enforcement causes unintended 403s on client routes, toggle AUTH_ENFORCE=false in server environment variables to revert the backend to log-only warning mode ([auth-would-deny]) without interrupting traffic.');
body += makeBullet('Phase 4 — Post-Incident Audit:', 'Audit any modified records against the confirmed baseline directory to verify phone numbers, check-in histories, and assigned workout plans.');

body += makeH1('8. Canonical Directory Baseline Reference');
body += makePara(
  'For instant verification during audits, the verified baseline of registered Fitkode accounts is documented below:'
);

body += makeTable(
  ['Member Name', 'Email Address', 'Verified Phone', 'Status & Assigned Assets'],
  [
    ['Chinmay Jain', 'chinmay4jain@gmail.com', '9654173664', 'Super Admin. Baseline tracker check-in active.'],
    ['Coach / SMTP Sender', 'myfitkode@gmail.com', '(System Account)', 'Super Admin & Transactional Email Service Account.'],
    ['Atul Gupta', 'akg.atulgupta@gmail.com', '7838777741', 'Enrolled Member. Assigned 4 Days workout, 1950 kcal Diet Plan, W1 & W2 check-ins.'],
    ['Shruti Dubey', 'dubeyshruti2428@gmail.com', '9891020554', 'Enrolled Member. Profile 42% complete.'],
    ['ChInMaY JaIn', 'chinmayright@gmail.com', '9654173664', 'Enrolled Member. Week 1 baseline check-in active.'],
    ['Rakshit Harneja', 'rharneja2008@gmail.com', '(Awaits Sync)', 'Enrolled Member. Paid Coaching Client tier.'],
    ['Gaurav Choudhary', 'advgauravc86@gmail.com', '(Awaits Sync)', 'Enrolled Member. Free / Unpaid tier.'],
    ['Jyothi Varma', 'jyothi.varmagl@gmail.com', '(Awaits Sync)', 'Enrolled Member. Free / Unpaid tier.']
  ],
  [1800, 2800, 1800, 3600]
);

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

function crc32(buf: Buffer): number {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

interface ZipFileItem {
  name: string;
  content: string;
}

function createZip(files: ZipFileItem[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const uncompressed = Buffer.from(file.content, 'utf8');
    const compressed = zlib.deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressed);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralSize = centralHeaders.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

const zipBuf = createZip([
  { name: '[Content_Types].xml', content: contentTypesXml },
  { name: '_rels/.rels', content: relsXml },
  { name: 'word/_rels/document.xml.rels', content: docRelsXml },
  { name: 'word/document.xml', content: documentXml },
]);

const filename1 = 'public/Fitkode_Guardrails_and_Evaluation_Framework.docx';
const filename2 = 'public/Fitkode_Engineering_Guardrails_and_Eval_Checklist.docx';

fs.writeFileSync(path.resolve(filename1), zipBuf);
fs.writeFileSync(path.resolve(filename2), zipBuf);

console.log('SUCCESS! Generated:', filename1, 'Size:', zipBuf.length, 'bytes');
console.log('SUCCESS! Synchronized:', filename2, 'Size:', zipBuf.length, 'bytes');
