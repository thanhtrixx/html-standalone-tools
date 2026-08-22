# 5. Unified Threshold Auto Term Allocation & Consolidated Sweep

All cash inflows (monthly salary deposits, matured CSV fixed term proceeds, and expired Auto Term payouts) sweep directly into the Flexible Pool. On each simulation day, after processing all daily inflows and scheduled withdrawals, a single unified threshold check is performed: if the configurable Auto Term Threshold is active ($> 0$) and the Flexible Pool balance is $\ge \text{Auto Term Threshold}$ (default $200,000,000\text{ VND}$), the entire available Flexible Pool balance is swept into **exactly one** new Fixed Term Deposit of configurable duration ($N$ months, default 6) and annual rate, setting the liquid Flexible Pool balance to 0.

We rejected the previous fixed 200M chunking loop (`while (pool >= 200M)`) because:

1. It left residual unallocated cash (e.g. 50M out of a 450M balance) idling at low demand interest rates rather than compounding at term rates.
2. Real-world savers consolidate large lump-sums and matured term returns into a single high-yield term deposit rather than managing multiple arbitrary 200M slices.
3. Parameterizing the threshold, duration, and rate provides users complete flexibility to model various savings strategies (e.g., 3-month rolling ladders or 12-month compounding deposits) or disable auto-allocation completely by setting the threshold to 0.
