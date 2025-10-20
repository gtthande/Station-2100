
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Building, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { UserMenu } from '@/components/navigation/UserMenu';
import { BackButton } from '@/components/navigation/BackButton';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  website: string | null;
  contact_person: string | null;
  specialty: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Suppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    website: '',
    contact_person: '',
    specialty: '',
    payment_terms: '',
    notes: ''
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!user
  });

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (supplierData: typeof formData) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplierData, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Supplier Added",
        description: "Supplier has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditingSupplier(null);
      resetForm();
      toast({
        title: "Supplier Updated",
        description: "Supplier has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Supplier Deleted",
        description: "Supplier has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States',
      website: '',
      contact_person: '',
      specialty: '',
      payment_terms: '',
      notes: ''
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      zip_code: supplier.zip_code || '',
      country: supplier.country || 'United States',
      website: supplier.website || '',
      contact_person: supplier.contact_person || '',
      specialty: supplier.specialty || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      addSupplierMutation.mutate(formData);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Station-2100</h1>
              <p className="text-white/60">Supplier Management</p>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Suppliers</h2>
              <p className="text-white/70">Manage your supplier database</p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen || !!editingSupplier} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingSupplier(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <GradientButton onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Supplier
              </GradientButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-surface-dark border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  {editingSupplier ? 'Update supplier information' : 'Add a new supplier to your system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person" className="text-white">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-white">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty" className="text-white">Specialty</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="e.g., Engine Parts, Avionics"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className="text-white">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms" className="text-white">Payment Terms</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="e.g., Net 30, COD"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <GradientButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingSupplier(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton type="submit">
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                  </GradientButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            [...Array(6)].map((_, i) => (
              <GlassCard key={i} className="animate-pulse">
                <GlassCardContent className="p-6">
                  <div className="h-4 bg-white/20 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full">
              <GlassCard>
                <GlassCardContent className="p-12 text-center">
                  <Building className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No suppliers found</h3>
                  <p className="text-white/70 mb-4">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first supplier.'}
                  </p>
                  {!searchTerm && (
                    <GradientButton onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Your First Supplier
                    </GradientButton>
                  )}
                </GlassCardContent>
              </GlassCard>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <GlassCard key={supplier.id} className="hover:bg-white/5 transition-colors">
                <GlassCardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <GlassCardTitle className="text-lg mb-1">{supplier.name}</GlassCardTitle>
                      {supplier.specialty && (
                        <p className="text-sm text-white/70">{supplier.specialty}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-white/70" />
                      </button>
                      <button
                        onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <div className="space-y-2">
                    {supplier.contact_person && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Building className="w-4 h-4" />
                        {supplier.contact_person}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Mail className="w-4 h-4" />
                        {supplier.email}
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Phone className="w-4 h-4" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Globe className="w-4 h-4" />
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          Website
                        </a>
                      </div>
                    )}
                    {supplier.city && supplier.state && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <MapPin className="w-4 h-4" />
                        {supplier.city}, {supplier.state}
                      </div>
                    )}
                    {supplier.payment_terms && (
                      <div className="mt-3 p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-white/50 mb-1">Payment Terms</p>
                        <p className="text-sm text-white">{supplier.payment_terms}</p>
                      </div>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
