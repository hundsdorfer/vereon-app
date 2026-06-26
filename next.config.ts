import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Erlaubt Next.js Dev-Server-Zugriff von lokalen Netzwerk-IPs (z.B. Handy im WLAN).
  // Nur im Dev-Modus aktiv. Hostnamen ohne Protokoll/Port — Port wird intern gestripped.
  allowedDevOrigins: [
    '192.168.*.*', // RFC 1918 Class C
    '10.*.*.*',    // RFC 1918 Class A
    '172.*.*.*',   // RFC 1918 Class B (172.16–31)
  ],
};

export default nextConfig;
