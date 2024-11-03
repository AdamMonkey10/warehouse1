import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getItems, updateItem } from '@/lib/firebase/items';
import { Search, Filter, Package, QrCode, RefreshCcw } from 'lucide-react';
import type { Item } from '@/types/warehouse';

export default function Picking() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeSearch, setCodeSearch] = useState('');
  const [additionalSearch, setAdditionalSearch] = useState('');
  const [additionalFilterType, setAdditionalFilterType] = useState<'description' | 'category'>('description');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [scanDialog, setScanDialog] = useState<{
    open: boolean;
    step: 'item' | 'location';
  }>({ open: false, step: 'item' });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [codeSearch, additionalSearch, additionalFilterType, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await getItems();
      // Only show items that are placed in the warehouse
      const placedItems = fetchedItems.filter(item => item.status === 'placed');
      setItems(placedItems);
      setFilteredItems(placedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Apply code filter
    if (codeSearch.trim()) {
      const codeLower = codeSearch.toLowerCase();
      filtered = filtered.filter(item => 
        item.itemCode.toLowerCase().includes(codeLower)
      );
    }

    // Apply additional filter
    if (additionalSearch.trim()) {
      const searchLower = additionalSearch.toLowerCase();
      filtered = filtered.filter(item => {
        switch (additionalFilterType) {
          case 'description':
            return item.description.toLowerCase().includes(searchLower);
          case 'category':
            return item.category.toLowerCase().includes(searchLower);
          default:
            return true;
        }
      });
    }

    setFilteredItems(filtered);
  };

  const handlePick = (item: Item) => {
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
        // Verify item barcode
        if (scannedCode !== selectedItem.itemCode) {
          toast.error('Invalid item code scanned');
          return;
        }
        setScanDialog(prev => ({ ...prev, step: 'location' }));
        toast.success(`Please scan location: ${selectedItem.location}`);
      } else {
        // Verify location barcode
        if (scannedCode !== selectedItem.location) {
          toast.error('Invalid location code scanned');
          return;
        }

        // Update item status
        await updateItem(selectedItem.id, {
          status: 'removed',
          location: null,
        });

        toast.success('Item picked successfully');
        setScanDialog({ open: false, step: 'item' });
        setSelectedItem(null);
        loadItems();
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
        <h1 className="text-3xl font-bold">Picking</h1>
        <Button onClick={loadItems} variant="outline" disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Search Items
          </CardTitle>
          <CardDescription>
            Search and filter items for picking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item code..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Additional search..."
                  value={additionalSearch}
                  onChange={(e) => setAdditionalSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select 
                value={additionalFilterType} 
                onValueChange={(value: 'description' | 'category') => setAdditionalFilterType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items List</CardTitle>
          <CardDescription>
            {filteredItems.length} items available for picking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No items found matching your search.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemCode}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{getCategoryBadge(item.category)}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.weight}kg</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePick(item)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Pick
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                : `Please scan location ${selectedItem?.location}`}
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