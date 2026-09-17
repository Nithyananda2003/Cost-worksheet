'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Database,
  FileText,
  FileSearch,
  Hash,
  Layers3,
  LoaderCircle,
  LogOut,
  MapPinned,
  RotateCcw,
} from 'lucide-react';

import { CostWorksheet, type WorksheetSeed } from '@/components/cost-worksheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

type Tier = 'T1' | 'T2' | 'Ground';

type Location = {
  id: string;
  stateCode: string;
  stateName: string;
  county: string;
  countyKey: string;
  fips: string | null;
  sourceRoute: string | null;
  primaryTier: string | null;
  secondaryTier: string | null;
  prices: Record<Tier, Record<string, number | null>>;
};

type PricingCatalog = {
  sourceFile: string;
  effectiveDate: string;
  updatedDate?: string;
  tiers: Tier[];
  orderTypes: string[];
  states: Record<string, string>;
  locations: Location[];
};

const DEFAULT_STATE = 'AL';
const DEFAULT_LOCATION = 'AL:baldwin:01003';
const DEFAULT_TIER: Tier = 'T2';
const DEFAULT_ORDER_TYPE = 'Full Search';

const TIER_LABELS: Record<Tier, string> = {
  T1: 'Online — T1',
  T2: 'Online — T2',
  Ground: 'Ground',
};

