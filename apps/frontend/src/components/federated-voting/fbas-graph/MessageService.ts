import { Node } from "./fbas-graph-node.vue";
import { Event, MessageSent } from "scp-simulation";

export interface MessageAnimation {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

export class MessageService {
  private messageCounter = 0;
  public createMessageAnimations(
    events: Event[],
    nodes: Node[],
    animationDuration: number,
  ): MessageAnimation[] {
    return events
      .map((event) => {
        if (event instanceof MessageSent) {
          return this.createMessageAnimation(event, nodes, animationDuration);
        } else return null;
      })
      .filter((animation) => animation !== null);
  }

  public createMessageAnimation(
    event: MessageSent,
    nodes: Node[],
    animationDuration: number,
  ): MessageAnimation | null {
    const source = event.message.sender;
    const target = event.message.receiver;
    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);

    if (sourceNode && targetNode) {
      return {
        id: this.messageCounter++,
        startX: sourceNode.x ?? 0,
        startY: sourceNode.y ?? 0,
        endX: targetNode.x ?? 0,
        endY: targetNode.y ?? 0,
        duration: animationDuration / 1000,
      };
    }
    return null;
  }
}

export default new MessageService();
