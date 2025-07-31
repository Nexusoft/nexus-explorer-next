import { createProxyMiddleware } from 'http-proxy-middleware';
import { API_URLS } from 'types/ConstantsTypes';
import { getClientIpFromRequest } from 'utils/common/ip';

// Create proxy instance outside of request handler function to avoid unnecessary re-creation
const apiProxy = createProxyMiddleware({
  target: process.env.NEXT_PUBLIC_TESTNET_BASE_URL,
  changeOrigin: true,
  pathRewrite: { [`^${API_URLS.TESTNET}`]: '' },
  secure: false,
  onProxyReq: (proxyReq, req) => {
    // Add the x-requested-by header with the client's IP address
    // Only add the header if we can determine the real client IP
    const clientIp = getClientIpFromRequest(req);
    if (clientIp) {
      proxyReq.setHeader('x-requested-by', clientIp);
    }
    // If clientIp is null, we omit the header for DDOS protection accuracy
  },
});

export default function handler(req, res) {
  apiProxy(req, res, (result) => {
    if (result instanceof Error) {
      throw result;
    }

    throw new Error(
      `Request '${req.url}' is not proxied! We should never reach here!`
    );
  });
}

export const config = { api: { externalResolver: true, bodyParser: false } };
