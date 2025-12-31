# Security Vulnerabilities - Status Report

## Fixed Vulnerabilities

The following vulnerabilities have been addressed via npm overrides in `package.json`:

1. **qs** (GHSA-6rw7-vpxm-498p) - Fixed by forcing version >= 6.14.1
   - Severity: High
   - Issue: ArrayLimit bypass in bracket notation allows DoS via memory exhaustion
   - Status: ✅ Fixed via npm overrides

2. **tmp** (GHSA-52f5-9888-hmc6) - Fixed by forcing version >= 0.2.4
   - Severity: Low
   - Issue: Allows arbitrary temporary file/directory write via symbolic link
   - Status: ✅ Fixed via npm overrides

3. **glob** (GHSA-5j98-mcp5-4vw2) - Fixed by forcing version >= 11.1.0
   - Severity: High
   - Issue: Command injection via -c/--cmd executes matches with shell:true
   - Status: ✅ Fixed via npm overrides

## Known Vulnerability - No Fix Available

### xlsx Package (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
- **Severity**: High
- **Issues**: 
  - Prototype Pollution
  - Regular Expression Denial of Service (ReDoS)
- **Status**: ⚠️ No fix available
- **Usage**: Used in `src/classes/classes.service.ts` for Excel file import functionality
- **Risk Assessment**: 
  - The package is used only for processing Excel files uploaded by authenticated users
  - Files are processed server-side with controlled inputs
  - Consider implementing file size limits and validation
  - Monitor for package updates that address these vulnerabilities
- **Mitigation Recommendations**:
  1. Implement strict file size limits (e.g., max 10MB)
  2. Validate file types before processing
  3. Consider rate limiting on the upload endpoint
  4. Monitor the xlsx package for security updates
  5. Consider alternative Excel parsing libraries if acceptable alternatives become available

## Current Status

✅ **All fixable vulnerabilities have been resolved!**

As of the latest `npm audit`:
- **3 high-severity vulnerabilities fixed** (qs, glob, tmp)
- **1 high-severity vulnerability remains** (xlsx - no fix available)

### Existing Security Measures for xlsx Usage

The xlsx package is used with the following protections in place:

1. **Frontend validation** (in `angular-frontend/src/app/pages/classes/classes.component.ts`):
   - File type validation: Only `.xlsx` and `.xls` files are accepted
   - File size limit: 10MB maximum
   - MIME type checking

2. **Backend processing**:
   - Files are processed server-side with authenticated users only
   - Files are processed from memory buffers (not written to disk first)
   - Processing is done in a controlled environment

3. **Recommendations for Enhanced Security**:
   - Consider adding file size limits in the backend `FileInterceptor` configuration (currently only frontend-limited)
   - Consider adding rate limiting to the `/classes/import-digitalization` endpoint
   - Monitor the xlsx package repository for security updates
   - Consider alternative Excel parsing libraries if they become available (e.g., `exceljs`)

### Node.js Version Note

Some packages show warnings about requiring Node.js 20+ (you're currently on v18.20.8). These are warnings only and shouldn't prevent the application from running. Consider upgrading to Node.js 20 or 22 LTS for better compatibility with newer packages.

