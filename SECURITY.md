# Security Policy

Aegis MVP Launchpad is a reference implementation for an MVP estimation portal. It is not a security certification.

## Current safeguards

- configurable CORS allowlist
- optional API-key enforcement
- bounded request fields and financial inputs
- bounded SSE subscriber queues
- capped persisted project logs
- generic health endpoint
- dependency-pinned backend runtime
- CI and CodeQL scanning

## Production requirements

Before exposing the service to the public internet, add real authentication/authorization, rate limiting, per-user/project access control, persistent production storage, secret management, audit logging, encrypted transport, and abuse protection.

Never place secrets, customer documents, credentials, or private prompts in Git.

## Vulnerability reporting

Use the repository's private security reporting channel rather than opening a public issue. Include reproduction steps, impact, and affected component; do not include secrets.
