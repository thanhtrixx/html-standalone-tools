# 1. Flexible Pool Deficit Handling for Withdrawals

When a scheduled withdrawal exceeds the available liquid funds in the Flexible Pool, the simulation permits the Flexible Pool to enter a negative balance and emits an explicit deficit warning event in the simulation log. We rejected automatic early liquidation of Fixed Term Deposits because bank penalties, interest loss rules, and priority ordering vary widely; presenting the unliquidated shortfall gives the user transparent visibility into liquidity gaps without making hidden portfolio assumptions.
