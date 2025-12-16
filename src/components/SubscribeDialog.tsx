'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
};

export function SubscribeDialog({ open, onOpenChange, onSubscribe }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Нужна подписка</DialogTitle>
          <DialogDescription>
            Откройте все возможности СканБотан с помощью подписки. Цена: 99
            ₽/месяц.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2 text-sm text-muted-foreground'>
          <p>Что даёт подписка:</p>
          <ul className='list-disc pl-5'>
            <li>Неограниченное количество сканирований</li>
            <li>История сканирований</li>
            <li>Скачивание PDF</li>
            <li>Будущие улучшения</li>
          </ul>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Отмена
          </Button>

          <Button onClick={onSubscribe}>Оформить подписку</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
