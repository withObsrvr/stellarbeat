<template>
  <svg ref="svgRef" :width="width" :height="height"></svg>
</template>

<script lang="ts" setup>
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { select } from "d3-selection";
import { drag } from "d3-drag";
import { onMounted, ref } from "vue";

interface Node extends SimulationNodeDatum {
  id: string;
  quorumSet?: string[];
  threshold?: number;
  vote: string;
  accept: string;
  confirm: string;
}

interface Link extends SimulationLinkDatum<Node> {
  bidirectional?: boolean;
  selfLoop?: boolean;
}

const graph = {
  nodes: [
    {
      id: "Alice",
      quorumSet: ["Bob", "Chad", "Alice"],
      threshold: 2,
      vote: "pizza",
      accept: "pizza",
      confirm: "pizza",
    },
    {
      id: "Bob",
      quorumSet: ["Alice", "Chad", "Bob"],
      threshold: 2,
      vote: "pizza",
      accept: "pizza",
      confirm: "",
    },
    {
      id: "Chad",
      quorumSet: ["Alice", "Bob", "Chad"],
      threshold: 3,
      vote: "burger",
      accept: "",
      confirm: "",
    },
    {
      id: "Steve",
      quorumSet: ["Bob", "Chad"],
      threshold: 2,
      vote: "burger",
      accept: "",
      confirm: "",
    },
  ] as Node[],
  links: [] as Link[],
};

// Create a map of nodes by ID for easy lookup
const nodesById = new Map<string, Node>();
graph.nodes.forEach((node) => nodesById.set(node.id, node));

// Create links based on quorum sets
graph.nodes.forEach((node) => {
  node.quorumSet?.forEach((qsMember) => {
    if (qsMember === node.id) {
      // Mark self-referential links
      graph.links.push({ source: node.id, target: qsMember, selfLoop: true });
    } else {
      graph.links.push({ source: node.id, target: qsMember });
    }
  });
});

