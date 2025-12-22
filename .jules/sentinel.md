## 2024-05-23 - Weak Random Number Generation
**Vulnerability:** Usage of `Math.random()` for password generation and session IDs.
**Learning:** `Math.random()` is not cryptographically secure and can be predicted, making it unsuitable for security-sensitive values.
**Prevention:** Always use Node.js `crypto` module (`crypto.randomInt`, `crypto.randomBytes`) for generating secrets, passwords, tokens, or IDs.
