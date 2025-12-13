'use client';

import { useState } from 'react';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';
import { SubscribeDialog } from '@/components/SubscribeDialog';

type Props = {
  scanId: number;
  hasSubscription: boolean;
};

export function ScanResultClient({ scanId, hasSubscription }: Props) {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  async function handleDownload() {
    if (!hasSubscription) {
      setSubscribeOpen(true);
      return;
    }

    setLoadingPdf(true);
    try {
      window.location.href = `/api/scan/${scanId}/pdf`;
    } finally {
      setLoadingPdf(false);
    }
  }

  async function createCheckout() {
    const r = await fetch('/api/billing/create-checkout', { method: 'POST' });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error);
    if (data.url) window.location.href = data.url;
  }

  return (
    <>
      <DownloadPdfButton onClick={handleDownload} loading={loadingPdf} />

      <SubscribeDialog
        open={subscribeOpen}
        onOpenChange={setSubscribeOpen}
        onSubscribe={createCheckout}
      />
    </>
  );
}
