import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, PackagePlus, Warehouse, Clock } from 'lucide-react';
import { getItems } from '@/lib/firebase/items';
import { getLocations } from '@/lib/firebase/locations';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Item, Location } from '@/types/warehouse';

interface LocationStats {
  total: number;
  empty: number;
  occupied: number;
  occupancyRate: number;
}

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats>({
    total: 0,
    empty: 0,
    occupied: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedItems, fetchedLocations] = await Promise.all([
          getItems(),
          getLocations()
        ]);

        setItems(fetchedItems);

        // Calculate location statistics
        const stats = fetchedLocations.reduce((acc, location) => {
          acc.total++;
          if (location.currentWeight === 0) {
            acc.empty++;
          } else {
            acc.occupied++;
          }
          return acc;
        }, { total: 0, empty: 0, occupied: 0 });

        setLocationStats({
          ...stats,
          occupancyRate: (stats.occupied / stats.total) * 100
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  // Get counts
  const placedItems = items.filter(item => item.status === 'placed').length;
  const pendingItems = items.filter(item => item.status === 'pending').length;

  return (
    <div className="relative space-y-6 min-h-[calc(100vh-4rem)]">
      {/* Background Logo */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] -z-10">
        <svg className="w-full max-w-7xl" viewBox="0 0 128.7 58.3" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="m128.2.5h-127.7v39.6h127.6v-39.6z" />
          <path d="m128.2.5h-127.7v39.6h127.6v-39.6z" />
          <path d="m.3 0h128.2.3v.3 40.1.3h-.3-128.2-.3v-.3-40.1-.3zm2.4 2.7h123.4v35.3h-123.4zm125.5-2.2h-127.7v39.6h127.6z" />
          <path d="m26.7 15.5v-6.4c0-.7-.4-1.1-1.2-1.3h6.3c2 0 3.7.2 5.2.6 1.4.4 2.5.9 3.2 1.6s1.1 1.5 1.1 2.4c-.1.8-.4 1.5-1.2 2.1-.7.7-1.8 1.2-3.2 1.6s-3.2.6-5.4.6h-6v-.1c.8 0 1.2-.5 1.2-1.1zm84.2 11.8c0-.6.3-1 .9-1.4s1.3-.6 2.2-.8 2-.3 3.1-.3 2.3.1 3.5.3v1.6c-.5-.3-1.2-.5-1.8-.7-.7-.2-1.4-.2-2.1-.2s-1.4.1-2 .3c-.5.2-.9.4-1 .7 0 .1-.1.2-.1.3 0 .4.3.8.9 1 .6.3 1.4.5 2.4.8l2 .6c.8.2 1.5.5 2.1.9s.9.9.9 1.4c-.1.6-.4 1.1-1 1.5s-1.4.8-2.4 1-2.2.4-3.4.4-2.6-.1-4-.4l-.7-1.8c.8.4 1.6.7 2.5.9s1.8.3 2.6.3c1 0 1.8-.2 2.6-.4s1.2-.6 1.2-1.1c0-.7-.8-1.2-2.4-1.6l-2.8-.8c-.5-.2-1-.3-1.5-.6-.5-.2-.9-.5-1.2-.8s-.5-.7-.5-1.1zm-14.7 5.2v-5.5c0-.4 0-.7-.1-.9 0-.2-.1-.4-.3-.6-.1-.2-.4-.3-.8-.4l.1-.1h5.7c1.7 0 3 .2 3.8.7s1.3 1.1 1.3 1.8c-.1.5-.5.9-1.1 1.4-.6.4-1.6.7-2.8.9l3.7 2.7c.3.2.7.5 1.3.8s1.4.7 2.4 1.1h-2.4c-.6 0-1.2-.1-1.6-.2s-.8-.3-1.1-.6l-2.8-2.1-2.2-2c.7-.1 1.3-.2 2-.3.6-.2 1.2-.4 1.6-.7s.6-.7.6-1.1c-.1-.5-.4-.9-1-1.1s-1.3-.3-2.2-.3c-.4 0-.9 0-1.6.1v6.5c0 .5 0 .8.1 1s.1.4.3.6.4.3.7.4h-4.6v-.1c.5-.1.8-.3.9-.6 0-.3.1-.8.1-1.4zm-13.6.6v-6.3c0-.4-.1-.8-.2-1.1s-.4-.5-.9-.6h7.8.4c.4 0 .6-.1.7-.1h.1v1.7h-.1c-.4-.2-.7-.4-1.2-.4-.5-.1-1-.1-1.8-.1-.4 0-.8 0-1.1 0s-.5 0-.6 0-.3 0-.4 0-.2 0-.3 0v2.7h2.3.6c.6 0 .9-.1 1.1-.1h.1v1.5h-.1c-.3-.3-1-.4-2-.4h-1.9v3.4c.6 0 1.3.1 1.9.1s1.1.1 1.5.1h.5c1.4 0 2.7-.3 3.8-.9h.1l-1.1 1.9h-10.3v-.1c.7-.1 1.1-.5 1.1-1.3zm-19.9 0v-6.3-.3c0-.4-.1-.7-.2-.9-.1-.3-.4-.4-.9-.5h4.9c-.5.1-.8.3-.9.6s-.2.7-.2 1.2v2h9.2v-2.2c0-.4-.1-.8-.2-1-.1-.3-.5-.5-1-.6h4.9c-.4.1-.7.3-.9.5s-.3.6-.3 1.1v6.4c0 .8.4 1.2 1.2 1.4v.1h-4.9v-.1c.8-.2 1.2-.6 1.2-1.4v-3.2h-9.2v3.2c0 .8.4 1.2 1.1 1.4v.1h-4.9v-.1c.8-.2 1.1-.6 1.1-1.4zm-10.5 0v-7h-2c-1.4 0-2.4.2-3 .6h-.2l.9-1.7h.1c.2.1.6.1 1.1.1h9.3c.6 0 1.1 0 1.3-.1h.1l-.8 1.6h-.1c-.1-.2-.4-.4-.7-.4-.3-.1-.8-.1-1.3-.1h-2.2v7c0 .3.1.6.2.8.2.2.5.4 1 .6v.1h-4.8v-.1c.7-.2 1.1-.6 1.1-1.4zm-19.1-.6 4.4-6.2c.2-.3.3-.5.3-.6 0-.3-.2-.5-.7-.6h4.1l5.7 7.9c.3.4.6.8.9 1s.7.4 1.3.6v.1h-5.3v-.1c.6-.1.9-.3.9-.5 0-.1-.1-.3-.3-.6l-1.8-2.5h-6.5l-1.5 2.3c-.1.2-.2.4-.3.6.1.3.4.5.9.6v.1h-4.7v-.1c.4-.1.6-.2.9-.4.3-.1.5-.3.6-.5.2-.2.3-.4.5-.6.3-.2.5-.4.6-.5zm3.7-2.6h5l-2.5-3.6zm-17.5 2.8v-5.9c0-.5-.1-.9-.2-1.2s-.4-.5-.9-.6h4.7c-.4.1-.7.3-.9.5-.1.3-.2.6-.2.9v.3 6.6c.5 0 1.1 0 2 .1h1.6c.7 0 1.4-.1 2-.2s1.4-.3 2.1-.7h.1l-1.2 1.9h-10v-.1c.7-.2 1.1-.6 1.1-1.5v-.1zm-11.5.4v-6.3-.3c0-.4-.1-.7-.2-.9-.1-.3-.4-.4-.9-.5h7.8.4c.4 0 .6-.1.8-.1h.1v1.7c-.3-.2-.7-.3-1.2-.4s-1-.1-1.8-.1c-1 0-1.8 0-2.4.1v2.7h2.3c.8 0 1.4 0 1.7-.1v1.5c-.2-.2-.4-.3-.7-.3-.3-.1-.8-.1-1.4-.1h-1.9v3 .2c0 .3.1.6.3.9s.4.4.8.5v.1h-4.8v-.1c.7-.3 1.1-.7 1.1-1.5zm79.7-17.9v-5.8c0-.5-.1-.8-.3-1s-.5-.4-1-.5h3.7c0 .1.3.3.8.6l9.3 6.3v-5.4c0-.4-.1-.7-.2-.9-.2-.3-.5-.5-1.1-.6h4.5c-.4.1-.6.2-.8.3s-.3.3-.4.5-.1.5-.1.8v7.8c-.8-.1-1.5-.3-1.9-.5-.5-.2-.9-.5-1.4-.8l-9.1-6.3v5.5c0 .3 0 .6.1.8s.2.3.4.4.4.2.8.3v.1h-4.5v-.1c.5-.1.9-.3 1.1-.6 0-.1.1-.5.1-.9zm-7.5-.3v-5.3c0-.6-.1-1-.2-1.2-.1-.3-.4-.4-.9-.6h4.8c-.3.1-.5.2-.7.4s-.3.3-.3.5-.1.5-.1.9v5.3c0 .5 0 .8.1 1 0 .2.2.4.3.5.2.1.4.2.7.3v.1h-4.8v-.1c.5-.1.8-.3.9-.6.1-.1.2-.6.2-1.2zm-13.6-2.7 4.1-2.9c.5-.3.7-.6.7-.8s-.3-.4-.8-.6h4.6l-5.9 4 5.2 3.7c.4.3.7.5 1.2.6.4.2 1 .4 1.9.6v.1h-2.6c-.6 0-1 0-1.4-.1s-.7-.2-1-.3-.5-.3-.6-.4c-.2-.1-.3-.3-.4-.3zm-2.9 2.7v-5.2c0-.5-.1-.9-.2-1.2s-.4-.5-1-.6h4.9c-.5.1-.8.3-.9.5-.1.3-.2.7-.2 1.3v5.2c0 .5 0 .8.1 1.1 0 .2.1.4.3.5s.4.2.7.3v.1h-4.8v-.1c.5-.1.8-.3.9-.6s.2-.7.2-1.3zm-19.2 0 4.6-5.9c.2-.3.3-.5.3-.6 0-.3-.3-.5-.8-.5h4.3l6 7.5c.3.4.6.7 1 .9.3.2.8.4 1.4.6v.1h-5.6v-.1c.6-.1 1-.3 1-.4s-.1-.3-.3-.6l-1.8-2.3h-6.9l-1.6 2.2c-.1.2-.2.4-.3.5.1.3.4.5 1 .6v.1h-5v-.1c.4-.1.7-.2 1-.3s.5-.3.7-.4c.2-.2.4-.4.5-.6.2-.4.3-.6.5-.7zm3.9-2.5h5.4l-2.7-3.4zm-18.9 3.4c.4 0 1 .1 1.8.1 1.2 0 2.3-.1 3.4-.3s2-.6 2.7-1c.7-.5 1.1-1.1 1.2-1.8 0 0 0-.1 0-.2s0-.1 0-.2c0-.9-.3-1.6-1-2.2-.7-.5-1.5-.9-2.5-1.1s-2.1-.3-3.2-.3c-.7 0-1.5 0-2.3.1z" />
        </svg>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ThemeToggle />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/inventory" className="transition-transform hover:scale-[1.02]">
          <Card className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{placedItems}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Items in warehouse
              </div>
              <div className="h-1 w-full bg-muted mt-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${Math.min(100, (placedItems / 1000) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/locations" className="transition-transform hover:scale-[1.02]">
          <Card className="hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-colors border-2 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location Status</CardTitle>
              <Warehouse className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(locationStats.occupancyRate)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {locationStats.occupied} Used / {locationStats.empty} Empty
              </div>
              <div className="h-1 w-full bg-muted mt-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${locationStats.occupancyRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/goods-in" className="transition-transform hover:scale-[1.02]">
          <Card className="hover:bg-green-500/5 dark:hover:bg-green-500/10 transition-colors border-2 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goods In</CardTitle>
              <PackagePlus className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {pendingItems}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Pending items
              </div>
              <div className="h-1 w-full bg-muted mt-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ 
                    width: `${Math.min(100, (pendingItems / 50) * 100)}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/pending" className="transition-transform hover:scale-[1.02]">
          <Card className="hover:bg-yellow-500/5 dark:hover:bg-yellow-500/10 transition-colors border-2 border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {pendingItems}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Items awaiting placement
              </div>
              <div className="h-1 w-full bg-muted mt-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all" 
                  style={{ 
                    width: `${Math.min(100, (pendingItems / 50) * 100)}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}