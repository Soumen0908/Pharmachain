import React, { useRef, useEffect, useCallback } from 'react';

/**
 * Galaxy — Canvas-based animated starfield with mouse interaction
 * Props:
 *   mouseRepulsion    – enable mouse repulsion effect (bool)
 *   mouseInteraction  – enable mouse glow tracking (bool)
 *   density           – star density multiplier (number, default 1)
 *   glowIntensity     – glow brightness (0–1, default 0.3)
 *   saturation        – color saturation (0–1, default 0)
 *   hueShift          – base hue rotation in degrees (default 140)
 *   twinkleIntensity  – twinkle brightness variation (0–1, default 0.3)
 *   rotationSpeed     – galaxy rotation speed (default 0.1)
 *   repulsionStrength – how strongly mouse repels stars (default 2)
 *   autoCenterRepulsion – pull to center strength (default 0)
 *   starSpeed         – radial drift speed (default 0.5)
 *   speed             – global animation speed multiplier (default 1)
 */
export default function Galaxy({
    mouseRepulsion = true,
    mouseInteraction = true,
    density = 1,
    glowIntensity = 0.3,
    saturation = 0,
    hueShift = 200,
    twinkleIntensity = 0.3,
    rotationSpeed = 0.08,
    repulsionStrength = 2,
    autoCenterRepulsion = 0,
    starSpeed = 0.3,
    speed = 1,
}) {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -9999, y: -9999, active: false });
    const starsRef = useRef([]);
    const rafRef = useRef(null);
    const timeRef = useRef(0);

    const createStars = useCallback((w, h) => {
        const count = Math.floor((w * h) / 2800 * density);
        const cx = w / 2;
        const cy = h / 2;
        const stars = [];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const maxR = Math.sqrt(cx * cx + cy * cy);
            const dist = Math.random() * maxR;
            stars.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                baseX: cx + Math.cos(angle) * dist,
                baseY: cy + Math.sin(angle) * dist,
                size: Math.random() * 1.8 + 0.3,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 2 + 1,
                hue: hueShift + (Math.random() - 0.5) * 60,
                dist,
                angle,
                orbitSpeed: (0.0002 + Math.random() * 0.0006) * rotationSpeed,
                driftSpeed: (Math.random() - 0.5) * starSpeed * 0.1,
            });
        }
        return stars;
    }, [density, hueShift, rotationSpeed, starSpeed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.parentElement?.clientWidth || window.innerWidth;
            const h = canvas.parentElement?.clientHeight || window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            starsRef.current = createStars(w, h);
        };

        resize();
        window.addEventListener('resize', resize);

        const handleMouseMove = (e) => {
            if (!mouseInteraction) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true,
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        const animate = () => {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            const cx = w / 2;
            const cy = h / 2;
            const stars = starsRef.current;
            const mouse = mouseRef.current;

            timeRef.current += 0.016 * speed;
            const t = timeRef.current;

            ctx.clearRect(0, 0, w, h);

            // Subtle center glow
            const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.4);
            centerGrad.addColorStop(0, `hsla(${hueShift}, ${saturation * 100}%, 70%, ${glowIntensity * 0.08})`);
            centerGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = centerGrad;
            ctx.fillRect(0, 0, w, h);

            // Mouse glow
            if (mouseInteraction && mouse.active) {
                const mouseGrad = ctx.createRadialGradient(
                    mouse.x, mouse.y, 0,
                    mouse.x, mouse.y, 120
                );
                mouseGrad.addColorStop(0, `hsla(${hueShift}, ${saturation * 100}%, 70%, ${glowIntensity * 0.12})`);
                mouseGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = mouseGrad;
                ctx.fillRect(0, 0, w, h);
            }

            // Draw stars
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];

                // Orbital rotation
                s.angle += s.orbitSpeed * speed;
                s.dist += s.driftSpeed * speed;

                // Wrap stars that drift too far
                const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;
                if (s.dist > maxR) s.dist = 20;
                if (s.dist < 10) s.dist = maxR - 20;

                s.baseX = cx + Math.cos(s.angle) * s.dist;
                s.baseY = cy + Math.sin(s.angle) * s.dist;

                let sx = s.baseX;
                let sy = s.baseY;

                // Mouse repulsion
                if (mouseRepulsion && mouse.active) {
                    const dx = sx - mouse.x;
                    const dy = sy - mouse.y;
                    const distSq = dx * dx + dy * dy;
                    const repRadius = 100;
                    if (distSq < repRadius * repRadius && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const force = (1 - dist / repRadius) * repulsionStrength * 30;
                        sx += (dx / dist) * force;
                        sy += (dy / dist) * force;
                    }
                }

                // Auto-center repulsion
                if (autoCenterRepulsion > 0) {
                    const dx = sx - cx;
                    const dy = sy - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60 && dist > 0) {
                        const force = (1 - dist / 60) * autoCenterRepulsion * 20;
                        sx += (dx / dist) * force;
                        sy += (dy / dist) * force;
                    }
                }

                // Twinkle
                const twinkle = 1 + Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * twinkleIntensity;
                const alpha = s.brightness * twinkle;

                // Star color
                const starHue = s.hue;
                const starSat = saturation * 100;
                const starLight = 70 + (1 - s.brightness) * 20;

                // Glow
                if (s.size > 1 && glowIntensity > 0) {
                    const glowR = s.size * 3;
                    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
                    glow.addColorStop(0, `hsla(${starHue}, ${starSat}%, ${starLight}%, ${alpha * glowIntensity * 0.5})`);
                    glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow;
                    ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
                }

                // Star dot
                ctx.beginPath();
                ctx.arc(sx, sy, s.size * twinkle * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${starHue}, ${starSat}%, ${starLight}%, ${Math.min(alpha, 1)})`;
                ctx.fill();
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [createStars, mouseRepulsion, mouseInteraction, glowIntensity, saturation, hueShift, twinkleIntensity, rotationSpeed, repulsionStrength, autoCenterRepulsion, starSpeed, speed]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
            }}
        />
    );
}
