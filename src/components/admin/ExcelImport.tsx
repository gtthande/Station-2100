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
  part_number: 'Part Number (PARTNO)',
  description: 'Description (DESCRIP)',
  bin_no: 'Bin Number (BINNO)',
  unit_of_measure: 'Unit of Measure (UNIT_OF_MEASURE)',
  unit_cost: 'Unit Cost (PURCHPRICE)',
  sale_markup: 'Sale Markup (SALEMARKUP)',
  sale_price: 'Sale Price (SALEPRICE)',
  open_balance: 'Open Balance (OPENBALANCE)',
  reorder_qty: 'Reorder Quantity (REORDERQTY)',
  open_bal_date: 'Open Balance Date (OPENBALDATE)',
  active: 'Active',
  department_id: 'Department ID (DEPARTMENT_ID)',
  stock_category: 'Stock Category (STOCKCATEGORY)',
  superseding_no: 'Superseding No (SUPERCEDING_NO)',
  minimum_stock: 'Minimum Stock',
  reorder_point: 'Reorder Point',
  purchase_price: 'Purchase Price',
  rack: 'Rack',
  row_position: 'Row Position'
};

const INVENTORY_BATCH_FIELDS = {
  receipt_id: 'Receipt ID (RECEIPTID)',
  part_number: 'Part Number (PARTNO) - Reference',
  batch_number: 'Batch Number (BATCH_NO)',
  supplier_id: 'Supplier ID (SUPPLIER_ID)',
  department_id: 'Department ID (DEPARTMENT_ID)',
  quantity: 'Quantity (QUANTITY)',
  buying_price: 'Buying Price (BUYING_PRICE)',
  sale_markup_percent: 'Sale Markup % (SALE_MARKUP_PERCENT)',
  sale_markup_value: 'Sale Markup Value (SALE_MARKUP_VALUE)',
  selling_price: 'Selling Price (SELLING_PRICE)',
  lpo: 'LPO',
  reference_no: 'Reference No (REFERENCE_NO)',
  batch_date: 'Batch Date (BATCH_DATE)',
  expiry_date: 'Expiry Date (EXPIRY_DATE)',
  bin_no: 'Bin No (BIN_NO)',
  the_size: 'Size (THESIZE)',
  dollar_rate: 'Dollar Rate (DOLLAR_RATE)',
  freight_rate: 'Freight Rate (FREIGHT_RATE)',
  total_rate: 'Total Rate (TOTAL_RATE)',
  dollar_amount: 'Dollar Amount (DOLLAR_AMOUNT)',
  core_value: 'Core Value (CORE_VALUE)',
  aircraft_reg_no: 'Aircraft Reg No (AIRCRAFTREGNO)',
  batch_id_a: 'Batch ID A (BATCH_ID_A)',
  batch_id_b: 'Batch ID B (BATCH_ID_B)',
  received_by: 'Received By (RECEIVEDBY)',
  receive_code: 'Receive Code (RECEIVECODE)',
  verified_by: 'Verified By (VERIFIEDBY)',
  verification_code: 'Verification Code (VERIFICATIONCODE)',
  core_id: 'Core ID (CORE_ID)',
  serial_no: 'Serial No (SERIAL_NO)',
  alternate_department_id: 'Alternate Department ID (ALTERNATE_DEPARTMENT_ID)',
  cost_per_unit: 'Cost Per Unit',
  received_date: 'Received Date',
  location: 'Location',
  purchase_order: 'Purchase Order',
  supplier_invoice_number: 'Supplier Invoice Number',
  notes: 'Notes'
};

const SUPPLIER_FIELDS = {
  name: 'Supplier Name (Required)',
  email: 'Email Address',
  phone: 'Phone Number',
  address: 'Street Address',
  city: 'City',
  state: 'State/Province',
  country: 'Country',
  website: 'Website URL',
  contact_person: 'Contact Person',
  specialty: 'Specialty/Services',
  payment_terms: 'Payment Terms',
  notes: 'Notes/Comments'
};

