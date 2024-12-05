<template>
  <svg ref="svgRef" :width="width" :height="height"></svg>
</template>

<script lang="ts" setup>
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";
import { drag } from "d3-drag";
import { onMounted, ref } from "vue";

// Sample data representing nodes and quorum sets
interface Node extends SimulationNodeDatum {
  id: string;
  isQuorumSet?: boolean;
}

interface Link {
  source: string | Node;
  target: string | Node;
  bidirectional?: boolean;
}

const graph = {
  nodes: [
    { id: "Alice" },
    { id: "Bob" },
    { id: "Chad" },
    { id: "Steve" },
    { id: "2/3", isQuorumSet: true },
    { id: "2/2", isQuorumSet: true },
    { id: "3/3", isQuorumSet: true },
  ] as Node[],
  links: [
    // Alice, Bob, and Chad's shared quorum set
    { source: "Alice", target: "2/3" },
    { source: "Bob", target: "2/3" },
    { source: "Chad", target: "3/3" },
    { source: "2/3", target: "Alice" },
    { source: "2/3", target: "Bob" },
    { source: "2/3", target: "Chad" },
    { source: "3/3", target: "Alice" },
    { source: "3/3", target: "Bob" },
    { source: "3/3", target: "Chad" },

    // Steve's quorum set
    { source: "Steve", target: "2/2" },
    { source: "2/2", target: "Chad" },
    { source: "2/2", target: "Bob" },
  ] as Link[],
};

// Identify bidirectional links
const linkKey = (d: Link) => {
  const sourceId = typeof d.source === "string" ? d.source : d.source.id;
  const targetId = typeof d.target === "string" ? d.target : d.target.id;
  return `${sourceId}-${targetId}`;
};

// Create a map to identify bidirectional links
const linkMap = new Map<string, Link>();

graph.links.forEach((link) => {
  const key = linkKey(link);
  linkMap.set(key, link);
});

// Add a bidirectional flag to links
graph.links.forEach((link) => {
  const reverseKey = linkKey({
    source: link.target,
    target: link.source,
  });
  if (linkMap.has(reverseKey)) {
    link.bidirectional = true;
    // Also set bidirectional on the reverse link
    linkMap.get(reverseKey)!.bidirectional = true;
  } else {
    link.bidirectional = false;
  }
});

const width = 800;
const height = 600;
const svgRef = ref<SVGSVGElement | null>(null);

onMounted(() => {
  const svg = select(svgRef.value);

  if (!svgRef.value) return;

  const simulation = forceSimulation<Node>(graph.nodes)
    .force(
      "link",
      forceLink(graph.links)
        .id((d: any) => d.id)
        .distance(200),
    )
    .force("charge", forceManyBody().strength(-2000))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "quorumSetX",
      forceX(width / 2).strength((d: any) => 0.1),
    )
    .force(
      "quorumSetY",
      forceY(height / 2).strength((d: any) => 0.1),
    );

  const linkGroup = svg
    .append("g")
    .attr("class", "links")
    .selectAll(".link-group")
    .data(graph.links)
    .enter()
    .append("g")
    .attr("class", "link-group");

  const link = linkGroup
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", (d: any) => {
      const sourceNode = graph.nodes.find((node) => node.id === d.source.id);
      return sourceNode?.isQuorumSet ? "#ff7f0e" : "#1f77b4";
    })
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.9);

  const arrowheads = linkGroup
    .append("path")
    .attr("class", "arrowhead")
    .attr("d", "M -5,-5 L 5,0 L -5,5 Z") // Arrowhead shape
    .attr("fill", (d: any) => {
      const sourceNode = graph.nodes.find((node) => node.id === d.source.id);
      return sourceNode?.isQuorumSet ? "#ff7f0e" : "#1f77b4";
    });

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g");

  node
    .filter((d: any) => d.isQuorumSet)
    .append("rect")
    .attr("width", 50)
    .attr("height", 20)
    .attr("x", -25)
    .attr("y", -10)
    .attr("fill", "#ff7f0e")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  node
    .filter((d: Node) => !d.isQuorumSet)
    .append("circle")
    .attr("r", 7)
    .attr("fill", "#1f77b4")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  node.call(
    drag<SVGGraphicsElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended),
  );

  const labels = node.append("g").attr("class", "label-group");

  labels
    .filter((d: any) => !d.isQuorumSet)
    .append("rect")
    .attr("x", -20)
    .attr("y", 10)
    .attr("width", (d: Node) => d.id.length * 9 + 15) // Dynamic width based on label length
    .attr("height", 20)
    .attr("fill", "#fff")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("opacity", 0.8);

  labels
    .filter((d: any) => !d.isQuorumSet)
    .append("text")
    .attr("dy", 25)
    .attr("dx", -10)
    .text((d: Node) => d.id)
    .attr("font-family", "Arial, sans-serif")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .attr("fill", "#333");

  labels
    .filter((d: any) => d.isQuorumSet)
    .append("text")
    .attr("dy", 5)
    .attr("dx", -7)
    .text((d: Node) => d.id)
    .attr("font-family", "Arial, sans-serif")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .attr("fill", "white");

  simulation.on("tick", () => {
    link.attr("d", (d: any) => {
      const sourceNode = d.source as Node;
      const targetNode = d.target as Node;

      const sx = sourceNode.x!;
      const sy = sourceNode.y!;
      const tx = targetNode.x!;
      const ty = targetNode.y!;

      if (d.bidirectional) {
        // Draw curved path for bidirectional links
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Control the curvature for slight arcs

        return `M${sx},${sy} A${dr},${dr} 0 0,1 ${tx},${ty}`;
      } else {
        // Draw straight line for unidirectional links
        return `M${sx},${sy} L${tx},${ty}`;
      }
    });

    node.attr("transform", (d: Node) => `translate(${d.x},${d.y})`);

    // Update arrowheads
    arrowheads.attr("transform", function (d: any) {
      const path = select(this.parentNode as Element)
        .select(".link")
        .node() as SVGPathElement;
      const totalLength = path.getTotalLength();

      // Get the point at half the length
      const midpoint = path.getPointAtLength(totalLength / 2);

      // Approximate the tangent at the midpoint
      const epsilon = 0.01; // Small value for derivative approximation
      const before = path.getPointAtLength(totalLength / 2 - epsilon);
      const after = path.getPointAtLength(totalLength / 2 + epsilon);

      const angle =
        Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);

      return `translate(${midpoint.x},${midpoint.y}) rotate(${angle})`;
    });
  });

  function dragstarted(event: any, d: Node) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: any, d: Node) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: any, d: Node) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
});
</script>
<style scoped>
.link {
  stroke-opacity: 0.9;
}

text {
  font-family: Arial, sans-serif;
  font-size: 14px;
  fill: #333;
  font-weight: bold;
}

.label-group rect {
  fill: #fff;
  stroke: #ccc;
  opacity: 0.8;
  stroke-width: 0.5;
}

.label-group text {
  fill: #333;
  font-weight: bold;
}

.arrowhead {
  fill: #999;
}

.link-group {
  pointer-events: none; /* Disable pointer events for links and arrowheads */
}
</style>
