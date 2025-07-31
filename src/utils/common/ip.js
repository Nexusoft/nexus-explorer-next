/**
 * Utility functions for extracting client IP addresses from server requests
 *
 * CONTEXT: In production, requests pass through multiple network layers:
 * Client → CDN → Load Balancer → Reverse Proxy → Next.js App
 *
 * Without proper handling, we'd only see the last proxy's IP, not the real client.
 * This is why we need to check specific headers that preserve the original client IP.
 */

/**
 * Extract client IP address from Next.js request object
 * Handles various proxy headers and fallback scenarios in order of reliability
 *
 * @param {object} req - Next.js request object
 * @returns {string} - Client IP address (original user, not proxy)
 */
export function getClientIpFromRequest(req) {
  // Extract all possible IP sources from headers and connection
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  const remoteAddress =
    req.socket?.remoteAddress || req.connection?.remoteAddress;

  // PRIORITY 1: x-forwarded-for (Industry Standard)
  // This header contains a chain of IPs from every proxy the request passed through
  // The leftmost IP is always the original client.
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    // The leftmost IP is ALWAYS the original client (before any proxies)
    return ips[0];
  }

  // PRIORITY 2: x-real-ip (Simple Alternative)
  // Used by some reverse proxies (like Nginx) as a simpler alternative
  // Contains only the original client IP (no proxy chain)
  // More reliable than x-forwarded-for in simple proxy setups
  if (realIp) return realIp;

  // PRIORITY 3: cf-connecting-ip (Cloudflare Specific)
  // Cloudflare's proprietary header containing the real client IP
  // Only present when your app is behind Cloudflare CDN
  // More accurate than x-forwarded-for when using Cloudflare
  if (cfConnectingIp) return cfConnectingIp;

  // PRIORITY 4: remoteAddress (Direct Connection)
  // The IP address of the direct TCP connection to your server
  // Only accurate when there are NO proxies/load balancers in between
  // Common in development or simple deployments
  if (remoteAddress) {
    // Node.js sometimes wraps IPv4 addresses in IPv6 format
    // Example: "::ffff:192.168.1.100" should become "192.168.1.100"
    return remoteAddress.replace(/^::ffff:/, '');
  }

  // NO FALLBACK: Return null when IP cannot be determined
  // For DDOS protection, it's better to omit the header entirely rather than send fake data
  //
  // WHY NO FALLBACK FOR DDOS PROTECTION:
  // 1. ACCURACY MATTERS: DDOS protection systems need real IPs for rate limiting and blocking
  // 2. AVOID CONFUSION: Fake IPs like 127.0.0.1 could group all "unknown" requests under localhost
  // 3. EXPLICIT FAILURE: null indicates "IP unknown" rather than providing misleading information
  // 4. PROPER HANDLING: Upstream code can decide whether to omit the header or handle differently
  //
  // The calling code will check for null and omit the x-requested-by header entirely
  // when the real client IP cannot be determined
  return null;
}

/**
 * Add x-requested-by header to axios config with client IP
 *
 * PURPOSE: Adds the original client's IP address to request headers for DDOS protection.
 * Only call this function when you know you're making a request that needs the IP header.
 *
 * @param {object} config - Axios request configuration object
 * @param {object} req - Next.js request object (contains client IP info)
 * @returns {object} - Modified config with x-requested-by header if IP detected
 */
export function addIpHeaderToAxiosConfig(config, req = null) {
  // Early return if we don't have the required parameters
  if (!req) return config;

  // Extract the real client IP using our robust IP detection logic
  const clientIp = getClientIpFromRequest(req);

  // Only add the header if we successfully detected a real client IP
  // For DDOS protection, it's better to omit the header than send fake/unknown IPs
  if (clientIp) {
    // Ensure headers object exists (axios config might not have headers yet)
    if (!config.headers) {
      config.headers = {};
    }

    // Add the x-requested-by header with the client's real IP address
    config.headers['x-requested-by'] = clientIp;
  }
  // If clientIp is null, we intentionally omit the x-requested-by header
  // This way the DDOS protection system knows the IP is unknown rather than getting fake data

  return config;
}