// Identify bidirectional links
const linkKey = (d: any) => {
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

graph.links.forEach((link) => {
  const reverseKey = linkKey({
    source: link.target,
    target: link.source,
  });
  if (linkMap.has(reverseKey)) {
    if (link.source !== link.target) {
      // Exclude self-loops from bidirectional consideration
      link.bidirectional = true;
      linkMap.get(reverseKey)!.bidirectional = true;
    }
  } else {
    link.bidirectional = false;
  }
});

// Separate self-loops from other links
const selfLoopLinks = graph.links.filter((link) => link.selfLoop);
const otherLinks = graph.links.filter((link) => !link.selfLoop);

// Filter out self-loops from the force simulation links
const simulationLinks = otherLinks;

// Set up the SVG canvas dimensions
const width = 800;
const height = 600;
const svgRef = ref<SVGSVGElement | null>(null);

onMounted(() => {
  const svg = select(svgRef.value);

  if (!svgRef.value) return;

  const linkForce = forceLink<Node, Link>(simulationLinks)
    .id((d: Node) => d.id)
    .distance(200);

  const simulation = forceSimulation<Node>(graph.nodes)
    .force("link", linkForce)
    .force("charge", forceManyBody().strength(-2000))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collide",
      forceCollide<Node>().radius((d) => getNodeRadius(d) + 10),
    );

  const links = linkForce.links();

  const linkGroup = svg
    .append("g")
    .attr("class", "links")
    .selectAll(".link-group")
    .data(links)
    .enter()
    .append("g")
    .attr("class", "link-group");

  const link = linkGroup
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.9);

  const arrowheads = linkGroup
    .append("path")
    .attr("class", "arrowhead")
    .attr("d", "M -7,-7 L 7,0 L -7,7 Z")
    .attr("fill", "#1f77b4");

  selfLoopLinks.forEach((link) => {
    link.source = nodesById.get(link.source as string) as Node;
    link.target = link.source; // For self-loops, source and target are the same
  });

  const selfLoopLinkGroup = svg
    .append("g")
    .attr("class", "self-loops")
    .selectAll(".link-group")
    .data(selfLoopLinks)
    .enter()
    .append("g")
    .attr("class", "link-group");

  const selfLoopLink = selfLoopLinkGroup
    .append("path")
    .attr("class", "link self-loop")
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.9);

  const selfLoopArrowheads = selfLoopLinkGroup
    .append("path")
    .attr("class", "arrowhead")
    .attr("d", "M -7,-7 L 7,0 L -7,7 Z")
    .attr("fill", "#1f77b4");

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g")
    .call(
      drag<SVGGraphicsElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    )
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  function getNodeRadius(d: Node): number {
    const nameLength = d.id.length;
    const thresholdTextLength =
      d.threshold && d.quorumSet
        ? `${d.threshold}/${d.quorumSet.length}`.length
        : 0;
    const maxLabelLength = Math.max(nameLength, thresholdTextLength);
    const baseRadius = 20; // Base radius
    const extraRadius = maxLabelLength * 3;
    const lineHeight = 14; // Approximate height per line of text
    const totalHeight = lineHeight * 2; // For two lines of text
    return Math.max(baseRadius + extraRadius, totalHeight);
  }

  node
    .append("circle")
    .attr("r", getNodeRadius)
    .attr("fill", (d: Node) => {
      if (d.confirm) {
        return "#2ca02c"; // Green if confirmed
      } else if (d.accept) {
        return "#1f77b4"; // Blue if accepted a value
      } else {
        return "#A9A9A9"; // Dark gray if only voted
      }
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add name label inside the circle
  node
    .append("text")
    .attr("class", "node-label name")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.3em") // Slightly above center
    .text((d: Node) => `${d.id}`)
    .attr("font-family", "Arial, sans-serif")
    .attr("font-size", 12)
    .attr("fill", "#fff");

  // Add quorum set threshold label inside the circle
  node
    .append("text")
    .attr("class", "node-label threshold")
    .attr("text-anchor", "middle")
    .attr("dy", "1em") // Slightly below center
    .text((d: Node) => {
      if (d.threshold && d.quorumSet) {
        return `${d.threshold}/${d.quorumSet.length}`;
      } else {
        return "";
      }
    })
    .attr("font-family", "Arial, sans-serif")
    .attr("font-size", 12)
    .attr("fill", "#fff");

  // Simulation tick updates positions of nodes and links
  simulation.on("tick", () => {
    // Update node positions
    node.attr("transform", (d: Node) => {
      if (typeof d.x === "number" && typeof d.y === "number") {
        return `translate(${d.x},${d.y})`;
      }
      return null;
    });

    // Update paths for other links
    link.attr("d", (d: Link) => {
      const sourceNode = d.source as Node;
      const targetNode = d.target as Node;

      const sx = sourceNode.x;
      const sy = sourceNode.y;
      const tx = targetNode.x;
      const ty = targetNode.y;

      if (
        typeof sx !== "number" ||
        typeof sy !== "number" ||
        typeof tx !== "number" ||
        typeof ty !== "number"
      ) {
        return null;
      }

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

    // Update link colors to match the target node's color
    link.attr("stroke", (d: Link) => {
      const targetNode = d.target as Node;
      if (targetNode.confirm) {
        return "#2ca02c"; // Green
      } else if (targetNode.accept) {
        return "#1f77b4"; // Blue
      } else {
        return "#A9A9A9"; // Dark gray
      }
    });

    // Update arrowhead colors to match the target node's color
    arrowheads.attr("fill", (d: Link) => {
      const targetNode = d.target as Node;
      if (targetNode.confirm) {
        return "#2ca02c"; // Green
      } else if (targetNode.accept) {
        return "#1f77b4"; // Blue
      } else {
        return "#A9A9A9"; // Dark gray
      }
    });

    // Update self-loop links
    selfLoopLink.attr("d", (d: Link) => {
      const sourceNode = d.source as Node;
      const sx = sourceNode.x!;
      const sy = sourceNode.y!;

      if (typeof sx !== "number" || typeof sy !== "number") {
        // Positions are not yet defined, skip rendering
        return null;
      }

      const pathRadius = 40; // Increased self-loop radius

      // Calculate direction from center to node
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = sx - centerX;
      const dy = sy - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
      const offsetDistance = 20; // Distance to offset loop center from node center

      // Normalize the vector and invert it to point away from the center
      const nx = dx / distance;
      const ny = dy / distance;

      // Offset the loop center from the node position
      const x = sx + nx * offsetDistance;
      const y = sy + ny * offsetDistance;

      // Compute the arc endpoints
      const dx1 = -pathRadius * 2 * ny;
      const dy1 = pathRadius * 2 * nx;
      const dx2 = pathRadius * 2 * ny;
      const dy2 = -pathRadius * 2 * nx;

      const pathData = `
          M ${x} ${y}
          a ${pathRadius} ${pathRadius} 0 1 1 ${dx1} ${dy1}
          a ${pathRadius} ${pathRadius} 0 1 1 ${dx2} ${dy2}
        `;
      return pathData;
    });

    // Update self-loop link colors to match the target node's color
    selfLoopLink.attr("stroke", (d: Link) => {
      const targetNode = d.target as Node;
      if (targetNode.confirm) {
        return "#2ca02c"; // Green
      } else if (targetNode.accept) {
        return "#1f77b4"; // Blue
      } else {
        return "#A9A9A9"; // Dark gray
      }
    });

    // Update arrowheads for other links
    arrowheads.attr("transform", function (d: Link) {
      const parentNode = this.parentNode;
      if (parentNode) {
        const path = select(parentNode as Element)
          .select(".link")
          .node() as SVGPathElement;

        if (path && path.getTotalLength) {
          const totalLength = path.getTotalLength();

          if (totalLength > 0) {
            const midpoint = path.getPointAtLength(totalLength / 2);

            // Approximate the tangent at the midpoint
            const epsilon = 0.01; // Small value for derivative approximation
            const before = path.getPointAtLength(totalLength / 2 - epsilon);
            const after = path.getPointAtLength(totalLength / 2 + epsilon);

            const angle =
              Math.atan2(after.y - before.y, after.x - before.x) *
              (180 / Math.PI);

            return `translate(${midpoint.x},${midpoint.y}) rotate(${angle})`;
          }
        }
      }
      return null;
    });

    // Update arrowheads for self-loop links
    selfLoopArrowheads
      .attr("fill", (d: Link) => {
        const targetNode = d.target as Node;
        if (targetNode.confirm) {
          return "#2ca02c"; // Green
        } else if (targetNode.accept) {
          return "#1f77b4"; // Blue
        } else {
          return "#A9A9A9"; // Dark gray
        }
      })
      .attr("transform", function (d: Link) {
        const parentNode = this.parentNode;
        if (parentNode) {
          const path = select(parentNode as Element)
            .select(".link")
            .node() as SVGPathElement;

          if (path && path.getTotalLength) {
            const totalLength = path.getTotalLength();

            if (totalLength > 0) {
              // Position the arrowhead at 25% of the path length
              const point = path.getPointAtLength(totalLength * 0.25);
              const before = path.getPointAtLength(totalLength * 0.25 - 1);
              const after = path.getPointAtLength(totalLength * 0.25 + 1);
              const angle =
                Math.atan2(after.y - before.y, after.x - before.x) *
                (180 / Math.PI);

              return `translate(${point.x},${point.y}) rotate(${angle})`;
            }
          }
        }
        return null;
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

  //hover
  function handleMouseOver(event: any, d: Node) {
    link.filter((l: Link) => l.source === d).attr("stroke-width", 6);
    selfLoopLink.filter((l: Link) => l.source === d).attr("stroke-width", 6);
    select(event.currentTarget).raise();
  }

  function handleMouseOut(event: any, d: Node) {
    link.filter((l: Link) => l.source === d).attr("stroke-width", 3);
    selfLoopLink.filter((l: Link) => l.source === d).attr("stroke-width", 3);
  }
});
</script>
<style scoped>
.link {
  stroke-opacity: 0.9;
}

.self-loop {
  stroke-width: 3px;
}

text {
  font-family: Arial, sans-serif;
  font-size: 12px;
  fill: #fff;
  font-weight: bold;
  pointer-events: none; /* Allow node dragging without affecting text */
}

.node-label.name {
  font-size: 12px;
}

.node-label.threshold {
  font-size: 12px;
}

.link-group {
  pointer-events: none; /* Disable pointer events for links and arrowheads */
}
</style>
