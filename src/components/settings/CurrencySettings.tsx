import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Save, RotateCcw } from 'lucide-react';

const CURRENCY_OPTIONS = [
  { value: '', label: 'No Symbol' },
  { value: '$', label: '$ (US Dollar)' },
  { value: '€', label: '€ (Euro)' },
  { value: '£', label: '£ (British Pound)' },
  { value: '¥', label: '¥ (Japanese Yen)' },
  { value: '₹', label: '₹ (Indian Rupee)' },
  { value: 'C$', label: 'C$ (Canadian Dollar)' },
  { value: 'A$', label: 'A$ (Australian Dollar)' },
  { value: 'CHF', label: 'CHF (Swiss Franc)' },
  { value: 'R', label: 'R (South African Rand)' },
  { value: 'custom', label: 'Custom Symbol' },
];

interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  customSymbol?: string;
}

export const CurrencySettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<CurrencyConfig>({
    symbol: '',
    position: 'before',
    customSymbol: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currencySettings');
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading currency settings:', error);
      }
    }
  }, []);

  const handleSymbolChange = (value: string) => {
    setConfig(prev => ({ 
      ...prev, 
      symbol: value === 'custom' ? (prev.customSymbol || '') : value 
    }));
    setHasChanges(true);
  };

  const handleCustomSymbolChange = (value: string) => {
    setConfig(prev => ({ 
      ...prev, 
      customSymbol: value,
      symbol: value 
    }));
    setHasChanges(true);
  };

  const handlePositionChange = (value: 'before' | 'after') => {
    setConfig(prev => ({ ...prev, position: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('currencySettings', JSON.stringify(config));
      setHasChanges(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('currencySettingsChanged', { detail: config }));
      
      toast({
        title: "Settings Saved",
        description: "Currency settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save currency settings",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    const defaultConfig: CurrencyConfig = {
      symbol: '',
      position: 'before',
      customSymbol: '',
    };
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const formatPreview = (amount: number = 123.45) => {
    if (!config.symbol) return amount.toFixed(2);
    
    return config.position === 'before' 
      ? `${config.symbol}${amount.toFixed(2)}`
      : `${amount.toFixed(2)}${config.symbol}`;
  };

  const isCustomSelected = CURRENCY_OPTIONS.find(opt => opt.value === config.symbol)?.value === undefined && config.symbol;

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Currency Symbol Settings
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="symbol-select" className="text-white/80">Currency Symbol</Label>
            <Select 
              value={isCustomSelected ? 'custom' : config.symbol} 
              onValueChange={handleSymbolChange}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select currency symbol" />
              </SelectTrigger>
              <SelectContent className="bg-surface-dark border-white/20">
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(isCustomSelected || config.symbol === '') && (
            <div>
              <Label htmlFor="custom-symbol" className="text-white/80">Custom Symbol</Label>
              <Input
                id="custom-symbol"
                value={config.customSymbol || ''}
                onChange={(e) => handleCustomSymbolChange(e.target.value)}
                placeholder="Enter custom currency symbol"
                className="bg-white/5 border-white/10 text-white"
                maxLength={10}
              />
              <p className="text-sm text-white/60 mt-1">
                Leave empty for no currency symbol
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="position-select" className="text-white/80">Symbol Position</Label>
            <Select value={config.position} onValueChange={handlePositionChange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-dark border-white/20">
                <SelectItem value="before" className="text-white">Before amount (e.g., $123.45)</SelectItem>
                <SelectItem value="after" className="text-white">After amount (e.g., 123.45$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <Label className="text-white/80">Preview</Label>
            <div className="text-2xl font-semibold text-white mt-2">
              {formatPreview()}
            </div>
            <p className="text-sm text-white/60 mt-1">
              This is how currency amounts will be displayed
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button 
              onClick={handleReset} 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Information */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-white font-medium mb-2">Note:</h4>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Currency settings apply to all financial displays in the application</li>
            <li>• Settings are saved locally in your browser</li>
            <li>• Changes take effect immediately after saving</li>
            <li>• Default setting is no currency symbol</li>
          </ul>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};