import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getItemsByStatus, updateItem } from '@/lib/firebase/items';
import { getAvailableLocations, updateLocation } from '@/lib/firebase/locations';
import { findOptimalLocation } from '@/lib/warehouse-logic';
import { Package2, QrCode, RefreshCcw } from 'lucide-react';
import type { Item, Location } from '@/types/warehouse';

export default function Pending() {
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [suggestedLocation, setSuggestedLocation] = useState<Location | null>(null);
  const [scanDialog, setScanDialog] = useState<{
    open: boolean;
    step: 'item' | 'location';
  }>({ open: false, step: 'item' });

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    try {
      setLoading(true);
      const items = await getItemsByStatus('pending');
      setPendingItems(items);
    } catch (error) {
      console.error('Error loading pending items:', error);
      toast.error('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = async (item: Item) => {
    setSelectedItem(item);
    setScanDialog({ open: true, step: 'item' });
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('scanInput') as HTMLInputElement;
    const scannedCode = input.value.trim();
    form.reset();

    if (!selectedItem) return;

    try {
      if (scanDialog.step === 'item') {
        // Verify item barcode using systemCode
        if (scannedCode !== selectedItem.systemCode) {
          toast.error('Invalid item code scanned');
          return;
        }

        // Get available locations after item verification
        const availableLocations = await getAvailableLocations(selectedItem.weight);
        if (availableLocations.length > 0) {
          const optimal = findOptimalLocation(availableLocations, selectedItem.weight);
          if (optimal) {
            setSuggestedLocation(optimal);
            toast.success(`Please scan location: ${optimal.code}`);
            setScanDialog(prev => ({ ...prev, step: 'location' }));
          } else {
            toast.error('No optimal location found for this weight');
          }
        } else {
          toast.error('No suitable locations available');
        }
      } else {
        // Verify location barcode
        if (!suggestedLocation || scannedCode !== suggestedLocation.code) {
          toast.error('Invalid location code scanned');
          return;
        }

        // Update location with item
        await updateLocation(suggestedLocation.id, {
          currentWeight: suggestedLocation.currentWeight + selectedItem.weight,
        });

        // Update item with location
        await updateItem(selectedItem.id, {
          status: 'placed',
          location: suggestedLocation.code,
          locationVerified: true,
        });

        toast.success('Item placed successfully');
        setScanDialog({ open: false, step: 'item' });
        setSelectedItem(null);
        setSuggestedLocation(null);
        loadPendingItems();
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      toast.error('Failed to process scan');
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      raw: 'bg-blue-100 text-blue-800',
      finished: 'bg-green-100 text-green-800',
      packaging: 'bg-yellow-100 text-yellow-800',
      spare: 'bg-purple-100 text-purple-800',
    }[category] || 'bg-gray-100 text-gray-800';

    const labels = {
      raw: 'Raw Materials',
      finished: 'Finished Goods',
      packaging: 'Packaging',
      spare: 'Spare Parts',
    }[category] || category;

    return (
      <Badge variant="outline" className={styles}>
        {labels}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pending Items</h1>
        <Button onClick={loadPendingItems} variant="outline" disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Items Awaiting Placement
          </CardTitle>
          <CardDescription>
            Scan items and assign them to warehouse locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading pending items...
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No pending items found.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.systemCode}</h3>
                      <p className="text-sm text-muted-foreground">
                        Reference: {item.itemCode}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getCategoryBadge(item.category)}
                        <span className="text-sm text-muted-foreground">
                          {item.weight}kg
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleItemSelect(item)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={scanDialog.open} onOpenChange={(open) => !open && setScanDialog({ open: false, step: 'item' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scanDialog.step === 'item' ? 'Scan Item' : 'Scan Location'}
            </DialogTitle>
            <DialogDescription>
              {scanDialog.step === 'item'
                ? 'Please scan the barcode on the item'
                : `Please scan location ${suggestedLocation?.code}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScan} className="space-y-4">
            <div className="relative">
              <QrCode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="scanInput"
                placeholder={`Scan ${scanDialog.step} barcode...`}
                className="pl-9"
                autoComplete="off"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              Verify Scan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}