type ImportType = 'products' | 'batches' | 'suppliers';

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
    console.log('🔥 handleFileUpload called - event:', event);
    const file = event.target.files?.[0];
    console.log('🔥 File from input:', file);
    if (!file) {
      console.log('🔥 No file selected, returning');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    
    // Show loading state immediately
    toast({
      title: "Processing",
      description: "Reading Excel file...",
    });

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log('FileReader onload triggered');
        const data = e.target?.result;
        if (!data) {
          throw new Error('No data read from file');
        }
        
        console.log('Reading workbook...');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheets = workbook.SheetNames;
        console.log('Sheets found:', sheets);
        setSheetNames(sheets);
        
        if (sheets.length > 0) {
          setSelectedSheet(sheets[0]);
          const worksheet = workbook.Sheets[sheets[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log('Raw data:', jsonData.slice(0, 3)); // Log first 3 rows
          
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
          
          console.log('Formatted data:', formattedData.slice(0, 2)); // Log first 2 rows
          setExcelData(formattedData);
          
          toast({
            title: "Success",
            description: `Excel file loaded with ${formattedData.length} rows`,
          });
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast({
          title: "Error",
          description: `Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        });
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast({
        title: "Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive"
      });
    };

    console.log('Starting to read file as binary string...');
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
    return Object.keys(excelData[0]).filter(key => key && key.trim() !== '');
  };

  const getTargetFields = () => {
    switch (importType) {
      case 'products':
        return INVENTORY_PRODUCT_FIELDS;
      case 'batches':
        return INVENTORY_BATCH_FIELDS;
      case 'suppliers':
        return SUPPLIER_FIELDS;
      default:
        return INVENTORY_PRODUCT_FIELDS;
    }
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
        // Import products with all new fields
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          try {
            // Helper function to get mapped value
            const getMappedValue = (fieldKey: string) => {
              const excelColumn = columnMapping[fieldKey];
              return excelColumn ? row[excelColumn] : '';
            };

            // Helper function to parse numeric values
            const parseNumeric = (value: any): number | null => {
              if (value === null || value === undefined || value === '') return null;
              const parsed = parseFloat(String(value));
              return isNaN(parsed) ? null : parsed;
            };

            // Helper function to parse date values
            const parseDate = (value: any): string | null => {
              if (!value) return null;
              try {
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
              } catch {
                return null;
              }
            };

            // Helper function to parse boolean values
            const parseBoolean = (value: any): boolean => {
              if (typeof value === 'boolean') return value;
              const str = String(value).toLowerCase();
              return str === 'true' || str === '1' || str === 'yes' || str === 'active';
            };

            // Helper function to parse UUID (department_id, stock_category)  
            const parseUUID = (value: any): string | null => {
              if (!value || String(value).trim() === '') return null;
              const str = String(value).trim();
              
              // Enhanced UUID format validation
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              if (!uuidRegex.test(str)) {
                console.warn(`Invalid UUID format: ${str}`);
                return null;
              }
              
              // Additional length validation
              if (str.length !== 36) {
                console.warn(`Invalid UUID length: ${str.length}, expected 36`);
                return null;
              }
              
              return str;
            };

            const productData: any = {
              user_id: userData.user.id,
              part_number: String(getMappedValue('part_number') || '').trim(),
              description: String(getMappedValue('description') || '').trim(),
              bin_no: String(getMappedValue('bin_no') || '').trim(),
              unit_of_measure: String(getMappedValue('unit_of_measure') || 'each').trim(),
              unit_cost: parseNumeric(getMappedValue('unit_cost')),
              purchase_price: parseNumeric(getMappedValue('purchase_price')),
              sale_markup: parseNumeric(getMappedValue('sale_markup')),
              sale_price: parseNumeric(getMappedValue('sale_price')),
              open_balance: parseNumeric(getMappedValue('open_balance')),
              reorder_qty: parseNumeric(getMappedValue('reorder_qty')),
              open_bal_date: parseDate(getMappedValue('open_bal_date')),
              active: parseBoolean(getMappedValue('active')),
              department_id: parseUUID(getMappedValue('department_id')),
              stock_category: parseUUID(getMappedValue('stock_category')),
              superseding_no: String(getMappedValue('superseding_no') || '').trim() || null,
              minimum_stock: parseNumeric(getMappedValue('minimum_stock')),
              reorder_point: parseNumeric(getMappedValue('reorder_point')),
              rack: String(getMappedValue('rack') || '').trim() || null,
              row_position: String(getMappedValue('row_position') || '').trim() || null
            };

            if (!productData.part_number) {
              errors.push(`Row ${i + 1}: Part number is required`);
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
      } else if (importType === 'batches') {
        // Import batches with enhanced field mapping and validation
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          try {
            // Helper function to get mapped value
            const getMappedValue = (fieldKey: string) => {
              const excelColumn = columnMapping[fieldKey];
              return excelColumn ? row[excelColumn] : '';
            };

            // Helper function to parse numeric values with better null handling
            const parseNumeric = (value: any): number | null => {
              if (value === null || value === undefined || value === '') return null;
              const parsed = parseFloat(String(value).replace(/[,$%]/g, ''));
              return isNaN(parsed) ? null : parsed;
            };

            // Helper function to parse date values
            const parseDate = (value: any): string | null => {
              if (!value) return null;
              try {
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
              } catch {
                return null;
              }
            };

            // Helper function to parse UUID (supplier_id, department_id, alternate_department_id)
            const parseUUID = (value: any): string | null => {
              if (!value || String(value).trim() === '') return null;
              const str = String(value).trim();
              
              // Enhanced UUID format validation
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              if (!uuidRegex.test(str)) {
                console.warn(`Invalid UUID format for batch import: ${str}`);
                return null;
              }
              
              return str;
            };

            const partNumber = getMappedValue('part_number');
            if (!partNumber) {
              errors.push(`Row ${i + 1}: Part number is required`);
              continue;
            }

            // Find the product using maybeSingle for safer lookup
            const { data: product, error: productError } = await supabase
              .from('inventory_products')
              .select('id')
              .eq('part_number', partNumber)
              .eq('user_id', userData.user.id)
              .maybeSingle();

            if (productError) {
              errors.push(`Row ${i + 1}: Database error finding product "${partNumber}": ${productError.message}`);
              continue;
            }

            if (!product) {
              errors.push(`Row ${i + 1}: Product with part number "${partNumber}" not found`);
              continue;
            }

            const batchData: any = {
              user_id: userData.user.id,
              product_id: product.id,
              batch_number: String(getMappedValue('batch_number') || '').trim(),
              quantity: parseInt(String(getMappedValue('quantity'))) || 0,
              cost_per_unit: parseNumeric(getMappedValue('cost_per_unit')),
              buying_price: parseNumeric(getMappedValue('buying_price')),
              sale_markup_percent: parseNumeric(getMappedValue('sale_markup_percent')),
              sale_markup_value: parseNumeric(getMappedValue('sale_markup_value')),
              selling_price: parseNumeric(getMappedValue('selling_price')),
              supplier_id: parseUUID(getMappedValue('supplier_id')),
              department_id: parseUUID(getMappedValue('department_id')),
              alternate_department_id: parseUUID(getMappedValue('alternate_department_id')),
              received_date: parseDate(getMappedValue('received_date')) || new Date().toISOString().split('T')[0],
              batch_date: parseDate(getMappedValue('batch_date')),
              expiry_date: parseDate(getMappedValue('expiry_date')),
              dollar_rate: parseNumeric(getMappedValue('dollar_rate')),
              freight_rate: parseNumeric(getMappedValue('freight_rate')),
              total_rate: parseNumeric(getMappedValue('total_rate')),
              dollar_amount: parseNumeric(getMappedValue('dollar_amount')),
              core_value: parseNumeric(getMappedValue('core_value')),
              location: String(getMappedValue('location') || '').trim() || null,
              purchase_order: String(getMappedValue('purchase_order') || '').trim() || null,
              supplier_invoice_number: String(getMappedValue('supplier_invoice_number') || '').trim() || null,
              notes: String(getMappedValue('notes') || '').trim() || null,
              receipt_id: String(getMappedValue('receipt_id') || '').trim() || null,
              lpo: String(getMappedValue('lpo') || '').trim() || null,
              reference_no: String(getMappedValue('reference_no') || '').trim() || null,
              bin_no: String(getMappedValue('bin_no') || '').trim() || null,
              the_size: String(getMappedValue('the_size') || '').trim() || null,
              aircraft_reg_no: String(getMappedValue('aircraft_reg_no') || '').trim() || null,
              batch_id_a: String(getMappedValue('batch_id_a') || '').trim() || null,
              batch_id_b: String(getMappedValue('batch_id_b') || '').trim() || null,
              received_by: String(getMappedValue('received_by') || '').trim() || null,
              receive_code: String(getMappedValue('receive_code') || '').trim() || null,
              verified_by: String(getMappedValue('verified_by') || '').trim() || null,
              verification_code: String(getMappedValue('verification_code') || '').trim() || null,
              core_id: String(getMappedValue('core_id') || '').trim() || null,
              serial_no: String(getMappedValue('serial_no') || '').trim() || null
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
      } else if (importType === 'suppliers') {
        // Import suppliers with proper field mapping
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          try {
            // Helper function to get mapped value
            const getMappedValue = (fieldKey: string) => {
              const excelColumn = columnMapping[fieldKey];
              return excelColumn ? row[excelColumn] : '';
            };

            const supplierData: any = {
              user_id: userData.user.id,
              name: String(getMappedValue('name') || '').trim(),
              email: String(getMappedValue('email') || '').trim() || null,
              phone: String(getMappedValue('phone') || '').trim() || null,
              address: String(getMappedValue('address') || '').trim() || null,
              city: String(getMappedValue('city') || '').trim() || null,
              state: String(getMappedValue('state') || '').trim() || null,
              country: String(getMappedValue('country') || 'Kenya').trim(),
              zip_code: '00000', // Default for Kenyan companies as requested
              website: String(getMappedValue('website') || '').trim() || null,
              contact_person: String(getMappedValue('contact_person') || '').trim() || null,
              specialty: String(getMappedValue('specialty') || '').trim() || null,
              payment_terms: String(getMappedValue('payment_terms') || '').trim() || null,
              notes: String(getMappedValue('notes') || '').trim() || null
            };

            if (!supplierData.name) {
              errors.push(`Row ${i + 1}: Supplier name is required`);
              continue;
            }

            const { error } = await supabase
              .from('suppliers')
              .insert(supplierData);

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
                <SelectItem value="products">Inventory Products (Station)</SelectItem>
                <SelectItem value="batches">Inventory Batches (Items)</SelectItem>
                <SelectItem value="suppliers">Suppliers</SelectItem>
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
              Download a template with the correct column headers from your previous system
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
                    value={columnMapping[key] || '__skip__'} 
                    onValueChange={(value) => setColumnMapping(prev => ({ 
                      ...prev, 
                      [key]: value === '__skip__' ? '' : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">-- Skip --</SelectItem>
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