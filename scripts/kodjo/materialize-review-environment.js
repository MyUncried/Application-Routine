#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CONTRACT_FILES = ['app.json', 'app.config.js', 'eas.json', 'package.json', 'package-lock.json'];

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function comparablePackage(pkg) {
  const dependencies = { ...(pkg.dependencies || {}) };
  delete dependencies['expo-updates'];
  return {
    name: pkg.name,
    main: pkg.main,
    version: pkg.version,
    dependencies,
    devDependencies: pkg.devDependencies || {},
    scripts: pkg.scripts || {},
    private: pkg.private,
  };
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function ready(deliveryDir, contractRoot) {
  const deliveryConfig = path.join(deliveryDir, 'app.config.js');
  if (!fs.existsSync(deliveryConfig)) return false;
  const deliveryPackage = json(path.join(deliveryDir, 'package.json'));
  const contractPackage = json(path.join(contractRoot, 'package.json'));
  return deliveryPackage.dependencies?.['expo-updates'] === contractPackage.dependencies?.['expo-updates'] &&
    CONTRACT_FILES.every(file => fs.existsSync(path.join(deliveryDir, file)));
}

function materialize(options) {
  const contractRoot = path.resolve(options.contractRoot);
  const deliveryDir = path.resolve(options.deliveryDir);
  const compatibilityFile = path.resolve(options.compatibilityFile);
  const evidenceFile = path.resolve(options.evidenceFile);
  const protocolHead = String(options.protocolHead || '');
  const applicationHead = String(options.applicationHead || '');

  if (!/^[0-9a-f]{40}$/.test(protocolHead)) fail('ENV_CONTRACT_PROTOCOL_HEAD_INVALID');
  if (!/^[0-9a-f]{40}$/.test(applicationHead)) fail('ENV_CONTRACT_APPLICATION_HEAD_INVALID');
  if (!fs.statSync(deliveryDir).isDirectory()) fail('ENV_CONTRACT_DELIVERY_DIR_INVALID');

  const compatibility = json(compatibilityFile);
  if (compatibility.schema !== 'kodjo.environment.update-compatibility.v1') {
    fail('ENV_CONTRACT_COMPATIBILITY_INVALID');
  }

  const before = {};
  for (const file of CONTRACT_FILES) {
    const target = path.join(deliveryDir, file);
    before[file] = fs.existsSync(target) ? hash(target) : null;
  }

  let overlayApplied = false;
  if (!ready(deliveryDir, contractRoot)) {
    if (compatibility.status !== 'OTA_COMPATIBLE') fail('ENV_CONTRACT_HISTORICAL_OVERLAY_REFUSED');

    const deliveryPackage = json(path.join(deliveryDir, 'package.json'));
    const contractPackage = json(path.join(contractRoot, 'package.json'));
    if (!same(comparablePackage(deliveryPackage), comparablePackage(contractPackage))) {
      fail('ENV_CONTRACT_PACKAGE_DRIFT');
    }
    if (!contractPackage.dependencies?.['expo-updates']) fail('ENV_CONTRACT_EXPO_UPDATES_MISSING');

    for (const file of CONTRACT_FILES) {
      const source = path.join(contractRoot, file);
      if (!fs.existsSync(source)) fail('ENV_CONTRACT_SOURCE_MISSING:' + file);
      fs.copyFileSync(source, path.join(deliveryDir, file));
    }

    compatibility.status = 'NATIVE_REBUILD_REQUIRED';
    compatibility.native_sensitive_files = [...new Set([
      ...(compatibility.native_sensitive_files || []),
      ...CONTRACT_FILES,
    ])].sort();
    compatibility.environment_bootstrap_required = true;
    overlayApplied = true;
  }

  compatibility.application_head = applicationHead;
  compatibility.environment_contract_head = protocolHead;
  compatibility.environment_contract_files = CONTRACT_FILES;
  fs.writeFileSync(compatibilityFile, JSON.stringify(compatibility, null, 2) + '\n', 'utf8');

  const after = {};
  for (const file of CONTRACT_FILES) {
    const source = path.join(contractRoot, file);
    const target = path.join(deliveryDir, file);
    if (!fs.existsSync(source) || !fs.existsSync(target) || hash(source) !== hash(target)) {
      fail('ENV_CONTRACT_MATERIALIZATION_MISMATCH:' + file);
    }
    after[file] = hash(target);
  }

  const evidence = {
    schema: 'kodjo.environment.review-contract.v1',
    application_head: applicationHead,
    environment_contract_head: protocolHead,
    overlay_applied: overlayApplied,
    overlay_files: CONTRACT_FILES,
    before_sha256: before,
    after_sha256: after,
    resulting_compatibility: compatibility.status,
  };
  fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  return evidence;
}

function main(argv) {
  const [deliveryDir, compatibilityFile, evidenceFile, protocolHead, applicationHead] = argv;
  if (!deliveryDir || !compatibilityFile || !evidenceFile) {
    fail('USAGE: materialize-review-environment.js <delivery-dir> <compatibility.json> <evidence.json> <protocol-head> <application-head>');
  }
  const result = materialize({
    contractRoot: process.cwd(), deliveryDir, compatibilityFile, evidenceFile, protocolHead, applicationHead,
  });
  process.stdout.write('[KODJO_ENV] review contract materialized — overlay=' + result.overlay_applied + '\n');
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(String(error && error.message ? error.message : error) + '\n'); process.exit(1); }
}

module.exports = { materialize, comparablePackage, CONTRACT_FILES };
