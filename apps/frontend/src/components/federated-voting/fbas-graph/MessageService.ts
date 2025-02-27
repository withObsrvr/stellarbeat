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

export interface QueuedMessage {
  source: string;
  target: string;
}

export class MessageService {
  private messageCounter: number = 0;
  private messageQueue: QueuedMessage[] = [];
  private messages: MessageAnimation[] = [];

  public handleMessageEvent(event: MessageSent): void {
    this.messageQueue.push({
      source: event.message.sender,
      target: event.message.receiver,
    });
  }

  public processMessageQueue(nodes: Node[], animationDuration: number): void {
    if (this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`);

      this.messageQueue.forEach((queuedMsg) => {
        const sourceNode = nodes.find((n) => n.id === queuedMsg.source);
        const targetNode = nodes.find((n) => n.id === queuedMsg.target);

        // Only create actual animations when positions are stable
        if (sourceNode && targetNode) {
          this.messages.push({
            id: this.messageCounter++,
            startX: sourceNode.x ?? 0,
            startY: sourceNode.y ?? 0,
            endX: targetNode.x ?? 0,
            endY: targetNode.y ?? 0,
            duration: animationDuration,
          });
        }
      });

      this.messageQueue = [];
    }
  }

  /**
   * Remove a message that has finished animating
   */
  public removeMessage(id: number): void {
    const index = this.messages.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      this.messages.splice(index, 1);
    }
  }

  public clearMessages(): void {
    this.messages = [];
  }

  public getMessages(): MessageAnimation[] {
    return this.messages;
  }

  public handleEvents(events: Event[]): void {
    events.forEach((event) => {
      if (event instanceof MessageSent) {
        this.handleMessageEvent(event);
      }
    });
  }
}

export default new MessageService();
