"use client";

import {
  CircleDashed,
  Download,
  Link2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { AuroraBackground } from "@/components/motion/aurora-background";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container, Section } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CircularProgress, Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { VERDICT_BANDS } from "@/lib/site";

/* ── Local scaffolding for the gallery only ─────────────────────────── */

function Spec({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-h3 text-ink">{title}</h2>
        {note && <p className="max-w-prose text-body-sm text-ink-muted">{note}</p>}
      </div>
      <Separator />
      <div className="pt-2">{children}</div>
    </section>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-line"
        style={{ background: `var(${token})` }}
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-caption font-medium text-ink">{label}</span>
        <code className="truncate font-mono text-micro text-ink-faint">{token}</code>
      </div>
    </div>
  );
}

const VERDICT_ICONS = {
  ShieldCheck,
  ShieldQuestion,
  CircleDashed,
  ShieldAlert,
  ShieldX,
} as const;

/* ── Sections ───────────────────────────────────────────────────────── */

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Report exported", tone: "success" })}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "Analysis inconclusive",
            description: "Signals conflicted. Try a higher-resolution source.",
            tone: "warning",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "Upload failed",
            description: "The file exceeds the 50 MB limit.",
            tone: "danger",
          })
        }
      >
        Danger
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Link copied" })}>
        Info
      </Button>
    </div>
  );
}

