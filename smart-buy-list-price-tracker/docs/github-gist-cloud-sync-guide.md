# GitHub Gist Cloud Sync Guide — Smart Buy-List (v3.10.0)

This guide provides step-by-step instructions for configuring, connecting, and utilizing **GitHub Gist Cloud Sync** in Smart Buy-List.

---

## 🌟 Overview & How It Works

Smart Buy-List is an **offline-first, zero-backend, privacy-centric** Progressive Web App (PWA). In addition to Google Drive, users can sync their shopping lists, custom stores, and unit price history directly to their personal **GitHub account** using Secret GitHub Gists.

### Key Highlights:

- 🐙 **Zero Third-Party Backend**: Communicates directly with the official GitHub REST API (`api.github.com`) from your browser using your own Personal Access Token (PAT).
- 🔒 **Private & Secret by Default**: Data is saved as `smart_buy_list_data.json` inside a private, secret Gist (`public: false`). It will not appear in public search feeds.
- 🔍 **Auto-Discovery & Seamless Multi-Device Pairing**: The app automatically searches for your existing backup Gist when you connect on a second device, or allows entering an explicit Gist ID.
- 🔄 **Deterministic Smart Merge**: When syncing across multiple devices, purchase ledger transactions are merged additively to preserve All-Time Lows (ATLs), while active list items synchronize by latest modification timestamps (`updatedAt`).
- 📶 **Offline-First Resiliency**: When offline, changes save locally to IndexedDB and automatically sync to GitHub when connectivity resumes.
- 📄 **Auditable & Exportable**: You can view, audit, copy, or download your raw JSON data at any time directly on GitHub (`https://gist.github.com/<gist_id>`).

---

## 🛠️ Step 1: Generate a GitHub Personal Access Token (PAT) (~1 minute)

To allow the browser application to read and write your secret Gist without an intermediate server, generate a **Classic GitHub Personal Access Token** with the `gist` permission.

> [!IMPORTANT]
> **Token Type**: GitHub's Gist REST API only supports **Classic Personal Access Tokens** (prefixed with `ghp_`). Fine-grained Personal Access Tokens (prefixed with `github_pat_`) do not support Gist endpoints and will be rejected with HTTP 403.

### Method A: 1-Click Pre-Filled Link (Recommended)

