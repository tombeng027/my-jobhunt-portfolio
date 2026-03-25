Project: NexusInsure Admin Framework
Objective: A modular, high-performance Insurtech platform for enterprise claims management, handling multi-channel intake and complex state-based rules.

Phase 1: Core Schema (Prisma)

```prisma
enum ClaimStatus {
	Draft
	Pending
	Manager_Review
	Approved
	Denied
	Sync_Exception
}

enum SourceSystem {
	Manual_FNOL
	Legacy_API
}

enum UserRole {
	Staff
	Manager
}

model Claim {
	id            String      @id @default(cuid())

	policyNumber  String      @map("Policy_Number")
	lossDate      DateTime    @map("LossDate")
	claimant      String      @map("Claimant")

	totalAmount   Decimal     @db.Decimal(14, 2) @map("Total_Amount")
	taxAmount     Decimal     @db.Decimal(14, 2) @map("Tax_Amount")

	status        ClaimStatus @default(Draft)

	sourceSystem  SourceSystem @map("Source_System")
	createdAt     DateTime     @default(now()) @map("Created_At")
	updatedByRole UserRole     @map("Updated_By_Role")

	auditLogs     AuditLog[]

	@@index([status])
	@@index([policyNumber])
}

model AuditLog {
	id            String       @id @default(cuid())
	claimId       String
	claim         Claim        @relation(fields: [claimId], references: [id], onDelete: Cascade)

	changedAt     DateTime     @default(now())
	changedByRole UserRole
	sourceSystem  SourceSystem?

	fieldName     String
	oldValue      Json?
	newValue      Json?

	@@index([claimId, changedAt])
}
```

Technical Architecture (The "Vanilla" Core)
Stack: Next.js (App Router), TypeScript, Tailwind CSS.

Data: PostgreSQL (Prisma/Drizzle) + Redis for caching.

Auth: RBAC (Role-Based Access Control) supporting SSO and Standard Login.

Sprint 1: Identity & Universal Intake (Current Week)
Goal: Build the "Gateway" that handles different users and incoming data streams.

Tasks:
Identity Orchestrator:

Implement Auth with Roles: Claims_Rep, Claims_Manager, External_Agent.

Create a "Threshold Guard" middleware: If claim_amount > $5,000, the Approve action requires Manager role.

The Universal Intake Service:

Build a REST endpoint /api/intake to handle JSON payloads (Legacy Sync).

Build a manual FNOL (First Notice of Loss) Form UI.

Normalization Layer: Ensure both the API and the Form map data to a single Universal_Claim_Schema.

Sprint 2: The "Data Dent" & Sync Logic
Goal: Solve the "Incomplete Payload" problem and implement the Rules Engine.

Tasks:
Idempotent Sync Service (The "Comparison" Engine):

Logic: Before updating a claim, fetch the current_state from DB.

Rule: If a field exists in DB but is missing in the new payload, retain the DB value.

Rule: Only overwrite with null if the payload explicitly sends field: null.

Rules-Based Calculation Engine:

Create a Rules directory. Implement a "State Tax" calculator that fetches a formula based on the loss_location field (e.g., CA vs. NY).

Ensure the calculator is Modular (can be updated without a full redeploy).

Sprint 3: Exception Handling & Audit Trails
Goal: Resilience against user error and legacy system failures.

Tasks:
The Audit Ledger:

Create a Claim_History table. Every change must log: User_ID, Old_Value, New_Value, Timestamp.

Exception Manager UI:

If a sync payload removes >20% of data, flag the claim as NEEDS_REVIEW and block auto-processing.

Build a "Manager Overrule" interface to manually manipulate caseloads in "God Mode."

Sprint 4: The "Animation" & UX Polish
Goal: Use motion to bridge the gap between "Logic" and "Experience."

Tasks:
Micro-Interactions:

Animate "High Priority" flags with a subtle pulse.

Add "Skeleton Loaders" that shimmer during API syncs.

Case Study Documentation:

Finalize the README to explain the "Data Dent" resolution and "Modular Plugin" architecture.