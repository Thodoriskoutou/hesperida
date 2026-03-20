
import type { Tool } from "./types"

export const tools:Tool[] = ['probe', 'seo', 'ssl', 'wcag', 'whois', 'domain']; // TODO security (don't forget to also update the schema)

export const domainTools:Tool[] = ['ssl']; // tools that need a domain argument instead of url
export const slowTools:Tool[] = ['seo', 'wcag']; // tools that use a browser mostly

export const restrictedTLDs: string[] = ['es', 'va', 'az', 'vn', 'gr']; // no whois/rdap server