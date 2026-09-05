// Google Identity Services & Remote Cloud State (OAuth 2.0 GIS)
let googleAuthState = {
  accessToken: null,
  expiresIn: null,
  tokenExpiresAt: null,
  tokenClient: null,
  clientId: null,
  isSyncing: false,
  lastSyncTime: null,
  lastError: null,
};

const GDRIVE_APP_DATA_FILE_NAME = "smart_buy_list_data.json";
const GDRIVE_APP_DATA_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    googleAuthState,
    GDRIVE_APP_DATA_FILE_NAME,
    GDRIVE_APP_DATA_SCOPE,
  };
}
