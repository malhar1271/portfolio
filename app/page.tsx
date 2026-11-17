"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProjectItem {
  id: string;
  title: string;
  alt: string;
  href: string;
  image: string;
}

const PROJECTS: ProjectItem[] = [
  {
    id: "versalite",
    title: "Versa-Lite",
    alt: "Versa-Lite",
    href: "/work/versalite",
    image:
      "https://framerusercontent.com/images/Y8r9ofFJErzRWULRg0F7NvsnCgU.jpeg?width=392&height=560",
  },
  {
    id: "cder",
    title: "CD'er",
    alt: "CD'er",
    href: "/work/cd'er",
    image:
      "https://framerusercontent.com/images/FoYT023555xMkxCER3riLwhffY.jpeg?scale-down-to=1024&width=5472&height=3648",
  },
  {
    id: "oakune",
    title: "Ohakune",
    alt: "Ohakune",
    href: "/work/ohakune",
    image:
      "https://framerusercontent.com/images/g190fqjdjMhotQjJKP6T9pqAqHI.png?scale-down-to=1024&width=2289&height=1440",
  },
  {
    id: "coat hanger",
    title: "Coat Hanger",
    alt: "Coat Hanger",
    href: "/work/coat-hanger",
    image:
      "https://framerusercontent.com/images/8VAQ2od81eoSziJpxhUATCjGI.jpeg?scale-down-to=1024&width=2304&height=3072",
  },
  {
    id: "peace encaged",
    title: "Peace Encaged",
    alt: "Peace Encaged",
    href: "/work/peace-encaged",
    image:
      "https://framerusercontent.com/images/bD5Gf7o1I9r95pxrFsFzXvx63vE.jpeg?scale-down-to=1024&width=5159&height=3591",
  },
  {
    id: "spotlight",
    title: "Spotlight",
    alt: "Spotlight",
    href: "/work/spotlight",
    image:
      "https://framerusercontent.com/images/ZTXfPBTxUeiEScB09nfOcIoIu4.png?scale-down-to=1024&width=1232&height=1080",
  },
  {
    id: "the reframe project",
    title: "The Reframe Project",
    alt: "The Reframe Project",
    href: "/work/the-reframe-project",
    image:
      "https://framerusercontent.com/images/DalA4rIooA69bbj58wUt55plFKk.jpeg?scale-down-to=1024&width=1073&height=740",
  },
];

interface CarouselMetrics {
  previewWidth: number;
  previewHeight: number;
  thumbWidth: number;
  thumbHeight: number;
  radiusX: number;
  maxCursorShiftX: number;
  maxCursorShiftY: number;
  isCompact: boolean;
}

