import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { addItem } from '@/lib/firebase/items';
import { generateItemCode } from '@/lib/utils';
import { Barcode as BarcodeIcon, Printer } from 'lucide-react';
import { Barcode } from '@/components/barcode';

export default function GoodsIn() {
  const [formData, setFormData] = useState({
    itemCode: '',
    description: '',
    weight: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Generate unique system code (e.g., FIN-2411031818-665)
      const systemCode = generateItemCode(formData.category, Date.now());
      setGeneratedCode(systemCode);

      // Add the item to the items collection as pending
      await addItem({
        itemCode: formData.itemCode, // User's reference code
        systemCode, // Generated barcode
        description: formData.description,
        weight: parseFloat(formData.weight),
        category: formData.category,
        status: 'pending',
      });

      toast.success('Item added to pending list');
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
      setGeneratedCode('');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { margin: 20px; }
              .barcode-container { text-align: center; }
              .item-details { 
                margin-top: 20px; 
                font-family: Arial;
                text-align: center;
              }
              .code {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .details {
                font-size: 16px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${document.getElementById('barcode-svg')?.outerHTML}
            </div>
            <div class="item-details">
              <div class="code">${generatedCode}</div>
              <div class="details">
                <p><strong>Reference:</strong> ${formData.itemCode}</p>
                <p><strong>Weight:</strong> ${formData.weight}kg</p>
              </div>
            </div>
            <script>window.onload = () => window.print()</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleReset = () => {
    setFormData({
      itemCode: '',
      description: '',
      weight: '',
      category: '',
    });
    setGeneratedCode('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goods In</h1>
      </div>

      {generatedCode && (
        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarcodeIcon className="h-5 w-5" />
              Generated Barcode
            </CardTitle>
            <CardDescription>
              Print this barcode and attach it to the item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Barcode value={generatedCode} className="w-full max-w-md" />
              <div className="text-center">
                <div className="text-lg font-bold">{generatedCode}</div>
                <div className="text-sm text-muted-foreground">
                  Reference: {formData.itemCode}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Barcode
                </Button>
                <Button onClick={handleReset} variant="default">
                  Process Next Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle>Receive Items</CardTitle>
            <CardDescription>
              Enter the details of the items being received into the warehouse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemCode">Item Code</Label>
                  <Input
                    id="itemCode"
                    placeholder="Enter reference code"
                    value={formData.itemCode}
                    onChange={(e) =>
                      setFormData({ ...formData, itemCode: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    placeholder="Enter weight"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Raw Materials</SelectItem>
                      <SelectItem value="finished">Finished Goods</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="spare">Spare Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter item description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Generate Barcode'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}