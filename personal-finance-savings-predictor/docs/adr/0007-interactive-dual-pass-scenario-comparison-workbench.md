# 7. Interactive Dual-Pass Scenario Comparison Workbench

Scenario Comparison executes two independent, side-by-side simulation runs (Scenario A baseline vs. Scenario B candidate) against the shared portfolio position dataset. Scenario B provides a dedicated parameter drawer where users can independently override monthly salary, annual salary growth, inflation, pool interest rate, auto term parameters, and savings goal. Growth trajectories are visualized simultaneously on the primary Growth Chart with distinct curve styling and a comparative KPI delta banner.

We rejected the previous static 2-year salary growth bump because:

1. A hardcoded salary assumption restricted the feature to a single narrow hypothetical question.
2. Users need to test arbitrary multi-variable "what-if" hypotheses (e.g. changing inflation, deposit rates, or aggressive savings rates).
3. Dual-pass execution against the shared portfolio guarantees mathematical parity while avoiding state leakage or portfolio duplication.
