export const msalConfig = {
  auth: {
    clientId: "9d415839-9ee7-4830-8dc3-ccf5a34af2b9", // Replace with your Azure AD app client ID
    authority: "https://login.microsoftonline.com/54df8ee5-42ab-4c14-b444-1b54f749b225",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "User.ReadBasic.All",
    "People.Read"
  ]
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};