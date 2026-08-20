'use strict';

/**
 * CyberSource direct Payments API client — full transaction lifecycle.
 *
 * Drop this file into a project, `npm install cybersource-rest-client`, and:
 *
 *   const cybs = require('./cybs-client');
 *   const auth = await cybs.authorize({ amount: '21.00', card: cybs.TEST_CARDS.visa });
 *   await cybs.capture(auth.id, { amount: '21.00' });
 *   await cybs.refund(auth.id, { amount: '21.00' });
 *
 * Credentials resolve from the project's .env first, then ~/.cybs/sandbox.env,
 * so a project with no .env of its own still works against the shared sandbox.
 *
 * No dependencies beyond the CyberSource SDK — the .env parser below exists so
 * this file does not drag dotenv into every project that copies it.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// SDK resolution
// ---------------------------------------------------------------------------

// Normally the SDK sits in the host project's node_modules. When this file runs
// straight out of the skill folder (smoke tests, throwaway checks) there is no
// project around it, so fall back to the copy installed beside the skill.
function loadSdk() {
  try {
    return require('cybersource-rest-client');
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    try {
      // webpackIgnore keeps the bundler from trying to statically resolve this
      // expression — the fallback only ever runs outside a bundle.
      return require(/* webpackIgnore: true */ path.join(__dirname, '..', 'node_modules', 'cybersource-rest-client'));
    } catch (e) {
      throw new Error(
        'cybersource-rest-client is not installed. Run:\n' +
          '  npm install cybersource-rest-client'
      );
    }
  }
}

const cybersourceRestApi = loadSdk();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Deliberately minimal: KEY=VALUE, ignoring blanks, comments and surrounding
// quotes. Enough for credential files, and it keeps this module dependency-free.
function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    out[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const SHARED_ENV_PATH = path.join(os.homedir(), '.cybs', 'sandbox.env');

/**
 * Precedence: real environment > project .env > shared sandbox file. A project
 * that sets its own credentials always wins; the shared file is the fallback so
 * new projects need no setup.
 */
function loadCredentials() {
  const shared = parseEnvFile(SHARED_ENV_PATH);
  const project = parseEnvFile(path.join(process.cwd(), '.env'));
  const pick = (key) => process.env[key] || project[key] || shared[key];

  const merchantID = pick('CYBS_MERCHANT_ID');
  const merchantKeyId = pick('CYBS_KEY_ID');
  const merchantsecretKey = pick('CYBS_SHARED_SECRET');

  if (!merchantID || !merchantKeyId || !merchantsecretKey) {
    throw new Error(
      'Missing CyberSource credentials. Set CYBS_MERCHANT_ID, CYBS_KEY_ID and ' +
        'CYBS_SHARED_SECRET in the environment, in ./.env, or in ' + SHARED_ENV_PATH
    );
  }

  return {
    // The SDK wants exactly these (oddly-cased) keys.
    authenticationType: 'http_signature',
    runEnvironment: pick('CYBS_RUN_ENVIRONMENT') || 'apitest.cybersource.com',
    merchantID,
    merchantKeyId,
    merchantsecretKey,
    logConfiguration: { enableLog: false },
  };
}

function isProduction(config) {
  return !/apitest|-test|sandbox/i.test(config.runEnvironment);
}

// ---------------------------------------------------------------------------
// SDK plumbing
// ---------------------------------------------------------------------------

// The SDK is callback-based and reports failures across three arguments at once.
// Collapse that into a normal rejected promise carrying the HTTP status and the
// parsed body, so callers can branch on real values instead of string-matching.
function call(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (error, data, response) => {
      if (error) {
        let body = (response && (response.body || response.text)) || null;
        // Errors often arrive as a JSON string rather than a parsed object, which
        // would otherwise hide `message` and `details` behind an opaque blob.
        if (typeof body === 'string') {
          try { body = JSON.parse(body); } catch (e) { /* keep the raw string */ }
        }
        const err = new Error(
          (body && (body.message || body.reason)) || error.message || 'CyberSource request failed'
        );
        err.httpStatus = response && response.status;
        err.body = body;
        // Field-level validation problems live here and are the actionable part.
        err.details = (body && body.details) || null;
        return reject(err);
      }
      resolve({ data, status: (response && response.status) || 200 });
    });
  });
}

