
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
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, X, Save, Plane, Globe } from 'lucide-react';
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
  country: string | null;
  aircraft_type: string | null;
  tail_number: string | null;
  contact_person: string | null;
  notes: string | null;
  user_id: string;
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditingInPanel, setIsEditingInPanel] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    aircraft_type: '',
    tail_number: '',
    contact_person: '',
    notes: ''
  });

  // Fetch customers using the same pattern as job cards
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user?.id
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
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
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
      country: 'United States',
      aircraft_type: '',
      tail_number: '',
      contact_person: '',
      notes: ''
    });
  };

  // Simple customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditingInPanel(false); // Exit edit mode when switching customers
  };

  // Close panel
  const handleClosePanel = () => {
    setSelectedCustomer(null);
    setIsEditingInPanel(false);
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
                        <Label htmlFor="country" className="text-white">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-white">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the customer..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
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
              <GlassCard 
                key={customer.id} 
                className={`hover:bg-white/5 transition-all duration-200 cursor-pointer ${
                  selectedCustomer?.id === customer.id ? 'ring-2 ring-blue-500/50 bg-white/5' : ''
                }`}
                onClick={() => handleCustomerSelect(customer)}
              >
                <GlassCardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <GlassCardTitle className="text-lg mb-1">{customer.name}</GlassCardTitle>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <div className="space-y-2">
                    {/* Contact Person */}
                    {customer.contact_person && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <User className="w-4 h-4" />
                        {customer.contact_person}
                      </div>
                    )}
                    
                    {/* Email */}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                    )}
                    
                    {/* Phone */}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                    )}
                    
                    {/* Location */}
                    {customer.city && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <MapPin className="w-4 h-4" />
                        {customer.city}, {customer.country}
                      </div>
                    )}
                    
                    {/* Aircraft Type */}
                    {customer.aircraft_type && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Plane className="w-4 h-4" />
                        {customer.aircraft_type}
                      </div>
                    )}
                    
                    {/* Tail Number */}
                    {customer.tail_number && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Plane className="w-4 h-4" />
                        Tail: {customer.tail_number}
                      </div>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))
          )}
        </div>
      </div>

      {/* Customer Details Side Panel */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-surface-dark border-l border-white/10 h-full overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">Customer Details</h3>
                  {filteredCustomers.length > 1 && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <span>
                        {filteredCustomers.findIndex(c => c.id === selectedCustomer.id) + 1} of {filteredCustomers.length}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClosePanel}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>


              {/* Customer Info */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      {isEditingInPanel ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white font-semibold text-lg"
                        />
                      ) : (
                        <h4 className="text-lg font-semibold text-white">{selectedCustomer.name}</h4>
                      )}
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Contact Person</Label>
                    {isEditingInPanel ? (
                      <Input
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    ) : (
                      <p className="text-white">{selectedCustomer.contact_person || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {canViewContactInfo() && (
                  <div className="space-y-4">
                    <h5 className="text-white font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Information
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white/70 text-sm">Email</Label>
                        {isEditingInPanel ? (
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        ) : (
                          <p className="text-white">{selectedCustomer.email || 'Not provided'}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-white/70 text-sm">Phone</Label>
                        {isEditingInPanel ? (
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        ) : (
                          <p className="text-white">{selectedCustomer.phone || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Information */}
                {canViewFullDetails() && (
                  <div className="space-y-4">
                    <h5 className="text-white font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address Information
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white/70 text-sm">Address</Label>
                        {isEditingInPanel ? (
                          <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        ) : (
                          <p className="text-white">{selectedCustomer.address || 'Not provided'}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-white/70 text-sm">City</Label>
                          {isEditingInPanel ? (
                            <Input
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          ) : (
                            <p className="text-white">{selectedCustomer.city || '-'}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-white/70 text-sm">State</Label>
                          {isEditingInPanel ? (
                            <Input
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          ) : (
                            <p className="text-white">{selectedCustomer.state || '-'}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-white/70 text-sm">Country</Label>
                          {isEditingInPanel ? (
                            <Input
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          ) : (
                            <p className="text-white">{selectedCustomer.country || 'United States'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aircraft Information */}
                <div className="space-y-4">
                  <h5 className="text-white font-medium flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    Aircraft Information
                  </h5>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white/70 text-sm">Aircraft Type</Label>
                      {isEditingInPanel ? (
                        <Input
                          value={formData.aircraft_type}
                          onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      ) : (
                        <p className="text-white">{selectedCustomer.aircraft_type || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-white/70 text-sm">Tail Number</Label>
                      {isEditingInPanel ? (
                        <Input
                          value={formData.tail_number}
                          onChange={(e) => setFormData({ ...formData, tail_number: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      ) : (
                        <p className="text-white">{selectedCustomer.tail_number || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h5 className="text-white font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Notes
                  </h5>
                  
                  <div>
                    <Label className="text-white/70 text-sm">Additional Notes</Label>
                    {isEditingInPanel ? (
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes about the customer..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                      />
                    ) : (
                      <p className="text-white">{selectedCustomer.notes || 'No notes provided'}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {isEditingInPanel ? (
                    <>
                      <GradientButton
                        onClick={() => {
                          updateCustomerMutation.mutate({ 
                            id: selectedCustomer.id, 
                            data: formData 
                          });
                          setIsEditingInPanel(false);
                        }}
                        className="flex-1 gap-2"
                        disabled={updateCustomerMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </GradientButton>
                      <GradientButton
                        variant="outline"
                        onClick={() => {
                          setIsEditingInPanel(false);
                          // Reset form data to original values
                          setFormData({
                            name: selectedCustomer.name,
                            email: selectedCustomer.email || '',
                            phone: selectedCustomer.phone || '',
                            address: selectedCustomer.address || '',
                            city: selectedCustomer.city || '',
                            state: selectedCustomer.state || '',
                            zip_code: selectedCustomer.zip_code || '',
                            country: selectedCustomer.country || 'United States',
                            aircraft_type: selectedCustomer.aircraft_type || '',
                            tail_number: selectedCustomer.tail_number || '',
                            contact_person: selectedCustomer.contact_person || '',
                            notes: selectedCustomer.notes || ''
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </GradientButton>
                    </>
                  ) : (
                    <>
                      <GradientButton
                        onClick={() => {
                          setIsEditingInPanel(true);
                          setFormData({
                            name: selectedCustomer.name,
                            email: selectedCustomer.email || '',
                            phone: selectedCustomer.phone || '',
                            address: selectedCustomer.address || '',
                            city: selectedCustomer.city || '',
                            state: selectedCustomer.state || '',
                            country: selectedCustomer.country || 'United States',
                            aircraft_type: selectedCustomer.aircraft_type || '',
                            tail_number: selectedCustomer.tail_number || '',
                            contact_person: selectedCustomer.contact_person || '',
                            notes: selectedCustomer.notes || ''
                          });
                        }}
                        className="flex-1 gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Customer
                      </GradientButton>
                      <GradientButton
                        variant="outline"
                        onClick={() => deleteCustomerMutation.mutate(selectedCustomer.id)}
                        className="flex-1 gap-2 text-red-400 border-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </GradientButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
