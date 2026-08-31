# Google Drive Cloud Sync Guide — Smart Buy-List (v3.9.0)

This guide provides step-by-step instructions for configuring, connecting, and utilizing **Google Drive Cloud Sync** in Smart Buy-List.

---

## 🌟 Overview & How It Works

Smart Buy-List is an **offline-first, zero-backend, privacy-centric** Progressive Web App (PWA). Rather than requiring third-party accounts or storing your personal shopping data on external servers, the application communicates directly with your personal **Google Drive** using the official Google Identity Services (GIS) and Google Drive REST API v3.

### Key Highlights:

- 🔒 **Privacy-First & Hidden AppData**: Data is stored inside Google Drive's hidden `appDataFolder` (`smart_buy_list_data.json`). It will **not** clutter your regular Google Drive files and cannot be accidentally modified or deleted by other applications.
- 🛡️ **Zero-Backend Security**: Your OAuth access tokens remain strictly in browser memory and are never stored in `localStorage` or transmitted to any middleman server.
- 🔄 **Deterministic Multi-Device Smart Merge**: When syncing across phone, tablet, and desktop, shopping lists merge by latest modification timestamps (`updatedAt`), while historical purchase ledger transactions are merged additively to preserve price tracking intelligence (All-Time Lows).
- 📶 **Offline-First Resiliency**: When offline, the app operates uninterrupted with IndexedDB; modifications are automatically queued and synced when connection resumes.

---

## 🛠️ Step 1: One-Time Google Cloud OAuth Client ID Setup (~2 minutes)

Because Smart Buy-List has no centralized server, each user creates their own free Google OAuth 2.0 Client ID. This gives you complete ownership and security over your API quotas and data access.

### 1.1. Create a Project in Google Cloud Console

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.
3. Click the project dropdown in the top navigation bar and click **New Project**.
4. Name the project (e.g. `Smart Buy List`) and click **Create**.

### 1.2. Enable Google Drive API

1. In the Google Cloud Console, open the navigation menu (☰) > **APIs & Services** > **Library**.
2. Search for **Google Drive API**.
3. Select **Google Drive API** and click **Enable**.

### 1.3. Configure the OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** and click **Create**.
3. Enter the required basic fields:
   - **App name**: `Smart Buy-List`
   - **User support email**: _Your email address_
   - **Developer contact information**: _Your email address_
4. Click **Save and Continue**.
5. _(Optional)_ In the **Scopes** step, you can leave it blank or add `https://www.googleapis.com/auth/drive.appdata`. Click **Save and Continue**.
6. In the **Test users** step, click **+ Add Users**, enter your Google account email, and click **Add**.
7. Click **Save and Continue** > **Back to Dashboard**.

### 1.4. Create OAuth 2.0 Client ID

1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. In **Application type**, select **Web application**.
4. Set **Name** (e.g. `Smart Buy List Web Client`).
5. Under **Authorized JavaScript origins**, click **+ Add URI** and enter the URLs where you access the tool:
   - If using local files or local server:
     - `http://localhost`
     - `http://localhost:3000`
     - `http://localhost:8080`
     - `http://127.0.0.1`
     - `http://127.0.0.1:8080`
   - If using GitHub Pages or a custom domain:
     - `https://yourusername.github.io`
     - `https://your-custom-domain.com`
6. Click **Create**.
7. A dialog will display your **Client ID** (format: `1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`). Copy this Client ID.

---

## 📲 Step 2: Connecting Google Drive in Smart Buy-List

1. Open **Smart Buy-List** in your web browser.
2. Open the **Option Hub** by tapping the Settings icon (⚙️) in the top-right header.
3. Scroll down to Section 4: **Google Drive Cloud Sync**.
4. Paste your copied **Google OAuth 2.0 Client ID** into the input field.
5. Tap the **💾 (Save)** button next to the input.
6. Tap **🔑 Sign in with Google**.
7. In the Google authentication popup, select your Google account and grant permission to connect with Google Drive AppData.
8. Upon successful authorization:
   - A success toast will appear: _"Connected to Google Drive!"_.
   - The status pill in Option Hub will display 🟢 **Synced**.

---

## ⚡ Step 3: Day-to-Day Synchronization

Once connected, synchronization runs automatically following our **Calm Cloud Sync** protocol:

| Trigger                   | Description                                                                                                                                                                                                                     |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data Mutations**        | Any change (adding items, toggling checkboxes, editing shelf prices, modifying stores, finalizing trips) automatically pushes to Google Drive in the background after a relaxed 15-second idle debounce (capped at 45 seconds). |
| **Startup / App Launch**  | Opening the app automatically checks Google Drive, fetches any remote changes made on other devices, and merges them into your active list.                                                                                     |
| **Tab Backgrounding**     | Switching away from the tab or locking your screen (`visibilitychange`) immediately flushes any pending debounced cloud sync.                                                                                                   |
| **Tab Re-focus / Wakeup** | Returning to the browser tab after more than 120 seconds of inactivity triggers a background refresh.                                                                                                                           |
| **Trip Completion**       | Finalizing a shopping trip immediately triggers an expedited cloud push.                                                                                                                                                        |

---

## 🎛️ Manual Controls & Overrides

Inside Option Hub (⚙️ > Google Drive Cloud Sync), you can perform manual operations:

- **🔄 Sync Now**: Immediately executes a bidirectional smart merge with Google Drive.
- **Force Upload to Cloud**: Overwrites the cloud backup with your current local device database.
- **Force Download from Cloud**: Overwrites your local device database with the latest cloud file.
- **🚪 Disconnect Drive**: Revokes and purges the active in-memory access token, reverting the app to local-only mode.

---

## ❓ Frequently Asked Questions (FAQ) & Troubleshooting

### Q: Where is my data stored on Google Drive?

> **A:** Data is saved in the isolated **AppData folder** (`spaces=appDataFolder`). This folder is private to the application and does not appear in your main Google Drive directory, preventing accidental deletion or modification.

### Q: What happens if I go offline?

> **A:** Smart Buy-List is 100% offline-first. When there is no internet connection, the status pill shows ⚪ **Local / Offline**. All changes continue saving to IndexedDB locally. As soon as you regain internet access and trigger an action or refresh, data merges with Google Drive.

### Q: How do I sync across multiple devices (Phone, Tablet, PC)?

> **A:**
>
> 1. In Google Cloud Console, ensure the origins (or domain) for all devices are in **Authorized JavaScript origins**.
> 2. On each device, open Option Hub (⚙️), enter the same Client ID, and click **🔑 Sign in with Google**.
> 3. Your active grocery list, store catalog, and price history will sync seamlessly across all devices.

### Q: Why do I see an `origin_mismatch` or `access_denied` error?

> **A:**
>
> - **`origin_mismatch`**: The current browser URL is not listed under **Authorized JavaScript origins** in Google Cloud Console. Add your current URL (including port if applicable) in Credentials > OAuth 2.0 Client ID.
> - **`access_denied`**: Ensure your Google account email is added under **Test users** on the **OAuth consent screen** in Google Cloud Console.