const FALLBACK_ORDER_TYPES = [
  'Current Owner',
  'Two Owner',
  'Full Search',
  'Update',
  'Legal & Vesting',
  'Property & Judgment',
  'Doc Search',
  'Extended Updates',
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

function locationLabel(location: Location, duplicateIds: Set<string>) {
  if (!duplicateIds.has(location.id)) return location.county;
  return `${location.county}${location.fips ? ` — FIPS ${location.fips}` : ''}`;
}

export default function PricingDesk() {
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [stateCode, setStateCode] = useState(DEFAULT_STATE);
  const [locationId, setLocationId] = useState(DEFAULT_LOCATION);
  const [tier, setTier] = useState<Tier>(DEFAULT_TIER);
  const [orderType, setOrderType] = useState(DEFAULT_ORDER_TYPE);
  const [orderNumber, setOrderNumber] = useState('');
  const [worksheetSeed, setWorksheetSeed] = useState<WorksheetSeed | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    fetch('/api/pricing', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Pricing data could not be loaded.');
        return response.json() as Promise<PricingCatalog>;
      })
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        const defaultLocation = data.locations.find(
          (location) => location.id === DEFAULT_LOCATION,
        );
        if (!defaultLocation) {
          const firstLocation = data.locations.find(
            (location) => location.stateCode === DEFAULT_STATE,
          );
          if (firstLocation) setLocationId(firstLocation.id);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const stateOptions = useMemo(() => {
    if (!catalog) return [{ code: 'AL', name: 'Alabama' }];
    const availableStates = new Set(
      catalog.locations.map((location) => location.stateCode),
    );
    return Object.entries(catalog.states)
      .filter(([code]) => availableStates.has(code))
      .map(([code, name]) => ({ code, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [catalog]);

  const countyOptions = useMemo(() => {
    if (!catalog) {
      return [
        {
          id: DEFAULT_LOCATION,
          stateCode: 'AL',
          stateName: 'Alabama',
          county: 'Baldwin',
          countyKey: 'baldwin',
          fips: '01003',
          sourceRoute: 'Online',
          primaryTier: '1',
          secondaryTier: '2',
          prices: {
            T1: { 'Full Search': 19 },
            T2: { 'Full Search': 42 },
            Ground: { 'Full Search': 142 },
          },
        } satisfies Location,
      ];
    }
    return catalog.locations
      .filter((location) => location.stateCode === stateCode)
      .sort(
        (left, right) =>
          left.county.localeCompare(right.county) ||
          (left.fips ?? '').localeCompare(right.fips ?? ''),
      );
  }, [catalog, stateCode]);

  const duplicateLocationIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const location of countyOptions) {
      counts.set(location.countyKey, (counts.get(location.countyKey) ?? 0) + 1);
    }
    return new Set(
      countyOptions
        .filter((location) => (counts.get(location.countyKey) ?? 0) > 1)
        .map((location) => location.id),
    );
  }, [countyOptions]);

  const selectedLocation =
    countyOptions.find((location) => location.id === locationId) ??
    countyOptions[0];
  const orderTypes = catalog?.orderTypes ?? FALLBACK_ORDER_TYPES;
  const selectedPrice = selectedLocation?.prices[tier]?.[orderType] ?? null;
  const matrixLabel = catalog?.updatedDate
    ? `Updated ${new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(`${catalog.updatedDate}T12:00:00`))}`
    : 'September 2025 matrix';
  const availablePricePoints = useMemo(
    () =>
      catalog?.locations.reduce(
        (sum, location) =>
          sum +
          Object.values(location.prices).reduce(
            (count, prices) =>
              count +
              Object.values(prices).filter((price) => price !== null).length,
            0,
          ),
        0,
      ) ?? 0,
    [catalog],
  );
  const selectedStateName =
    catalog?.states[stateCode] ?? selectedLocation?.stateName ?? 'Alabama';

  const chooseState = (nextState: string) => {
    setStateCode(nextState);
    const firstLocation = catalog?.locations
      .filter((location) => location.stateCode === nextState)
      .sort((left, right) => left.county.localeCompare(right.county))[0];
    setLocationId(firstLocation?.id ?? '');
  };

  const reset = () => {
    setStateCode(DEFAULT_STATE);
    setLocationId(DEFAULT_LOCATION);
    setTier(DEFAULT_TIER);
    setOrderType(DEFAULT_ORDER_TYPE);
    setOrderNumber('');
  };

  const resultStatus = loadError
    ? 'error'
    : !catalog
      ? 'loading'
      : selectedPrice === null
        ? 'unavailable'
        : 'found';

  const previewWorksheet = () => {
    if (!selectedLocation || selectedPrice === null || !orderNumber.trim())
      return;

    setWorksheetSeed({
      orderNumber: orderNumber.trim(),
      stateCode,
      county: selectedLocation.county,
      productType: orderType,
      fulfillment: tier === 'Ground' ? 'Ground' : 'Online',
      basePrice: selectedPrice,
      sourceLabel: matrixLabel,
    });
  };

  if (worksheetSeed) {
    return (
      <CostWorksheet
        seed={worksheetSeed}
        onBack={() => setWorksheetSeed(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-[#c9d4df]/80 bg-[#f8fbfc]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Database className="size-[18px]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-[15px] font-semibold tracking-[-0.01em]">
                ADS Pricing Desk
              </p>
              <p className="text-[11px] text-muted-foreground">
                County order cost lookup
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden border-[#bdcbc6] bg-white/80 text-[#365d53] sm:inline-flex"
            >
              <span className="mr-1 size-1.5 rounded-full bg-[#2f806c]" />
              {matrixLabel}
            </Badge>
            <form action="/api/auth/logout" method="post">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-[#c8d3dc] bg-white/80 text-[#35516b]"
              >
                <LogOut data-icon="inline-start" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-7 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3e7668]">
            Price to PDF workflow
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.035em] text-[#18314f] sm:text-[2.45rem] sm:leading-[1.1]">
            Find the price, then create the worksheet.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Enter the order number and choose the location, tier, and order
            type. You can review every cost before downloading the PDF.
          </p>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <Card className="border-0 bg-white shadow-[0_18px_55px_rgba(24,49,79,0.09)] ring-[#cdd9e2]">
            <CardHeader className="border-b border-[#e3eaef] pb-4">
              <CardTitle className="text-lg text-[#18314f]">
                Price criteria
              </CardTitle>
              <CardDescription>
                Enter the order number and complete all four selections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor="order-number"
                    className="flex items-center gap-2 text-[#2d465f]"
                  >
                    <Hash
                      className="size-4 text-[#438072]"
                      aria-hidden="true"
                    />
                    Order number
                  </Label>
                  <Input
                    id="order-number"
                    value={orderNumber}
                    onChange={(event) =>
                      setOrderNumber(event.target.value.slice(0, 40))
                    }
                    className="h-10 bg-white"
                    placeholder="Enter the order number"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="state"
                    className="flex items-center gap-2 text-[#2d465f]"
                  >
                    <MapPinned
                      className="size-4 text-[#438072]"
                      aria-hidden="true"
                    />
                    State
                  </Label>
                  <NativeSelect
                    id="state"
                    value={stateCode}
                    onChange={(event) => chooseState(event.target.value)}
                    className="w-full"
                    disabled={!catalog || loadError}
                  >
                    {stateOptions.map(({ code, name }) => (
                      <NativeSelectOption key={code} value={code}>
                        {name} ({code})
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="county"
                    className="flex items-center gap-2 text-[#2d465f]"
                  >
                    <Building2
                      className="size-4 text-[#438072]"
                      aria-hidden="true"
                    />
                    County / service area
                  </Label>
                  <NativeSelect
                    id="county"
                    value={selectedLocation?.id ?? ''}
                    onChange={(event) => {
                      setLocationId(event.target.value);
                    }}
                    className="w-full"
                    disabled={
                      !catalog || loadError || countyOptions.length === 0
                    }
                  >
                    {countyOptions.map((location) => (
                      <NativeSelectOption key={location.id} value={location.id}>
                        {locationLabel(location, duplicateLocationIds)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="tier"
                    className="flex items-center gap-2 text-[#2d465f]"
                  >
                    <Layers3
                      className="size-4 text-[#438072]"
                      aria-hidden="true"
                    />
                    Tier
                  </Label>
                  <NativeSelect
                    id="tier"
                    value={tier}
                    onChange={(event) => {
                      setTier(event.target.value as Tier);
                    }}
                    className="w-full"
                    disabled={loadError}
                  >
                    {(catalog?.tiers ?? (['T1', 'T2', 'Ground'] as Tier[])).map(
                      (tierOption) => (
                        <NativeSelectOption key={tierOption} value={tierOption}>
                          {TIER_LABELS[tierOption]}
                        </NativeSelectOption>
                      ),
                    )}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="order-type"
                    className="flex items-center gap-2 text-[#2d465f]"
                  >
                    <FileSearch
                      className="size-4 text-[#438072]"
                      aria-hidden="true"
                    />
                    Order type
                  </Label>
                  <NativeSelect
                    id="order-type"
                    value={orderType}
                    onChange={(event) => {
                      setOrderType(event.target.value);
                    }}
                    className="w-full"
                    disabled={loadError}
                  >
                    {orderTypes.map((option) => (
                      <NativeSelectOption key={option} value={option}>
                        {option}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6ecef] pt-5">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BadgeCheck
                    className="size-4 text-[#2f806c]"
                    aria-hidden="true"
                  />
                  No estimates or cross-tier substitutions
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[#35516b]"
                  onClick={reset}
                >
                  <RotateCcw data-icon="inline-start" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            aria-live="polite"
            aria-atomic="true"
            className="border-0 bg-[#173a59] text-white shadow-[0_18px_55px_rgba(23,58,89,0.2)] ring-white/10"
          >
            <CardHeader>
              <div className="mb-3 flex items-center justify-between gap-3">
                {resultStatus === 'found' && (
                  <Badge className="bg-[#d7f0e8] text-[#205f50]">
                    Price found
                  </Badge>
                )}
                {resultStatus === 'unavailable' && (
                  <Badge className="bg-[#fff0cf] text-[#775b18]">
                    Not available
                  </Badge>
                )}
                {resultStatus === 'loading' && (
                  <Badge className="bg-white/10 text-white/80">
                    <LoaderCircle className="mr-1 animate-spin" /> Loading
                    matrix
                  </Badge>
                )}
                {resultStatus === 'error' && (
                  <Badge className="bg-[#ffd9d5] text-[#8b2b24]">
                    <AlertTriangle className="mr-1" /> Data unavailable
                  </Badge>
                )}
                <span className="text-xs text-white/55">{matrixLabel}</span>
              </div>

              <CardDescription className="text-white/60">
                {TIER_LABELS[tier]} · {orderType}
              </CardDescription>
              <CardTitle className="mt-1 font-heading text-5xl font-semibold tracking-[-0.04em]">
                {resultStatus === 'loading'
                  ? '—'
                  : resultStatus === 'error'
                    ? 'Try again'
                    : selectedPrice === null
                      ? 'Unavailable'
                      : formatPrice(selectedPrice)}
              </CardTitle>
              {resultStatus === 'unavailable' && (
                <p className="mt-2 max-w-xs text-sm leading-5 text-white/60">
                  The source matrix has no price for this exact combination.
                </p>
              )}
              {resultStatus === 'error' && (
                <p className="mt-2 max-w-xs text-sm leading-5 text-white/60">
                  The pricing file could not be loaded. Refresh the page to
                  retry.
                </p>
              )}
            </CardHeader>

            <CardContent className="mt-auto space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm font-medium">
                  {selectedLocation?.county ?? 'Select a county'},{' '}
                  {selectedStateName}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/45">FIPS</p>
                    <p className="mt-1 font-medium text-white/85">
                      {selectedLocation?.fips ?? 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/45">Source route</p>
                    <p className="mt-1 font-medium text-white/85">
                      {selectedLocation?.sourceRoute ?? 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {catalog && selectedLocation && !loadError && (
                <div className="grid grid-cols-3 gap-2">
                  {catalog.tiers.map((comparisonTier) => {
                    const comparisonPrice =
                      selectedLocation.prices[comparisonTier]?.[orderType] ??
                      null;
                    return (
                      <button
                        key={comparisonTier}
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-left transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78bca8]"
                        onClick={() => setTier(comparisonTier)}
                        aria-label={`Select ${TIER_LABELS[comparisonTier]}`}
                      >
                        <span className="block text-[10px] text-white/45">
                          {comparisonTier}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-white/85">
                          {comparisonPrice === null
                            ? 'N/A'
                            : formatPrice(comparisonPrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                className="w-full bg-white text-[#173a59] hover:bg-[#eef5f3]"
                disabled={
                  selectedPrice === null ||
                  resultStatus !== 'found' ||
                  !orderNumber.trim()
                }
                onClick={previewWorksheet}
              >
                <FileText data-icon="inline-start" />
                Preview cost worksheet
              </Button>
              {resultStatus === 'found' && !orderNumber.trim() && (
                <p className="text-center text-xs text-white/55">
                  Enter the order number to continue to the PDF preview.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            {availablePricePoints.toLocaleString()} available price points
            across {(catalog?.locations.length ?? 0).toLocaleString()} locations
          </p>
          <p>Blank or invalid source prices are shown as unavailable.</p>
        </div>
      </section>
    </main>
  );
}