function api(name) {
  const config = loadCredentials();
  return { instance: new cybersourceRestApi[name](config), config };
}

function amountDetails(amount, currency) {
  return { totalAmount: String(amount), currency: currency || 'USD' };
}

function reference(code) {
  return { code: code || `cybs-${Date.now()}` };
}

/**
 * LOCAL EXTENSION (not in the skill's copy of this file).
 *
 * Merge caller-supplied request blocks — Level II / Level III enhanced data,
 * `merchantInformation`, and anything else CyberSource accepts — on top of the
 * request this client builds.
 *
 * The merge is recursive on purpose. A shallow merge would let an incoming
 * `orderInformation.amountDetails` (carrying only taxAmount and freightAmount)
 * replace the one assembled above it, dropping `totalAmount` — which CyberSource
 * reports as a bare "missing one or more fields" with no field named. Arrays and
 * primitives replace; plain objects merge.
 */
function mergeExtra(request, extra) {
  if (!extra) return request;
  const merged = { ...request };
  for (const [key, value] of Object.entries(extra)) {
    const base = merged[key];
    const mergeable =
      base && value && typeof base === 'object' && typeof value === 'object' &&
      !Array.isArray(base) && !Array.isArray(value);
    merged[key] = mergeable ? mergeExtra(base, value) : value;
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Lifecycle operations
// ---------------------------------------------------------------------------

/**
 * Authorize (capture: false) or sale (capture: true).
 *
 * `billTo` is required whenever a raw card is used — CyberSource rejects the
 * request with MISSING_FIELD otherwise. Use TEST_BILL_TO for sandbox runs.
 *
 * Passing a raw card puts this server in PCI DSS SAQ D scope. For a browser
 * checkout, collect the card with Unified Checkout or Microform and pass
 * `transientToken` instead — the card then never reaches your infrastructure.
 */
async function authorize(opts = {}) {
  const { instance, config } = api('PaymentsApi');
  const { amount, currency, card, transientToken, billTo, capture = false, code, extra } = opts;

  if (!card && !transientToken) {
    throw new Error('Provide either `card` (raw PAN) or `transientToken`.');
  }
  if (card && isProduction(config)) {
    throw new Error(
      `Refusing to send a raw PAN to ${config.runEnvironment}. Use a transient token in production.`
    );
  }

  const request = {
    clientReferenceInformation: reference(code),
    processingInformation: { capture },
    orderInformation: {
      amountDetails: amountDetails(amount, currency),
      ...(billTo ? { billTo } : {}),
    },
    ...(transientToken
      ? { tokenInformation: { transientTokenJwt: transientToken } }
      : { paymentInformation: { card } }),
  };

  const { data, status } = await call(instance.createPayment.bind(instance), mergeExtra(request, extra));
  return { ...data, httpStatus: status };
}

/** Authorize and capture in a single call. */
function sale(opts = {}) {
  return authorize({ ...opts, capture: true });
}

/** Capture a prior authorization. Omit `amount` to capture it in full. */
async function capture(paymentId, opts = {}) {
  const { instance } = api('CaptureApi');
  const request = {
    clientReferenceInformation: reference(opts.code),
    ...(opts.amount
      ? { orderInformation: { amountDetails: amountDetails(opts.amount, opts.currency) } }
      : {}),
  };
  const { data, status } = await call(instance.capturePayment.bind(instance), mergeExtra(request, opts.extra), paymentId);
  return { ...data, httpStatus: status };
}

/**
 * Refund settled funds. Defaults to a follow-on refund against the payment id;
 * pass `{ captureId }` to refund a specific capture instead.
 */
async function refund(paymentId, opts = {}) {
  const { instance } = api('RefundApi');
  const request = {
    clientReferenceInformation: reference(opts.code),
    ...(opts.amount
      ? { orderInformation: { amountDetails: amountDetails(opts.amount, opts.currency) } }
      : {}),
  };
  const { data, status } = opts.captureId
    ? await call(instance.refundCapture.bind(instance), request, opts.captureId)
    : await call(instance.refundPayment.bind(instance), request, paymentId);
  return { ...data, httpStatus: status };
}

/**
 * Cancel a transaction before it settles. Pass `{ captureId }` to void a capture.
 * To release an unsettled authorization, use reverse() instead.
 */
async function voidTransaction(paymentId, opts = {}) {
  const { instance } = api('VoidApi');
  const request = { clientReferenceInformation: reference(opts.code) };
  const { data, status } = opts.captureId
    ? await call(instance.voidCapture.bind(instance), request, opts.captureId)
    : await call(instance.voidPayment.bind(instance), request, paymentId);
  return { ...data, httpStatus: status };
}

/** Release the hold from an authorization that will never be captured. */
async function reverse(paymentId, opts = {}) {
  const { instance } = api('ReversalApi');
  const request = {
    clientReferenceInformation: reference(opts.code),
    reversalInformation: {
      amountDetails: { totalAmount: String(opts.amount) },
      ...(opts.reason ? { reason: opts.reason } : {}),
    },
  };
  const { data, status } = await call(instance.authReversal.bind(instance), request, paymentId);
  return { ...data, httpStatus: status };
}

/** Look up a transaction after the fact (Transaction Search API). */
async function getTransaction(transactionId) {
  const { instance } = api('TransactionDetailsApi');
  const { data, status } = await call(instance.getTransaction.bind(instance), transactionId);
  return { ...data, httpStatus: status };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Sandbox test cards. `type` is the CyberSource card code, not the brand name.
const TEST_CARDS = {
  visa: { number: '4111111111111111', expirationMonth: '12', expirationYear: '2031', securityCode: '123', type: '001' },
  mastercard: { number: '5555555555554444', expirationMonth: '12', expirationYear: '2031', securityCode: '123', type: '002' },
  amex: { number: '378282246310005', expirationMonth: '12', expirationYear: '2031', securityCode: '1234', type: '003' },
  discover: { number: '6011111111111117', expirationMonth: '12', expirationYear: '2031', securityCode: '123', type: '004' },
};

// A complete billing address for sandbox runs. Card payments require billTo;
// real integrations pass the shopper's actual address instead.
const TEST_BILL_TO = {
  firstName: 'John',
  lastName: 'Doe',
  address1: '1 Market St',
  locality: 'San Francisco',
  administrativeArea: 'CA',
  postalCode: '94105',
  country: 'US',
  email: 'jd@example.com',
  phoneNumber: '4155551234',
};

/**
 * Mask card data for logging. Never log a request containing a raw PAN without
 * running it through this first — terminal output gets pasted into tickets.
 */
function redact(request) {
  if (!request || !request.paymentInformation || !request.paymentInformation.card) return request;
  const card = request.paymentInformation.card;
  return {
    ...request,
    paymentInformation: {
      ...request.paymentInformation,
      card: {
        ...card,
        number: String(card.number).slice(0, 6) + '••••••' + String(card.number).slice(-4),
        securityCode: '•••',
      },
    },
  };
}

module.exports = {
  authorize,
  sale,
  capture,
  refund,
  void: voidTransaction,
  voidTransaction,
  reverse,
  getTransaction,
  TEST_CARDS,
  TEST_BILL_TO,
  redact,
  loadCredentials,
  SHARED_ENV_PATH,
};
