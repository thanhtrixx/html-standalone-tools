# Buy vs. Rent Home Comparison

A standalone, client-side financial decision engine and dual-path wealth simulator designed to evaluate the long-term economic outcomes of homeownership versus renting and investing the difference.

## Language

### Core Comparison Scenarios

**Buy Path**:
The simulation scenario modeling all capital outflows, debt obligations, ongoing maintenance, property taxes, HOA fees, asset appreciation, and realized equity associated with purchasing and owning residential real estate.
_Avoid_: Owner path, house track, property branch

**Rent Path**:
The simulation scenario modeling initial capital preservation, security deposits, monthly rent payments, annual rent escalations, and the compound growth of all capital savings invested in an alternative asset portfolio.
_Avoid_: Tenant path, lease track, non-owner branch

**Net Worth Crossover Date**:
The exact calendar month and year on the simulation timeline when the cumulative net wealth of the Buy Path surpasses the Rent Path (or vice versa).
_Avoid_: Break-even date, inflection point, parity day

**Price-to-Rent Ratio (PRR)**:
The ratio of the total purchase price of the home to the annualized initial rent ($\frac{\text{Home Price}}{\text{Annual Rent}}$), serving as a standard rule-of-thumb valuation benchmark.
_Avoid_: Rent multiplier, property-to-lease ratio

**Gross Rental Yield**:
The annual baseline rental income expressed as a percentage of the total home purchase price ($\frac{\text{Annual Rent}}{\text{Home Price}} \times 100\%$).
_Avoid_: Cap rate, rental return percentage

---

### Home Financing & Mortgage

**Mortgage Amortization Scheme**:
The mathematical method used to calculate periodic principal and interest repayments. Supported schemes include **Equal Monthly Installments (Annuity / Fixed EMI)** and **Linear Principal Reduction (Equal Principal + Reducing Interest)**.
_Avoid_: Loan repayment type, debt schedule model

**Teaser Rate Period**:
An introductory promotional phase (typically 12 to 36 months) during which the mortgage incurs a discounted fixed interest rate prior to resetting to a floating rate benchmark.
_Avoid_: Promo duration, discount window, introductory rate period

**Floating Rate Benchmark**:
The long-term annualized interest rate applied to the remaining mortgage balance after the Teaser Rate Period expires, typically derived from a bank's cost of funds plus a risk margin.
_Avoid_: Standard rate, variable rate, post-promo interest

**Early Prepayment Penalty Tier**:
A structured penalty fee percentage charged on extra principal payments or full loan payoffs during early loan years (e.g. Years 1–3: 2.0%, Years 4–5: 1.0%, Year 6+: 0%).
_Avoid_: Prepayment fee, early payoff fine, settlement charge

**Remaining Loan Principal**:
The outstanding unpaid loan balance owed to the lender at any given month $t$ on the timeline.
_Avoid_: Debt balance, loan remainder, mortgage principal left

---

### Real Estate Equity & Ownership Costs

**Realizable Home Equity**:
The net liquidated value of the home at month $t$, defined as the appreciated market value minus the remaining mortgage balance and estimated selling friction costs.
_Avoid_: Paper equity, gross home value, raw property equity

**Selling Friction Cost**:
The total percentage of property market value deducted upon hypothetical sale at horizon exit to account for broker commissions, notary, title transfer fees, and transfer taxes (default 2.0%–3.0%).
_Avoid_: Exit fee, liquidation penalty, broker cost

**Upfront Acquisition Outflows**:
The sum of downpayment, government registration tax (Lệ phí trước bạ), title notary and legal fees, bank origination/insurance fees, and initial interior furnishing & renovation fit-out.
_Avoid_: Closing fees, purchase setup costs, initial buying costs

**Property Maintenance Buffer**:
An annual allocation for physical wear-and-tear, repairs, and recurring renovations, calculated as a percentage of the current appreciated property market value (e.g. 0.5%–1.0%/yr).
_Avoid_: Repair sinking fund, upkeep cost, home maintenance

**Building Management & HOA Fee**:
Recurring monthly dues paid for common building services, security, and amenities, escalating over time with general consumer price inflation (CPI).
_Avoid_: Strata fee, condo fee, monthly service charge

---

### Renting & Opportunity Cost Portfolio

**Initial Rent Investment Portfolio**:
The starting liquid capital pool in the Rent Path, calculated as the total upfront home acquisition outflows minus the rental security deposit and initial move-in expenses.
_Avoid_: Opportunity capital, seed portfolio, alternative investment balance

