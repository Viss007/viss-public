/**
 * Static hire-me assets from website-templates/public (no PHP).
 */
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PUBLIC_ROOT = path.join(__dirname, "..", "website-templates", "public");

const STATIC_PREFIXES = [
  "/css/",
  "/js/",
  "/images/",
  "/videos/",
  "/build/",
  "/modulus-booking-build/",
  "/agent/",
  "/vendor/",
  "/livewire/",
];

function fileExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

export function mountStaticPublic(gateway) {
  gateway.get("/", (_req, res) => res.redirect(302, "/about"));
  gateway.get("/about", (_req, res) => res.sendFile(path.join(PUBLIC_ROOT, "about.html")));
  gateway.get("/about.html", (_req, res) => res.redirect(302, "/about"));
  gateway.get("/media", (_req, res) => res.sendFile(path.join(PUBLIC_ROOT, "media.html")));
  gateway.get("/media.html", (_req, res) => res.redirect(302, "/media"));
  gateway.get("/websites.html", (_req, res) => res.redirect(302, "/websites"));
  gateway.get("/hire-me", (_req, res) => res.redirect(302, "/#hire-me"));
  gateway.get("/hire%20me", (_req, res) => res.redirect(302, "/#hire-me"));

  gateway.use(
    express.static(PUBLIC_ROOT, {
      index: false,
      fallthrough: true,
    }),
  );

  gateway.use((req, res, next) => {
    const p = req.path;
    if (STATIC_PREFIXES.some((pre) => p.startsWith(pre))) {
      return next();
    }
    if (/\.[a-z0-9]+$/i.test(p)) {
      const abs = path.join(PUBLIC_ROOT, p.replace(/^\//, ""));
      if (fileExists(abs)) {
        return res.sendFile(abs);
      }
    }
    next();
  });
}

export function isLikelyStaticPath(pathname) {
  if (pathname === "/about" || pathname === "/media") return true;
  if (STATIC_PREFIXES.some((pre) => pathname.startsWith(pre))) return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    const abs = path.join(PUBLIC_ROOT, pathname.replace(/^\//, ""));
    return fileExists(abs);
  }
  return false;
}
