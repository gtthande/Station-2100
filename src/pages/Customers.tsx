
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCustomerPermissions } from '@/hooks/useCustomerPermissions';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserMenu } from '@/components/navigation/UserMenu';
import { BackButton } from '@/components/navigation/BackButton';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  aircraft_type: string | null;
  tail_number: string | null;
  contact_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Customers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    canViewCustomers, 
    canViewContactInfo, 
    canViewFullDetails, 
    canManageCustomers 
  } = useCustomerPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    aircraft_type: '',
    tail_number: '',
    contact_person: '',
    notes: ''
  });

  // Fetch customers using secure view with field-level permissions
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-secure'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers_secure_view')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user && canViewCustomers()
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof formData) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-secure'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Customer Added",
        description: "Customer has been successfully added.",
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

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-secure'] });
      setEditingCustomer(null);
      resetForm();
      toast({
        title: "Customer Updated",
        description: "Customer has been successfully updated.",
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

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-secure'] });
      toast({
        title: "Customer Deleted",
        description: "Customer has been successfully deleted.",
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
      aircraft_type: '',
      tail_number: '',
      contact_person: '',
      notes: ''
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zip_code: customer.zip_code || '',
      country: customer.country || 'United States',
      aircraft_type: customer.aircraft_type || '',
      tail_number: customer.tail_number || '',
      contact_person: customer.contact_person || '',
      notes: customer.notes || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      addCustomerMutation.mutate(formData);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.tail_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Station-2100</h1>
              <p className="text-white/60">Customer Management</p>
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
              <h2 className="text-3xl font-bold text-white mb-2">Customers</h2>
              <p className="text-white/70">Manage your customer database</p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen || !!editingCustomer} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingCustomer(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <GradientButton 
                onClick={() => setIsAddDialogOpen(true)} 
                className="gap-2"
                disabled={!canManageCustomers()}
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </GradientButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-surface-dark border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Customer Name *</Label>
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
                
                {canViewContactInfo() && (
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
                )}

                {canViewFullDetails() && (
                  <>
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
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aircraft_type" className="text-white">Aircraft Type</Label>
                    <Input
                      id="aircraft_type"
                      value={formData.aircraft_type}
                      onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                      placeholder="e.g., Cessna 172, Boeing 737"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tail_number" className="text-white">Tail Number</Label>
                    <Input
                      id="tail_number"
                      value={formData.tail_number}
                      onChange={(e) => setFormData({ ...formData, tail_number: e.target.value })}
                      placeholder="e.g., N123AB"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <GradientButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingCustomer(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton type="submit">
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
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
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Customers Grid */}
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
          ) : filteredCustomers.length === 0 ? (
            <div className="col-span-full">
              <GlassCard>
                <GlassCardContent className="p-12 text-center">
                  <User className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No customers found</h3>
                  <p className="text-white/70 mb-4">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first customer.'}
                  </p>
                  {!searchTerm && (
                    <GradientButton onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Your First Customer
                    </GradientButton>
                  )}
                </GlassCardContent>
              </GlassCard>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <GlassCard key={customer.id} className="hover:bg-white/5 transition-colors">
                <GlassCardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <GlassCardTitle className="text-lg mb-1">{customer.name}</GlassCardTitle>
                      {customer.tail_number && (
                        <p className="text-sm text-white/70">Tail: {customer.tail_number}</p>
                      )}
                    </div>
                    {canManageCustomers() && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-white/70" />
                        </button>
                        <button
                          onClick={() => deleteCustomerMutation.mutate(customer.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <div className="space-y-2">
                    {/* Contact Person - show if available or show protected status */}
                    {customer.contact_person && customer.contact_person !== '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <User className="w-4 h-4" />
                        {customer.contact_person}
                      </div>
                    )}
                    {customer.contact_person === '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/40 italic">
                        <User className="w-4 h-4" />
                        Contact info protected
                      </div>
                    )}
                    
                    {/* Email - show if available or show protected status */}
                    {customer.email && customer.email !== '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                    )}
                    {customer.email === '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/40 italic">
                        <Mail className="w-4 h-4" />
                        Email protected
                      </div>
                    )}
                    
                    {/* Phone - show if available or show protected status */}
                    {customer.phone && customer.phone !== '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.phone === '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/40 italic">
                        <Phone className="w-4 h-4" />
                        Phone protected
                      </div>
                    )}
                    
                    {/* Location - show city/state (usually not protected) */}
                    {customer.city && customer.state && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <MapPin className="w-4 h-4" />
                        {customer.city}, {customer.state}
                      </div>
                    )}
                    
                    {/* Address protection indicator for full address */}
                    {customer.address === '[PROTECTED]' && (
                      <div className="flex items-center gap-2 text-sm text-white/40 italic">
                        <MapPin className="w-4 h-4" />
                        Full address protected
                      </div>
                    )}
                    
                    {/* Aircraft info - generally not sensitive */}
                    {customer.aircraft_type && (
                      <div className="mt-3 p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-white/50 mb-1">Aircraft</p>
                        <p className="text-sm text-white">{customer.aircraft_type}</p>
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

export default Customers;
