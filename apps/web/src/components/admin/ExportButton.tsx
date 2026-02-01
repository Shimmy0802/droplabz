'use client';

import { useState } from 'react';

interface ExportButtonProps {
    eventId: string;
    eventTitle: string;
    type?: 'entries' | 'winners';
    includeIneligible?: boolean;
}

/**
 * Export Button Component
 *
 * Inspired by Subber: "export wallet addresses" and
 * "full list ready to export for your airdrop or mint claim"
 */
export function ExportButton({ eventId, eventTitle, type = 'winners', includeIneligible = false }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);

            const params = new URLSearchParams({
                type,
                includeIneligible: includeIneligible.toString(),
            });

            const res = await fetch(`/api/events/${eventId}/export?${params.toString()}`);

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download =
                    res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
                    `${eventTitle}_${type}_export.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const error = await res.json();
                alert(`Export failed: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('An error occurred during export');
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-[#00d4ff] text-[#0a0e27] rounded-lg font-semibold hover:bg-[#0099cc] disabled:opacity-50 transition-colors"
        >
            {exporting ? (
                <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Exporting...
                </>
            ) : (
                <>
                    <span className="mr-2">📥</span>
                    Export {type === 'winners' ? 'Winners' : 'All Entries'} CSV
                </>
            )}
        </button>
    );
}
