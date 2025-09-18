import React, { useState } from 'react';
import { useCompany, useUpdateCompany, useUploadLogo, useDeleteLogo, CompanyFormData } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Upload, 
  Trash2, 
  Save, 
  RefreshCw, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  tax_id: z.string().optional(),
  zip_code: z.string().optional(),
});

export default function CompanyManagement() {
  const { data: company, isLoading, error } = useCompany();
  const updateCompany = useUpdateCompany();
  const uploadLogo = useUploadLogo();
  const deleteLogo = useDeleteLogo();
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      tax_id: '',
      zip_code: '',
    },
  });

  // Reset form when company data loads
  React.useEffect(() => {
    if (company) {
      reset({
        name: company.name || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        tax_id: company.tax_id || '',
        zip_code: company.zip_code || '',
      });
    }
  }, [company, reset]);

  const onSubmit = (data: CompanyFormData) => {
    updateCompany.mutate(data);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogo.mutate(logoFile);
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleDeleteLogo = () => {
    if (confirm('Are you sure you want to delete the company logo?')) {
      deleteLogo.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading company details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading company details: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Company Management
          </h2>
          <p className="text-white/70 mt-1">
            Manage your company details, logo, and tax information
          </p>
        </div>
        <Badge variant="outline" className="text-white border-white/20">
          {company ? 'Configured' : 'Not Set Up'}
        </Badge>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Company Details</TabsTrigger>
          <TabsTrigger value="logo">Logo & Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription className="text-white/70">
                Update your company details for use in reports and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Company Name *
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter company name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Tax ID */}
                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="text-white">
                      Tax ID / VAT Number
                    </Label>
                    <Input
                      id="tax_id"
                      {...register('tax_id')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter tax ID or VAT number"
                    />
                    {errors.tax_id && (
                      <p className="text-red-400 text-sm">{errors.tax_id.message}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      {...register('address')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter company address"
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-red-400 text-sm">{errors.address.message}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">
                      City
                    </Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="text-red-400 text-sm">{errors.city.message}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">
                      Country
                    </Label>
                    <Input
                      id="country"
                      {...register('country')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter country"
                    />
                    {errors.country && (
                      <p className="text-red-400 text-sm">{errors.country.message}</p>
                    )}
                  </div>

                  {/* Zip Code */}
                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className="text-white">
                      Zip Code
                    </Label>
                    <Input
                      id="zip_code"
                      {...register('zip_code')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter zip code"
                    />
                    {errors.zip_code && (
                      <p className="text-red-400 text-sm">{errors.zip_code.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-white flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      {...register('website')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <p className="text-red-400 text-sm">{errors.website.message}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateCompany.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateCompany.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Company Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logo" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Company Logo
              </CardTitle>
              <CardDescription className="text-white/70">
                Upload and manage your company logo for use in reports and documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Logo */}
              {company?.logo_url && (
                <div className="space-y-4">
                  <Label className="text-white">Current Logo</Label>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <img
                      src={company.logo_url}
                      alt="Company Logo"
                      className="w-24 h-24 object-contain bg-white rounded"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">Logo uploaded</p>
                      <p className="text-white/70 text-sm">
                        This logo will appear in reports and documents
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteLogo}
                      disabled={deleteLogo.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload New Logo */}
              <div className="space-y-4">
                <Label className="text-white">Upload New Logo</Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <ImageIcon className="w-12 h-12 mx-auto text-white/50" />
                    <div>
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-white font-medium">Click to upload</span>
                        <span className="text-white/70"> or drag and drop</span>
                      </Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-white/50 text-sm">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>

                {/* Logo Preview */}
                {logoPreview && (
                  <div className="space-y-4">
                    <Label className="text-white">Preview</Label>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-24 h-24 object-contain bg-white rounded"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">New logo preview</p>
                        <p className="text-white/70 text-sm">
                          Click upload to save this logo
                        </p>
                      </div>
                      <Button
                        onClick={handleUploadLogo}
                        disabled={uploadLogo.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {uploadLogo.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
