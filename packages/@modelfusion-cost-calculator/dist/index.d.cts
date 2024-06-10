type BaseModelCallFinishedEventResult = {
    status: "success";
    /**
     * The original model response.
     */
    rawResponse: unknown;
    value: unknown;
    /**
     * Optional usage information for the model call. The type depends on the call type.
     */
    usage?: unknown;
} | {
    status: "error";
    error: unknown;
} | {
    status: "abort";
};
interface BaseModelCallFinishedEvent {
    functionType: string;
    model: {
        provider: string;
        modelName: string | null;
    };
    /**
     * The main input to the model call. The type depends on the call type or model.
     */
    input: unknown;
    /**
     * The model settings used for the call. The type depends on the model.
     */
    settings: unknown;
    /**
     * The result of the model call. Can be "success", "error", or "abort". Additional information is provided depending on the status.
     */
    result: BaseModelCallFinishedEventResult;
}
interface SuccessfulModelCall extends BaseModelCallFinishedEvent {
    result: BaseModelCallFinishedEventResult & {
        status: "success";
    };
}

declare class Cost {
    readonly costInMillicents: number;
    readonly hasUnknownCost: boolean;
    readonly callsWithUnknownCost: SuccessfulModelCall[];
    constructor({ costInMillicents, hasUnknownCost, callsWithUnknownCost, }: {
        costInMillicents: number;
        hasUnknownCost: boolean;
        callsWithUnknownCost: SuccessfulModelCall[];
    });
    get costInCent(): number;
    get costInDollar(): number;
    formatAsDollarAmount({ decimals }?: {
        decimals?: number;
    }): string;
}

interface CostCalculator {
    readonly provider: string;
    /**
     * @return null if the cost is unknown, otherwise the cost in Millicents (0 if free)
     */
    calculateCostInMillicents(call: SuccessfulModelCall): PromiseLike<number | null>;
}

declare function calculateCost({ calls, costCalculators, }: {
    calls: SuccessfulModelCall[];
    costCalculators: CostCalculator[];
}): Promise<Cost>;

declare class OpenAICostCalculator implements CostCalculator {
    readonly provider = "openai";
    calculateCostInMillicents(call: SuccessfulModelCall): Promise<number | null>;
}

export { Cost, type CostCalculator, OpenAICostCalculator, calculateCost };
