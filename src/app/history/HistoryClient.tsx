'use client';

import { useEffect, useState, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Heart, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import Link from 'next/link';
import { toast } from 'sonner';

export function HistoryClient() {
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<
    { id: number; createdAt: string; result: any; isFavorite: boolean }[]
  >([]);
  const [activeTab, setActiveTab] = useState('all');
  const [favoriteLoading, setFavoriteLoading] = useState<number | null>(null);

  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    loadScans();
  }, []);

  async function loadScans() {
    setLoading(true);
    try {
      const res = await fetch('/api/scans');
      if (res.status === 402) {
        toast.error('Требуется активная подписка');
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setScans(data.scans || []);
    } catch (error) {
      toast.error('Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(scanId: number, currentFavorite: boolean) {
    setFavoriteLoading(scanId);
    try {
      const res = await fetch(`/api/scans/${scanId}/favorite`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to toggle');
      const data = await res.json();

      setScans((prev) =>
        prev.map((scan) =>
          scan.id === scanId ? { ...scan, isFavorite: data.isFavorite } : scan
        )
      );

      toast.success(
        data.isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного'
      );
    } catch (error) {
      toast.error('Ошибка изменения избранного');
    } finally {
      setFavoriteLoading(null);
    }
  }

  const favoriteScans = scans.filter((s) => s.isFavorite);
  const displayScans = activeTab === 'favorites' ? favoriteScans : scans;

  return (
    <AppLayout>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold'>История сканирований</h1>
          <p className='text-muted-foreground mt-2'>
            Просмотр всех ваших сканирований растений
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value='all'>Все ({scans.length})</TabsTrigger>
            <TabsTrigger value='favorites'>
              Избранное ({favoriteScans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className='mt-6'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : displayScans.length === 0 ? (
              <Card>
                <CardContent className='py-12 text-center'>
                  <p className='text-muted-foreground'>
                    {activeTab === 'favorites'
                      ? 'У вас пока нет избранных сканирований'
                      : 'История сканирований пуста'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Растение</TableHead>
                        <TableHead>Избранное</TableHead>
                        <TableHead className='text-right'>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayScans.map((scan) => {
                        const name =
                          scan.result?.plantName || scan.result?.name || '—';
                        const date = format(
                          new Date(scan.createdAt),
                          'd MMMM yyyy, HH:mm',
                          { locale: ru }
                        );
                        return (
                          <TableRow key={scan.id}>
                            <TableCell className='whitespace-nowrap'>
                              {date}
                            </TableCell>
                            <TableCell>{name}</TableCell>
                            <TableCell>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() =>
                                  toggleFavorite(scan.id, scan.isFavorite)
                                }
                                disabled={favoriteLoading === scan.id}
                                className='h-8 w-8'
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    scan.isFavorite
                                      ? 'fill-red-500 text-red-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </Button>
                            </TableCell>
                            <TableCell className='text-right'>
                              <Link href={`/scan/${scan.id}`}>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='gap-2'
                                >
                                  Открыть
                                  <ExternalLink className='h-3 w-3' />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
