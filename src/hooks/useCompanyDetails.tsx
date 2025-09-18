import { useCompany } from './useCompany';

/**
 * Hook to get company details for use in reports and documents
 * Returns formatted company information with fallbacks
 */
export const useCompanyDetails = () => {
  const { data: company, isLoading, error } = useCompany();

  const getCompanyName = () => {
    return company?.name || 'Company Name Not Set';
  };

  const getCompanyAddress = () => {
    if (!company) return 'Address Not Set';
    
    const parts = [
      company.address,
      company.city,
      company.country,
      company.zip_code
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Address Not Set';
  };

  const getCompanyContact = () => {
    if (!company) return { phone: 'Phone Not Set', email: 'Email Not Set', website: 'Website Not Set' };
    
    return {
      phone: company.phone || 'Phone Not Set',
      email: company.email || 'Email Not Set',
      website: company.website || 'Website Not Set'
    };
  };

  const getCompanyTaxInfo = () => {
    return company?.tax_id || 'Tax ID Not Set';
  };

  const getCompanyLogo = () => {
    return company?.logo_url || null;
  };

  const getFullCompanyInfo = () => {
    if (!company) {
      return {
        name: 'Company Name Not Set',
        address: 'Address Not Set',
        contact: {
          phone: 'Phone Not Set',
          email: 'Email Not Set',
          website: 'Website Not Set'
        },
        taxId: 'Tax ID Not Set',
        logo: null
      };
    }

    return {
      name: company.name,
      address: getCompanyAddress(),
      contact: getCompanyContact(),
      taxId: company.tax_id || 'Tax ID Not Set',
      logo: company.logo_url
    };
  };

  return {
    company,
    isLoading,
    error,
    getCompanyName,
    getCompanyAddress,
    getCompanyContact,
    getCompanyTaxInfo,
    getCompanyLogo,
    getFullCompanyInfo
  };
};
