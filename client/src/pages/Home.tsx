import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Leaf, Recycle, Heart, Truck, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ItemCard } from '@/components/ItemCard';
import { ItemsGridSkeleton } from '@/components/ItemCardSkeleton';
import api, { type Item, type Category, type ItemFilters } from '@/services/api';

const conditions = ['New', 'Like New', 'Good', 'Fair'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Home() {
  const [filters, setFilters] = useState<ItemFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items', filters],
    queryFn: async () => {
      const response = await api.items.getAll(filters);
      return response.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await api.categories.getAll();
      return response.data;
    },
  });

  const items: Item[] = itemsData?.data || itemsData || [];
  const categories: Category[] = categoriesData?.data || categoriesData || [];

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFilterCount = Object.keys(filters).filter((key) => filters[key as keyof ItemFilters]).length;

  const FilterContent = () => (
    <div className="space-y-6">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Categories
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={filters.category_id === category.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  category_id: prev.category_id === category.id ? undefined : category.id,
                }))
              }
              data-testid={`filter-category-${category.id}`}
            >
              {category.name}
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Condition
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {conditions.map((condition) => (
            <Button
              key={condition}
              variant={filters.condition === condition ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  condition: prev.condition === condition ? undefined : condition,
                }))
              }
              data-testid={`filter-condition-${condition.toLowerCase()}`}
            >
              {condition}
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Size
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size}
                variant={filters.size === size ? 'secondary' : 'outline'}
                size="sm"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    size: prev.size === size ? undefined : size,
                  }))
                }
                data-testid={`filter-size-${size.toLowerCase()}`}
              >
                {size}
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters} data-testid="button-clear-filters">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1920&q=80')`,
            zIndex: -1,
          }}
        />
        <div className="relative h-full container mx-auto px-4 md:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-2xl space-y-6">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
              Sustainable Fashion Marketplace
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Give Your Clothes a Second Life
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Join the circular fashion movement. Buy, sell, and donate pre-loved clothing
              to reduce textile waste and embrace ethical consumption.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" data-testid="button-hero-shop">
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
                data-testid="button-hero-sell"
              >
                Start Selling
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-card">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Eco-Friendly</h3>
                <p className="text-sm text-muted-foreground">Reduce fashion waste</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Recycle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Circular Economy</h3>
                <p className="text-sm text-muted-foreground">Give clothes new life</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Community</h3>
                <p className="text-sm text-muted-foreground">Connect with sellers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">Local pickup available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" id="shop">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <FilterContent />
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.sort || ''}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value || undefined }))}
                  >
                    <SelectTrigger className="w-[160px]" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild className="lg:hidden">
                      <Button variant="outline" data-testid="button-filters-mobile">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px]">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filters.category_id && (
                    <Badge variant="secondary">
                      {categories.find((c) => c.id === filters.category_id)?.name}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setFilters((prev) => ({ ...prev, category_id: undefined }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.condition && (
                    <Badge variant="secondary">
                      {filters.condition}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setFilters((prev) => ({ ...prev, condition: undefined }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.size && (
                    <Badge variant="secondary">
                      Size: {filters.size}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setFilters((prev) => ({ ...prev, size: undefined }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.search && (
                    <Badge variant="secondary">
                      "{filters.search}"
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, search: undefined }));
                          setSearchQuery('');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {isLoadingItems ? (
                <ItemsGridSkeleton />
              ) : items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No items found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
