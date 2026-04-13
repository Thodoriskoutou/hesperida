<script lang="ts" module>
    export type ScoreChartItem = {
        tool: string;
        label: string;
        score: number;
        index?: number;
    }
</script>
<script lang="ts">
    import * as Chart from "$lib/components/ui/chart/index.js";
    import { Arc, ArcChart, Text } from "layerchart";

    let { scores }: { scores: ScoreChartItem[] } = $props();

    const chartConfig = $derived(scores.reduce((acc, item, i) => {
        // @ts-expect-error TODO(upstream layerchart/shadcn): runtime accepts dynamic chart keys.
        acc[item.tool] = {
            label: item.label,
            color: `var(--chart-${i + 1})`
        }
        return acc;
    }, {}) satisfies Chart.ChartConfig);
</script>

<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px]">
    <ArcChart
    label="tool"
    value="score"
    outerRadius={-17}
    innerRadius={-12.5}
    padding={20}
    range={[180, -180]}
    maxValue={100}
    cornerRadius={20}
    series={scores.map((d, i) => ({
        key: d.tool,
        color: `var(--chart-${i + 1})`,
        data: [d],
        label: d.label,
        index: i
    }))}
    props={{
        arc: { track: { fill: "var(--muted)" }, motion: "tween" },
        tooltip: { context: { hideDelay: 350 } },
    }}
    >
        {#snippet tooltip()}
            <Chart.Tooltip hideLabel>
                {#snippet formatter({ value, payload, item })}
                    {#key item}
                    {@const markerColor = String(payload?.[0]?.color ?? "currentColor")}
                    <div class="shrink-0 rounded-xs border-(--color-border) bg-(--color-bg) size-2.5" style="--color-bg: {markerColor}; --color-border: {markerColor};"></div>
                    {/key}                    
                    <div class="flex flex-1 shrink-0 justify-between leading-none items-center">
                        <div class="grid gap-1.5">
                            <span class="text-muted-foreground">{payload[0].payload.label}</span>
                        </div>
                        <span class="text-foreground font-mono font-semibold tabular-nums">{(value as number).toFixed(2)}%</span>
                    </div>
                {/snippet}
            </Chart.Tooltip>
        {/snippet}
        {#snippet arc({ props, seriesIndex, context })}
          <Arc {...props}>
            {#snippet children({ getTrackTextProps })}
              <Text
                {...getTrackTextProps("middle", { startOffset: "1%" })}
                class="pointer-events-none capitalize select-none"
                value={context.data[seriesIndex].label + ' ' + context.data[seriesIndex].score.toFixed(2) + '%'}
                fill="white"
              />
            {/snippet}
          </Arc>
        {/snippet}
    </ArcChart>
</Chart.Container>
