export const API_URL = process.env.REACT_APP_BACKEND_URL;
export const SOCKET_URL = (API_URL || "").replace(/\/api\/?$/, "");
