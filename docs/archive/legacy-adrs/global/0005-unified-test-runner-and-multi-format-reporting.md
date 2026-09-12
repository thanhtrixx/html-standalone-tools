# ADR-0005: Unified Test Runner & Multi-Format Reporting

> **Status:** Accepted

## Context

Previously, tests were executed through a chained shell script in `package.json`, emitting plain unstructured terminal text. Developers and maintainers reviewing CI runs or testing locally had no visual test dashboard, no structured machine-readable test artifacts (JUnit XML / JSON), and no at-a-glance summary rendered within GitHub Actions workflows. Identifying failing assertions required manually reading through hundreds of lines of terminal output.

## Decision

We have implemented a unified test execution and reporting engine (`scripts/run-tests.js`) that manages all repository test suites:

1. **Centralized Test Execution**:
   - Executes all test suites sequentially across all standalone tools (Build compaction, i18n dictionary parity, Savings Predictor simulation & UI, Buy vs. Rent comparison suites, Smart Buy-List price tracking suites, and calculation helpers).
   - Streams live terminal feedback while collecting per-assertion telemetry, pass/fail status, and precise execution durations.

2. **Multi-Format Report Generation**:
   - **Interactive Standalone HTML Report (`test-reports/index.html`)**: A self-contained, responsive HTML report featuring overall pass rates, duration metrics, suite summary cards, search filtering, and collapsible assertion tables.
   - **Structured JSON (`test-reports/results.json`)**: Full execution metadata, suite timings, and assertion results.
   - **Standard JUnit XML (`test-reports/junit.xml`)**: Standardized XML for CI test report parsers.
   - **GitHub Actions Step Summary**: Automatically appends a markdown summary table to `$GITHUB_STEP_SUMMARY` during CI runs.

3. **Workflow Artifact Archiving**:
   - Configured `actions/upload-artifact@v4` with `if: always()` in both `pr-verify.yml` and `release.yml` to preserve `test-reports/` as downloadable artifacts even in the event of test failures.

4. **Clean Git Workspace**:
   - Added `test-reports/` to `.gitignore` to ensure local report generation does not dirty the source control tree.

## Consequences

- **Immediate Visibility**: Tech leads and engineers get instant visual test summaries directly on the GitHub Actions summary page for every PR and merge.
- **Diagnostic Efficiency**: Detailed standalone HTML reports allow rapid filtering and debugging of failed assertions.
- **Audit & Compliance**: Machine-readable JSON and JUnit XML reports are preserved as downloadable workflow artifacts for every pipeline run.
