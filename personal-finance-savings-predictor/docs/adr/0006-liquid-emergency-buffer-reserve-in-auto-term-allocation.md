# 6. Liquid Emergency Buffer Reserve in Auto Term Allocation

When evaluating the daily Auto Term Deposit sweep, the simulation engine requires that the liquid Flexible Pool balance meet or exceed the sum of the Auto Term Threshold and the configurable Emergency Buffer Reserve ($\text{Flexible Pool} \ge \text{Auto Term Threshold} + \text{Emergency Buffer Reserve}$). Upon trigger, exactly $\text{Flexible Pool} - \text{Emergency Buffer Reserve}$ is swept into a single Fixed Term Deposit, guaranteeing that the Emergency Buffer Reserve remains liquid in the Flexible Pool.

We rejected sweeping the entire pool to 0 VND (previous ADR-0005 behavior) because:

1. Real-world individuals do not lock 100% of liquid assets without preserving cash for routine living expenses and unforeseen liquidity demands.
2. Immediate scheduled withdrawals following a sweep previously triggered artificial deficit warnings.
3. Requiring the pool to exceed $\text{Threshold} + \text{Buffer}$ ensures the locked principal is always at least equal to the user's intended minimum deposit threshold while keeping liquid reserves intact.
