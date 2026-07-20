import { z } from "zod";

/**
 * Contract with the analysis engine.
 *
 * These schemas mirror the Pydantic models in `api/app/schemas/analysis.py`.
 * Parsing rather than casting means a drift between the two surfaces fails
 * loudly here instead of rendering `undefined` somewhere in the report.
 */

export const directionSchema = z.enum(["authentic", "neutral", "synthetic"]);

export const verdictSchema = z.enum([
  "authentic",
  "leaning-authentic",
  "inconclusive",
  "leaning-synthetic",
  "synthetic",
]);

export const findingSchema = z.object({
  id: z.string(),
  label: z.string(),
  direction: directionSchema,
  strength: z.number().min(0).max(1),
  summary: z.string(),
  /** Stable outcome id (e.g. "noise.uniform") used to localise the copy. The
   *  engine's English `summary`/`caveat` stay as the fallback. */
  code: z.string().nullable().default(null),
  measurements: z.record(z.string(), z.unknown()).default({}),
  caveat: z.string().nullable().default(null),
});

export const assessmentSchema = z.object({
  verdict: verdictSchema,
  synthetic_likelihood: z.number().min(0).max(100),
  evidence_strength: z.number().min(0).max(100),
  /** False until the weighting is validated against a labelled corpus. The
   *  UI must not present the likelihood as a probability while it is False. */
  calibrated: z.boolean(),
  summary: z.string(),
  summary_code: z.string().nullable().default(null),
  summary_driver_ids: z.array(z.string()).default([]),
  conflicted: z.boolean().default(false),
  findings: z.array(findingSchema),
  limitations: z.array(z.string()),
  limitation_codes: z.array(z.string()).default([]),
});

export const analysisResponseSchema = z.object({
  filename: z.string(),
  media_type: z.string(),
  width: z.number(),
  height: z.number(),
  sha256: z.string(),
  processing_ms: z.number(),
  assessment: assessmentSchema,
  engine_version: z.string(),
});

export type Direction = z.infer<typeof directionSchema>;
export type VerdictId = z.infer<typeof verdictSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

/** Maps an engine verdict onto the design system's spectrum tokens. */
export const VERDICT_PRESENTATION: Record<
  VerdictId,
  { label: string; token: string; icon: string }
> = {
  authentic: {
    label: "Likely Authentic",
    token: "--verdict-authentic",
    icon: "ShieldCheck",
  },
  "leaning-authentic": {
    label: "Leaning Authentic",
    token: "--verdict-leaning-authentic",
    icon: "ShieldQuestion",
  },
  inconclusive: {
    label: "Inconclusive",
    token: "--verdict-inconclusive",
    icon: "CircleDashed",
  },
  "leaning-synthetic": {
    label: "Leaning Synthetic",
    token: "--verdict-leaning-synthetic",
    icon: "ShieldAlert",
  },
  synthetic: {
    label: "Likely Synthetic",
    token: "--verdict-synthetic",
    icon: "ShieldX",
  },
};

export const DIRECTION_PRESENTATION: Record<Direction, { label: string; token: string }> =
  {
    authentic: { label: "Supports authentic", token: "--verdict-authentic" },
    neutral: { label: "Inconclusive", token: "--verdict-inconclusive" },
    synthetic: { label: "Supports synthetic", token: "--verdict-synthetic" },
  };

export class EngineUnavailableError extends Error {
  constructor() {
    super("The analysis engine is not reachable.");
    this.name = "EngineUnavailableError";
  }
}

export class EngineRejectedError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EngineRejectedError";
  }
}

/**
 * Submits a file for analysis via the app's own route handler.
 *
 * Deliberately goes through `/api/analyze` rather than calling the engine
 * directly from the browser: it keeps the engine's address server-side, lets
 * the Next.js layer own limits and (later) rate limiting, and means the
 * browser never needs CORS access to a second origin.
 */
export async function requestAnalysis(
  file: File,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      body,
      ...(signal ? { signal } : {}),
    });
  } catch {
    throw new EngineUnavailableError();
  }

  if (!response.ok) {
    let detail = "The engine could not analyze this file.";
    try {
      const payload: unknown = await response.json();
      if (
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as { detail: unknown }).detail === "string"
      ) {
        detail = (payload as { detail: string }).detail;
      }
    } catch {
      // Non-JSON error body; the default message stands.
    }
    if (response.status === 503) throw new EngineUnavailableError();
    throw new EngineRejectedError(detail, response.status);
  }

  return analysisResponseSchema.parse(await response.json());
}
