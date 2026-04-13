<script lang="ts">
  import { geoPath, geoOrthographic } from 'd3-geo';
  import { feature } from 'topojson-client';
  import world from "$lib/assets/countries-110m.json";
  import type { MouseEventHandler } from 'svelte/elements';

  type Point = {
    lat: number;
    lon: number;
  };

  let { point, trigger, width = 500, height = 500, scale = 200 }: { point: Point; trigger?: MouseEventHandler<SVGCircleElement>, width?: number, height?: number, scale?: number } = $props();
  
  //@ts-ignore
  let countries = $derived(feature(world, world.objects.countries).features);

  // 2. Setup Projection (Orthographic = Globe)
  let projection = $derived(geoOrthographic()
    .scale(scale)
    .translate([width / 2, height / 2])
    .rotate([-point.lon, -point.lat]));

  let pathGenerator = $derived(geoPath().projection(projection));
  //@ts-ignore
  let [x, y] = $derived(projection([point.lon, point.lat]));

</script>

<div class="map-container">
  <svg {width} {height} viewBox="0 0 {width} {height}">
    <path 
      d={pathGenerator({ type: 'Sphere' })} 
      fill="var(--sidebar-primary)"
      stroke="var(--border)" 
    />

    {#each countries as country}
      <path 
        d={pathGenerator(country)} 
        fill="var(--muted)"
        stroke="var(--border)" 
        stroke-width="0.5"
      />
    {/each}
      
    {#if pathGenerator({type: 'Point', coordinates: [point.lon, point.lat]})}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <circle class="cursor-pointer" onclick={trigger} role="button" tabindex="0" cx={x} cy={y} r={Math.ceil(scale / 40)} fill="var(--destructive)" stroke="var(--foreground)" stroke-width="1" />
    {/if}
  </svg>
</div>

<style>
  .map-container {
    display: flex;
    justify-content: center;
    border-radius: 8px;
  }
  path { transition: fill 0.3s; }
</style>