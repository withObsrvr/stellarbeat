import { Node } from "./trust-graph-node.vue";
import { Event, ForgedMessageSent, MessageSent } from "scp-simulation";

export interface MessageAnimation {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  isForged: boolean;
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
          return this.createMessageAnimation(
            event,
            nodes,
            animationDuration,
            false,
          );
        } else if (event instanceof ForgedMessageSent) {
          return this.createMessageAnimation(
            event,
            nodes,
            animationDuration,
            true,
          );
        } else {
          return null;
        }
      })
      .filter((animation) => animation !== null);
  }

  public createMessageAnimation(
    event: MessageSent,
    nodes: Node[],
    animationDuration: number,
    isForged: boolean,
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
        isForged,
      };
    }
    return null;
  }
}

export default new MessageService();