1. Click this pre-configured GitHub link:
   👉 **[Generate GitHub Token with `gist` scope](https://github.com/settings/tokens/new?scopes=gist&description=Smart+Buy+List+PWA)**
2. Sign in to GitHub if prompted.
3. Notice that **Note** (`Smart Buy List PWA`) and **Expiration** are pre-filled, and the **`gist`** scope checkbox is pre-checked.
4. Scroll to the bottom and click **Generate token**.
5. Copy the generated token (e.g. `ghp_xxxxxxxxxxxxxxxxxxxx`).
   > [!IMPORTANT]
   > GitHub only displays the token once. Copy it immediately.

### Method B: Manual Classic PAT

1. On GitHub, click your profile icon (top right) > **Settings**.
2. In the left sidebar, click **Developer Settings** > **Personal access tokens** > **Tokens (classic)**.
3. Click **Generate new token** > **Generate new token (classic)**.
4. Set Note to `Smart Buy-List Sync` and check the **`gist`** scope.
5. Click **Generate token** and copy it.

---

## 📲 Step 2: Connecting GitHub Gist in Smart Buy-List

1. Open **Smart Buy-List** in your browser or installed PWA.
2. Tap the Settings icon (⚙️) in the top-right header to open the **Option Hub**.
3. Under **Cloud Sync Provider**, select **🐙 GitHub Gist** from the dropdown.
4. Paste your copied Personal Access Token into the **GitHub Personal Access Token** field.
5. _(Optional)_ If you want to link to a specific existing Gist on a new device, paste its ID into the **Gist ID** field. Otherwise, leave it blank to auto-discover or auto-create a new Gist.
6. Leave **"Remember token on this device"** checked for persistent sync across sessions.
7. Tap **🔗 Connect & Verify**.
8. Upon successful authorization:
   - A success toast will appear: _"Connected to GitHub Gist!"_.
   - The Gist ID will be displayed along with a clickable link: **View on GitHub Gist ↗**.
   - The status pill in Option Hub will display 🟢 **Synced**.

---

## ⚡ Step 3: Day-to-Day Synchronization

Once connected, synchronization operates seamlessly following our **Calm Cloud Sync** protocol:

| Trigger                   | Description                                                                                                                                                                                                       |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Mutations**        | Any change (adding items, editing prices, checking off items, changing stores, completing trips) automatically pushes to GitHub in the background after a relaxed 15-second idle debounce (capped at 45 seconds). |
| **Startup / App Launch**  | Opening the app automatically pulls the latest state from your GitHub Gist, merges any remote changes made on your other devices, and updates your active buy list and price history.                             |
| **Tab Backgrounding**     | Switching away from the tab or locking your screen (`visibilitychange`) immediately flushes any pending debounced cloud sync.                                                                                     |
| **Tab Re-focus / Wakeup** | Returning to the browser tab after more than 120 seconds of inactivity triggers a background refresh.                                                                                                             |
| **Trip Completion**       | Finalizing a shopping trip immediately triggers an expedited cloud push.                                                                                                                                          |

---

## 🎛️ Manual Controls & Cloud Overrides Explained

Inside Option Hub (⚙️ > Cloud Sync > GitHub Gist), you have three distinct synchronization actions:

### 1. 🔄 Sync Now (Two-Way Deterministic 3-Way Merge)

- **What it does**: Fetches the latest remote data from your GitHub Gist, executes a deterministic 3-way merge (`merge3Way`) reconciling active items (by `updatedAt`), purchase ledgers (union by ID), and store profiles with 30-day deletion tombstones, then writes the unified database back to GitHub.
- **When to use**: Everyday routine synchronization between your phone, tablet, and laptop. Safe and non-destructive.

### 2. ⬆️ Force Upload to Cloud (One-Way Master Push)

- **What it does**: Unconditionally serializes your current device's local database and forcefully overwrites the remote file (`smart_buy_list_data.json`) on GitHub Gist without reading or merging remote changes.
- **When to use**: When your cloud backup is corrupted, dirty, or out-of-date, and you want your current device to be the absolute single source of truth.

### 3. ⬇️ Force Download from Cloud (One-Way Master Pull)

- **What it does**: Downloads the remote backup from GitHub Gist and completely replaces your local device database.
- **When to use**: When setting up a new device or discarding local changes to restore from cloud backup.

- **View on GitHub Gist ↗**: Opens your secret Gist on GitHub in a new browser tab.
- **🚪 Disconnect**: Clears the stored token and Gist ID from memory and local storage, returning the app to local-only mode.

---

## ❓ Frequently Asked Questions (FAQ) & Troubleshooting

### Q: What is the difference between "Sync Now" and "Force Upload to Cloud"?

> **A:** **`Sync Now`** is a **two-way merge** that combines changes from both your device and GitHub without deleting data created on either side. In contrast, **`Force Upload to Cloud`** is a **one-way master overwrite** that replaces the entire cloud file with your local device's data, ignoring whatever was on the cloud.

### Q: What happens if I encounter a GitHub API Rate Limit error?

> **A:** GitHub applies an hourly request limit (5,000 requests/hour for authenticated Classic tokens) and secondary rate limits for bursts. When reached, Smart Buy-List automatically inspects the response headers (`x-ratelimit-reset` and `Retry-After`) and displays a precise countdown banner in Settings and toast alerts showing the exact local time and minutes until the limit resets (e.g., _"Đã đạt giới hạn yêu cầu GitHub API. Tự động mở lại lúc 18:45 (sau 25 phút)."_). Offline local operations continue uninterrupted during rate-limit cooldowns.

### Q: Is my GitHub Token secure?

> **A:** Yes. Smart Buy-List is a 100% client-side application with zero intermediary backend servers. Your token is stored exclusively on your device (in browser `localStorage` or session memory) and transmitted only to official GitHub API endpoints (`api.github.com`) over TLS encryption. It is never transmitted anywhere else.

### Q: How do I sync between my phone and computer?

> **A:**
>
> 1. Set up GitHub sync on your first device (e.g. Computer). It will create your backup Gist and show the **Gist ID**.
> 2. Open Smart Buy-List on your second device (e.g. Phone).
> 3. Select **GitHub Gist** as the provider and enter the same Personal Access Token.
> 4. The app will auto-discover the existing Gist. Alternatively, paste the **Gist ID** from step 1 into the Gist ID field and tap **Connect & Verify**.
> 5. Both devices will now sync bidirectionally in real time!

### Q: What scopes does the token need?

> **A:** The token needs a Classic Personal Access Token with the **`gist`** scope. It does **not** need access to your repositories, organizations, workflow, or user profile data. Note: Fine-grained tokens are not supported by GitHub's Gist REST API.

### Q: Why do I see an `HTTP 403 Forbidden` error?

> **A:** An HTTP 403 Forbidden error occurs if:
>
> 1. You generated a Fine-grained PAT (`github_pat_...`) instead of a Classic PAT (`ghp_...`). GitHub's Gist API only supports Classic PATs.
> 2. Your Classic PAT was generated without checking the **`gist`** permission checkbox.
> 3. To fix, click the pre-filled link: **[Generate GitHub Token with `gist` scope](https://github.com/settings/tokens/new?scopes=gist&description=Smart+Buy+List+PWA)**, generate a Classic token, and reconnect.

### Q: Why do I see a `401 Unauthorized` or `Bad credentials` error?

> **A:** This indicates that the Personal Access Token was entered incorrectly or has expired. Generate a new token in GitHub Settings > Developer Settings > Personal access tokens and paste it into Option Hub.

### Q: What happens if I hit GitHub rate limits?

> **A:** Authenticated requests with a Personal Access Token have a generous limit of **5,000 requests per hour** on GitHub. Because Smart Buy-List debounces sync requests with a relaxed 15-second idle delay, normal daily shopping list usage will only consume a tiny fraction (<0.1%) of this hourly limit.
