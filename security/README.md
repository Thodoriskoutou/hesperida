Based on https://github.com/BruceWy4ne/web-vuln-scanner

## risk level score

- info = 0
- low = 1
- medium = 3
- high = 7
- critical = 10

## get nuclei templates db

https://nuclei-templates.netlify.app/db.json.gz

check https://api.github.com/repos/projectdiscovery/nuclei-templates/releases/latest  .tag_name
against the db.json .version, if the github is newer re-download

## runtime diagnostics and optional tuning

The security tool runs nuclei, Wapiti, and Nikto in parallel. Results include per-scanner timing metadata under `raw.scanner_metrics` so slow scans can be attributed to the scanner that is still working or waiting on target responses.

Optional environment variables:

- `SECURITY_NIKTO_TIMEOUT`: wrapper-level Nikto process timeout in seconds. Production default: `600`.
- `SECURITY_NIKTO_REQUEST_TIMEOUT`: Nikto per-request timeout, passed to `nikto -timeout`. Production default: `6`.
- `SECURITY_WAPITI_MAX_SCAN_TIME`: Wapiti total scan limit, passed to `wapiti --max-scan-time`. Production default: `600`.
- `SECURITY_WAPITI_MAX_ATTACK_TIME`: Wapiti per-attack-module limit, passed to `wapiti --max-attack-time`. Production default: `120`.
- `SECURITY_NUCLEI_TIMEOUT`: Nuclei request timeout, passed to `nuclei -timeout`. Production default: `8`.
- `SECURITY_NUCLEI_RETRIES`: Nuclei retry count, passed to `nuclei -retries`. Production default: `1`.

These defaults favor web-facing findings and predictable runtime. Increase them for deeper, slower network-fingerprint coverage.

When `DEBUG=true`, each scanner logs start/end timing, exit status, timeout state, and a bounded stderr tail.
