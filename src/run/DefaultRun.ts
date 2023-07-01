import { nanoid as createId } from "nanoid";
import { SuccessfulModelCall } from "../cost/SuccessfulModelCall.js";
import {
  ModelCallFinishedEvent,
  ModelCallStartedEvent,
} from "../model/ModelCallEvent.js";
import { ModelCallObserver } from "../model/ModelCallObserver.js";
import { Run } from "./Run.js";
import { CostCalculator } from "cost/CostCalculator.js";
import { calculateCost } from "cost/calculateCost.js";
export class DefaultRun implements Run {
  readonly runId: string;
  readonly sessionId?: string;
  readonly userId?: string;

  readonly abortSignal?: AbortSignal;
  readonly costCalculators: CostCalculator[];

  readonly modelCallEvents: (ModelCallFinishedEvent | ModelCallStartedEvent)[] =
    [];

  readonly observers?: ModelCallObserver[];

  constructor({
    runId = createId(),
    sessionId,
    userId,
    abortSignal,
    observers,
    costCalculators = [],
  }: {
    runId?: string;
    sessionId?: string;
    userId?: string;
    abortSignal?: AbortSignal;
    observers?: ModelCallObserver[];
    costCalculators?: CostCalculator[];
  } = {}) {
    this.runId = runId;
    this.sessionId = sessionId;
    this.userId = userId;
    this.abortSignal = abortSignal;
    this.costCalculators = costCalculators;

    this.observers = [
      {
        onModelCallStarted: (event) => {
          this.modelCallEvents.push(event);
        },
        onModelCallFinished: (event) => {
          this.modelCallEvents.push(event);
        },
      },
      ...(observers ?? []),
    ];
  }

  get successfulModelCalls(): Array<SuccessfulModelCall> {
    return this.modelCallEvents
      .filter(
        (event): event is ModelCallFinishedEvent & { status: "success" } =>
          "status" in event && event.status === "success"
      )
      .map(
        (event): SuccessfulModelCall => ({
          model: event.metadata.model,
          settings: event.settings,
          response: event.response,
          type: eventTypeToCostType[event.type],
        })
      );
  }

  calculateCost() {
    return calculateCost({
      calls: this.successfulModelCalls,
      costCalculators: this.costCalculators,
    });
  }
}

const eventTypeToCostType = {
  "image-generation-finished": "image-generation" as const,
  "text-embedding-finished": "text-embedding" as const,
  "text-generation-finished": "text-generation" as const,
  "transcription-finished": "transcription" as const,
};
