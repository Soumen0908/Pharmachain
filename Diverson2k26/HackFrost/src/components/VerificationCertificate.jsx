import React, { useRef } from 'react';
import { FileDown } from 'lucide-react';

export default function VerificationCertificate({ batchData, trustResult, verdict }) {
    const certRef = useRef(null);

    async function downloadCertificate() {
        const el = certRef.current;
        if (!el) return;

        // Use canvas to render certificate as image
        const canvas = document.createElement('canvas');
        const dpr = 2;
        canvas.width = 600 * dpr;
        canvas.height = 360 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Background
        const bg = ctx.createLinearGradient(0, 0, 600, 360);
        bg.addColorStop(0, '#050816');
        bg.addColorStop(0.5, '#0a1628');
        bg.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 600, 360);

        // Border
        ctx.strokeStyle = trustResult.score >= 70 ? '#00d4aa' : trustResult.score >= 40 ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.roundRect(10, 10, 580, 340, 16);
        ctx.stroke();

        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PharmaChain Verification Certificate', 300, 50);

        // Divider
        ctx.strokeStyle = 'rgba(0, 212, 170, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 65);
        ctx.lineTo(560, 65);
        ctx.stroke();

        // Verdict
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillStyle = verdict?.color || '#00d4aa';
        ctx.fillText(`${verdict?.icon || '✅'} ${verdict?.text || 'VERIFIED'}`, 300, 100);

        // Details
        ctx.textAlign = 'left';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        const details = [
            ['Drug Name', batchData.meta?.drugName || 'Unknown'],
            ['Batch ID', batchData.meta?.batchId || batchData.batchIdHash?.slice(0, 16) + '...'],
            ['Trust Score', `${trustResult.score}/100 (${trustResult.riskLevel})`],
            ['Inspector', batchData.inspectorApproved ? 'Approved' : 'Pending'],
            ['Expiry Date', batchData.meta?.expiryDate || 'N/A'],
            ['Verified On', new Date().toLocaleDateString()],
        ];

        details.forEach(([label, value], i) => {
            const y = 130 + i * 28;
            ctx.fillStyle = '#64748b';
            ctx.fillText(label, 50, y);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '13px Inter, sans-serif';
            ctx.fillText(value, 220, y);
        });

        // Trust score circle
        const scoreX = 480;
        const scoreY = 200;
        const scoreR = 45;
        ctx.beginPath();
        ctx.arc(scoreX, scoreY, scoreR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(scoreX, scoreY, scoreR, -Math.PI / 2, -Math.PI / 2 + (trustResult.score / 100) * Math.PI * 2);
        ctx.strokeStyle = trustResult.score >= 70 ? '#00d4aa' : trustResult.score >= 40 ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(trustResult.score, scoreX, scoreY + 8);

        // Footer
        ctx.fillStyle = '#475569';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Verified on PharmaChain — Anti-Counterfeit Drug Infrastructure', 300, 335);
        ctx.fillText('Powered by Blockchain & AI | HackFrost 2026', 300, 350);

        // Download
        const link = document.createElement('a');
        link.download = `pharmachain-cert-${batchData.meta?.batchId || 'batch'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    return (
        <div ref={certRef} style={{ marginTop: '16px' }}>
            <button className="btn btn-blue btn-sm" onClick={downloadCertificate}>
                <FileDown size={14} /> Download Verification Certificate
            </button>
        </div>
    );
}
