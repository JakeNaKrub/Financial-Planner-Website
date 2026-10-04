# Future improvements

This is a prioritized backlog, not a promise that every item is scheduled. Existing behavior is described in [README.md](README.md), and implementation details are in [CONTEXT.md](CONTEXT.md).

## Recommended next

1. **Add automated tests for money parsing and totals**
   - Extract quick-input parsing into a testable module.
   - Cover expense split syntax, date headings, valid and invalid income input, and amounts with decimals and grouping separators.
   - Verify that income never changes expense, personal-cost, or settlement totals.
   - Test mixed-history sorting and separate trip/share summaries.

2. **Improve save and sync feedback**
   - Replace silent early returns on expense, trip, and income persistence failures with visible, actionable errors.
   - Make it clear when entries are saved remotely versus only present in local state.
   - Add retry behavior for transient network errors without creating duplicate entries.

3. **Make income and expenses consistently filterable in history**
   - Add an entry-type filter for all entries, expenses only, or income only.
   - Keep category filters limited to expenses and label that behavior.
   - Ensure search, date grouping, and amount sorting work consistently across entry types.

## Later possibilities

4. **Track remaining cash as a separate concept**
   - Do not calculate remaining cash as income minus expense totals: a shared expense may have been paid by another person, and an expense payer may later be reimbursed.
   - If added, track who received income, who paid each expense, and repayments/transfers explicitly.
   - Show the resulting cash-flow figure separately from each traveler's cost and the shared settlement balance.

5. **Add explicit shared-fund contributions**
   - Model money added to a group trip fund as a separate entry type from personal income.
   - Define how contributions affect the fund balance and how spending from the fund is recorded before changing settlement calculations.

6. **Support editing income dates and currency**
   - Current income entries store a date, source, amount, and currency; the editor currently changes source and amount only.
   - Add date editing and clear currency handling if users need to correct imported entries or record non-THB income.
   - Define conversion behavior before combining entries with different currencies into one trip total.

7. **Harden and document share-link controls**
   - Let trip owners choose whether income source details are visible to link viewers.
   - Consider revocable or expiring links and a privacy reminder when creating or copying a link.
   - Preserve the rule that shared payloads do not include account identifiers or private ownership metadata.

8. **Improve data portability**
   - Make JSON and CSV exports specific to the selected trip and include income consistently.
   - Consider a validated import/restore workflow with duplicate detection and a preview before writing records.

## Out of scope until behavior is specified

- Automatically treating gifts as shared-trip contributions.
- Adding income to expense totals or using it to change who owes whom.
- Showing a single “cash remaining” number without recording payers and repayments.
