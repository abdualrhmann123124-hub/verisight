import { NextResponse, type NextRequest } from "next/server";

import {
  fetchRemoteImage,
  RemoteFetchError,
  type RemoteFetchFailure,
} from "@/features/analyze/lib/remote-fetch";

/**
 * Fetches a direct image link on the browser's behalf.
 *
 * The browser cannot fetch an arbitrary third-party image itself — CORS blocks
 * reading the bytes — so this route does it server-side and hands the bytes
 * back. Analysis is unchanged from there: the client turns the response into a
 * File and runs the same preflight and engine path as an uploaded file, so
 * there is one analysis pipeline rather than two.
 *
 * The SSRF guarding lives in `remote-fetch`; this route only translates its
 * failures into status codes. Failures are returned as a `reason` code rather
 * than a sentence, so the UI renders them in the reader's language.
 */

// DNS resolution and manual redirect handling need the Node runtime.
export const runtime = "nodejs";

const STATUS: Record<RemoteFetchFailure, number> = {
  "invalid-url": 400,
  "blocked-host": 403,
  unreachable: 502,
  "not-an-image": 415,
  "too-large": 413,
  "too-many-redirects": 502,
};

export async function POST(request: NextRequest) {
  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ reason: "invalid-url" }, { status: 400 });
  }

  if (typeof url !== "string") {
    return NextResponse.json({ reason: "invalid-url" }, { status: 400 });
  }

  try {
    const media = await fetchRemoteImage(url);
    return new NextResponse(media.bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": media.contentType,
        "Content-Length": String(media.bytes.byteLength),
        // Read by the client to name the File it reconstructs.
        "X-Media-Filename": encodeURIComponent(media.filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof RemoteFetchError) {
      return NextResponse.json(
        { reason: error.reason },
        { status: STATUS[error.reason] },
      );
    }
    return NextResponse.json({ reason: "unreachable" }, { status: 502 });
  }
}
