import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExcelData {
  [key: string]: any;
}

interface ColumnMapping {
  [excelColumn: string]: string;
}

const INVENTORY_PRODUCT_FIELDS = {
  part_number: 'Part Number',
  name: 'Product Name',
  description: 'Description',
  category: 'Category',
  manufacturer: 'Manufacturer',
  unit_of_measure: 'Unit of Measure',
  minimum_stock: 'Minimum Stock',
  reorder_point: 'Reorder Point',
  unit_cost: 'Unit Cost'
};

const INVENTORY_BATCH_FIELDS = {
  part_number: 'Part Number (Reference)',
  batch_number: 'Batch Number',
  quantity: 'Quantity',
  cost_per_unit: 'Cost Per Unit',
  received_date: 'Received Date',
  expiry_date: 'Expiry Date',
  supplier_name: 'Supplier Name',
  location: 'Location',
  purchase_order: 'Purchase Order',
  supplier_invoice_number: 'Supplier Invoice Number',
  notes: 'Notes'
};

type ImportType = 'products' | 'batches';

export const ExcelImport = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [importType, setImportType] = useState<ImportType>('products');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheets = workbook.SheetNames;
        setSheetNames(sheets);
        
        if (sheets.length > 0) {
          setSelectedSheet(sheets[0]);
          const worksheet = workbook.Sheets[sheets[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert to object format with first row as headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          const formattedData = rows.map(row => {
            const obj: ExcelData = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          setExcelData(formattedData);
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast({
          title: "Error",
          description: "Failed to read Excel file. Please check the file format.",
          variant: "destructive"
        });
      }
    };

    reader.readAsBinaryString(file);
  }, [toast]);

  const handleSheetChange = useCallback((sheetName: string) => {
    if (!selectedFile) return;
    
    setSelectedSheet(sheetName);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      const formattedData = rows.map(row => {
        const obj: ExcelData = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      
      setExcelData(formattedData);
    };

    reader.readAsBinaryString(selectedFile);
  }, [selectedFile]);

  const getAvailableColumns = () => {
    if (excelData.length === 0) return [];
    return Object.keys(excelData[0]);
  };

  const getTargetFields = () => {
    return importType === 'products' ? INVENTORY_PRODUCT_FIELDS : INVENTORY_BATCH_FIELDS;
  };

  const handleImport = async () => {
    if (excelData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload and select data to import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      if (importType === 'products') {
        // Import products
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          try {
            const productData: any = {
              user_id: userData.user.id,
              part_number: row[columnMapping.part_number] || '',
              name: row[columnMapping.name] || '',
              description: row[columnMapping.description] || null,
              category: row[columnMapping.category] || null,
              manufacturer: row[columnMapping.manufacturer] || null,
              unit_of_measure: row[columnMapping.unit_of_measure] || 'each',
              minimum_stock: parseInt(row[columnMapping.minimum_stock]) || 0,
              reorder_point: parseInt(row[columnMapping.reorder_point]) || 0,
              unit_cost: parseFloat(row[columnMapping.unit_cost]) || null
            };

            if (!productData.part_number || !productData.name) {
              errors.push(`Row ${i + 1}: Part number and name are required`);
              continue;
            }

            const { error } = await supabase
              .from('inventory_products')
              .insert(productData);

            if (error) {
              errors.push(`Row ${i + 1}: ${error.message}`);
            } else {
              successCount++;
            }
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        // Import batches - need to find product IDs first
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          try {
            const partNumber = row[columnMapping.part_number];
            if (!partNumber) {
              errors.push(`Row ${i + 1}: Part number is required`);
              continue;
            }

            // Find the product
            const { data: product, error: productError } = await supabase
              .from('inventory_products')
              .select('id')
              .eq('part_number', partNumber)
              .eq('user_id', userData.user.id)
              .single();

            if (productError || !product) {
              errors.push(`Row ${i + 1}: Product with part number "${partNumber}" not found`);
              continue;
            }

            const batchData: any = {
              user_id: userData.user.id,
              product_id: product.id,
              batch_number: row[columnMapping.batch_number] || '',
              quantity: parseInt(row[columnMapping.quantity]) || 0,
              cost_per_unit: parseFloat(row[columnMapping.cost_per_unit]) || null,
              received_date: row[columnMapping.received_date] || new Date().toISOString().split('T')[0],
              expiry_date: row[columnMapping.expiry_date] || null,
              location: row[columnMapping.location] || null,
              purchase_order: row[columnMapping.purchase_order] || null,
              supplier_invoice_number: row[columnMapping.supplier_invoice_number] || null,
              notes: row[columnMapping.notes] || null
            };

            if (!batchData.batch_number) {
              errors.push(`Row ${i + 1}: Batch number is required`);
              continue;
            }

            const { error } = await supabase
              .from('inventory_batches')
              .insert(batchData);

            if (error) {
              errors.push(`Row ${i + 1}: ${error.message}`);
            } else {
              successCount++;
            }
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      setImportResults({ success: successCount, errors });
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} records with ${errors.length} errors.`,
        variant: successCount > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "An error occurred during import. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const fields = getTargetFields();
    const headers = Object.values(fields);
    const sampleData = [headers];
    
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${importType}_template`);
    XLSX.writeFile(wb, `${importType}_import_template.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Excel Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <Label>Import Type</Label>
            <Select value={importType} onValueChange={(value: ImportType) => setImportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Inventory Products</SelectItem>
                <SelectItem value="batches">Inventory Batches</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <span className="text-sm text-muted-foreground">
              Download a template with the correct column headers
            </span>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Excel File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload Excel file (.xlsx, .xls)
                </p>
                {selectedFile && (
                  <p className="text-sm font-medium mt-2 text-primary">
                    {selectedFile.name}
                  </p>
                )}
              </label>
            </div>
          </div>

          {/* Sheet Selection */}
          {sheetNames.length > 1 && (
            <div className="space-y-2">
              <Label>Select Sheet</Label>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Mapping */}
      {excelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(getTargetFields()).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Select 
                    value={columnMapping[key] || ''} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [key]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Skip --</SelectItem>
                      {getAvailableColumns().map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {excelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview ({excelData.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getAvailableColumns().map(col => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {getAvailableColumns().map(col => (
                        <TableCell key={col}>{row[col]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {excelData.length > 5 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  ... and {excelData.length - 5} more rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults && (
        <Alert className={importResults.errors.length > 0 ? "border-destructive" : "border-green-500"}>
          {importResults.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Import completed:</strong> {importResults.success} successful, {importResults.errors.length} errors</p>
              {importResults.errors.length > 0 && (
                <div className="max-h-32 overflow-auto">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {importResults.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Import Button */}
      {excelData.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleImport} 
            disabled={isImporting || Object.keys(columnMapping).length === 0}
            size="lg"
          >
            {isImporting ? 'Importing...' : `Import ${excelData.length} Records`}
          </Button>
        </div>
      )}
    </div>
  );
};