**Rent Security Deposit**:
A refundable deposit (e.g. 2 months' rent) held by the landlord that escalates proportionately with rent increases and is fully credited back to net worth at horizon exit.
_Avoid_: Lease bond, damage deposit, caution money

**Monthly Cashflow Delta Sweep**:
The dynamic monthly transfer between scenarios: if buying costs exceed renting, the positive difference is invested into the Rent Investment Portfolio; if renting costs exceed buying, the shortfall is drawn from the portfolio.
_Avoid_: Monthly savings transfer, delta injection, opportunity rebalance

**Rent Investment Yield**:
The expected compound annual nominal return rate earned by the Rent Investment Portfolio (default 8.0% p.a. for VND, 7.0% for USD).
_Avoid_: Market return, alternative yield, portfolio growth rate

**Cumulative Unrecoverable Costs (Sunk Costs)**:
The total sum of non-equity-building expenditures over time, contrasting rent payments against mortgage interest, property taxes, maintenance, HOA fees, and purchase/sale transaction friction.
_Avoid_: Wasted money, non-equity costs, dead money

---

### Inflation & Purchasing Power

**Property Appreciation Rate**:
The annual percentage compound growth rate applied to the market value of the residential real estate asset.
_Avoid_: Home price growth, house appreciation, real estate inflation

**Rent Inflation Rate**:
The annual percentage compound increase applied to monthly rent at each 12-month lease anniversary.
_Avoid_: Rental escalation, lease increase rate

**Headline Inflation Rate (CPI)**:
The general consumer price inflation rate used to continuously calculate the inflation-discounted Real Purchasing Power curve.
_Avoid_: Cost of living index, general inflation

**Purchasing Power (Real Value)**:
The inflation-adjusted equivalent value of nominal balances discounted continuously from the simulation start date.
_Avoid_: Constant currency, deflated net worth, real terms

---

### Analytics & User Ergonomics

**Continuous Multi-Variable Sensitivity Matrix**:
A 2D matrix heatmap showing the resulting Net Worth Crossover Horizon across varying combinations of Property Appreciation Rates and Rent Investment Yields.
_Avoid_: Grid heatmap, sensitivity table, scenario matrix

**Strategy Persona Preset**:
A predefined real estate profile (e.g. Urban Apartment Condo, Suburban Landed House, Aggressive FIRE Investor Renter, High-Yield Expat) with one-click parameter loading and 5-second undo safeguard.
_Avoid_: Template, default scenario, profile preset

**AI Decision Dossier**:
A structured, portable analytical Markdown summary generated from simulation parameters and month-by-month results, synthesizing crossover metrics, cashflow obligations, and tailored AI advisory blueprints.
_Avoid_: AI prompt, report export, LLM dump

**Privacy Anonymization Mask**:
A client-side sanitization toggle that converts absolute monetary values in the AI Decision Dossier into relative home-price multiples and percentage shares before export.
_Avoid_: Data hide, obfuscator, privacy shield

**Currency Input Masking**:
Live formatting of numerical monetary input fields with locale-aware thousand separators (dot `.` in `vi`, comma `,` in `en`) while preserving cursor positions during text insertion/deletion.
_Avoid_: Number spinner, raw unformatted input, unmasked text

**Dynamic Verbal Helper**:
Real-time localized verbal representation of monetary quantities (e.g. `2.5 Tỷ VND` / `2.5 Billion VND`, `35 Triệu VND` / `35 Million VND`) displayed beneath currency inputs.
_Avoid_: Tooltip translation, spelled-out popup, static text hint

**Contextual Tooltip Popover**:
A responsive floating micro-dialog triggered via hover or tap on information `(i)` icons across input fields and KPI cards, explaining domain definitions and behavioral nuances with zero layout shifts.
_Avoid_: Static title attribute, inline helper text, popup drawer

**Methodology & Formula Hub**:
A dedicated in-app modal repository delivering complete mathematical proofs, variable definitions, live variable substitution traces, and bilingual glossary references for the underlying simulation engine.
_Avoid_: Math docs, formula sheet, help guide

**Dynamic Formula Trace**:
An interactive mathematical display that dynamically substitutes the user's active input numbers into general formulas (e.g. EMI, Equity, PRR) to demonstrate step-by-step arithmetic without black-box opacity.
_Avoid_: Static equation, example calculation, dummy trace

---

## Vietnamese Domain Vocabulary & Copywriting Standards (Chuẩn Hóa Thuật Ngữ Tiếng Việt)

To maintain clarity, natural financial phrasing, and customer empathy in Vietnamese localization, the following ubiquitous terms MUST be used:

### Core Terms Mapping

| English Domain Term                              | Vietnamese Standard Term                          | Explicitly Avoided Synonyms                     |
| :----------------------------------------------- | :------------------------------------------------ | :---------------------------------------------- |
| **Buy Path**                                     | `Kịch Bản Mua Nhà`                                | `Đường mua`, `Phương án mua`, `Lộ trình mua`    |
| **Rent Path**                                    | `Kịch Bản Thuê Nhà & Đầu Tư`                      | `Đường thuê`, `Phương án thuê`, `Kịch bản thuê` |
| **Net Worth Crossover Horizon**                  | `Điểm Hòa Vốn Tài Sản Ròng / Mốc Giao Thoa`       | `Ngày crossover`, `Điểm gãy`, `Ngày hòa vốn`    |
| **Price-to-Rent Ratio (PRR)**                    | `Tỷ Lệ Giá Bán / Tiền Thuê Năm (PRR)`             | `Hệ số thuê`, `Bội số giá thuê`                 |
| **Gross Rental Yield**                           | `Tỷ Suất Cho Thuê Gộp Hàng Năm`                   | `Lợi tức cho thuê`, `Lãi suất thuê`             |
| **Cumulative Sunk Costs**                        | `Tổng Chi Phí Mất Đi Vĩnh Viễn (Chi Phí Chìm)`    | `Tiền mất`, `Tiền chết`, `Chi phí lãng phí`     |
| **Mortgage Loan Principal ($P$)**                | `Số Tiền Gốc Vay Ngân Hàng`                       | `Gốc nợ`, `Tiền nợ vay`                         |
| **Downpayment**                                  | `Vốn Tự Có / Tiền Trả Trước Ban Đầu`              | `Tiền cọc mua`, `Khoản nạp đầu`                 |
| **Linear Principal Reduction**                   | `Dư Nợ Giảm Dần (Gốc Đều, Lãi Giảm Dần)`          | `Gốc chia đều`, `Lãi giảm`                      |
| **Fixed EMI Annuity**                            | `Niên Kim Cố Định (Trả Góp Hàng Tháng Đều Nhau)`  | `Trả đều`, `EMI cố định`                        |
| **Teaser Rate Period**                           | `Kỳ Hạn Lãi Suất Ưu Đãi`                          | `Thời gian promo`, `Giai đoạn khuyến mãi`       |
| **Floating Rate Benchmark**                      | `Lãi Suất Thả Nổi Cơ Sở`                          | `Lãi thả nổi`, `Lãi suất thị trường`            |
| **Realizable Home Equity**                       | `Tài Sản Ròng Thực Nhận Khi Bán Nhà`              | `Vốn chủ sở hữu giấy`, `Giá trị nhà ròng`       |
| **Selling Friction Cost**                        | `Chi Phí Ma Sát Khi Bán Nhà`                      | `Phí thanh lý`, `Phí bán ra`                    |
| **Upfront Acquisition Outflows**                 | `Tổng Chi Phí Thanh Toán Ban Đầu Khi Mua Nhà`     | `Chi phí setup`, `Tổng tiền đóng ban đầu`       |
| **Property Maintenance Buffer**                  | `Quỹ Dự Phòng Bảo Trì & Khấu Hao Nhà Ở`           | `Tiền sửa nhà`, `Quỹ chìm bảo trì`              |
| **Building Management & HOA Fee**                | `Phí Quản Lý Vận Hành Tòa Nhà / Chung Cư (HOA)`   | `Phí dịch vụ`, `Phí chung cư hàng tháng`        |
| **Initial Investment Portfolio**                 | `Vốn Danh Mục Đầu Tư Ban Đầu`                     | `Vốn cơ hội`, `Quỹ đầu tư thay thế`             |
| **Rent Security Deposit**                        | `Tiền Đặt Cọc Thuê Nhà (Hoàn Lại)`                | `Tiền thế chân`, `Tiền bảo chứng`               |
| **Monthly Cashflow Delta Sweep**                 | `Tái Đầu Tư Tiền Chênh Lệch Dòng Tiền Hàng Tháng` | `Quét delta`, `Bù tiền tiết kiệm`               |
| **Continuous Multi-Variable Sensitivity Matrix** | `Ma Trận Độ Nhạy Đa Biến 2 Chiều`                 | `Bảng nhiệt`, `Bảng kịch bản`                   |
| **AI Real Estate Decision Dossier**              | `Hồ Sơ Tư Vấn Bất Động Sản AI`                    | `Prompt AI`, `Báo cáo xuất AI`                  |
| **Privacy Anonymization Mask**                   | `Chế Độ Ẩn Danh Dữ Liệu (Zero-Leak Privacy)`      | `Ẩn thông tin`, `Mặt nạ bảo mật`                |
| **Dynamic Formula Trace**                        | `Minh Họa Thay Số Thực Tế`                        | `Ví dụ tính toán`, `Thay số công thức`          |

---

### Master Bilingual Financial & Technical Terminology Table

| English                                          | Vietnamese                                            | Meaning (VN)                                                                                                                                                                                                                                                                 | Meaning (EN)                                                                                                                                                                                                                                    |
| :----------------------------------------------- | :---------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buy Path**                                     | **Kịch Bản Mua Nhà**                                  | Mô hình tài chính mô phỏng toàn bộ dòng tiền mua nhà bao gồm vốn tự có ban đầu, trả nợ gốc & lãi vay ngân hàng, chi phí sở hữu định kỳ (bảo trì, thuế, phí quản lý HOA), tăng giá bất động sản và tài sản ròng thực nhận khi bán nhà sau khi trừ dư nợ và chi phí giao dịch. | Financial simulation path tracking home purchase outlays, mortgage principal and interest amortization, ongoing ownership costs (maintenance, HOA, property taxes), compound property appreciation, and net realizable equity upon liquidation. |
| **Rent Path**                                    | **Kịch Bản Thuê Nhà & Đầu Tư**                        | Mô hình tài chính mô phỏng việc giữ lại vốn tự có ban đầu (trừ cọc thuê) và tái đầu tư toàn bộ tiền chênh lệch dòng tiền hàng tháng (giữa chi phí mua và chi phí thuê) vào danh mục tài sản sinh lời (tiết kiệm, quỹ đầu tư, cổ phiếu/ETF) để tích lũy lãi kép.              | Financial simulation path modeling initial capital preservation (net of rent deposit), monthly rent payments and escalations, and compound growth of all monthly cashflow savings invested into an alternative asset portfolio.                 |
| **Net Worth Crossover Date / Horizon**           | **Điểm Hòa Vốn Tài Sản Ròng / Mốc Giao Thoa**         | Thời điểm (tháng/năm) trên dòng thời gian mô phỏng khi tổng tài sản ròng thực tế của Kịch Bản Mua Nhà chính thức vượt qua tổng giá trị danh mục tích lũy của Kịch Bản Thuê Nhà & Đầu Tư (hoặc ngược lại).                                                                    | The exact calendar month and year on the timeline when cumulative net wealth of the Buy Path surpasses the Rent Path (or vice versa).                                                                                                           |
| **Price-to-Rent Ratio (PRR)**                    | **Tỷ Lệ Giá Bán / Tiền Thuê Năm (PRR)**               | Chỉ số định giá cơ bản tính bằng Giá mua nhà chia cho Tổng tiền thuê nhà 12 tháng ($\frac{\text{Giá Nhà}}{\text{Tiền Thuê 1 Năm}}$). PRR < 16x ưu tiên Mua, PRR > 22x ưu tiên Thuê.                                                                                          | The ratio of total home purchase price to 12-month annual rental cost ($\frac{\text{Home Price}}{\text{Annual Rent}}$); a standard rule-of-thumb valuation metric (<16x favors Buy, >22x favors Rent).                                          |
| **Gross Rental Yield**                           | **Tỷ Suất Cho Thuê Gộp Hàng Năm**                     | Tỷ lệ phần trăm doanh thu cho thuê hàng năm trên tổng giá trị mua căn nhà ($\frac{\text{Tiền Thuê 12 Tháng}}{\text{Giá Mua Nhà}} \times 100\%$). Yield > 6.25% hấp dẫn mua, Yield < 4.5% nên thuê.                                                                           | Annual gross rental income expressed as a percentage of total home purchase price ($\frac{\text{Annual Rent}}{\text{Home Price}} \times 100\%$).                                                                                                |
| **Cumulative Unrecoverable Costs (Sunk Costs)**  | **Tổng Chi Phí Mất Đi Vĩnh Viễn (Chi Phí Chìm)**      | Toàn bộ chi phí nhà ở phát sinh không tạo ra vốn chủ sở hữu: Kịch Bản Mua Nhà gồm tiền lãi vay ngân hàng, bảo trì, phí quản lý HOA, lệ phí trước bạ và chi phí bán nhà; Kịch Bản Thuê Nhà gồm 100% tiền thuê nhà đã trả.                                                     | Total non-equity-building expenditures lost forever over time (Buy: Mortgage interest, maintenance, HOA fees, taxes, selling friction; Rent: 100% of rent paid).                                                                                |
| **Mortgage Loan Principal ($P$)**                | **Số Tiền Gốc Vay Ngân Hàng**                         | Số tiền thực tế vay thế chấp từ ngân hàng để mua nhà (= Giá mua nhà trừ đi vốn tự có trả trước).                                                                                                                                                                             | The initial borrowed principal balance financed by the mortgage lender (= Home Purchase Price minus Upfront Downpayment).                                                                                                                       |
| **Downpayment**                                  | **Vốn Tự Có / Tiền Trả Trước Ban Đầu**                | Khoản tiền mặt tự có người mua thanh toán ngay khi ký hợp đồng mua nhà (thường từ 20% đến 50% giá trị BĐS).                                                                                                                                                                  | The upfront equity portion of the home purchase price paid in liquid cash by the buyer at transaction closing.                                                                                                                                  |
| **Loan Tenure**                                  | **Thời Hạn Vay Vốn (Kỳ Hạn Vay)**                     | Tổng thời gian cam kết trả góp nợ vay với ngân hàng, tính bằng số năm hoặc số tháng (từ 10 đến 30 năm).                                                                                                                                                                      | Total agreed duration of the mortgage loan contract, expressed in years or months (e.g. 10 to 30 years / 120 to 360 months).                                                                                                                    |
| **Mortgage Amortization Scheme**                 | **Cơ Chế / Phương Thức Trả Nợ Vay**                   | Phương pháp toán học phân bổ nghĩa vụ thanh toán nợ gốc và tiền lãi định kỳ hàng tháng cho ngân hàng.                                                                                                                                                                        | The mathematical schedule model used to calculate periodic principal and interest loan repayments.                                                                                                                                              |
| **Linear Principal Reduction**                   | **Dư Nợ Giảm Dần (Gốc Đều, Lãi Giảm Dần)**            | Phương thức trả nợ chia đều tiền gốc mỗi tháng, tiền lãi tính trên dư nợ gốc thực tế còn lại giảm dần, giúp tổng số tiền trả giảm dần theo thời gian và tiết kiệm tối đa tổng tiền lãi.                                                                                      | Loan repayment scheme where principal is divided equally across all months, and interest is computed on remaining unpaid balance, resulting in declining monthly payments.                                                                      |
| **Fixed EMI Annuity**                            | **Niên Kim Cố Định (Trả Góp Hàng Tháng Đều Nhau)**    | Tổng số tiền thanh toán cho ngân hàng mỗi tháng (Gốc + Lãi) là một con số cố định không đổi trong suốt kỳ vay, giúp ổn định kế hoạch tài chính nhưng tổng tiền lãi phải trả cao hơn.                                                                                         | Equated Monthly Installment scheme where total monthly debt payment (principal + interest) remains constant throughout the loan term.                                                                                                           |
| **Teaser Rate Period**                           | **Kỳ Hạn Lãi Suất Ưu Đãi**                            | Giai đoạn đầu của khoản vay (thường 12–36 tháng) được ngân hàng áp dụng mức lãi suất cố định ưu đãi thấp để hỗ trợ người mua.                                                                                                                                                | An introductory loan phase (typically 12–36 months) during which a discounted fixed interest rate is applied before resetting to floating benchmark.                                                                                            |
| **Promo / Teaser Rate**                          | **Lãi Suất Ưu Đãi Ban Đầu**                           | Tỷ lệ phần trăm lãi suất năm áp dụng trong giai đoạn ưu đãi của gói vay.                                                                                                                                                                                                     | The discounted annual interest rate charged during the promotional teaser window.                                                                                                                                                               |
| **Floating Rate Benchmark**                      | **Lãi Suất Thả Nổi Cơ Sở**                            | Lãi suất năm áp dụng sau khi hết thời gian ưu đãi, thường tính bằng Lãi suất tiết kiệm cơ sở của ngân hàng cộng biên độ rủi ro (Margin 3.0%–4.5%).                                                                                                                           | Long-term annualized variable interest rate applied to remaining loan balance after teaser period expires (cost-of-funds benchmark plus risk spread).                                                                                           |
| **Remaining Loan Principal**                     | **Dư Nợ Gốc Vay Còn Lại**                             | Khoản nợ gốc thực tế chưa thanh toán còn nợ ngân hàng tại tháng thứ $t$ trên dòng thời gian mô phỏng.                                                                                                                                                                        | The outstanding unpaid mortgage principal balance owed to the lender at any given month $t$.                                                                                                                                                    |
| **Realizable Home Equity**                       | **Tài Sản Ròng Thực Nhận Khi Bán Nhà**                | Số tiền mặt thực tế người mua thu về sau khi bán căn nhà theo giá trị thị trường tại tháng thứ $t$, trừ đi toàn bộ dư nợ vay ngân hàng còn lại và chi phí ma sát bán nhà.                                                                                                    | Net liquidated cash value of the property at month $t$, defined as appreciated market value minus remaining loan balance and estimated selling friction costs.                                                                                  |
| **Selling Friction Cost**                        | **Chi Phí Ma Sát Khi Bán Nhà (Môi Giới & Thuế TNCN)** | Tỷ lệ % giá trị BĐS bị khấu trừ khi thanh lý (mặc định 2.5%–3.0%), gồm 2.0% thuế TNCN chuyển nhượng BĐS và 0.5%–1.0% phí môi giới, thẩm định, công chứng.                                                                                                                    | Total percentage deducted from property market value upon sale for broker commissions, notary, title transfer, and personal income transfer taxes (2.5%–3.0%).                                                                                  |
| **Upfront Acquisition Outflows**                 | **Tổng Chi Phí Thanh Toán Ban Đầu Khi Mua Nhà**       | Tổng lượng tiền mặt cần có để sở hữu nhà gồm: Tiền trả trước (Downpayment), Lệ phí trước bạ & sang tên (0.5%–0.6%), Phí công chứng (0.1%) và Chi phí hoàn thiện nội thất ban đầu.                                                                                            | Sum of upfront downpayment, government registration tax, notary/legal fees, bank loan origination, and initial furnishing/renovation fit-out.                                                                                                   |
| **Registration & Transfer Tax**                  | **Lệ Phí Trước Bạ & Phí Sang Tên Sổ**                 | Khoản nghĩa vụ thuế nộp cho nhà nước khi đăng ký quyền sở hữu bất động sản (thường là 0.5%–0.6% giá trị hợp đồng).                                                                                                                                                           | Mandatory government taxes and fees paid to legally register property ownership and title deed transfer (typically 0.5%–0.6%).                                                                                                                  |
| **Initial Interior Fit-out / Furnishing**        | **Chi Phí Nội Thất & Hoàn Thiện Ban Đầu**             | Khoản tiền mặt chi trả một lần để mua sắm nội thất, sửa chữa, cải tạo và trang thiết bị trước khi dọn vào ở.                                                                                                                                                                 | Upfront out-of-pocket cash spent on furniture, interior design, renovation, and appliances prior to moving in.                                                                                                                                  |
| **Property Maintenance Buffer**                  | **Quỹ Dự Phòng Bảo Trì & Khấu Hao Nhà Ở**             | Chi phí trích lập hàng năm để sửa chữa, bảo dưỡng hao mòn vật chất căn nhà theo thời gian (0.3%–0.5%/năm trên giá trị thị trường).                                                                                                                                           | Annual budgetary allocation for physical wear-and-tear, repairs, and recurring upkeep, calculated as a percentage of current market value (0.3%–0.5%/yr).                                                                                       |
| **Building Management & HOA Fee**                | **Phí Quản Lý Vận Hành Tòa Nhà / Chung Cư (HOA)**     | Chi phí dịch vụ cố định hàng tháng trả cho ban quản lý tòa nhà (bảo vệ, thang máy, vệ sinh, tiện ích), tự động tăng theo lạm phát CPI. Đối với nhà phố/đất nền thì phí này bằng 0đ.                                                                                          | Recurring monthly dues for common building services, security, elevator, and amenities; escalates with CPI (0 VND for landed houses).                                                                                                           |
| **Property Type Profile**                        | **Loại Hình Bất Động Sản**                            | Phân loại BĐS thành Chung Cư / Căn Hộ (có phí quản lý, bảo dưỡng, tăng giá vừa phải) hoặc Nhà Phố / Đất Nền (không phí quản lý, tốc độ tăng giá đất cao hơn).                                                                                                                | Classification into Urban Apartment/Condo (incurs HOA/maintenance, moderate growth) or Landed House/Villa (zero HOA, higher land appreciation).                                                                                                 |
| **Initial Investment Portfolio**                 | **Vốn Danh Mục Đầu Tư Ban Đầu**                       | Số vốn khởi điểm người thuê đem đi đầu tư vào tài sản sinh lời = Tổng chi phí mua nhà ban đầu trừ đi tiền cọc thuê (2 tháng) và chi phí dọn nhà.                                                                                                                             | Starting liquid capital pool of the renter invested in income-generating assets (= Total upfront buy outlay minus lease security deposit and move-in setup).                                                                                    |
| **Rent Security Deposit**                        | **Tiền Đặt Cọc Thuê Nhà (Hoàn Lại)**                  | Khoản tiền cọc (1–3 tháng tiền thuê) người thuê giao cho chủ nhà giữ, tự động điều chỉnh tăng theo giá thuê và được hoàn lại 100% vào tài sản ròng khi kết thúc kỳ mô phỏng.                                                                                                 | Refundable security deposit held by landlord (1–3 months rent); escalates with rent increases and is 100% credited back to net wealth upon exit.                                                                                                |
| **Monthly Cashflow Delta Sweep**                 | **Tái Đầu Tư Tiền Chênh Lệch Dòng Tiền Hàng Tháng**   | Cơ chế điều phối dòng tiền: nếu chi phí mua nhà tháng đó cao hơn tiền thuê, phần chênh lệch được tự động nạp vào danh mục đầu tư người thuê; nếu tiền thuê cao hơn mua, phần thâm hụt được trích rút từ danh mục.                                                            | Dynamic monthly cashflow sweep: if buying costs exceed rent, positive delta is added to renter's portfolio; if rent exceeds buying, shortfall is drawn from the portfolio.                                                                      |
| **Alternative Investment Yield**                 | **Tỷ Suất Sinh Lời Danh Mục Đầu Tư Thay Thế**         | Lãi suất kỳ vọng sinh lời hàng năm từ các kênh đầu tư thay thế (Tiết kiệm ngân hàng 5.5%, Danh mục cân bằng 8.0%, Quỹ cổ phiếu/ETF 10.5%).                                                                                                                                   | Expected compound annual nominal return rate earned on the renter's liquid investment portfolio (e.g. 5.5% bank savings, 8.0% balanced, 10.5% equities/ETFs).                                                                                   |
| **Property Appreciation Rate**                   | **Tỷ Lệ Tăng Giá Bất Động Sản Hàng Năm**              | Tốc độ tăng trưởng giá trị thị trường của bất động sản hàng năm theo quy luật lãi kép (thường 5%–9%/năm).                                                                                                                                                                    | Annual percentage compound growth rate applied to the market value of the residential property.                                                                                                                                                 |
| **Rent Inflation Rate**                          | **Tỷ Lệ Tăng Giá Thuê Nhà Hàng Năm**                  | Tỷ lệ phần trăm tăng giá thuê mỗi 12 tháng tại các kỳ tái ký hợp đồng thuê nhà (thường 3%–6%/năm).                                                                                                                                                                           | Annual percentage compound escalation applied to monthly lease rent at each 12-month lease anniversary.                                                                                                                                         |
| **Headline Inflation Rate (CPI)**                | **Lạm Phát Chỉ Số Giá Tiêu Dùng (CPI)**               | Tỷ lệ lạm phát hàng năm của nền kinh tế dùng để chiết khấu tài sản danh nghĩa về sức mua thực tế.                                                                                                                                                                            | General annual consumer price index inflation rate used to continuously discount nominal balances into real purchasing power.                                                                                                                   |
| **Purchasing Power (Real Value)**                | **Sức Mua Thực Tế (Đã Trừ Lạm Phát)**                 | Giá trị tài sản sau khi đã chiết khấu mức độ mất giá của đồng tiền do lạm phát CPI theo thời gian về hiện tại.                                                                                                                                                               | Inflation-adjusted equivalent value of nominal balances continuously discounted back to initial purchasing power.                                                                                                                               |
| **Continuous Multi-Variable Sensitivity Matrix** | **Ma Trận Độ Nhạy Đa Biến 2 Chiều**                   | Bảng nhiệt tương tác (Heatmap) thể hiện số năm hòa vốn tương ứng với từng cặp kịch bản (Tỷ lệ tăng giá BĐS vs Tỷ suất đầu tư danh mục).                                                                                                                                      | Interactive 2D matrix heatmap displaying the resulting break-even crossover horizon across varying combinations of property appreciation and investment yields.                                                                                 |
| **Cashflow Delta**                               | **Chênh Lệch Dòng Tiền Ra Hàng Tháng**                | Biểu đồ so sánh lượng tiền mặt phải chi ra hàng tháng giữa việc trả nợ gốc + lãi + phí nhà ở vs Tiền thuê nhà + phụ phí.                                                                                                                                                     | Comparative timeline showing monthly out-of-pocket cash outflows (mortgage principal + interest + HOA + maintenance vs rent).                                                                                                                   |
| **Ending Net Wealth**                            | **Tổng Tài Sản Ròng Cuối Kỳ**                         | Giá trị tài sản ròng được thanh lý toàn bộ sau khi kết thúc khung thời gian so sánh (năm thứ $N$) đã trừ hết nợ vay, chi phí bán nhà và hoàn trả tiền cọc thuê.                                                                                                              | Total liquidated net wealth accumulated at horizon end (liquidated realizable home equity vs total compounded investment portfolio + deposit).                                                                                                  |
| **Strategy Persona Presets**                     | **Chiến Lược Mẫu / Kịch Bản Điển Hình**               | Các bộ thông số cấu hình sẵn cho các trường hợp thực tế (Chung Cư Đô Thị, Nhà Phố Ngoại Thành, Thuê Nhà & FIRE, Ngắn Hạn & Linh Hoạt).                                                                                                                                       | Predefined realistic scenario configurations (Urban Apartment Condo, Suburban Landed House, FIRE Renter & Investor, Short-Term Mobility).                                                                                                       |
| **5-Second Undo Safeguard**                      | **Nút Hoàn Tác 5 Giây**                               | Thanh thông báo Toast cho phép người dùng khôi phục cài đặt trước đó sau khi nạp chiến lược mẫu.                                                                                                                                                                             | Interactive toast banner with a 5-second undo button allowing users to revert to their previous configuration after applying a preset.                                                                                                          |
| **AI Real Estate Decision Dossier**              | **Hồ Sơ Tư Vấn Bất Động Sản AI**                      | Tài liệu phân tích chuyên sâu định dạng Markdown chứa đầy đủ tham số, dữ liệu dòng tiền và câu hỏi chiến lược để dán vào ChatGPT / Claude / Gemini.                                                                                                                          | Structured analytical Markdown report containing simulation parameters, cashflow metrics, and strategic prompts to feed into AI assistants (ChatGPT, Claude, Gemini).                                                                           |
| **Prompt Blueprints**                            | **Khung Mục Tiêu Tư Vấn AI**                          | 4 định dạng câu hỏi chuyên sâu: Đánh Giá Toàn Diện, Kiểm Tra Căng Thẳng Lãi Suất, Tối Ưu Hóa FIRE, Phân Bổ Tài Sản & Nợ.                                                                                                                                                     | 4 specialized prompt objectives: Holistic Verdict, Interest Rate Stress-Test, FIRE Optimization, and Asset & Debt Allocation.                                                                                                                   |
| **Data Anonymization Mask (Zero-Leak Privacy)**  | **Chế Độ Ẩn Danh Dữ Liệu**                            | Tính năng bảo mật client-side tự động biến đổi số tiền tuyệt đối thành bội số giá nhà và tỷ lệ % trước khi xuất hồ sơ gửi AI.                                                                                                                                                | Client-side sanitization converting absolute monetary amounts into relative home price multiples and percentages before exporting to AI.                                                                                                        |
| **Methodology & Formula Hub**                    | **Trung Tâm Phương Pháp Luận & Công Thức Toán**       | Cửa sổ chuyên khảo cung cấp đầy đủ công thức toán tài chính (KaTeX LaTeX), định nghĩa biến số, minh họa thay số trực tiếp và từ điển thuật ngữ.                                                                                                                              | Dedicated modal repository delivering mathematical proofs (KaTeX LaTeX), variable definitions, live dynamic formula traces, and bilingual glossary.                                                                                             |
| **Dynamic Formula Trace**                        | **Minh Họa Thay Số Thực Tế**                          | Trực quan hóa công thức bằng cách thay thế trực tiếp các số liệu người dùng đang nhập vào phương trình toán để giải thích chi tiết không có "hộp đen".                                                                                                                       | Interactive mathematical display dynamically substituting active user input values into equations (EMI, Equity, PRR) for complete algorithmic transparency.                                                                                     |
| **Simulation Invariants**                        | **Giả Định & Quy Chuẩn Mô Phỏng Cốt Lõi**             | Các nguyên tắc toán học và kinh tế học bất biến chi phối toàn bộ thuật toán mô phỏng (bước nhảy từng tháng, lãi kép liên tục, hoàn trả tiền cọc, bù thâm hụt dòng tiền).                                                                                                     | Invariant mathematical and economic rules governing the simulation (monthly time-steps, continuous compounding, deposit refund, cashflow deficit handling).                                                                                     |
| **Currency & Number Masking**                    | **Định Dạng Số & Phân Cách Hàng Nghìn**               | Định dạng trực tiếp ô nhập tiền với dấu chấm `.` trong tiếng Việt và dấu phẩy `,` trong tiếng Anh, giữ nguyên vị trí con trỏ chuột khi gõ.                                                                                                                                   | Live formatting of numerical monetary input fields with locale-aware thousand separators (dot `.` in `vi`, comma `,` in `en`) while preserving cursor position.                                                                                 |
| **Dynamic Verbal Helper**                        | **Trợ Lý Đọc Số Tiền Thành Chữ**                      | Hiển thị chữ đọc trực tiếp số tiền bên dưới ô nhập liệu (ví dụ: `3.5 Tỷ VND` / `3.5 Billion VND`, `14 Triệu VND` / `14 Million VND`).                                                                                                                                        | Real-time localized verbal representation of monetary numbers (e.g. `3.5 Tỷ VND` / `3.5 Billion VND`, `14 Triệu VND` / `14 Million VND`) displayed under inputs.                                                                                |
| **Contextual Tooltip Popovers `(i)`**            | **Nút Chú Thích Ngữ Cảnh Nổi**                        | Nút bấm `(i)` giải thích chi tiết ý nghĩa từng thuật ngữ tài chính khi di chuột hoặc chạm ngón tay trên điện thoại mà không gây lệch bố cục.                                                                                                                                 | Responsive floating micro-dialog triggered via hover or tap on info `(i)` icons, explaining financial terms with zero layout shifts.                                                                                                            |
