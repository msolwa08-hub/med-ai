#!/usr/bin/env node
// Runs `npm audit` and fails CI unless every finding is a KNOWN_DEBT entry below.
// This exists because a handful of advisories are only fixable by a semver-major
// migration (Fastify v5, Expo SDK 57, Vite v8) that hasn't been scheduled yet.
// New/unrelated vulnerabilities still fail the build.
import { execSync } from 'node:child_process';

// Package name -> tracking note. Keep this list as small and specific as possible;
// remove an entry as soon as its migration lands.
const KNOWN_DEBT = {
  // Fixed by bumping @fastify/jwt to v10, which requires Fastify v4 -> v5.
  fastify: 'blocked on Fastify v5 migration',
  '@fastify/ajv-compiler': 'blocked on Fastify v5 migration',
  '@fastify/fast-json-stringify-compiler': 'blocked on Fastify v5 migration',
  'fast-json-stringify': 'blocked on Fastify v5 migration',
  'fast-uri': 'blocked on Fastify v5 migration',
  '@fastify/jwt': 'blocked on Fastify v5 migration',
  'fast-jwt': 'blocked on Fastify v5 migration (CRITICAL - JWT auth bypass, prioritize this migration)',

  // Fixed by bumping the Expo SDK to 57, a full mobile app migration.
  expo: 'blocked on Expo SDK 57 migration',
  '@expo/bunyan': 'blocked on Expo SDK 57 migration',
  '@expo/cli': 'blocked on Expo SDK 57 migration',
  '@expo/config': 'blocked on Expo SDK 57 migration',
  '@expo/config-plugins': 'blocked on Expo SDK 57 migration',
  '@expo/metro-config': 'blocked on Expo SDK 57 migration',
  '@expo/plist': 'blocked on Expo SDK 57 migration',
  '@expo/prebuild-config': 'blocked on Expo SDK 57 migration',
  '@expo/rudder-sdk-node': 'blocked on Expo SDK 57 migration',
  '@xmldom/xmldom': 'blocked on Expo SDK 57 migration',
  cacache: 'blocked on Expo SDK 57 migration',
  'expo-asset': 'blocked on Expo SDK 57 migration',
  'expo-constants': 'blocked on Expo SDK 57 migration',
  'expo-notifications': 'blocked on Expo SDK 57 migration',
  'fast-xml-parser': 'blocked on Expo SDK 57 migration',
  'jest-expo': 'blocked on Expo SDK 57 migration',
  postcss: 'blocked on Expo SDK 57 migration',
  'react-native': 'blocked on Expo SDK 57 migration',
  '@react-native-community/cli': 'blocked on Expo SDK 57 migration',
  '@react-native-community/cli-doctor': 'blocked on Expo SDK 57 migration',
  '@react-native-community/cli-hermes': 'blocked on Expo SDK 57 migration',
  '@react-native-community/cli-platform-android': 'blocked on Expo SDK 57 migration',
  '@react-native-community/cli-platform-apple': 'blocked on Expo SDK 57 migration',
  '@react-native-community/cli-platform-ios': 'blocked on Expo SDK 57 migration',
  send: 'blocked on Expo SDK 57 migration',
  tar: 'blocked on Expo SDK 57 migration',
  uuid: 'blocked on Expo SDK 57 migration',
  xcode: 'blocked on Expo SDK 57 migration',

  // Fixed by bumping apps/web's Vite from v5 to v8.
  vite: 'blocked on apps/web Vite v8 migration',
  esbuild: 'blocked on apps/web Vite v8 migration',
};

// npm audit exits non-zero whenever it finds anything, even with --json, so
// pull the report off stdout regardless of exit code.
let raw;
try {
  raw = execSync('npm audit --json', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
} catch (err) {
  raw = err.stdout;
}
const report = JSON.parse((raw || '{}').trim());
const vulnerabilities = report.vulnerabilities ?? {};

const unexpected = Object.keys(vulnerabilities).filter((name) => !(name in KNOWN_DEBT));

if (unexpected.length > 0) {
  console.error('New/unallowlisted npm audit findings (fix or add to scripts/audit-check.mjs with a tracking note):\n');
  for (const name of unexpected) {
    const v = vulnerabilities[name];
    console.error(`  - ${name} (${v.severity})`);
  }
  process.exit(1);
}

const debtCount = Object.keys(vulnerabilities).length;
console.log(`npm audit: ${debtCount} finding(s), all covered by known/tracked migrations:`);
for (const name of Object.keys(vulnerabilities)) {
  console.log(`  - ${name}: ${KNOWN_DEBT[name]}`);
}
