<script lang="ts">
    import type { ApiDomainResult } from "$lib/types/api";
    import * as Table from "./ui/table";

    type MxRecord = { exchange: string; priority: number };
    type DnsValue = string | MxRecord;
    type DnsGroup = Record<string, DnsValue[]>;

    let { domain }: { domain: ApiDomainResult } = $props();
</script>

<Table.Root>
    <Table.Body>
        <Table.Row>
            <Table.Head>Nameservers</Table.Head>
            <Table.Cell class="font-medium">
                <ul>
                    {#each domain.nameservers as ns}
                    <li>{ns}</li>
                    {/each}
                </ul>
            </Table.Cell>
        </Table.Row>
        {#each Object.keys(domain.records ?? {}) as dnsType}
        {#if dnsType !== 'ns'}
        {@const group = ((domain.records?.[dnsType] ?? {}) as DnsGroup)}
        <Table.Row>
            <Table.Head>{dnsType.toUpperCase()} records</Table.Head>
            <Table.Cell class="font-medium">
            {#each Object.keys(group) as subdomain}
            <div class="flex gap-2 mt-1">
                <h5 class="font-bold">{subdomain}</h5>
                <div class="break-all" style="white-space: break-spaces;">
                    {#if typeof group[subdomain]?.[0] === 'string'}
                    {@const target = (group[subdomain].reduce((acc, target) => acc+`<div class="even:bg-sidebar-border">${String(target)}</div>`, '') as string).replaceAll('"', '')}
                    {@html target.substring(0, target.length -2)}
                    {:else}
                    {@html group[subdomain].reduce((acc, target) => {
                        const mx = target as MxRecord;
                        return acc+`<div class="even:bg-sidebar-border">${mx.exchange} (${mx.priority})</div>`;
                    }, '')}
                    {/if}
                </div>
            </div>
            {/each}
            </Table.Cell>
        </Table.Row>
        {/if}
        {/each}
    </Table.Body>
</Table.Root>
