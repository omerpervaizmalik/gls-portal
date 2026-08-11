# Allow Walk-in Invoices for Income Records

Currently, the `Invoice` schema strictly requires a `clientId`, which prevents us from generating an invoice for "Walk-in" or unregistered clients when an income is recorded.

## Proposed Changes

### 1. Database Schema (`prisma/schema.prisma`)
- Make `clientId` optional on the `Invoice` model: `clientId String?` and `client Client? @relation(...)`.
- Add an `invoiceId String? @unique` to the `IncomeRecord` model with a relation to `Invoice`. This will allow us to link the generated invoice directly to the income record.

### 2. Generate Invoice on Income Creation (`app/fams/income/new/page.tsx`)
- When recording an income WITHOUT a client (Walk-in), automatically generate a new `Invoice` record.
- The invoice will have `clientId: null`.
- The `items` array will contain the selected `serviceType` and `amount`.
- Update the created `IncomeRecord` with this new `invoiceId`.

### 3. Show Invoice Icon in Income Table (`app/fams/income/page.tsx`)
- Include the linked `invoice` in the query: `include: { client: true, invoice: true }`.
- In the actions column, if `record.invoiceId` exists, display an invoice icon (e.g., `FileText`) that links to the invoice print/view page (`/fams/invoice/[id]`).

## User Review Required

> [!WARNING]
> This requires a database schema update. `npx prisma db push` will be executed to apply the changes to the database.

> [!NOTE]
> For walk-in clients, the invoice will not display a client name or CF number, as they are not registered in the system. The invoice will just reflect the service provided and the amount. Is this acceptable?

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure TypeScript types are successfully updated and valid.

### Manual Verification
- Go to Add Income.
- Record an income without selecting a client.
- Verify that an Invoice is generated and appears in the Invoices section.
- Verify that the Income list shows a clickable invoice icon next to the new entry.
