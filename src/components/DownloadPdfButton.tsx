'use client';

import { Button } from '@/components/ui/button';

type Props = {
  onClick: () => void;
  loading?: boolean;
};

export function DownloadPdfButton({ onClick, loading }: Props) {
  return (
    <Button onClick={onClick} disabled={loading}>
      {loading ? 'Подготовка PDF…' : 'Скачать PDF'}
    </Button>
  );
}
