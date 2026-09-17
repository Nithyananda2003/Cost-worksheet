'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Database,
  Download,
  FilePenLine,
  LoaderCircle,
  LogOut,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CostKey =
  | 'base'
  | 'additional'
  | 'abstractor'
  | 'copy'
  | 'other1'
  | 'other2';

type CostRow = {
  key: CostKey;
  label: string;
};

export type WorksheetSeed = {
  orderNumber: string;
  stateCode: string;
  county: string;
  productType: string;
  fulfillment: 'Online' | 'Ground';
  basePrice: number;
  sourceLabel: string;
};

type CostWorksheetProps = {
  seed: WorksheetSeed;
  onBack: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function amountFromInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function productTypeForWorksheet(orderType: string) {
  if (orderType === 'Current Owner') return 'Current Owner Search';
  if (orderType === 'Two Owner') return 'Two Owner Search';
  return orderType;
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

function safeFileName(value: string) {
  return (
    value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'Order'
  );
}

function WorksheetPreview({
  orderNumber,
  searchDate,
  stateCode,
  county,
  productType,
  fulfillment,
  note,
  rows,
  amounts,
  comments,
  total,
}: {
  orderNumber: string;
  searchDate: string;
  stateCode: string;
  county: string;
  productType: string;
  fulfillment: 'Online' | 'Ground';
  note: string;
  rows: CostRow[];
  amounts: Record<CostKey, string>;
  comments: Record<CostKey, string>;
  total: number;
}) {
  const orderRows = [
    ['Order Number', orderNumber || '—'],
    ['Date of Search', searchDate],
    ['State', stateCode],
    ['County', county],
    ['Product Type', productType],
  ];

  return (
    <article className="relative aspect-[612/792] w-full overflow-hidden bg-white font-[Arial,sans-serif] text-black shadow-[0_24px_70px_rgba(22,49,76,0.18)] [container-type:size]">
      <div className="absolute left-1/2 top-[10.5%] -translate-x-1/2 whitespace-nowrap border-b-[0.15cqw] border-black pb-[0.35cqw] text-[3.27cqw] font-bold leading-none">
        DTNP - COST WORKSHEET
      </div>

      <div className="absolute left-[11.77%] top-[15.15%] border-b-[0.13cqw] border-[#365f91] text-[2.63cqw] font-bold leading-none text-[#365f91]">
        Order Details
      </div>

      <div className="absolute left-[13%] top-[17.61%] w-[66.3%] border-l-[0.1cqw] border-t-[0.1cqw] border-black font-[Carlito,Arial,sans-serif] text-[1.960784cqw] leading-none">
        {orderRows.map(([label, value], index) => (
          <div
            key={label}
            className="grid grid-cols-[23.1%_76.9%]"
            style={{ height: index === 3 ? '3.34cqh' : '2.67cqh' }}
          >
            <div
              className={`flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black px-[0.8cqw] text-center ${index === 0 ? 'bg-[#d6e9f2]' : 'bg-[#d9d9d9]'}`}
            >
              {label}
            </div>
            <div className="flex min-w-0 items-center border-b-[0.1cqw] border-r-[0.1cqw] border-black px-[1.25cqw]">
              <span className="truncate">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-[11.77%] top-[37.67%] border-b-[0.13cqw] border-[#365f91] text-[2.63cqw] font-bold leading-none text-[#365f91]">
        Search Cost Details
      </div>
      <div className="absolute left-[13.95%] top-[40.55%] text-[1.65cqw] font-bold italic leading-none">
        Must complete the following:
      </div>

      <div className="absolute left-[13%] top-[42.83%] grid h-[3.1%] w-[66.3%] grid-cols-[35.4%_29.9%_34.7%] border-l-[0.1cqw] border-t-[0.1cqw] border-black bg-[#d9d9d9] font-[Carlito,Arial,sans-serif] text-[1.960784cqw] font-bold leading-none">
        <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black">
          Online/Ground
        </div>
        <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black font-bold">
          {fulfillment}
        </div>
        <div className="flex min-w-0 items-center border-b-[0.1cqw] border-r-[0.1cqw] border-black px-[1.1cqw] text-left">
          <span className="shrink-0">Note:</span>
          {note && (
            <span className="ml-[0.7cqw] truncate font-normal">{note}</span>
          )}
        </div>
      </div>

      <div className="absolute left-[13%] top-[48.01%] w-[66.3%] border-l-[0.1cqw] border-t-[0.1cqw] border-black font-[Carlito,Arial,sans-serif] text-[1.960784cqw] leading-none">
        <div className="grid h-[3.05cqh] grid-cols-[35.4%_29.9%_34.7%] bg-[#d9d9d9] font-bold">
          <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black">
            Cost Type
          </div>
          <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black">
            Cost $
          </div>
          <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black">
            Comments
          </div>
        </div>

        {rows.map((row, index) => {
          const value = amountFromInput(amounts[row.key]);
          return (
            <div
              key={row.key}
              className="grid grid-cols-[35.4%_29.9%_34.7%]"
              style={{ height: index === 0 ? '2.82cqh' : '2.28cqh' }}
            >
              <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black px-[0.5cqw] text-center">
                {row.label}
              </div>
              <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black">
                {amounts[row.key] !== '' &&
                !(row.key === 'base' && fulfillment === 'Ground' && value === 0)
                  ? formatCurrency(value)
                  : ''}
              </div>
              <div className="flex min-w-0 items-center border-b-[0.1cqw] border-r-[0.1cqw] border-black px-[0.8cqw]">
                <span className="truncate">{comments[row.key]}</span>
              </div>
            </div>
          );
        })}

        <div className="grid h-[2.9cqh] grid-cols-[35.4%_29.9%_34.7%] bg-[#d9d9d9]">
          <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black font-bold">
            Total Cost
          </div>
          <div className="flex items-center justify-center border-b-[0.1cqw] border-r-[0.1cqw] border-black">
            {formatCurrency(total)}
          </div>
          <div className="border-b-[0.1cqw] border-r-[0.1cqw] border-black" />
        </div>
      </div>
    </article>
  );
}

export function CostWorksheet({ seed, onBack }: CostWorksheetProps) {
  const [orderNumber, setOrderNumber] = useState(seed.orderNumber);
  const [searchDate] = useState(todayLabel);
  const [productType, setProductType] = useState(() =>
    productTypeForWorksheet(seed.productType),
  );
  const [note, setNote] = useState('');
  const [amounts, setAmounts] = useState<Record<CostKey, string>>({
    base: seed.fulfillment === 'Online' ? seed.basePrice.toFixed(2) : '',
    additional: '',
    abstractor: seed.fulfillment === 'Ground' ? seed.basePrice.toFixed(2) : '',
    copy: '',
    other1: '',
    other2: '',
  });
  const [comments, setComments] = useState<Record<CostKey, string>>({
    base: '',
    additional: '',
    abstractor: '',
    copy: '',
    other1: '',
    other2: '',
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const rows = useMemo<CostRow[]>(
    () => [
      { key: 'base', label: 'Online Cost' },
      { key: 'additional', label: 'Additional Online Cost' },
      { key: 'abstractor', label: 'Abstractor Cost' },
      { key: 'copy', label: 'Copy Cost' },
      { key: 'other1', label: 'Other Cost' },
      { key: 'other2', label: 'Other Cost' },
    ],
    [],
  );

  const total = useMemo(
    () =>
      Object.values(amounts).reduce(
        (sum, value) => sum + amountFromInput(value),
        0,
      ),
    [amounts],
  );

  const updateAmount = (key: CostKey, value: string) => {
    if (value !== '' && !/^\d*(\.\d{0,2})?$/.test(value)) return;
    setAmounts((current) => ({ ...current, [key]: value }));
  };

  const updateComment = (key: CostKey, value: string) => {
    setComments((current) => ({ ...current, [key]: value.slice(0, 60) }));
  };

  const downloadPdf = async () => {
    if (!orderNumber.trim()) {
      setDownloadError('Enter an order number before downloading.');
      return;
    }
    if (!productType.trim()) {
      setDownloadError('Enter a product type before downloading.');
      return;
    }

    setIsDownloading(true);
    setDownloadError('');

    try {
      const response = await fetch('/api/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          searchDate,
          stateCode: seed.stateCode,
          county: seed.county,
          productType: productType.trim(),
          fulfillment: seed.fulfillment,
          note,
          rows: rows.map((row) => ({
            label: row.label,
            amount:
              amounts[row.key] === ''
                ? null
                : amountFromInput(amounts[row.key]),
            comment: comments[row.key],
          })),
        }),
      });

      if (response.status === 401) {
        window.location.replace('/login');
        return;
      }

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? 'The PDF could not be created.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFileName(orderNumber)}_Cost_Worksheet.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : 'The PDF could not be created.',
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-[#c9d4df]/80 bg-[#f8fbfc]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[90rem] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Back to pricing"
              onClick={onBack}
              className="border-[#c8d3dc] bg-white/80 text-[#35516b]"
            >
              <ArrowLeft />
            </Button>
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FilePenLine className="size-[18px]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-[15px] font-semibold tracking-[-0.01em]">
                Cost worksheet preview
              </p>
              <p className="text-xs text-muted-foreground">
                Review, adjust, then download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={downloadPdf}
              disabled={
                isDownloading || !orderNumber.trim() || !productType.trim()
              }
              className="bg-[#173a59] text-white hover:bg-[#234e70]"
            >
              {isDownloading ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Download data-icon="inline-start" />
              )}
              {isDownloading ? 'Creating PDF…' : 'Download PDF'}
            </Button>
            <form action="/api/auth/logout" method="post">
              <Button
                type="submit"
                variant="outline"
                size="icon"
                aria-label="Sign out"
                className="border-[#c8d3dc] bg-white/80 text-[#35516b]"
              >
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[90rem] items-start gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card className="border-0 bg-white shadow-[0_18px_55px_rgba(24,49,79,0.09)] ring-[#cdd9e2]">
            <CardHeader className="border-b border-[#e3eaef] pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg text-[#18314f]">
                  <Calculator className="size-5 text-[#438072]" />
                  Edit costs
                </CardTitle>
                <Badge className="bg-[#d7f0e8] text-[#205f50]">
                  Live total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="worksheet-order">Order number</Label>
                  <Input
                    id="worksheet-order"
                    value={orderNumber}
                    onChange={(event) =>
                      setOrderNumber(event.target.value.slice(0, 40))
                    }
                    className="h-10 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worksheet-date">Date of search</Label>
                  <Input
                    id="worksheet-date"
                    value={searchDate}
                    readOnly
                    className="h-10 bg-[#f2f5f4] text-muted-foreground"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="worksheet-product">Product type</Label>
                  <Input
                    id="worksheet-product"
                    value={productType}
                    maxLength={80}
                    onChange={(event) => setProductType(event.target.value)}
                    className="h-10 bg-white"
                    placeholder="Enter product type"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="worksheet-note">Note</Label>
                  <Input
                    id="worksheet-note"
                    value={note}
                    maxLength={80}
                    onChange={(event) => setNote(event.target.value)}
                    className="h-10 bg-white"
                    placeholder="Optional note"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-[#e6ecef] pt-5">
                {rows.map((row) => (
                  <div key={row.key} className="space-y-2">
                    <Label htmlFor={`amount-${row.key}`}>{row.label}</Label>
                    <div className="grid grid-cols-[7.5rem_1fr] gap-2">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          id={`amount-${row.key}`}
                          inputMode="decimal"
                          value={amounts[row.key]}
                          onChange={(event) =>
                            updateAmount(row.key, event.target.value)
                          }
                          className="h-10 bg-white pl-7 text-right tabular-nums"
                          placeholder="0.00"
                        />
                      </div>
                      <Input
                        aria-label={`${row.label} comments`}
                        value={comments[row.key]}
                        onChange={(event) =>
                          updateComment(row.key, event.target.value)
                        }
                        className="h-10 bg-white"
                        placeholder="Comments"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#173a59] px-4 py-3 text-white">
                <span className="text-sm text-white/70">Total cost</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>

              {downloadError && (
                <p role="alert" className="text-sm text-[#a33d35]">
                  {downloadError}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#18314f]">
                PDF preview
              </p>
              <p className="text-xs text-muted-foreground">
                US Letter · values update as you type
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="size-4 text-[#438072]" />
              {seed.sourceLabel}
            </div>
          </div>

          <div className="rounded-2xl border border-[#d5dee5] bg-[#e8edef] p-3 sm:p-6 xl:p-10">
            <div className="mx-auto max-w-[51rem]">
              <WorksheetPreview
                orderNumber={orderNumber}
                searchDate={searchDate}
                stateCode={seed.stateCode}
                county={seed.county}
                productType={productType}
                fulfillment={seed.fulfillment}
                note={note}
                rows={rows}
                amounts={amounts}
                comments={comments}
                total={total}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