function GalleryBody() {
  const [progress, setProgress] = useState(42);
  const [confidence, setConfidence] = useState(84);

  return (
    <div className="relative min-h-dvh">
      <AuroraBackground />

      <Container className="py-16">
        {/* Header */}
        <header className="mb-16 flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="accent" icon={<Sparkles />}>
              Phase 1 — Foundation
            </Badge>
            <h1 className="font-display text-display-lg text-ink">Design System</h1>
            <p className="max-w-prose text-body-lg text-ink-muted">
              Every primitive, every state. Toggle the theme to check both palettes;
              resize to check the responsive behaviour.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-col gap-20">
          {/* ── Colour ──────────────────────────────────────────────── */}
          <Spec
            title="Surfaces"
            note="Elevation runs canvas → surface → raised → overlay. In dark mode depth comes from surface lightness and border contrast, since a drop shadow is invisible against a near-black page."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Swatch token="--canvas" label="Canvas" />
              <Swatch token="--surface" label="Surface" />
              <Swatch token="--surface-raised" label="Raised" />
              <Swatch token="--surface-overlay" label="Overlay" />
              <Swatch token="--surface-inset" label="Inset" />
            </div>
          </Spec>

          <Spec title="Brand & status">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              <Swatch token="--brand" label="Deep Graphite" />
              <Swatch token="--accent" label="Electric Blue" />
              <Swatch token="--support" label="Soft Cyan" />
              <Swatch token="--success" label="Emerald" />
              <Swatch token="--warning" label="Amber" />
              <Swatch token="--danger" label="Rose Red" />
              <Swatch token="--neutral" label="Slate" />
            </div>
          </Spec>

          <Spec
            title="Confidence spectrum"
            note="The verdict is a position on a spectrum, never a binary. Colour is never the only signal — each band always carries an icon and a written label, so the meaning survives both colour-blindness and a greyscale print."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {VERDICT_BANDS.map((band) => {
                const Icon = VERDICT_ICONS[band.icon as keyof typeof VERDICT_ICONS];
                return (
                  <Card key={band.id} padding="sm" className="flex flex-col gap-3">
                    <div
                      className="flex items-center gap-2"
                      style={{ color: `var(--verdict-${band.id})` }}
                    >
                      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                      <span className="text-body-sm font-medium">{band.label}</span>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full"
                      style={{ background: `var(--verdict-${band.id})` }}
                    />
                    <p className="text-caption text-ink-muted">{band.description}</p>
                  </Card>
                );
              })}
            </div>
          </Spec>

          {/* ── Typography ──────────────────────────────────────────── */}
          <Spec
            title="Typography"
            note="Instrument Sans for display, Inter for body, JetBrains Mono for technical values. Display steps tighten as they grow — large text needs negative tracking or it reads loose."
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="font-display text-display-2xl text-ink">Verify Reality</p>
                <code className="font-mono text-micro text-ink-faint">
                  text-display-2xl · 72/1.05 · -0.03em
                </code>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-display text-h1 text-ink">Analysis complete</p>
                <code className="font-mono text-micro text-ink-faint">
                  text-h1 · 40/1.15 · -0.02em
                </code>
              </div>
              <div className="flex max-w-prose flex-col gap-2">
                <p className="text-body text-ink-muted">
                  The uploaded media shows characteristics associated with AI-generated
                  content, including repeated texture patterns and metadata
                  inconsistencies. This is a confidence estimate, not definitive proof.
                </p>
                <code className="font-mono text-micro text-ink-faint">
                  text-body · 16/1.6
                </code>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-mono text-body-sm text-support">
                  SHA-256 · a3f1c9e2b7d4…
                </p>
                <code className="font-mono text-micro text-ink-faint">font-mono</code>
              </div>
            </div>
          </Spec>

          {/* ── Buttons ─────────────────────────────────────────────── */}
          <Spec
            title="Buttons"
            note="Press feedback is a 0.98 scale rather than a translate — translating a button inside a flex row nudges its neighbours."
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Analyze Media</Button>
                <Button variant="secondary">Learn More</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="subtle">Subtle</Button>
                <Button variant="danger" leadingIcon={<Trash2 />}>
                  Delete
                </Button>
                <Button variant="link">Link style</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg" leadingIcon={<Download />}>
                  Large with icon
                </Button>
                <Button size="icon" aria-label="Search">
                  <Search />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button loading>Analyzing</Button>
                <Button variant="secondary" loading>
                  Exporting
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </Spec>

          {/* ── Cards ───────────────────────────────────────────────── */}
          <Spec
            title="Cards"
            note="Hover lift is 2px — enough to register, small enough that moving across a grid doesn't set off a wave."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <MotionCard>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                  <CardDescription>EXIF, XMP, and C2PA provenance</CardDescription>
                </CardHeader>
                <CardContent className="mt-4">
                  No camera signature found. Software tag suggests one export operation.
                </CardContent>
              </MotionCard>
              <Card variant="raised">
                <CardHeader>
                  <CardTitle>Raised</CardTitle>
                  <CardDescription>For nested or emphasised content</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Glass</CardTitle>
                  <CardDescription>
                    Falls back to an opaque surface without backdrop-filter
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </Spec>

          {/* ── Forms ───────────────────────────────────────────────── */}
          <Spec
            title="Forms"
            note="Every field has a real label. A placeholder disappears on first keystroke — exactly when a user who paused to think needs it most."
          >
            <div className="grid max-w-2xl gap-6 md:grid-cols-2">
              <Input
                label="Media URL"
                placeholder="https://…"
                leadingIcon={<Link2 />}
                hint="Public links from X, Instagram, Reddit, and others."
              />
              <Input
                label="Media URL"
                defaultValue="not-a-url"
                leadingIcon={<Link2 />}
                error="Enter a valid public URL, including https://"
              />
              <Input
                label="Search history"
                placeholder="Search…"
                leadingIcon={<Search />}
              />
              <Input label="Disabled" placeholder="Unavailable" disabled />
            </div>
            <div className="mt-8 flex flex-col gap-4">
              <Switch
                label="Store analysis history"
                description="Keeps reports on this device so you can revisit them."
                defaultChecked
              />
              <Switch
                label="Reduced motion"
                description="Follows your system setting automatically."
              />
            </div>
          </Spec>

          {/* ── Feedback ────────────────────────────────────────────── */}
          <Spec
            title="Progress"
            note="The ring uses a near-critically-damped spring. An overshoot would briefly display a confidence figure the analysis never produced."
          >
            <div className="flex flex-col gap-8">
              <div className="flex max-w-md flex-col gap-4">
                <Progress value={progress} />
                <Progress value={progress} tone="success" size="sm" />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setProgress(18)}>
                    18%
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setProgress(64)}>
                    64%
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setProgress(97)}>
                    97%
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-10">
                <CircularProgress
                  value={confidence}
                  label="AI generation likelihood"
                  color="var(--verdict-leaning-synthetic)"
                >
                  <div className="flex flex-col items-center">
                    <AnimatedNumber
                      value={confidence}
                      suffix="%"
                      className="font-display text-h1 text-ink"
                    />
                    <span className="text-caption text-ink-muted">Likelihood</span>
                  </div>
                </CircularProgress>
                <div className="flex flex-col gap-2">
                  {[12, 47, 84].map((v) => (
                    <Button
                      key={v}
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfidence(v)}
                    >
                      Set {v}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Spec>

          <Spec
            title="Toasts"
            note="Advisory messages announce politely; failures interrupt. That distinction is what keeps assertive announcements meaningful."
          >
            <ToastDemo />
          </Spec>

          <Spec
            title="Skeletons"
            note="A skeleton only beats a spinner when it matches the shape of what replaces it — otherwise the layout jumps on load."
          >
            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <Card>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="flex-1">
                    <SkeletonText lines={2} />
                  </div>
                </div>
              </Card>
              <Card>
                <Skeleton className="mb-4 h-32 w-full" />
                <SkeletonText lines={3} />
              </Card>
            </div>
          </Spec>

          {/* ── Overlays ────────────────────────────────────────────── */}
          <Spec
            title="Overlays"
            note="Dialogs come from Radix: focus is trapped inside, returned to the trigger on close, and Escape dismisses. Hand-rolled modals nearly always leak focus."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Open dialog</Button>
                </DialogTrigger>
                <DialogContent
                  title="Delete this report?"
                  description="This removes the analysis and its findings from this device. It cannot be undone."
                >
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="danger" leadingIcon={<Trash2 />}>
                        Delete report
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Tooltip content="Supplementary only — never the sole carrier of meaning.">
                <Button variant="ghost">Hover or focus me</Button>
              </Tooltip>
            </div>
          </Spec>

          <Spec
            title="Tabs"
            note="The active pill is one shared-layout element that slides between triggers, rather than a background that blinks out and in."
          >
            <Tabs defaultValue="findings" className="max-w-2xl">
              <TabsList>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="findings">
                <Card>
                  <CardContent>
                    Nine independent analyzers contributed to this assessment.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="technical">
                <Card>
                  <CardContent className="font-mono text-caption">
                    quantization_table: non-standard · ela_mean: 12.4
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="timeline">
                <Card>
                  <CardContent>Frame-level events appear here for video.</CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Spec>

          {/* ── Badges & motion ─────────────────────────────────────── */}
          <Spec title="Badges">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Neutral</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="support">Support</Badge>
              <Badge variant="success" dot>
                Analysis complete
              </Badge>
              <Badge variant="warning" dot>
                Low confidence
              </Badge>
              <Badge variant="danger" icon={<ShieldX />}>
                Failed
              </Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Spec>

          <Spec
            title="Motion"
            note="Scroll-triggered reveals fire once. Replaying on every scroll-past turns a long page into a flicker show."
          >
            <Stagger className="grid gap-4 sm:grid-cols-3">
              {["Metadata", "Compression", "Frequency"].map((t) => (
                <StaggerItem key={t}>
                  <Card>
                    <CardTitle className="text-h4">{t}</CardTitle>
                    <CardContent className="mt-2">Staggered by 60ms.</CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.1} className="mt-4">
              <Card variant="outline">
                <CardContent>This card reveals as it enters the viewport.</CardContent>
              </Card>
            </Reveal>
          </Spec>
        </div>
      </Container>

      <Section spacing="sm">
        <Container>
          <Separator className="mb-8" />
          <p className="text-caption text-ink-faint">
            VeriSight design system · Development build
          </p>
        </Container>
      </Section>
    </div>
  );
}

export function DesignSystemGallery() {
  return (
    <TooltipProvider>
      <ToastProvider>
        <main id="main">
          <GalleryBody />
        </main>
      </ToastProvider>
    </TooltipProvider>
  );
}
