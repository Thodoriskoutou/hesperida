<script lang="ts">
    import type { Domain } from "$lib/types";
    import * as Table from "./ui/table";

    let { domain }: { domain: Domain } = $props();
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
        {#each Object.keys(domain.records!) as dnsType}
        {#if dnsType !== 'ns'}
        {@const group = domain.records? domain.records[dnsType] : {}}
        <Table.Row>
            <Table.Head>{dnsType.toUpperCase()} records</Table.Head>
            <Table.Cell class="font-medium">
            {#each Object.keys(group) as subdomain}
            <div class="flex gap-2 mt-1">
                <h5 class="font-bold">{subdomain}</h5>
                <div class="break-all" style="white-space: break-spaces;">
                    {#if typeof group[subdomain][0] === 'string'}
                    {@const target = (group[subdomain].reduce((acc, target) => acc+`<div class="even:bg-sidebar-border">${target}</div>`, '') as string).replaceAll('"', '')}
                    {@html target.substring(0, target.length -2)}
                    {:else}
                    {@html group[subdomain].reduce((acc, target) => acc+`<div class="even:bg-sidebar-border">${(target as any).exchange} (${(target as any).priority})</div>`, '')}
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