export default function PortfolioRoulettePage() {
  const pathname = usePathname();

  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorNorm, setCursorNorm] = useState({ x: 0, y: 0 });

  const [metrics, setMetrics] = useState<CarouselMetrics>({
    previewWidth: 408,
    previewHeight: 474,
    thumbWidth: 73.5,
    thumbHeight: 101.43,
    radiusX: 520,
    maxCursorShiftX: 140,
    maxCursorShiftY: 90,
    isCompact: false,
  });

  const viewportRef = useRef<HTMLElement | null>(null);
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartRotation = useRef(0);
  const velocityRef = useRef(0);
  const snapTargetRef = useRef<number | null>(null);
  const lastX = useRef(0);
  const lastPointerTime = useRef(0);
  const lastFrameTime = useRef(0);
  const rafRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);

  const targetNormRef = useRef({ x: 0, y: 0 });
  const currentNormRef = useRef({ x: 0, y: 0 });

  const count = PROJECTS.length;
  const stepAngle = (Math.PI * 2) / count;

  // Lock viewport & disable browser trackpad back/forward swipe gestures
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;

    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Responsive ~80% viewport scaling across desktop, iPad, and phone ratios
  useEffect(() => {
    const updateMetrics = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isPortrait = vh > vw;
      const isCompact = vw < 680;

      const targetSpanW = vw * 0.8;
      const maxHeroH = isPortrait ? vh * 0.54 : vh * 0.66;
      const maxHeroW = isPortrait ? vw * 0.72 : vw * 0.44;

      const heroWidth = Math.min(maxHeroW, maxHeroH * 0.86);
      const heroHeight = heroWidth / 0.86;

      const orbitThumbWidth = Math.max(52, Math.min(116, heroWidth * 0.21));
      const thumbWidth = orbitThumbWidth * 0.7;
      const thumbHeight = thumbWidth * 1.38;

      const radiusX = Math.max(
        heroWidth * 0.46,
        (targetSpanW - orbitThumbWidth) / 2
      );
      setMetrics({
        previewWidth: heroWidth * 0.72,
        previewHeight: heroHeight * 0.72,
        thumbWidth,
        thumbHeight,
        radiusX,
        maxCursorShiftX: vw * 0.17,
        maxCursorShiftY: vh * 0.17,
        isCompact,
      });
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    return () => window.removeEventListener("resize", updateMetrics);
  }, []);

  // Smooth cursor tracking; resets back to (0, 0) when cursor exits the page
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      targetNormRef.current = {
        x: (e.clientX / vw) * 2 - 1,
        y: (e.clientY / vh) * 2 - 1,
      };
    };

    const resetToCenter = () => {
      targetNormRef.current = { x: 0, y: 0 };
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        resetToCenter();
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", resetToCenter);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("blur", resetToCenter);

    let animId: number;
    const animateCursorParallax = () => {
      const dx = targetNormRef.current.x - currentNormRef.current.x;
      const dy = targetNormRef.current.y - currentNormRef.current.y;

      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        currentNormRef.current.x += dx * 0.08;
        currentNormRef.current.y += dy * 0.08;

        setCursorNorm({
          x: currentNormRef.current.x,
          y: currentNormRef.current.y,
        });
      }
      animId = requestAnimationFrame(animateCursorParallax);
    };

    animId = requestAnimationFrame(animateCursorParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", resetToCenter);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("blur", resetToCenter);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Refresh-rate-normalized inertia with no automatic slot snapping.
  const ensurePhysicsLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameTime.current = performance.now();

    const tick = (now: number) => {
      const dtMs = Math.max(now - lastFrameTime.current, 1);
      lastFrameTime.current = now;
      const dtRatio = Math.min(dtMs / 16.667, 2.5);

      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      let next = rotationRef.current;

      // Explicit target spin (thumbnail click or arrow key)
      if (snapTargetRef.current !== null) {
        const diff = snapTargetRef.current - next;
        const springFactor = 1 - Math.pow(1 - 0.14, dtRatio);
        next += diff * springFactor;

        if (Math.abs(diff) < 0.0004) {
          next = snapTargetRef.current;
          snapTargetRef.current = null;
          velocityRef.current = 0;
          rotationRef.current = next;
          setRotation(next);
          rafRef.current = null;
          return;
        }

        rotationRef.current = next;
        setRotation(next);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Free momentum decays naturally and keeps its final angular position.
      next += velocityRef.current * dtRatio;
      velocityRef.current *= Math.pow(0.915, dtRatio);

      rotationRef.current = next;
      setRotation(next);

      if (Math.abs(velocityRef.current) < 0.0004) {
        velocityRef.current = 0;
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Non-passive wheel listener to hijack horizontal & vertical trackpad swipes
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      snapTargetRef.current = null;

      // Normalize deltaMode (0 = pixels, 1 = lines, 2 = pages)
      const modeScale =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const rawDelta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const deltaPx = rawDelta * modeScale;

      // Feed smooth impulse into angular velocity & clamp max flick speed
      const nextVel = velocityRef.current - deltaPx * 0.00034;
      velocityRef.current = Math.max(-0.18, Math.min(0.18, nextVel));

      ensurePhysicsLoop();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ensurePhysicsLoop]);

  // Keyboard arrow navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      velocityRef.current = 0;
      const base =
        snapTargetRef.current ??
        Math.round(rotationRef.current / stepAngle) * stepAngle;
      snapTargetRef.current =
        base + (e.key === "ArrowLeft" ? stepAngle : -stepAngle);
      ensurePhysicsLoop();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ensurePhysicsLoop, stepAngle]);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    snapTargetRef.current = null;
    velocityRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartX.current = e.clientX;
    dragStartRotation.current = rotationRef.current;
    lastX.current = e.clientX;
    lastPointerTime.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 4) hasMovedRef.current = true;

    const sensitivity = 0.0045;
    const next = dragStartRotation.current + dx * sensitivity;
    rotationRef.current = next;
    setRotation(next);

    const now = performance.now();
    const dt = Math.max(now - lastPointerTime.current, 1);
    const instVel = ((e.clientX - lastX.current) * sensitivity) / (dt / 16.667);
    velocityRef.current = velocityRef.current * 0.4 + instVel * 0.6;
    lastX.current = e.clientX;
    lastPointerTime.current = now;
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    ensurePhysicsLoop();
  };

  // Click any side thumbnail to spin it smoothly to the front
  const spinToIndex = (index: number) => {
    if (hasMovedRef.current) return;
    velocityRef.current = 0;

    const currentNormalized = rotationRef.current;
    const desired = -index * stepAngle;
    const delta =
      ((((desired - currentNormalized) % (Math.PI * 2)) + Math.PI * 3) %
        (Math.PI * 2)) -
      Math.PI;

    snapTargetRef.current = currentNormalized + delta;
    ensurePhysicsLoop();
  };

  const activeIndex =
    ((Math.round(-rotation / stepAngle) % count) + count) % count;
  const activeProject = PROJECTS[activeIndex];

  // Active route highlight (#d5ff00)
  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  };

  const getTabStyle = (href: string): React.CSSProperties => ({
    backgroundColor: isRouteActive(href) ? "#d5ff00" : "#ededed",
    color: "#0c0c0c",
    padding: metrics.isCompact ? "2px 5px" : "2px 6px",
    fontSize: metrics.isCompact ? "11px" : "12px",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: "1.3em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "background-color 0.2s ease",
  });

  // Render both halves of one level cylinder with shared perspective.
  const renderRingLayer = (layer: "back" | "front") => {
    // Evenly spaced cards have mean proximity 0.5 around the level orbit.
    const meanPullX = cursorNorm.x * metrics.maxCursorShiftX * 0.625;
    const meanPullY = cursorNorm.y * metrics.maxCursorShiftY * 0.625;

    return PROJECTS.map((project, idx) => {
      const theta = idx * stepAngle + rotation;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta); // +1 at front center -> -1 at back center

      const centerProximity = (cos + 1) / 2;
const scale = 1 + centerProximity * 0.4;

      // Cohesive cursor follow: 100% pull at front, ~63% at sides, 25% subtle drift at back
      const parallaxWeight = 0.25 + 0.75 * centerProximity;

      // Remove the shared component of the pull so the carousel's center stays fixed.
      const pullX =
        cursorNorm.x * metrics.maxCursorShiftX * parallaxWeight - meanPullX;
      const pullY =
        cursorNorm.y * metrics.maxCursorShiftY * parallaxWeight - meanPullY;

      // Keep the orbit level; cursor pull is balanced to preserve its center.
      const x = sin * metrics.radiusX + pullX;
      const y = pullY;
      const z = cos * metrics.radiusX;

      // Front vs back split occurs cleanly at the cylinder's tangent horizon
      const isFrontHalf = cos >= 0;
      if (layer === "back" && isFrontHalf) return null;
      if (layer === "front" && !isFrontHalf) return null;

      // Let each card turn at the same rate as its point moves around the Y axis.
      const cylinderYawDeg = (theta * 180) / Math.PI;

      // Keep opacity continuous as a card crosses from front to rear.
      const opacity = 0.75 + centerProximity * 0.25;

      const zIndex = Math.round(centerProximity * 2000);

      return (
        <div
          key={`${layer}-${project.id}`}
          onClick={() => spinToIndex(idx)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${metrics.thumbWidth}px`,
            height: `${metrics.thumbHeight}px`,
            transform: "translate(-50%, -50%)",
            transformStyle: "preserve-3d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex,
            pointerEvents: "auto",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(
  2
)}px, ${z.toFixed(2)}px) rotateY(${cylinderYawDeg.toFixed(
  2
)}deg) scale(${scale})`,
              willChange: "transform",
            }}
          >
            <img
              src={project.image}
              alt={project.alt}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "0px",
                opacity,
                backfaceVisibility: "hidden",
                userSelect: "none",
              }}
            />
            <img
              src={project.image}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "0px",
                opacity,
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                userSelect: "none",
              }}
            />
          </div>
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        backgroundColor: "#ffffff",
        color: "#0c0c0c",
        fontFamily: "'SUSE Mono', monospace",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      {/* Fixed Top Header */}
      <header
        aria-label="Site header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: metrics.isCompact ? "12px 14px" : "16px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <div style={{ justifySelf: "start", pointerEvents: "auto" }}>
          <Link href="/" style={getTabStyle("/")}>
            Malhar | Portfolio
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          style={{
            justifySelf: "center",
            display: "flex",
            alignItems: "center",
            gap: metrics.isCompact ? "4px" : "8px",
            pointerEvents: "auto",
          }}
        >
          <Link className="nav-tab" href="/about" style={getTabStyle("/about")}>
            About
          </Link>
          <Link className="nav-tab" href="/work" style={getTabStyle("/work")}>
            Work
          </Link>
          <Link className="nav-tab" href="/contact" style={getTabStyle("/contact")}>
            Contact
          </Link>
        </nav>

        <div
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: metrics.isCompact ? "4px" : "8px",
            pointerEvents: "auto",
          }}
        >
          <a
            className="nav-tab"
            href="https://www.linkedin.com/in/malhar-shirur-b53707285"
            target="_blank"
            rel="noreferrer"
            style={getTabStyle("external-linkedin")}
          >
            Linkedin
          </a>
          <a
            className="nav-tab"
            href="mailto:shirurmalhar@gmail.com"
            style={getTabStyle("external-email")}
          >
            Email
          </a>
        </div>
      </header>

      {/* Main Locked 3D Roulette Viewport */}
      <main
        aria-label="Main content"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <section
          ref={viewportRef}
          role="region"
          aria-label="3D media ring carousel"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            cursor: "default",
            touchAction: "none",
          }}
        >
          {/* LAYER 1 (z-index: 0): Rear Orbiting Ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              perspective: `${Math.max(900, metrics.radiusX * 3)}px`,
              transformStyle: "preserve-3d",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            {renderRingLayer("back")}
          </div>

          {/* LAYER 2 (z-index: 1): Static Large Centered Active Project Card */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${metrics.previewWidth}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 1,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "0.86 / 1",
                overflow: "hidden",
                backgroundColor: "#f6f6f6",
              }}
            >
              <Link
                href={activeProject.href}
                draggable={false}
                onClick={(e) => {
                  if (hasMovedRef.current) e.preventDefault();
                }}
                aria-label={`Open ${activeProject.title}`}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              >
                <img
                  src={activeProject.image}
                  alt={activeProject.alt}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Link>
            </div>
          </div>

          {/* LAYER 3 (z-index: 2): Front Orbiting Ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              perspective: `${Math.max(900, metrics.radiusX * 3)}px`,
              transformStyle: "preserve-3d",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {renderRingLayer("front")}
          </div>

          {/* LAYER 4 (z-index: 3): Static Top Metadata Bar Flush Above Center Card */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `calc(50% - ${metrics.previewHeight / 2}px)`,
              width: `${metrics.previewWidth}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 3,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                backgroundColor: "#ededed",
                color: "#0c0c0c",
                padding: "4px 6px",
                fontSize: metrics.isCompact ? "13px" : "15px",
                fontWeight: 500,
                lineHeight: "1.2em",
                letterSpacing: "-0.03em",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  flex: "1 1 0%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeProject.title}
              </span>
              <Link
                className="nav-tab"
                href={activeProject.href}
                aria-label={`View Project - ${activeProject.title}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#0c0c0c",
                  color: "#ffffff",
                  borderRadius: "0px",
                  padding: "2px 6px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  fontSize: metrics.isCompact ? "12px" : "13px",
                  fontWeight: 500,
                  lineHeight: "1em",
                  letterSpacing: "-0.03em",
                }}
              >
                View Project
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        aria-label="Site footer"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 15,
          padding: metrics.isCompact ? "12px 16px" : "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontSize: metrics.isCompact ? "12px" : "14px",
            lineHeight: "1.3em",
            color: "#757575",
            margin: 0,
          }}
        >
          Updated October 2026
        </p>
      </footer>
    </div>
  );
}
