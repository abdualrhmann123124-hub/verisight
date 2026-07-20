/**
 * English copy — the source of truth.
 *
 * Every other locale mirrors this shape, and the `Dictionary` type is derived
 * from it, so a missing or misspelled key in a translation fails typecheck
 * rather than rendering a blank string in production.
 */
export const en = {
  nav: {
    howItWorks: "How it works",
    technology: "Technology",
    example: "Example",
    faq: "FAQ",
    analyzeMedia: "Analyze media",
    home: "VeriSight home",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle colour theme",
    language: "Language",
  },

  hero: {
    badge: "Confidence-based media verification",
    headlineTop: "Verify digital media",
    headlineBottom: "before you trust it.",
    subtitle:
      "Analyze images using AI-assisted digital forensic techniques to estimate authenticity — with transparent confidence scoring and evidence you can inspect.",
    platformsLabel: "Recognises links from",
  },

  input: {
    urlPlaceholder: "Paste a public image or video link",
    urlLabel: "Media URL",
    clearUrl: "Clear URL",
    upload: "Upload",
    analyze: "Analyze",
    checking: "Checking media",
    dropToLoad: "Drop to load media",
    imageLimits: "PNG, JPG, WEBP up to 25 MB",
    videoLimits: "MP4, MOV, WEBM up to 200 MB",
    tryExample: "Try an example link",
    readyToAnalyze: "Ready to analyze.",
    removeFile: "Remove {name}",
    image: "Image",
    video: "Video",
    linkRecognised:
      "{platform} link recognised — but analyzing links is not supported yet.",
    linkVideoNote:
      " Video analysis is also still in development. Upload an image file instead.",
    linkImageNote: " Save the image and upload the file instead.",
    directLink: "Direct media link on {host} — but analyzing links is not supported yet.",
    directLinkNote: " Download the file and upload it instead.",
  },

  workspace: {
    backHome: "Back to home",
    title: "Analyze media",
    startOver: "Start over",
    dropTitle: "Drop a file to analyze",
    dropTitleActive: "Drop to begin",
    dropSubtitle:
      "Preflight runs in your browser. Only the bytes needed for forensic analysis are sent to the engine.",
    chooseFile: "Choose a file",
    limits: "PNG, JPG, WEBP up to 25 MB · MP4, MOV, WEBM up to 200 MB",
    analysisStopped: "Analysis stopped",
    chooseAnother: "Choose another file",
    engineUnavailableTitle: "Preflight complete — engine did not respond",
    engineUnavailableBody:
      "Your file was read, fingerprinted, decoded, and its metadata parsed locally. The forensic analyzers run in a separate service, which is not reachable right now.",
    engineUnavailableNote:
      "No score is shown because none was produced. A number invented to fill this space would be worse than no number at all.",
    assessmentUnavailable: "Assessment unavailable",
  },

  stages: {
    validate: "Validating media",
    validateDetail: "Checking format, size, and integrity",
    read: "Reading file",
    readDetail: "Loading bytes into memory",
    fingerprint: "Computing fingerprint",
    fingerprintDetail: "SHA-256 over the raw bytes",
    decode: "Decoding media",
    decodeDetail: "Reading intrinsic dimensions and duration",
    metadata: "Inspecting metadata",
    metadataDetail: "Parsing EXIF, XMP, and provenance tags",
    handoff: "Forensic analysis",
    handoffDetail: "Handing off to the analysis engine",
    progressLabel: "Preflight progress",
    complete: "Preflight complete",
    ready: "Ready",
    stopped: "Analysis stopped",
  },

  facts: {
    title: "File facts",
    measured: "Measured",
    name: "Name",
    type: "Type",
    size: "Size",
    resolution: "Resolution",
    duration: "Duration",
    unavailable: "Unavailable",
    copy: "Copy",
    copied: "Copied",
    hashNote: "Identifies the exact bytes analysed, independent of the filename.",
    embeddedMetadata: "Embedded metadata",
    noneFound: "None found",
    tags: "{count} tags",
    camera: "Camera",
    software: "Software",
    captured: "Captured",
    cameraSignature: "Camera signature",
    editingSoftware: "Editing software tag",
    locationPresent: "Location present",
    metadataPresentNote:
      "Metadata can be edited or fabricated. Treat it as one signal among several, not as proof of origin.",
    metadataAbsentNote:
      "Missing metadata is weak evidence on its own — X, Instagram, WhatsApp and most other platforms strip it from every upload.",
    processedLocally: "Preflight ran on this device",
    processedTooltip:
      "Hashing, decoding, and metadata parsing happen in your browser. The file is sent to the engine only for forensic analysis.",
  },

  report: {
    engineVersion: "Engine v{version}",
    analyzers: "{count} analyzers",
    indicativeScore: "Indicative score",
    evidence: "Evidence",
    evidenceLow: "Most analyzers found little to work with.",
    evidenceOk: "Several analyzers contributed measurements.",
    notCalibratedTitle: "This score is not calibrated",
    notCalibratedBody:
      "It is a weighted combination of forensic heuristics, not a probability. The weights have not yet been validated against a labelled dataset, so treat the score as a pointer toward the evidence below rather than as a measurement in its own right.",
    signalStrength: "Signal strength",
    showMeasurements: "Show raw measurements",
    hideMeasurements: "Hide raw measurements",
    limitationsTitle: "What this cannot tell you",
  },

  verdict: {
    authentic: "Likely Authentic",
    "leaning-authentic": "Leaning Authentic",
    inconclusive: "Inconclusive",
    "leaning-synthetic": "Leaning Synthetic",
    synthetic: "Likely Synthetic",
  },

  direction: {
    authentic: "Supports authentic",
    neutral: "Inconclusive",
    synthetic: "Supports synthetic",
  },

  howItWorks: {
    eyebrow: "How it works",
    title: "Three steps, no guesswork",
    description:
      "Each stage is inspectable. If the platform cannot reach a confident answer, it says so rather than picking one.",
    step1Title: "Provide the media",
    step1Body:
      "Upload an image. Preflight runs locally; only the bytes needed for forensic analysis reach the engine.",
    step2Title: "Independent analyses run",
    step2Body:
      "Metadata, compression, noise, and frequency signals are examined separately, so no single indicator decides the outcome.",
    step3Title: "Read the evidence",
    step3Body:
      "You get a confidence estimate with the findings behind it — including which signals disagreed and how reliable the assessment is.",
    footnote:
      "Processing time depends on image size. Link and video analysis are not yet available.",
  },

  technology: {
    eyebrow: "Technology",
    title: "Multiple signals, weighed together",
    description:
      "No single technique is reliable alone. Each contributes evidence, and disagreement between them is reported rather than hidden.",
    metadataTitle: "Metadata & provenance",
    metadataBody:
      "Reads EXIF and C2PA Content Credentials. Some generators sign their output; where that signature exists it is strong evidence.",
    compressionTitle: "Compression analysis",
    compressionBody:
      "Inspects JPEG quantization tables and error levels for traces of re-encoding, editing, or a non-camera origin.",
    frequencyTitle: "Frequency domain",
    frequencyBody:
      "Generative models often leave periodic artefacts from upsampling. A frequency transform can surface patterns invisible to the eye.",
    noiseTitle: "Sensor noise",
    noiseBody:
      "Camera sensors impose a characteristic noise pattern that varies with brightness. Its absence or uniformity is a meaningful signal.",
    textureTitle: "Error level analysis",
    textureBody:
      "Re-encodes the image and measures where compression error concentrates, which can reveal regions from different sources.",
    weightingTitle: "Weighted aggregation",
    weightingBody:
      "Signals are combined by documented weights reflecting how much each can actually carry. Thin evidence widens the result toward inconclusive.",
  },

  example: {
    eyebrow: "Example",
    title: "What a report looks like",
    description:
      "A worked illustration of the report format. The figures below are sample values chosen to demonstrate the layout — they are not the result of a real analysis.",
    badge: "Illustrative sample",
    processed: "Processed in 4.2s · 9 analyzers",
    likelihood: "AI likelihood",
    confidence: "Confidence",
    reliability: "Reliability",
    moderate: "Moderate",
    good: "Good",
    summary:
      "Several indicators associated with generated media are present, most notably in the frequency and sensor-noise analyses. Lighting remains physically consistent, which argues against generation. This is a confidence estimate, not proof.",
    disclaimer:
      "Sample data for layout demonstration only. No media was analyzed to produce these figures.",
    spectrumLabel: "Results are reported on a spectrum",
    findingMetadata: "No camera signature; software tag indicates re-export.",
    findingFrequency: "Periodic artefacts consistent with generative upsampling.",
    findingNoise: "Noise pattern is uniform where it should vary.",
    findingLighting: "Light direction is physically consistent across subjects.",
    labelMetadata: "Metadata",
    labelFrequency: "Frequency",
    labelNoise: "Sensor noise",
    labelLighting: "Lighting",
  },

  why: {
    eyebrow: "Why VeriSight",
    title: "Built to be questioned",
    description:
      "Verification tools are only useful if you can check their reasoning. That constraint shaped every part of this platform.",
    evidenceTitle: "Evidence you can inspect",
    evidenceBody:
      "Every score is traceable to a named analysis. You can see which signals fired, which did not, and how strongly each contributed.",
    disagreementTitle: "Disagreement is reported",
    disagreementBody:
      "When analyses conflict, the report says so and the confidence drops. Conflicting evidence is information, not something to smooth over.",
    calibratedTitle: "Calibrated, not absolute",
    calibratedBody:
      "Output is a likelihood with a stated reliability. The platform will return 'inconclusive' rather than manufacture a verdict it cannot support.",
    privacyTitle: "Your media stays yours",
    privacyBody:
      "Files are analyzed and discarded. Nothing is published, sold, or used as training data.",
  },

  faq: {
    eyebrow: "FAQ",
    title: "Questions worth asking",
    description: "Including the ones about what this tool cannot do.",
    q1: "Can VeriSight prove an image is AI-generated?",
    a1: "No, and it will never claim to. Detection of generated media is an open research problem, and no tool — including this one — can offer proof. VeriSight reports a likelihood with the evidence behind it, so you can judge how much weight the assessment deserves.",
    q2: "How accurate is it?",
    a2: "The scoring weights have not been calibrated against a labelled dataset, so there is no honest accuracy figure to quote. Each report states how much evidence was available instead, which is the more useful number.",
    q3: "Why does it sometimes say 'inconclusive'?",
    a3: "Because that is sometimes the honest answer. When signals conflict, or the media has been compressed enough to destroy the evidence, forcing a verdict would be misleading. An inconclusive result means the analysis ran correctly and did not find enough to support a conclusion.",
    q4: "What happens to the media I upload?",
    a4: "Preflight — hashing, decoding, metadata — runs entirely in your browser. The file is sent to the analysis engine only for the forensic stage, where it is processed and discarded. Nothing is published, shared, sold, or used as training data.",
    q5: "Can I analyze a link or a video?",
    a5: "Not yet. Links are recognised but not fetched, and the engine analyzes still images only. Video would need frame extraction and temporal aggregation, which is not built. Download the media and upload the image file instead.",
    q6: "Does editing a photo make it look AI-generated?",
    a6: "It can affect several signals. Cropping, filters, and re-exporting all leave traces that overlap with the traces generation leaves. This is why no single indicator decides the outcome, and why the report shows which signals fired rather than only a final number.",
  },

  footer: {
    tagline:
      "VeriSight reports confidence estimates, not verdicts. Results should be interpreted alongside context and other evidence.",
    product: "Product",
    resources: "Resources",
    about: "About",
    limitations: "Limitations",
    privacy: "Privacy",
    exampleReport: "Example report",
    designedBy: "Designed & developed by",
    rightsReserved: "All rights reserved.",
  },

  common: {
    skipToContent: "Skip to content",
    dismiss: "Dismiss notification",
    close: "Close dialog",
  },

  // Input, upload, and preflight failure copy. Kept out of the pipeline code
  // so the same message is stated once and translates with everything else;
  // {host}/{size}/{limit} are filled in at the point of use.
  validation: {
    urlMalformed: "That does not look like a valid URL.",
    urlProtocol: "Only http and https links are supported.",
    urlInsecure: "Use an https link — plain http downloads can be tampered with.",
    urlUnsupported:
      "{host} is not a recognised source. Paste a direct link to an image or video file instead.",
    fileFormat: "Unsupported format. Use PNG, JPG, WEBP, MP4, MOV, or WEBM.",
    fileEmpty: "That file is empty or unreadable.",
    fileTooLarge: "That file is {size}. The limit is {limit}.",
    formatRecovery: "Use PNG, JPG, or WEBP for images, or MP4, MOV, or WEBM for video.",
    decodeTimeout: "The file took too long to decode.",
    decodeTimeoutRecovery:
      "It may be very large or partially corrupted. Try a smaller file.",
    decodeFailed: "This file could not be decoded.",
    decodeFailedRecovery:
      "It appears corrupted or is not the format its extension claims. Try re-exporting it.",
    readFailed: "The file could not be read.",
    readFailedRecovery:
      "It may have been moved or deleted since you selected it. Try selecting it again.",
    generic: "Something went wrong while reading this file.",
    genericRecovery: "Try again, or use a different file.",
  },
} as const;

/**
 * Widens the `as const` literals to `string`, keeping the exact key shape.
 *
 * `en` is `as const` so this file reads as data and every key is fixed, but a
 * translation must be free to supply *different* strings. Deriving `Dictionary`
 * straight from `typeof en` would type each value as its English literal and
 * reject "تحليل" for a field whose type is `"Analyze"`. This maps every leaf to
 * `string` while preserving the structure, so a missing or misspelled key still
 * fails typecheck.
 */
type Localized<T> = {
  [K in keyof T]: T[K] extends string ? string : Localized<T[K]>;
};

export type Dictionary = Localized<typeof en>;
